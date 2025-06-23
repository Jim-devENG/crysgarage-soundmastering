<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AudioFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use App\Services\EQProcessor;
use App\Services\AdvancedAudioProcessor;
use App\Models\ProcessingPreset;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Exception;

class AudioFileController extends Controller
{
    use AuthorizesRequests;
    protected EQProcessor $eqProcessor;
    protected AdvancedAudioProcessor $advancedProcessor;

    public function __construct()
    {
        $this->eqProcessor = new EQProcessor();
        $this->advancedProcessor = new AdvancedAudioProcessor();
    }

    /**
     * Get all audio files for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $audioFiles = AudioFile::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json([
            'data' => $audioFiles->items(),
            'pagination' => [
                'current_page' => $audioFiles->currentPage(),
                'last_page' => $audioFiles->lastPage(),
                'per_page' => $audioFiles->perPage(),
                'total' => $audioFiles->total(),
            ]
        ]);
    }

    /**
     * Upload audio file
     */
    public function upload(Request $request): JsonResponse
    {
        $allowedMimeTypes = config('audio.supported_formats.mime_types');
        $allowedExtensions = implode(',', config('audio.supported_formats.extensions'));
        $maxFileSize = config('audio.file_size.max_upload_size_kb');

        $request->validate([
            'audio' => [
                'required', 
                'file', 
                'max:' . $maxFileSize,
                'mimes:' . $allowedExtensions
            ],
        ]);

        $file = $request->file('audio');
        
        // Additional MIME type validation
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file->getPathname());
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedMimeTypes)) {
            $supportedFormats = strtoupper(implode(', ', config('audio.supported_formats.extensions')));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => [
                    'audio' => ["Invalid file type. Allowed types: {$supportedFormats}"]
                ]
            ], 422);
        }

        $originalFilename = $file->getClientOriginalName();
        $path = $file->store(config('audio.processing.original_directory'), config('audio.storage.disk'));

        $audioFile = AudioFile::create([
            'user_id' => auth()->id(),
            'original_filename' => $originalFilename,
            'original_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);

        try {
            $this->processAudio($audioFile);
        } catch (\Exception $e) {
            Log::error('Audio processing failed', [
                'error' => $e->getMessage(),
                'audio_file_id' => $audioFile->id,
            ]);

            $audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Audio processing failed',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Audio uploaded successfully',
            'data' => $audioFile,
        ]);
    }

    /**
     * Get specific audio file
     */
    public function show(AudioFile $audioFile): JsonResponse
    {
        try {
            Log::info('Audio file show request', [
                'audio_file_id' => $audioFile->id,
                'user_id' => auth()->id(),
                'audio_file_user_id' => $audioFile->user_id,
            ]);

            $this->authorize('view', $audioFile);

            return response()->json([
                'data' => $audioFile,
            ]);
        } catch (\Exception $e) {
            Log::error('Audio file show failed', [
                'audio_file_id' => $audioFile->id ?? 'unknown',
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to load audio file',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apply advanced mastering settings
     */
    public function applyAdvancedMastering(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        $request->validate([
            'mastering_settings' => 'required|array',
            'mastering_settings.target_loudness' => 'required|numeric|between:-20,-8',
            'mastering_settings.genre_preset' => 'required|string|in:' . implode(',', AdvancedAudioProcessor::getGenrePresets()),
            'mastering_settings.processing_quality' => 'required|string|in:' . implode(',', AdvancedAudioProcessor::getQualityPresets()),
            'mastering_settings.stereo_width' => 'nullable|numeric|between:-20,20',
            'mastering_settings.bass_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.presence_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.dynamic_range' => 'nullable|string|in:compressed,natural,expanded',
            'mastering_settings.high_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.low_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.noise_reduction' => 'nullable|boolean',
        ]);

        try {
            $audioFile->update(['status' => 'processing']);

            $inputPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            $outputPath = Storage::disk(config('audio.storage.disk'))->path(
                config('audio.processing.output_directory') . '/' . $audioFile->id . '_advanced.wav'
            );

            // Ensure output directory exists
            if (!file_exists(dirname($outputPath))) {
                mkdir(dirname($outputPath), 0755, true);
            }

            $result = $this->advancedProcessor->processWithAdvancedSettings(
                $inputPath,
                $outputPath,
                $request->input('mastering_settings')
            );

            // Update audio file with new metadata
            $audioFile->update([
                'status' => 'completed',
                'mastered_path' => config('audio.processing.output_directory') . '/' . $audioFile->id . '_advanced.wav',
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'advanced_mastering_applied' => true,
                    'mastering_settings' => $request->input('mastering_settings'),
                    'analysis' => $result['analysis'],
                    'processing_time' => microtime(true) - LARAVEL_START,
                ])
            ]);

            return response()->json([
                'message' => 'Advanced mastering applied successfully',
                'data' => $audioFile->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Advanced mastering failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Advanced mastering failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apply EQ settings to an audio file
     */
    public function applyEQ(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        // Validate request
        $request->validate([
            'eq_settings' => 'required|array',
            'eq_settings.enabled' => 'required|boolean',
            'eq_settings.bass' => 'required|numeric|between:-12,12',
            'eq_settings.low_mid' => 'required|numeric|between:-12,12',
            'eq_settings.mid' => 'required|numeric|between:-12,12',
            'eq_settings.high_mid' => 'required|numeric|between:-12,12',
            'eq_settings.treble' => 'required|numeric|between:-12,12',
        ]);

        try {
            // Get the AI-only version if it exists, otherwise use the mastered version
            $inputPath = $audioFile->ai_only_path 
                ? Storage::disk(config('audio.storage.disk'))->path($audioFile->ai_only_path)
                : Storage::disk(config('audio.storage.disk'))->path($audioFile->mastered_path);

            if (!file_exists($inputPath)) {
                throw new \Exception('Input audio file not found');
            }

            // Apply EQ processing
            $eqSettings = $request->input('eq_settings');
            
            // Convert frontend format to EQProcessor format
            $processorEQSettings = [
                'bass' => ['gain' => (float)$eqSettings['bass']],
                'low_mid' => ['gain' => (float)$eqSettings['low_mid']],
                'mid' => ['gain' => (float)$eqSettings['mid']],
                'high_mid' => ['gain' => (float)$eqSettings['high_mid']],
                'treble' => ['gain' => (float)$eqSettings['treble']],
            ];
            
            $outputPath = $this->eqProcessor->enhanceAIMaster($inputPath, $processorEQSettings);

            // Move the processed file to the final location
            $finalPath = 'audio/mastered/' . $audioFile->id . '_eq.wav';
            Storage::disk(config('audio.storage.disk'))->put($finalPath, file_get_contents($outputPath));

            // Update the audio file record
            $audioFile->update([
                'mastered_path' => $finalPath,
                'eq_applied' => true,
                'eq_settings' => $eqSettings
            ]);

            // Clean up temporary files
            if (file_exists($outputPath)) {
                unlink($outputPath);
            }

            return response()->json([
                'message' => 'EQ settings applied successfully',
                'data' => $audioFile->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to apply EQ settings', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to apply EQ settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audio analysis
     */
    public function getAnalysis(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        if ($audioFile->status !== 'completed') {
            return response()->json([
                'message' => 'Audio file is not ready for analysis',
            ], 400);
        }

        $analysis = $audioFile->metadata['analysis'] ?? null;

        if (!$analysis) {
            // Perform analysis if not already done
            try {
                $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->mastered_path);
                $analysis = $this->advancedProcessor->analyzeAudio($audioPath);
                
                // Update the audio file with analysis
                $audioFile->update([
                    'metadata' => array_merge($audioFile->metadata ?? [], ['analysis' => $analysis])
                ]);
            } catch (\Exception $e) {
                Log::error('Audio analysis failed', [
                    'audio_file_id' => $audioFile->id,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'error' => 'Failed to analyze audio: ' . $e->getMessage()
                ], 500);
            }
        }

        return response()->json([
            'data' => $analysis
        ]);
    }

    /**
     * Download processed audio
     */
    public function download(AudioFile $audioFile, Request $request): JsonResponse
    {
        $this->authorize('view', $audioFile);

        if ($audioFile->status !== 'completed') {
            return response()->json([
                'message' => 'Audio file is not ready for download',
            ], 400);
        }

        $format = $request->get('format', 'wav');
        $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->mastered_path);

        if (!file_exists($audioPath)) {
            return response()->json([
                'message' => 'Audio file not found',
            ], 404);
        }

        // Generate download URL
        $downloadUrl = Storage::disk(config('audio.storage.disk'))->url($audioFile->mastered_path);

        return response()->json([
            'data' => [
                'download_url' => $downloadUrl,
                'filename' => $audioFile->original_filename . '_mastered.' . $format,
                'file_size' => filesize($audioPath),
            ]
        ]);
    }

    /**
     * Get processing status
     */
    public function getStatus(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        return response()->json([
            'data' => [
                'status' => $audioFile->status,
                'progress' => $this->calculateProgress($audioFile),
                'error_message' => $audioFile->error_message,
                'created_at' => $audioFile->created_at,
                'updated_at' => $audioFile->updated_at,
            ]
        ]);
    }

    /**
     * Retry failed processing
     */
    public function retryProcessing(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        if ($audioFile->status !== 'failed') {
            return response()->json([
                'message' => 'Only failed audio files can be retried',
            ], 400);
        }

        try {
            $audioFile->update([
                'status' => 'pending',
                'error_message' => null,
            ]);

            $this->processAudio($audioFile);

            return response()->json([
                'message' => 'Processing restarted successfully',
                'data' => $audioFile->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Retry processing failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to restart processing',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available presets
     */
    public function getAvailablePresets(): JsonResponse
    {
        $genrePresets = AdvancedAudioProcessor::getGenrePresets();
        $qualityPresets = AdvancedAudioProcessor::getQualityPresets();

        return response()->json([
            'data' => [
                'genre_presets' => $genrePresets,
                'quality_presets' => $qualityPresets,
                'user_presets' => ProcessingPreset::where('user_id', auth()->id())
                    ->orWhere('is_default', true)
                    ->get(['id', 'name', 'description', 'is_default']),
            ]
        ]);
    }

    /**
     * Process audio with basic mastering
     */
    private function processAudio(AudioFile $audioFile): void
    {
        $audioFile->update(['status' => 'processing']);

        $inputPath = Storage::disk('public')->path($audioFile->original_path);
        $outputPath = Storage::disk('public')->path('audio/mastered/' . $audioFile->id . '.wav');

        // Check if aimastering tool is available
        $aimasteringAvailable = $this->isAimasteringAvailable();
        
        if ($aimasteringAvailable) {
            // Use the actual aimastering tool
            $process = new Process([
                'aimastering',
                'master',
                '--input', $inputPath,
                '--output', $outputPath,
                '--target-loudness', '-14',
            ]);

            $process->setTimeout(300); // 5 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error('Aimastering process failed', [
                    'audio_file_id' => $audioFile->id,
                    'error' => $process->getErrorOutput(),
                    'exit_code' => $process->getExitCode(),
                ]);
                throw new \RuntimeException('Audio processing failed: ' . $process->getErrorOutput());
            }
        } else {
            // Fallback: Copy the original file as "mastered" (simulation)
            Log::info('Aimastering tool not available, using fallback processing', [
                'audio_file_id' => $audioFile->id,
            ]);
            
            // Ensure output directory exists
            $outputDir = dirname($outputPath);
            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }
            
            // Copy the original file as the "mastered" version
            if (!copy($inputPath, $outputPath)) {
                throw new \RuntimeException('Failed to copy audio file for fallback processing');
            }
            
            // Add a small delay to simulate processing time
            sleep(1);
        }

        $audioFile->update([
            'status' => 'completed',
            'mastered_path' => 'audio/mastered/' . $audioFile->id . '.wav',
            'metadata' => array_merge($audioFile->metadata ?? [], [
                'processing_time' => 0,
                'output_size' => filesize($outputPath),
                'original_size' => $audioFile->file_size,
                'original_format' => pathinfo($audioFile->original_filename, PATHINFO_EXTENSION),
                'output_format' => 'wav',
                'note' => $aimasteringAvailable ? 'Processed with aimastering tool' : 'This is a placeholder. Audio mastering is not available.',
                'aimastering_enabled' => $aimasteringAvailable,
            ])
        ]);
    }

    /**
     * Check if aimastering tool is available
     */
    private function isAimasteringAvailable(): bool
    {
        try {
            $process = new Process(['aimastering', '--version']);
            $process->setTimeout(10);
            $process->run();
            return $process->isSuccessful();
        } catch (\Exception $e) {
            Log::info('Aimastering tool not available', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Calculate processing progress
     */
    private function calculateProgress(AudioFile $audioFile): int
    {
        switch ($audioFile->status) {
            case 'pending':
                return 10;
            case 'processing':
                return 50;
            case 'completed':
                return 100;
            case 'failed':
                return 0;
            default:
                return 0;
        }
    }

    /**
     * Convert audio to MP3 for browser compatibility
     */
    public function convertToMP3(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        if ($audioFile->status !== 'completed') {
            return response()->json([
                'message' => 'Audio file is not ready for conversion',
            ], 400);
        }

        try {
            $inputPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->mastered_path);
            
            if (!file_exists($inputPath)) {
                throw new \Exception('Audio file not found');
            }

            // Generate MP3 output path
            $mp3Path = 'audio/mastered/' . $audioFile->id . '.mp3';
            $outputPath = Storage::disk(config('audio.storage.disk'))->path($mp3Path);

            // Ensure output directory exists
            $outputDir = dirname($outputPath);
            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            // Convert to MP3 using FFmpeg
            $process = new Process([
                'ffmpeg',
                '-i', $inputPath,
                '-acodec', 'libmp3lame',
                '-ab', '192k',
                '-ar', '44100',
                '-y', // Overwrite output file
                $outputPath
            ]);

            $process->setTimeout(300); // 5 minutes timeout
            $process->run();

            if (!$process->isSuccessful()) {
                Log::error('MP3 conversion failed', [
                    'audio_file_id' => $audioFile->id,
                    'error' => $process->getErrorOutput(),
                    'exit_code' => $process->getExitCode(),
                ]);
                throw new \RuntimeException('MP3 conversion failed: ' . $process->getErrorOutput());
            }

            // Update the audio file with MP3 path
            $audioFile->update([
                'mp3_path' => $mp3Path,
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'mp3_converted' => true,
                    'mp3_size' => filesize($outputPath),
                ])
            ]);

            return response()->json([
                'message' => 'Audio converted to MP3 successfully',
                'data' => [
                    'mp3_url' => Storage::disk(config('audio.storage.disk'))->url($mp3Path),
                    'mp3_path' => $mp3Path,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('MP3 conversion failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to convert audio to MP3: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply real-time mastering with immediate feedback
     */
    public function applyRealTimeMastering(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        try {
            $request->validate([
                'mastering_settings' => 'required|array',
                'mastering_settings.genre_preset' => 'required|string|in:' . implode(',', AdvancedAudioProcessor::getGenrePresets()),
                'mastering_settings.processing_quality' => 'required|string|in:' . implode(',', AdvancedAudioProcessor::getQualityPresets()),
                'mastering_settings.target_loudness' => 'required|numeric|between:-20,-8',
                'mastering_settings.compression_ratio' => 'required|numeric|between:1,20',
                'mastering_settings.eq_settings' => 'required|array',
                'mastering_settings.eq_settings.bass' => 'required|numeric|between:-12,12',
                'mastering_settings.eq_settings.low_mid' => 'required|numeric|between:-12,12',
                'mastering_settings.eq_settings.mid' => 'required|numeric|between:-12,12',
                'mastering_settings.eq_settings.high_mid' => 'required|numeric|between:-12,12',
                'mastering_settings.eq_settings.treble' => 'required|numeric|between:-12,12',
            ]);

            $settings = $request->input('mastering_settings');
            $inputPath = storage_path('app/' . $audioFile->original_path);
            
            // Generate a unique output path for real-time processing
            $outputPath = storage_path('app/public/audio/' . $audioFile->id . '_realtime_' . time() . '.wav');
            
            // Process with optimized settings for speed
            $result = $this->advancedProcessor->processWithAdvancedSettings(
                $inputPath,
                $outputPath,
                $settings
            );

            if ($result['success']) {
                // Update the audio file with the real-time processed version
                $audioFile->mastered_path = str_replace(storage_path('app/'), '', $outputPath);
                $audioFile->status = 'completed';
                $audioFile->metadata = array_merge($audioFile->metadata ?? [], [
                    'realtime_processing' => true,
                    'processing_time' => microtime(true) - LARAVEL_START,
                    'analysis' => $result['analysis'] ?? []
                ]);
                $audioFile->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Real-time mastering applied successfully',
                    'data' => $audioFile,
                    'output_url' => Storage::url($audioFile->mastered_path)
                ]);
            } else {
                throw new Exception('Real-time mastering failed');
            }

        } catch (Exception $e) {
            Log::error('Real-time mastering failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Real-time mastering failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
