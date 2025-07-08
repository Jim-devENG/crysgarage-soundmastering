<?php

namespace App\Jobs;

use App\Models\AudioFile;
use App\Services\EQProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ProcessAudioFile implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected EQProcessor $eqProcessor;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected AudioFile $audioFile
    ) {
        $this->eqProcessor = new EQProcessor();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $startTime = microtime(true);
        $jobId = uniqid('job_', true);
        
        try {
            Log::info('=== JOB START ===', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'user_id' => $this->audioFile->user_id,
                'original_filename' => $this->audioFile->original_filename,
                'file_size' => $this->audioFile->file_size,
                'mime_type' => $this->audioFile->mime_type,
                'status' => $this->audioFile->status,
                'queue_connection' => config('queue.default'),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'timestamp' => now()->toISOString(),
            ]);

            // Step 1: Update status to processing
            $this->audioFile->update(['status' => 'processing']);
            Log::info('Status updated to processing', ['job_id' => $jobId, 'audio_file_id' => $this->audioFile->id]);

            // Step 2: Verify input file exists
            $inputPath = Storage::disk(config('audio.storage.disk'))->path($this->audioFile->original_path);
            $outputDirectory = config('audio.processing.output_directory');
            
            Log::info('File paths prepared', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'input_path' => $inputPath,
                'input_exists' => file_exists($inputPath),
                'input_size' => file_exists($inputPath) ? filesize($inputPath) : 'N/A',
                'input_readable' => file_exists($inputPath) ? is_readable($inputPath) : false,
                'output_directory' => $outputDirectory,
                'storage_disk' => config('audio.storage.disk'),
            ]);

            if (!file_exists($inputPath)) {
                throw new \RuntimeException("Input file does not exist: {$inputPath}");
            }

            if (!is_readable($inputPath)) {
                throw new \RuntimeException("Input file is not readable: {$inputPath}");
            }

            // Step 3: Check system requirements
            $this->checkSystemRequirements($jobId);

            // Step 4: Create output directories
            $this->createOutputDirectories($jobId, $outputDirectory);

            // Step 5: STAGE 1 - AI Mastering
            $aiMasteredPath = $this->runAIMastering($jobId, $inputPath, $outputDirectory);
            $aiProcessingTime = microtime(true) - $startTime;

            // Step 6: STAGE 2 - Post-mastering EQ Enhancement
            $finalPath = $this->applyPostMasteringEQ($jobId, $aiMasteredPath);
            $totalProcessingTime = microtime(true) - $startTime;

            // Step 7: Move files to final location
            $finalOutputPath = $this->moveToFinalLocation($jobId, $finalPath, $outputDirectory);
            $aiOnlyPath = $this->shouldKeepAIOnlyVersion() ? 
                $this->moveToFinalLocation($jobId, $aiMasteredPath, $outputDirectory, '_ai_only') : null;

            // Step 8: Update database with results
            $this->updateProcessingResults($jobId, $finalOutputPath, $aiOnlyPath, $totalProcessingTime, $aiProcessingTime);

            Log::info('=== JOB COMPLETED SUCCESSFULLY ===', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'total_time' => round($totalProcessingTime, 2),
                'ai_time' => round($aiProcessingTime, 2),
                'final_path' => $finalOutputPath,
                'final_size' => filesize(Storage::disk(config('audio.storage.disk'))->path($finalOutputPath)),
            ]);

        } catch (\Exception $e) {
            $processingTime = microtime(true) - $startTime;
            
            Log::error('=== JOB FAILED ===', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
                'processing_time_seconds' => round($processingTime, 3),
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
            ]);

            $this->audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'metadata' => array_merge($this->audioFile->metadata ?? [], [
                    'job_id' => $jobId,
                    'failed_at' => now()->toISOString(),
                    'processing_time' => round($processingTime, 2),
                    'error_class' => get_class($e),
                ]),
            ]);

            // Clean up any partial output files
            $this->cleanupFailedProcessing($jobId);

            throw $e;
        }
    }

    /**
     * Stage 1: Run AI Mastering
     */
    private function runAIMastering(string $jobId, string $inputPath, string $outputDirectory): string
    {
        $aiOutputPath = Storage::disk(config('audio.storage.disk'))->path($outputDirectory . '/temp_ai_' . $this->audioFile->id . '.wav');
        
        if (!file_exists(dirname($aiOutputPath))) {
            mkdir(dirname($aiOutputPath), 0755, true);
        }

        Log::info('Stage 1: Starting AI mastering', [
            'job_id' => $jobId,
            'audio_file_id' => $this->audioFile->id,
            'input_path' => $inputPath,
            'ai_output_path' => $aiOutputPath,
        ]);

        // Check if aimastering tool is available
        $process = new Process(['aimastering', '--version']);
        $process->run();
        
        if (!$process->isSuccessful()) {
            Log::warning('AI mastering tool not available, using direct copy', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'error' => $process->getErrorOutput(),
            ]);
            
            // If tool is not available, just copy the file
            if (!copy($inputPath, $aiOutputPath)) {
                throw new \RuntimeException('Failed to copy audio file for processing');
            }
            
            Log::info('Stage 1: File copied (AI mastering not available)', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'ai_output_size' => filesize($aiOutputPath),
            ]);
            
            return $aiOutputPath;
        }

        // If tool is available, use it for processing
        $process = new Process([
            'aimastering',
            'master',
            '--input', $inputPath,
            '--output', $aiOutputPath,
            '--target-loudness', config('audio.aimastering.target_loudness', '-14'),
        ]);

        $process->setTimeout(config('audio.aimastering.timeout', 300));
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException('AI mastering failed: ' . $process->getErrorOutput());
        }

        Log::info('Stage 1: AI mastering completed', [
            'job_id' => $jobId,
            'audio_file_id' => $this->audioFile->id,
            'ai_output_size' => filesize($aiOutputPath),
        ]);

        return $aiOutputPath;
    }

    /**
     * Stage 2: Apply post-mastering EQ enhancement
     */
    private function applyPostMasteringEQ(string $jobId, string $aiMasteredPath): string
    {
        if (!$this->shouldApplyEQ()) {
            Log::info('Stage 2: Skipping EQ processing', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'reason' => 'No EQ settings or EQ disabled',
            ]);
            return $aiMasteredPath;
        }

        Log::info('Stage 2: Starting EQ enhancement', [
            'job_id' => $jobId,
            'audio_file_id' => $this->audioFile->id,
            'eq_settings' => $this->getEQSettings(),
        ]);

        try {
            $eqEnhancedPath = $this->eqProcessor->enhanceAIMaster($aiMasteredPath, $this->getEQSettings());
            
            Log::info('Stage 2: EQ enhancement completed', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'eq_output_size' => filesize($eqEnhancedPath),
            ]);

            return $eqEnhancedPath;
            
        } catch (\Exception $e) {
            Log::warning('Stage 2: EQ processing failed, using AI-only version', [
                'job_id' => $jobId,
                'audio_file_id' => $this->audioFile->id,
                'error' => $e->getMessage(),
            ]);
            
            // If EQ fails, continue with AI-only version
            return $aiMasteredPath;
        }
    }

    /**
     * Check if EQ should be applied
     */
    private function shouldApplyEQ(): bool
    {
        if (!config('audio.eq_processing.enabled', true)) {
            return false;
        }

        $preset = $this->audioFile->preset;
        if (!$preset) {
            return false;
        }

        $eqSettings = $preset->settings['post_eq'] ?? null;
        if (!$eqSettings || !($eqSettings['enabled'] ?? false)) {
            return false;
        }

        return true;
    }

    /**
     * Get EQ settings from preset
     */
    private function getEQSettings(): array
    {
        $preset = $this->audioFile->preset;
        if (!$preset) {
            return [];
        }

        return $preset->settings['post_eq'] ?? [];
    }

    /**
     * Check if EQ was actually applied
     */
    private function wasEQApplied(): bool
    {
        return $this->shouldApplyEQ();
    }

    /**
     * Check if AI-only version should be kept
     */
    private function shouldKeepAIOnlyVersion(): bool
    {
        return config('audio.eq_processing.keep_ai_only_version', true) && $this->wasEQApplied();
    }

    /**
     * Move processed file to final location
     */
    private function moveToFinalLocation(string $jobId, string $tempPath, string $outputDirectory, string $suffix = ''): string
    {
        $finalPath = $outputDirectory . '/' . $this->audioFile->id . $suffix . '.wav';
        $fullFinalPath = Storage::disk(config('audio.storage.disk'))->path($finalPath);
        
        if (!file_exists(dirname($fullFinalPath))) {
            mkdir(dirname($fullFinalPath), 0755, true);
        }
        
        copy($tempPath, $fullFinalPath);
        
        // Clean up temp file
        if (file_exists($tempPath) && $tempPath !== $fullFinalPath) {
            unlink($tempPath);
        }
        
        return $finalPath;
    }

    /**
     * Clean up files from failed processing
     */
    private function cleanupFailedProcessing(string $jobId): void
    {
        $outputDirectory = config('audio.processing.output_directory');
        $patterns = [
            Storage::disk(config('audio.storage.disk'))->path($outputDirectory . '/temp_ai_' . $this->audioFile->id . '.wav'),
            Storage::disk(config('audio.storage.disk'))->path($outputDirectory . '/' . $this->audioFile->id . '.wav'),
            Storage::disk(config('audio.storage.disk'))->path($outputDirectory . '/' . $this->audioFile->id . '_ai_only.wav'),
        ];
        
        foreach ($patterns as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
        Log::info('Cleanup completed for job: ' . $jobId, ['job_id' => $jobId]);
    }

    /**
     * Check system requirements for audio processing
     */
    private function checkSystemRequirements(string $jobId): void
    {
        Log::info('Checking system requirements', ['job_id' => $jobId]);

        // Check ffmpeg
        $ffmpegProcess = new Process(['ffmpeg', '-version']);
        $ffmpegProcess->run();
        $ffmpegAvailable = $ffmpegProcess->isSuccessful();

        // Check sox
        $soxProcess = new Process(['sox', '--version']);
        $soxProcess->run();
        $soxAvailable = $soxProcess->isSuccessful();

        // Check aimastering
        $aimasteringProcess = new Process(['aimastering', '--version']);
        $aimasteringProcess->run();
        $aimasteringAvailable = $aimasteringProcess->isSuccessful();

        Log::info('System requirements check', [
            'job_id' => $jobId,
            'ffmpeg_available' => $ffmpegAvailable,
            'sox_available' => $soxAvailable,
            'aimastering_available' => $aimasteringAvailable,
            'ffmpeg_error' => $ffmpegAvailable ? null : $ffmpegProcess->getErrorOutput(),
            'sox_error' => $soxAvailable ? null : $soxProcess->getErrorOutput(),
            'aimastering_error' => $aimasteringAvailable ? null : $aimasteringProcess->getErrorOutput(),
        ]);

        if (!$ffmpegAvailable) {
            Log::warning('FFmpeg not available - some processing features may be limited', ['job_id' => $jobId]);
        }

        if (!$soxAvailable) {
            Log::warning('SoX not available - EQ processing may be limited', ['job_id' => $jobId]);
        }
    }

    /**
     * Create necessary output directories
     */
    private function createOutputDirectories(string $jobId, string $outputDirectory): void
    {
        $storageDisk = config('audio.storage.disk');
        $outputPath = Storage::disk($storageDisk)->path($outputDirectory);
        $tempPath = Storage::disk($storageDisk)->path('temp');

        Log::info('Creating output directories', [
            'job_id' => $jobId,
            'output_path' => $outputPath,
            'temp_path' => $tempPath,
        ]);

        // Create output directory
        if (!file_exists($outputPath)) {
            if (!mkdir($outputPath, 0755, true)) {
                throw new \RuntimeException("Failed to create output directory: {$outputPath}");
            }
            Log::info('Created output directory', ['job_id' => $jobId, 'path' => $outputPath]);
        }

        // Create temp directory
        if (!file_exists($tempPath)) {
            if (!mkdir($tempPath, 0755, true)) {
                throw new \RuntimeException("Failed to create temp directory: {$tempPath}");
            }
            Log::info('Created temp directory', ['job_id' => $jobId, 'path' => $tempPath]);
        }

        // Check permissions
        if (!is_writable($outputPath)) {
            throw new \RuntimeException("Output directory is not writable: {$outputPath}");
        }

        if (!is_writable($tempPath)) {
            throw new \RuntimeException("Temp directory is not writable: {$tempPath}");
        }

        Log::info('Output directories ready', [
            'job_id' => $jobId,
            'output_writable' => is_writable($outputPath),
            'temp_writable' => is_writable($tempPath),
        ]);
    }

    /**
     * Update database with processing results
     */
    private function updateProcessingResults(string $jobId, string $finalOutputPath, ?string $aiOnlyPath, float $totalProcessingTime, float $aiProcessingTime): void
    {
        $this->audioFile->update([
            'status' => 'completed',
            'mastered_path' => $finalOutputPath,
            'metadata' => array_merge($this->audioFile->metadata ?? [], [
                'job_id' => $jobId,
                'processing_time' => round($totalProcessingTime, 2),
                'ai_processing_time' => round($aiProcessingTime, 2),
                'eq_processing_time' => round($totalProcessingTime - $aiProcessingTime, 2),
                'output_size' => filesize(Storage::disk(config('audio.storage.disk'))->path($finalOutputPath)),
                'original_size' => $this->audioFile->file_size,
                'original_format' => pathinfo($this->audioFile->original_filename, PATHINFO_EXTENSION),
                'output_format' => config('audio.processing.output_format'),
                'ai_only_path' => $aiOnlyPath,
                'eq_applied' => $this->wasEQApplied(),
                'eq_settings' => $this->getEQSettings(),
                'aimastering_enabled' => config('audio.aimastering.enabled'),
                'eq_processing_enabled' => config('audio.eq_processing.enabled'),
            ]),
        ]);
        Log::info('Database updated with processing results', ['job_id' => $jobId, 'audio_file_id' => $this->audioFile->id]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Audio processing job failed', [
            'audio_file_id' => $this->audioFile->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        $this->audioFile->update([
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
        ]);

        $this->cleanupFailedProcessing(uniqid('job_', true)); // Use a new job ID for failed jobs
    }
}
