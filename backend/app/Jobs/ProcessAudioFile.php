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
        
        try {
            $this->audioFile->update(['status' => 'processing']);

            $inputPath = Storage::disk(config('audio.storage.disk'))->path($this->audioFile->original_path);
            $outputDirectory = config('audio.processing.output_directory');
            
            Log::info('Starting two-stage audio processing', [
                'audio_file_id' => $this->audioFile->id,
                'input_path' => $inputPath,
                'file_size' => $this->audioFile->file_size,
                'mime_type' => $this->audioFile->mime_type,
                'original_format' => pathinfo($this->audioFile->original_filename, PATHINFO_EXTENSION),
                'has_preset' => $this->audioFile->preset_id !== null,
            ]);

            // STAGE 1: AI Mastering
            $aiMasteredPath = $this->runAIMastering($inputPath, $outputDirectory);
            $aiProcessingTime = microtime(true) - $startTime;

            // STAGE 2: Post-mastering EQ Enhancement (if enabled)
            $finalPath = $this->applyPostMasteringEQ($aiMasteredPath);
            $totalProcessingTime = microtime(true) - $startTime;

            // Determine final paths for storage
            $finalOutputPath = $this->moveToFinalLocation($finalPath, $outputDirectory);
            $aiOnlyPath = $this->shouldKeepAIOnlyVersion() ? 
                $this->moveToFinalLocation($aiMasteredPath, $outputDirectory, '_ai_only') : null;

            $this->audioFile->update([
                'status' => 'completed',
                'mastered_path' => $finalOutputPath,
                'metadata' => [
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
                ],
            ]);

            Log::info('Two-stage audio processing completed', [
                'audio_file_id' => $this->audioFile->id,
                'total_time' => round($totalProcessingTime, 2),
                'ai_time' => round($aiProcessingTime, 2),
                'eq_applied' => $this->wasEQApplied(),
                'final_size' => filesize(Storage::disk(config('audio.storage.disk'))->path($finalOutputPath)),
            ]);

        } catch (\Exception $e) {
            Log::error('Audio processing failed', [
                'audio_file_id' => $this->audioFile->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            // Clean up any partial output files
            $this->cleanupFailedProcessing();

            throw $e;
        }
    }

    /**
     * Stage 1: Run AI Mastering
     */
    private function runAIMastering(string $inputPath, string $outputDirectory): string
    {
        $aiOutputPath = Storage::disk(config('audio.storage.disk'))->path($outputDirectory . '/temp_ai_' . $this->audioFile->id . '.wav');
        
        if (!file_exists(dirname($aiOutputPath))) {
            mkdir(dirname($aiOutputPath), 0755, true);
        }

        Log::info('Stage 1: Starting AI mastering', [
            'audio_file_id' => $this->audioFile->id,
            'input_path' => $inputPath,
            'ai_output_path' => $aiOutputPath,
        ]);

        // Check if aimastering tool is available
        $process = new Process(['aimastering', '--version']);
        $process->run();
        
        if (!$process->isSuccessful()) {
            Log::warning('AI mastering tool not available, using direct copy', [
                'audio_file_id' => $this->audioFile->id,
                'error' => $process->getErrorOutput(),
            ]);
            
            // If tool is not available, just copy the file
            if (!copy($inputPath, $aiOutputPath)) {
                throw new \RuntimeException('Failed to copy audio file for processing');
            }
            
            Log::info('Stage 1: File copied (AI mastering not available)', [
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
            'audio_file_id' => $this->audioFile->id,
            'ai_output_size' => filesize($aiOutputPath),
        ]);

        return $aiOutputPath;
    }

    /**
     * Stage 2: Apply post-mastering EQ enhancement
     */
    private function applyPostMasteringEQ(string $aiMasteredPath): string
    {
        if (!$this->shouldApplyEQ()) {
            Log::info('Stage 2: Skipping EQ processing', [
                'audio_file_id' => $this->audioFile->id,
                'reason' => 'No EQ settings or EQ disabled',
            ]);
            return $aiMasteredPath;
        }

        Log::info('Stage 2: Starting EQ enhancement', [
            'audio_file_id' => $this->audioFile->id,
            'eq_settings' => $this->getEQSettings(),
        ]);

        try {
            $eqEnhancedPath = $this->eqProcessor->enhanceAIMaster($aiMasteredPath, $this->getEQSettings());
            
            Log::info('Stage 2: EQ enhancement completed', [
                'audio_file_id' => $this->audioFile->id,
                'eq_output_size' => filesize($eqEnhancedPath),
            ]);

            return $eqEnhancedPath;
            
        } catch (\Exception $e) {
            Log::warning('Stage 2: EQ processing failed, using AI-only version', [
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
    private function moveToFinalLocation(string $tempPath, string $outputDirectory, string $suffix = ''): string
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
    private function cleanupFailedProcessing(): void
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

        $this->cleanupFailedProcessing();
    }
}
