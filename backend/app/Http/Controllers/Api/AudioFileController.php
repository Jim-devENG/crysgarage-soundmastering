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
use App\Services\WebAudioAnalysisService;
use App\Services\RealTimeWebAudioAnalysisService;

class AudioFileController extends Controller
{
    use AuthorizesRequests;
    protected EQProcessor $eqProcessor;
    protected AdvancedAudioProcessor $advancedProcessor;
    private $webAnalysisService;
    private $realTimeAnalysisService;

    public function __construct()
    {
        $this->eqProcessor = new EQProcessor();
        $this->advancedProcessor = new AdvancedAudioProcessor();
        $this->webAnalysisService = new WebAudioAnalysisService();
        $this->realTimeAnalysisService = new RealTimeWebAudioAnalysisService();
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
            return response()->json([
                'message' => 'Unsupported file type',
                'error' => 'The uploaded file type is not supported. Please upload a valid audio file.',
            ], 422);
        }

        try {
            $user = $request->user();
        $originalFilename = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $extension = $file->getClientOriginalExtension();

            // Generate unique filename
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $path = $file->storeAs('audio/original', $filename, 'public');

            // Create audio file record
        $audioFile = AudioFile::create([
                'user_id' => $user->id,
            'original_filename' => $originalFilename,
            'original_path' => $path,
                'file_size' => $fileSize,
            'mime_type' => $mimeType,
                'status' => 'uploaded'
            ]);

            return response()->json([
                'message' => 'Audio file uploaded successfully',
                'data' => $audioFile
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Audio upload failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Upload failed',
                'error' => 'Failed to upload audio file. Please try again.',
            ], 500);
        }
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
            'mastering_settings.target_loudness' => 'nullable|numeric|between:-20,-8',
            'mastering_settings.genre_preset' => 'nullable|string|in:' . implode(',', AdvancedAudioProcessor::getGenrePresets()),
            'mastering_settings.processing_quality' => 'nullable|string|in:' . implode(',', AdvancedAudioProcessor::getQualityPresets()),
            'mastering_settings.stereo_width' => 'nullable|numeric|between:-20,20',
            'mastering_settings.bass_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.presence_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.dynamic_range' => 'nullable|string|in:compressed,natural,expanded',
            'mastering_settings.high_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.low_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.noise_reduction' => 'nullable|boolean',
            'mastering_settings.limiter_enabled' => 'nullable|boolean',
            'mastering_settings.limiter_threshold' => 'nullable|numeric|between:-30,0',
            'mastering_settings.limiter_release' => 'nullable|numeric|between:5,1000',
            'mastering_settings.limiter_ceiling' => 'nullable|numeric|between:-3,0',
            'mastering_settings.auto_mastering_enabled' => 'nullable|boolean',
            'mastering_settings.reference_audio_enabled' => 'nullable|boolean',
            'mastering_settings.eq_settings' => 'nullable|array',
            'mastering_settings.eq_settings.low_shelf' => 'nullable|array',
            'mastering_settings.eq_settings.high_shelf' => 'nullable|array',
            'mastering_settings.eq_settings.presence' => 'nullable|array',
            'mastering_settings.compression_ratio' => 'nullable|numeric|between:1,30',
            'mastering_settings.attack_time' => 'nullable|numeric|between:0.0001,0.1',
            'mastering_settings.release_time' => 'nullable|numeric|between:0.001,1',
            'mastering_settings.eq_bands' => 'nullable|array',
        ]);

        try {
            $audioFile->update(['status' => 'processing']);

            $inputPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            $outputPath = Storage::disk(config('audio.storage.disk'))->path(
                config('audio.processing.output_directory') . '/' . $audioFile->id . '_automatic_mastered.wav'
            );

            // Ensure output directory exists
            if (!file_exists(dirname($outputPath))) {
                mkdir(dirname($outputPath), 0755, true);
            }

            // Merge settings with defaults if needed
            $settings = $request->input('mastering_settings');
            
            // Set defaults for missing values
            $settings['target_loudness'] = $settings['target_loudness'] ?? -10;
            $settings['genre_preset'] = $settings['genre_preset'] ?? 'pop';
            $settings['processing_quality'] = $settings['processing_quality'] ?? 'standard';
            
            // Apply genre preset if auto mastering is enabled
            if ($settings['auto_mastering_enabled'] ?? false) {
                $genrePreset = AdvancedAudioProcessor::getGenrePresetData($settings['genre_preset']);
                if ($genrePreset) {
                    $settings = array_merge($settings, $genrePreset);
                }
            }

            $result = $this->advancedProcessor->processWithAdvancedSettings(
                $inputPath,
                $outputPath,
                $settings
            );

            // Update audio file with new metadata
            $audioFile->update([
                'status' => 'completed',
                'automatic_mastered_path' => config('audio.processing.output_directory') . '/' . $audioFile->id . '_automatic_mastered.wav',
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'automatic_mastering_applied' => true,
                    'mastering_settings' => $settings,
                    'analysis' => $result['analysis'],
                    'mastering_changes' => $result['mastering_changes'],
                    'processing_time' => microtime(true) - LARAVEL_START,
                    'auto_mastering_enabled' => $settings['auto_mastering_enabled'] ?? false,
                    'limiter_enabled' => $settings['limiter_enabled'] ?? false,
                    'eq_settings' => $settings['eq_settings'] ?? [],
                    'compression_settings' => [
                        'ratio' => $settings['compression_ratio'] ?? null,
                        'attack' => $settings['attack_time'] ?? null,
                        'release' => $settings['release_time'] ?? null,
                    ],
                    'limiter_settings' => [
                        'threshold' => $settings['limiter_threshold'] ?? null,
                        'release' => $settings['limiter_release'] ?? null,
                        'ceiling' => $settings['limiter_ceiling'] ?? null,
                    ],
                    'enhancement_settings' => [
                        'stereo_width' => $settings['stereo_width'] ?? null,
                        'bass_boost' => $settings['bass_boost'] ?? null,
                        'presence_boost' => $settings['presence_boost'] ?? null,
                        'dynamic_range' => $settings['dynamic_range'] ?? null,
                        'high_freq_enhancement' => $settings['high_freq_enhancement'] ?? false,
                        'low_freq_enhancement' => $settings['low_freq_enhancement'] ?? false,
                        'noise_reduction' => $settings['noise_reduction'] ?? false,
                    ],
                ]),
                'mastering_metadata' => [
                    'automatic' => [
                        'applied' => true,
                        'settings' => $settings,
                        'analysis' => $result['analysis'],
                        'mastering_changes' => $result['mastering_changes'],
                        'processing_time' => microtime(true) - LARAVEL_START,
                    ]
                ]
            ]);

            $audioFile->mastered_path = $audioFile->automatic_mastered_path ?? $audioFile->advanced_mastered_path;
            $audioFile->save();

            return response()->json([
                'message' => 'Crysgarage Studio 1 mastering applied successfully',
                'data' => [
                    'audio_file' => $audioFile->fresh(),
                    'mastering_changes' => $result['mastering_changes'] ?? null,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Crysgarage Studio 1 mastering failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Crysgarage Studio 1 mastering failed',
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
            // Perform analysis if not already done using web API
            try {
                $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->mastered_path);
                
                // Use web API analysis service instead of local SoX
                $webAnalysisService = new \App\Services\WebAudioAnalysisService();
                $analysis = $webAnalysisService->analyzeAudio($audioPath);
                
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
    public function download($id, Request $request)
    {
        $audio = AudioFile::findOrFail($id);
        $format = $request->query('format', 'wav');
        $path = storage_path('app/' . $audio->mastered_path);

        if (!file_exists($path)) {
            abort(404, 'File not found');
        }

        // If requested format is the same as stored, just return the file
        if ($format === 'wav') {
            return response()->download($path, pathinfo($audio->original_filename, PATHINFO_FILENAME) . '.wav');
        }

        // Otherwise, convert using ffmpeg
        $output = tempnam(sys_get_temp_dir(), 'audio_') . '.' . $format;
        $cmd = "ffmpeg -y -i " . escapeshellarg($path) . " " . escapeshellarg($output);
        exec($cmd);

        if (!file_exists($output)) {
            abort(500, 'Conversion failed');
        }

        return response()->download($output, pathinfo($audio->original_filename, PATHINFO_FILENAME) . '.' . $format)->deleteFileAfterSend(true);
    }

    /**
     * Get processing status
     */
    public function getStatus(AudioFile $audioFile): JsonResponse
    {
        Log::info('getStatus called', [
            'audio_file_id' => $audioFile->id,
            'user_id' => auth()->id(),
            'status' => $audioFile->status,
        ]);
        $this->authorize('view', $audioFile);

        // Get mastering type from request if available
        $masteringType = request()->query('mastering_type', 'automatic');

        $masteredPath = null;
        $masteringChanges = null;

        switch ($masteringType) {
            case 'automatic':
                $masteredPath = $audioFile->automatic_mastered_path;
                $masteringChanges = $audioFile->mastering_metadata['automatic']['mastering_changes'] ?? null;
                break;
            case 'lite-automatic':
                $masteredPath = $audioFile->lite_automatic_mastered_path;
                $masteringChanges = $audioFile->mastering_metadata['lite_automatic']['mastering_changes'] ?? null;
                break;
            case 'advanced':
                $masteredPath = $audioFile->advanced_mastered_path;
                $masteringChanges = $audioFile->mastering_metadata['advanced']['mastering_changes'] ?? null;
                break;
            default:
                $masteredPath = $audioFile->mastered_path;
                $masteringChanges = $audioFile->metadata['mastering_changes'] ?? null;
        }

        $response = response()->json([
            'data' => [
                'status' => $audioFile->status,
                'progress' => $this->calculateProgress($audioFile),
                'error_message' => $audioFile->error_message,
                'created_at' => $audioFile->created_at,
                'updated_at' => $audioFile->updated_at,
                'mastered_path' => $masteredPath,
                'original_filename' => $audioFile->original_filename,
                'mastering_changes' => $masteringChanges,
                'mastering_type' => $masteringType,
                'mastering_metadata' => $audioFile->mastering_metadata,
            ]
        ]);
        // Add CORS headers for debugging
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        Log::info('getStatus response', ['audio_file_id' => $audioFile->id, 'response' => $response->getContent()]);
        return $response;
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
        return response()->json([
            'data' => [
                'genre_presets' => AdvancedAudioProcessor::getGenrePresets(),
                'quality_presets' => AdvancedAudioProcessor::getQualityPresets(),
            ]
        ]);
    }

    /**
     * Get genre presets for Automatic Mastery
     */
    public function getGenrePresets(): JsonResponse
    {
        return response()->json([
            'data' => [
                'genre_presets' => AdvancedAudioProcessor::getAllGenrePresetData(),
                'available_genres' => AdvancedAudioProcessor::getGenrePresets(),
            ]
        ]);
    }

    /**
     * Get real-time frequency spectrum analysis using web API
     */
    public function getFrequencySpectrum(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            
            if (!file_exists($audioPath)) {
                return response()->json([
                    'error' => 'Audio file not found'
                ], 404);
            }

            // Use web API service for frequency spectrum analysis
            $spectrumData = $this->webAnalysisService->analyzeFrequencySpectrum($audioPath);

            return response()->json([
                'data' => $spectrumData
            ]);

        } catch (\Exception $e) {
            Log::error('Web API frequency spectrum analysis failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to analyze frequency spectrum: ' . $e->getMessage()
            ], 500);
        }
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

            $request->validate([
                'mastering_settings' => 'required|array',
            'mastering_settings.genre_preset' => 'nullable|string|in:' . implode(',', AdvancedAudioProcessor::getGenrePresets()),
            'mastering_settings.limiter_enabled' => 'nullable|boolean',
            'mastering_settings.limiter_threshold' => 'nullable|numeric|between:-30,0',
            'mastering_settings.limiter_release' => 'nullable|numeric|between:5,1000',
            'mastering_settings.limiter_ceiling' => 'nullable|numeric|between:-3,0',
            'mastering_settings.auto_mastering_enabled' => 'nullable|boolean',
            'mastering_settings.eq_settings' => 'nullable|array',
            'mastering_settings.eq_settings.low_shelf' => 'nullable|array',
            'mastering_settings.eq_settings.high_shelf' => 'nullable|array',
            'mastering_settings.eq_settings.presence' => 'nullable|array',
            'mastering_settings.compression_ratio' => 'nullable|numeric|between:1,30',
            'mastering_settings.attack_time' => 'nullable|numeric|between:0.0001,0.1',
            'mastering_settings.release_time' => 'nullable|numeric|between:0.001,1',
            'mastering_settings.stereo_width' => 'nullable|numeric|between:-20,20',
            'mastering_settings.bass_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.presence_boost' => 'nullable|numeric|between:-3,6',
            'mastering_settings.dynamic_range' => 'nullable|string|in:compressed,natural,expanded',
            'mastering_settings.high_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.low_freq_enhancement' => 'nullable|boolean',
            'mastering_settings.noise_reduction' => 'nullable|boolean',
            'mastering_settings.eq_bands' => 'nullable|array',
        ]);

        try {
            $settings = $request->input('mastering_settings');
            
            // For real-time processing, we use the original audio path
            // since effects are applied using Web Audio API in the browser
            $originalPath = $audioFile->original_path;
            
            // Get genre preset for real-time analysis
            $genrePreset = null;
            if (!empty($settings['genre_preset'])) {
                $genrePresets = AdvancedAudioProcessor::getGenrePresets();
                $genrePreset = $genrePresets[$settings['genre_preset']] ?? null;
            }
            
            // Update audio file with new metadata and settings
            $audioFile->update([
                'status' => 'completed',
                'mastered_path' => $originalPath, // Use original for real-time
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'realtime_mastering_applied' => true,
                    'mastering_settings' => $settings,
                    'genre_preset' => $settings['genre_preset'] ?? null,
                    'genre_preset_data' => $genrePreset,
                    'processing_timestamp' => now()->toISOString(),
                    'web_audio_api_used' => true,
                    'auto_mastering_enabled' => $settings['auto_mastering_enabled'] ?? false,
                    'limiter_enabled' => $settings['limiter_enabled'] ?? false,
                    'eq_settings' => $settings['eq_settings'] ?? [],
                    'compression_settings' => [
                        'ratio' => $settings['compression_ratio'] ?? null,
                        'attack' => $settings['attack_time'] ?? null,
                        'release' => $settings['release_time'] ?? null,
                    ],
                    'limiter_settings' => [
                        'threshold' => $settings['limiter_threshold'] ?? null,
                        'release' => $settings['limiter_release'] ?? null,
                        'ceiling' => $settings['limiter_ceiling'] ?? null,
                    ],
                    'enhancement_settings' => [
                        'stereo_width' => $settings['stereo_width'] ?? null,
                        'bass_boost' => $settings['bass_boost'] ?? null,
                        'presence_boost' => $settings['presence_boost'] ?? null,
                        'dynamic_range' => $settings['dynamic_range'] ?? null,
                        'high_freq_enhancement' => $settings['high_freq_enhancement'] ?? false,
                        'low_freq_enhancement' => $settings['low_freq_enhancement'] ?? false,
                        'noise_reduction' => $settings['noise_reduction'] ?? false,
                    ],
                ])
            ]);

                return response()->json([
                    'message' => 'Real-time mastering applied successfully',
                'data' => [
                    'audio_file' => $audioFile,
                    'real_time_path' => $originalPath,
                    'real_time_url' => Storage::disk(config('audio.storage.disk'))->url($originalPath),
                    'web_audio_api' => true,
                    'genre_preset' => $genrePreset,
                    'settings_applied' => $settings,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Real-time mastering failed', [
                'error' => $e->getMessage(),
                'audio_file_id' => $audioFile->id,
            ]);

            $audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Real-time mastering failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload reference audio for mastering
     */
    public function uploadReferenceAudio(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        $request->validate([
            'reference_audio' => 'required|file|max:102400', // 100MB max
        ]);

        try {
            $file = $request->file('reference_audio');
            $originalFilename = $file->getClientOriginalName();
            $path = $file->store(
                config('audio.processing.reference_directory', 'reference_audio'), 
                config('audio.storage.disk')
            );

            // Update audio file with reference audio path
            $audioFile->update([
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'reference_audio_path' => $path,
                    'reference_audio_filename' => $originalFilename,
                    'reference_audio_uploaded_at' => now()->toISOString(),
                ])
            ]);

            return response()->json([
                'message' => 'Reference audio uploaded successfully',
                'data' => [
                    'reference_audio_path' => $path,
                    'reference_audio_filename' => $originalFilename,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Reference audio upload failed', [
                'error' => $e->getMessage(),
                'audio_file_id' => $audioFile->id,
            ]);

            return response()->json([
                'message' => 'Reference audio upload failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test web API analysis
     */
    public function testWebAPIAnalysis(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            
            if (!file_exists($audioPath)) {
                return response()->json([
                    'error' => 'Audio file not found'
                ], 404);
            }

            $analysis = $this->webAnalysisService->analyzeAudio($audioPath);
            $spectrumData = $this->webAnalysisService->analyzeFrequencySpectrum($audioPath);

            return response()->json([
                'data' => [
                    'analysis' => $analysis,
                    'spectrum' => $spectrumData,
                    'audio_file_id' => $audioFile->id,
                    'test_timestamp' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Web API analysis test failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Web API analysis test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Real-time audio analysis using multiple web APIs
     */
    public function getRealTimeAnalysis(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            
            if (!file_exists($audioPath)) {
                return response()->json([
                    'error' => 'Audio file not found'
                ], 404);
            }

            $startTime = microtime(true);
            $analysis = $this->realTimeAnalysisService->analyzeAudioRealTime($audioPath);
            $executionTime = microtime(true) - $startTime;

            Log::info('Real-time analysis completed', [
                'audio_file_id' => $audioFile->id,
                'execution_time' => round($executionTime, 3),
                'analysis_quality' => $analysis['analysis_quality'],
            ]);

            return response()->json([
                'data' => [
                    'analysis' => $analysis,
                    'execution_time_ms' => round($executionTime * 1000, 2),
                    'audio_file_id' => $audioFile->id,
                    'analysis_timestamp' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Real-time analysis failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Real-time analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Real-time frequency spectrum analysis
     */
    public function getRealTimeFrequencySpectrum(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            
            if (!file_exists($audioPath)) {
                return response()->json([
                    'error' => 'Audio file not found'
                ], 404);
            }

            $startTime = microtime(true);
            $spectrumData = $this->realTimeAnalysisService->analyzeFrequencySpectrumRealTime($audioPath);
            $executionTime = microtime(true) - $startTime;

            Log::info('Real-time frequency spectrum analysis completed', [
                'audio_file_id' => $audioFile->id,
                'execution_time' => round($executionTime, 3),
                'analysis_quality' => $spectrumData['analysis_quality'],
            ]);

            return response()->json([
                'data' => [
                    'spectrum' => $spectrumData,
                    'execution_time_ms' => round($executionTime * 1000, 2),
                    'audio_file_id' => $audioFile->id,
                    'analysis_timestamp' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Real-time frequency spectrum analysis failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Real-time frequency spectrum analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive real-time analysis (both audio and spectrum)
     */
    public function getComprehensiveRealTimeAnalysis(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $audioPath = Storage::disk(config('audio.storage.disk'))->path($audioFile->original_path);
            
            if (!file_exists($audioPath)) {
                return response()->json([
                    'error' => 'Audio file not found'
                ], 404);
            }

            $startTime = microtime(true);
            
            // Perform both analyses in parallel
            $analysis = $this->realTimeAnalysisService->analyzeAudioRealTime($audioPath);
            $spectrumData = $this->realTimeAnalysisService->analyzeFrequencySpectrumRealTime($audioPath);
            
            $executionTime = microtime(true) - $startTime;

            Log::info('Comprehensive real-time analysis completed', [
                'audio_file_id' => $audioFile->id,
                'execution_time' => round($executionTime, 3),
                'audio_quality' => $analysis['analysis_quality'],
                'spectrum_quality' => $spectrumData['analysis_quality'],
            ]);

            return response()->json([
                'data' => [
                    'audio_analysis' => $analysis,
                    'frequency_spectrum' => $spectrumData,
                    'execution_time_ms' => round($executionTime * 1000, 2),
                    'audio_file_id' => $audioFile->id,
                    'analysis_timestamp' => now()->toISOString(),
                    'apis_used' => [
                        'audio' => $analysis['api_source'],
                        'spectrum' => $spectrumData['api_source'],
                    ],
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Comprehensive real-time analysis failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Comprehensive real-time analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
