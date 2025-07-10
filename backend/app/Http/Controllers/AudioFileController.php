<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAudioFile;
use App\Models\AudioFile;
use App\Services\EQProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AudioFileController extends Controller
{
    use AuthorizesRequests;

    private const ALLOWED_MIME_TYPES = [
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mpeg',
        'audio/mp3',
        'audio/flac',
        'audio/x-flac',
        'audio/aiff',
        'audio/x-aiff',
        'audio/aif',
        'audio/x-aif',
        'audio/ogg',
        'audio/vorbis',
        'audio/x-ms-wma',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
    ];

    private const MAX_FILE_SIZE = 100 * 1024; // 100MB in KB (Laravel validation expects KB)

    public function __construct()
    {
        // Remove incorrect middleware call
    }

    public function store(Request $request): JsonResponse
    {
        $uploadStartTime = microtime(true);
        $uploadId = uniqid('upload_', true);

        // Log request received
        Log::debug('UPLOAD START', [
            'upload_id' => $uploadId,
            'user' => auth()->user(),
            'hasFile' => $request->hasFile('audio'),
            'allFiles' => $request->allFiles(),
            'headers' => $request->headers->all(),
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length'),
            'post_data' => $request->post(),
        ]);

        try {
            // Step 1: Check content length (prevents PHP upload limit issues)
            $contentLength = $request->server('CONTENT_LENGTH');
            $maxSize = config('audio.file_size.max_upload_size');
            if ($contentLength && $contentLength > $maxSize) {
                Log::debug('File too large', [
                    'upload_id' => $uploadId,
                    'content_length' => $contentLength,
                    'max_size' => $maxSize,
                ]);
                return response()->json([
                    'message' => 'File too large',
                    'error' => 'The uploaded file exceeds the maximum allowed size of ' . ($maxSize / 1024 / 1024) . 'MB',
                    'max_size_mb' => $maxSize / 1024 / 1024,
                    'uploaded_size_mb' => round($contentLength / 1024 / 1024, 2),
                    'upload_id' => $uploadId,
                ], 413);
            }

            // Step 2: Log config
            $allowedMimeTypes = config('audio.supported_formats.mime_types');
            $allowedExtensions = implode(',', config('audio.supported_formats.extensions'));
            $maxFileSize = config('audio.file_size.max_upload_size_kb');
            Log::debug('Config', [
                'upload_id' => $uploadId,
                'allowed_mime_types' => $allowedMimeTypes,
                'allowed_extensions' => $allowedExtensions,
                'max_file_size_kb' => $maxFileSize,
            ]);

            // Step 3: Check if file is present
            if (!$request->hasFile('audio')) {
                Log::debug('No file provided', [
                    'upload_id' => $uploadId,
                    'files' => $request->allFiles(),
                    'post_data' => $request->post(),
                ]);
                return response()->json([
                    'message' => 'No file provided',
                    'error' => 'Please select an audio file to upload.',
                    'upload_id' => $uploadId,
                ], 400);
            }

            $file = $request->file('audio');

            // Step 4: Log file received
            Log::debug('File received', [
                'upload_id' => $uploadId,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
                'temp_path' => $file->getPathname(),
            ]);

            // Step 5: Check file validity
            if (!$file->isValid()) {
                Log::debug('Invalid file', [
                    'upload_id' => $uploadId,
                    'file_error' => $file->getError(),
                    'file_error_message' => $this->getFileErrorMessage($file->getError()),
                ]);
                return response()->json([
                    'message' => 'Invalid file',
                    'error' => 'The uploaded file is invalid: ' . $this->getFileErrorMessage($file->getError()),
                    'upload_id' => $uploadId,
                ], 400);
            }

            // Step 6: Validate file (Laravel validation)
            $validator = Validator::make($request->all(), [
                'audio' => [
                    'required',
                    'file',
                    'max:' . $maxFileSize,
                    'mimes:' . $allowedExtensions,
                ],
            ]);
            if ($validator->fails()) {
                Log::debug('Validation failed', [
                    'upload_id' => $uploadId,
                    'validation_errors' => $validator->errors(),
                ]);
                return response()->json([
                    'message' => 'Validation failed',
                    'error' => 'File validation failed',
                    'details' => $validator->errors(),
                    'upload_id' => $uploadId,
                ], 422);
            }
            Log::debug('File validation passed', ['upload_id' => $uploadId]);

            // Step 7: Additional MIME type validation
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file->getPathname());
            finfo_close($finfo);
            Log::debug('MIME type check', [
                'upload_id' => $uploadId,
                'detected_mime_type' => $mimeType,
                'is_allowed' => in_array($mimeType, $allowedMimeTypes),
            ]);
            if (!in_array($mimeType, $allowedMimeTypes)) {
                Log::debug('Invalid MIME type', [
                    'upload_id' => $uploadId,
                    'mime_type' => $mimeType,
                    'allowed_types' => $allowedMimeTypes,
                ]);
                $supportedFormats = strtoupper(implode(', ', config('audio.supported_formats.extensions')));
                return response()->json([
                    'message' => 'Unsupported file type',
                    'error' => "Invalid file type. Allowed types: {$supportedFormats}",
                    'detected_type' => $mimeType,
                    'upload_id' => $uploadId,
                ], 422);
            }

            // Step 8: Store file
            Log::debug('Storing file', [
                'upload_id' => $uploadId,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
            $path = $file->store('audio/original', 'public');
            Log::debug('File stored successfully', [
                'upload_id' => $uploadId,
                'stored_path' => $path,
            ]);

            // Step 9: Create DB record
            $audioFile = AudioFile::create([
                'user_id' => auth()->id(),
                'original_path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $mimeType,
                'file_size' => $file->getSize(),
            ]);
            Log::debug('Audio file record created', [
                'upload_id' => $uploadId,
                'audio_file_id' => $audioFile->id,
            ]);

            // Step 10: Dispatch processing job
            ProcessAudioFile::dispatch($audioFile);
            Log::debug('Processing job dispatched', [
                'upload_id' => $uploadId,
                'audio_file_id' => $audioFile->id,
            ]);

            // Step 11: Success response
            $uploadTime = microtime(true) - $uploadStartTime;
            Log::debug('UPLOAD SUCCESS', [
                'upload_id' => $uploadId,
                'audio_file_id' => $audioFile->id,
                'upload_time_seconds' => round($uploadTime, 3),
                'message' => 'Audio file uploaded successfully',
            ]);
            return response()->json([
                'message' => 'Audio file uploaded successfully',
                'audio_file' => $audioFile,
                'upload_id' => $uploadId,
            ], 201);

        } catch (\Exception $e) {
            $uploadTime = microtime(true) - $uploadStartTime;
            Log::debug('UPLOAD FAILED: Exception', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
                'upload_time_seconds' => round($uploadTime, 3),
            ]);
            return response()->json([
                'message' => 'Failed to upload audio file',
                'error' => 'An unexpected error occurred. Please try again.',
                'upload_id' => $uploadId,
            ], 500);
        }
    }

    /**
     * Get human-readable file upload error message
     */
    private function getFileErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
            default => 'Unknown upload error',
        };
    }

    public function show(AudioFile $audioFile): JsonResponse
    {
        Log::info('User accessing audio file:', [
            'user' => auth()->user(),
            'audio_file' => $audioFile
        ]);

        $this->authorize('view', $audioFile);

        return response()->json([
            'audio_file' => $audioFile->load(['user:id,name,email']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Log::info('User accessing audio files:', ['user' => auth()->user()]);
        
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        $audioFiles = auth()->user()
            ->audioFiles()
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'audio_files' => $audioFiles->items(),
            'pagination' => [
                'total' => $audioFiles->total(),
                'per_page' => $audioFiles->perPage(),
                'current_page' => $audioFiles->currentPage(),
                'last_page' => $audioFiles->lastPage(),
            ],
        ]);
    }

    public function destroy(AudioFile $audioFile): JsonResponse
    {
        Log::info('User attempting to delete audio file:', [
            'user' => auth()->user(),
            'audio_file' => $audioFile
        ]);

        $this->authorize('delete', $audioFile);

        try {
            if ($audioFile->original_path) {
                Storage::disk('public')->delete($audioFile->original_path);
            }

            if ($audioFile->mastered_path) {
                Storage::disk('public')->delete($audioFile->mastered_path);
            }

            $audioFile->delete();

            return response()->json([
                'message' => 'Audio file deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete audio file:', [
                'error' => $e->getMessage(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);

            return response()->json([
                'message' => 'Failed to delete audio file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get different versions of the audio file for A/B comparison
     */
    public function getVersions(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        $versions = [
            'original' => [
                'label' => 'Original',
                'description' => 'Unprocessed original file',
                'path' => $audioFile->original_path,
                'url' => $audioFile->original_path ? Storage::disk('public')->url($audioFile->original_path) : null,
                'size' => $audioFile->file_size,
            ]
        ];

        // Add AI-only version if available
        if ($audioFile->ai_only_path && Storage::disk('public')->exists($audioFile->ai_only_path)) {
            $versions['ai_only'] = [
                'label' => 'AI Mastered Only',
                'description' => 'AI mastered without EQ enhancement',
                'path' => $audioFile->ai_only_path,
                'url' => Storage::disk('public')->url($audioFile->ai_only_path),
                'size' => Storage::disk('public')->size($audioFile->ai_only_path),
            ];
        }

        // Add final version (with EQ if applied)
        if ($audioFile->mastered_path && Storage::disk('public')->exists($audioFile->mastered_path)) {
            $label = $audioFile->eq_applied ? 'Final (AI + EQ)' : 'AI Mastered';
            $description = $audioFile->eq_applied 
                ? 'AI mastered with EQ enhancement applied'
                : 'AI mastered final version';

            $versions['final'] = [
                'label' => $label,
                'description' => $description,
                'path' => $audioFile->mastered_path,
                'url' => Storage::disk('public')->url($audioFile->mastered_path),
                'size' => Storage::disk('public')->size($audioFile->mastered_path),
                'eq_applied' => $audioFile->eq_applied,
                'eq_settings' => $audioFile->eq_settings,
            ];
        }

        return response()->json([
            'audio_file_id' => $audioFile->id,
            'versions' => $versions,
            'processing_info' => [
                'status' => $audioFile->status,
                'eq_applied' => $audioFile->eq_applied,
                'preset_used' => $audioFile->preset?->name,
                'processing_time' => $audioFile->metadata['processing_time'] ?? null,
                'ai_processing_time' => $audioFile->metadata['ai_processing_time'] ?? null,
                'eq_processing_time' => $audioFile->metadata['eq_processing_time'] ?? null,
            ]
        ]);
    }

    /**
     * Apply EQ settings to an audio file
     */
    public function applyEQ(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        try {
            $validator = Validator::make($request->all(), [
                'eq_settings' => 'required|array',
                'eq_settings.enabled' => 'required|boolean',
                'eq_settings.bass' => 'required|numeric|min:-12|max:12',
                'eq_settings.low_mid' => 'required|numeric|min:-12|max:12',
                'eq_settings.mid' => 'required|numeric|min:-12|max:12',
                'eq_settings.high_mid' => 'required|numeric|min:-12|max:12',
                'eq_settings.treble' => 'required|numeric|min:-12|max:12',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $frontendSettings = $request->input('eq_settings');
            
            // Convert frontend settings to backend format
            $eqSettings = [
                [
                    'frequency' => 80, // Bass
                    'gain' => $frontendSettings['bass']
                ],
                [
                    'frequency' => 200, // Low Mid
                    'gain' => $frontendSettings['low_mid']
                ],
                [
                    'frequency' => 1000, // Mid
                    'gain' => $frontendSettings['mid']
                ],
                [
                    'frequency' => 5000, // High Mid
                    'gain' => $frontendSettings['high_mid']
                ],
                [
                    'frequency' => 10000, // Treble
                    'gain' => $frontendSettings['treble']
                ]
            ];
            
            // Get the input file path
            $inputPath = $audioFile->ai_only_path ?? $audioFile->mastered_path;
            if (!$inputPath || !Storage::disk('public')->exists($inputPath)) {
                throw new \Exception('No mastered audio file found to apply EQ');
            }

            $fullInputPath = Storage::disk('public')->path($inputPath);
            
            // Process the audio with EQ
            $eqProcessor = new EQProcessor();
            $outputPath = $eqProcessor->enhanceAIMaster($fullInputPath, $eqSettings);
            
            // Store the processed file
            $relativeOutputPath = 'audio/mastered/' . basename($outputPath);
            Storage::disk('public')->put($relativeOutputPath, file_get_contents($outputPath));
            
            // Update the audio file record
            $audioFile->update([
                'mastered_path' => $relativeOutputPath,
                'eq_applied' => true,
                'eq_settings' => $frontendSettings,
            ]);

            // Clean up temporary files
            $eqProcessor->cleanupTempFiles();

            return response()->json([
                'message' => 'EQ settings applied successfully',
                'audio_file' => $audioFile->fresh(),
            ]);

        } catch (ValidationException $e) {
            Log::warning('EQ settings validation failed:', [
                'errors' => $e->errors(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Failed to apply EQ settings:', [
                'error' => $e->getMessage(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);
            return response()->json([
                'message' => 'Failed to apply EQ settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get lite mastering presets
     */
    public function getLiteMasteringPresets(): JsonResponse
    {
        // Convert to frontend-expected format
        $frontendPresets = [
            'presets' => [
                [
                    'value' => 'rock',
                    'label' => 'Rock',
                    'description' => 'High energy, punchy sound with enhanced bass and presence',
                    'target_loudness' => -10,
                    'compression_ratio' => 4,
                    'stereo_width' => 15,
                    'bass_boost' => 2,
                    'presence_boost' => 2,
                    'dynamic_range' => 'compressed',
                    'high_freq_enhancement' => true,
                    'low_freq_enhancement' => true,
                    'noise_reduction' => false,
                ],
                [
                    'value' => 'pop',
                    'label' => 'Pop',
                    'description' => 'Bright, commercial sound with enhanced clarity',
                    'target_loudness' => -8,
                    'compression_ratio' => 6,
                    'stereo_width' => 20,
                    'bass_boost' => 1.5,
                    'presence_boost' => 2.5,
                    'dynamic_range' => 'compressed',
                    'high_freq_enhancement' => true,
                    'low_freq_enhancement' => false,
                    'noise_reduction' => false,
                ],
                [
                    'value' => 'electronic',
                    'label' => 'Electronic',
                    'description' => 'Deep bass, crisp highs, and enhanced stereo width',
                    'target_loudness' => -6,
                    'compression_ratio' => 8,
                    'stereo_width' => 25,
                    'bass_boost' => 3,
                    'presence_boost' => 1.5,
                    'dynamic_range' => 'compressed',
                    'high_freq_enhancement' => true,
                    'low_freq_enhancement' => true,
                    'noise_reduction' => false,
                ],
                [
                    'value' => 'jazz',
                    'label' => 'Jazz',
                    'description' => 'Warm, natural sound with enhanced midrange',
                    'target_loudness' => -12,
                    'compression_ratio' => 2,
                    'stereo_width' => 10,
                    'bass_boost' => 1,
                    'presence_boost' => 1.5,
                    'dynamic_range' => 'natural',
                    'high_freq_enhancement' => false,
                    'low_freq_enhancement' => false,
                    'noise_reduction' => true,
                ],
                [
                    'value' => 'classical',
                    'label' => 'Classical',
                    'description' => 'Natural, transparent sound with subtle enhancement',
                    'target_loudness' => -14,
                    'compression_ratio' => 1.5,
                    'stereo_width' => 5,
                    'bass_boost' => 0.5,
                    'presence_boost' => 1,
                    'dynamic_range' => 'natural',
                    'high_freq_enhancement' => false,
                    'low_freq_enhancement' => false,
                    'noise_reduction' => true,
                ],
            ],
            'quality_options' => [
                [
                    'value' => 'fast',
                    'label' => 'Fast',
                    'description' => 'Quick processing for immediate results'
                ],
                [
                    'value' => 'standard',
                    'label' => 'Standard',
                    'description' => 'Balanced quality and speed'
                ],
                [
                    'value' => 'high',
                    'label' => 'High',
                    'description' => 'Maximum quality processing'
                ],
            ],
            'dynamic_range_options' => [
                [
                    'value' => 'natural',
                    'label' => 'Natural',
                    'description' => 'Preserve original dynamics'
                ],
                [
                    'value' => 'balanced',
                    'label' => 'Balanced',
                    'description' => 'Moderate compression'
                ],
                [
                    'value' => 'compressed',
                    'label' => 'Compressed',
                    'description' => 'High compression for loudness'
                ],
            ],
        ];

        return response()->json($frontendPresets);
    }

    /**
     * Get processing status of an audio file
     */
    public function getStatus(AudioFile $audioFile): JsonResponse
    {
        $this->authorize('view', $audioFile);

        return response()->json([
            'id' => $audioFile->id,
            'status' => $audioFile->status,
            'progress' => $audioFile->progress ?? 0,
            'mastered_path' => $audioFile->mastered_path,
            'original_filename' => $audioFile->original_filename,
            'error_message' => $audioFile->error_message,
            'created_at' => $audioFile->created_at,
            'updated_at' => $audioFile->updated_at,
        ]);
    }

    /**
     * Download processed audio file
     */
    public function download(AudioFile $audioFile, Request $request): JsonResponse
    {
        $this->authorize('view', $audioFile);

        try {
            $format = $request->input('format', 'wav');
            
            // Determine which file to download
            $filePath = null;
            $fileName = null;
            
            if ($audioFile->mastered_path && Storage::disk('public')->exists($audioFile->mastered_path)) {
                $filePath = $audioFile->mastered_path;
                $fileName = 'mastered_' . $audioFile->original_filename;
            } elseif ($audioFile->original_path && Storage::disk('public')->exists($audioFile->original_path)) {
                $filePath = $audioFile->original_path;
                $fileName = $audioFile->original_filename;
            } else {
                return response()->json([
                    'message' => 'No audio file found for download',
                ], 404);
            }

            $fullPath = Storage::disk('public')->path($filePath);
            
            if (!file_exists($fullPath)) {
                return response()->json([
                    'message' => 'Audio file not found on disk',
                ], 404);
            }

            // Get file contents
            $fileContents = file_get_contents($fullPath);
            
            if ($fileContents === false) {
                return response()->json([
                    'message' => 'Failed to read audio file',
                ], 500);
            }

            // Determine MIME type
            $mimeType = Storage::disk('public')->mimeType($filePath) ?? 'audio/wav';

            return response()->json([
                'file' => base64_encode($fileContents),
                'filename' => $fileName,
                'mime_type' => $mimeType,
                'size' => strlen($fileContents),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to download audio file:', [
                'error' => $e->getMessage(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);

            return response()->json([
                'message' => 'Failed to download audio file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apply lite automatic mastering to an audio file
     */
    public function applyLiteAutomaticMastering(Request $request, AudioFile $audioFile): JsonResponse
    {
        $this->authorize('update', $audioFile);

        try {
            $validator = Validator::make($request->all(), [
                'genre_preset' => 'required|string|in:rock,pop,electronic,jazz,classical',
                'target_loudness' => 'required|numeric|min:-20|max:-5',
                'bass_boost' => 'required|numeric|min:0|max:5',
                'presence_boost' => 'required|numeric|min:0|max:5',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Get the genre preset settings
            $presets = [
                'rock' => [
                    'bass' => 2.0,
                    'low_mid' => 1.5,
                    'mid' => 0.5,
                    'high_mid' => 2.0,
                    'treble' => 1.0
                ],
                'pop' => [
                    'bass' => 1.5,
                    'low_mid' => 0.5,
                    'mid' => 1.0,
                    'high_mid' => 2.5,
                    'treble' => 2.0
                ],
                'electronic' => [
                    'bass' => 3.0,
                    'low_mid' => 1.0,
                    'mid' => 0.0,
                    'high_mid' => 1.5,
                    'treble' => 2.5
                ],
                'jazz' => [
                    'bass' => 1.0,
                    'low_mid' => 2.0,
                    'mid' => 2.5,
                    'high_mid' => 1.5,
                    'treble' => 0.5
                ],
                'classical' => [
                    'bass' => 0.5,
                    'low_mid' => 1.0,
                    'mid' => 1.5,
                    'high_mid' => 1.0,
                    'treble' => 1.5
                ]
            ];

            $genrePreset = $request->input('genre_preset');
            $eqSettings = $presets[$genrePreset];
            
            // Apply bass and presence boosts
            $eqSettings['bass'] += $request->input('bass_boost', 0);
            $eqSettings['high_mid'] += $request->input('presence_boost', 0);
            
            // Get the input file path
            $inputPath = $audioFile->original_path;
            if (!$inputPath || !Storage::disk('public')->exists($inputPath)) {
                throw new \Exception('No original audio file found for processing');
            }

            $fullInputPath = Storage::disk('public')->path($inputPath);
            
            // Try AI mastering first
            $aiMasteringUsed = false;
            $outputPath = null;
            
            try {
                // Check if aimastering tool is available
                $aimasteringPath = base_path('aimastering-windows-amd64.exe');
                if (file_exists($aimasteringPath)) {
                    $outputPath = $this->applyAIMastering($fullInputPath, $request->input('target_loudness'));
                    $aiMasteringUsed = true;
                } else {
                    Log::info('Aimastering tool not available, using fallback processing', ['audio_file_id' => $audioFile->id]);
                }
            } catch (\Exception $e) {
                Log::warning('AI mastering failed, using fallback processing', [
                    'error' => $e->getMessage(),
                    'audio_file_id' => $audioFile->id
                ]);
            }
            
            // If AI mastering failed or not available, use local processing
            if (!$outputPath) {
                $outputPath = $this->applyLocalMastering($fullInputPath, $request->input('target_loudness'));
            }
            
            // Apply EQ enhancement
            $eqProcessor = new EQProcessor();
            $finalOutputPath = $eqProcessor->enhanceAIMaster($outputPath, [
                [
                    'frequency' => 80,
                    'gain' => $eqSettings['bass']
                ],
                [
                    'frequency' => 200,
                    'gain' => $eqSettings['low_mid']
                ],
                [
                    'frequency' => 1000,
                    'gain' => $eqSettings['mid']
                ],
                [
                    'frequency' => 5000,
                    'gain' => $eqSettings['high_mid']
                ],
                [
                    'frequency' => 10000,
                    'gain' => $eqSettings['treble']
                ]
            ]);
            
            // Store the processed file
            $relativeOutputPath = 'audio/mastered/' . basename($finalOutputPath);
            Storage::disk('public')->put($relativeOutputPath, file_get_contents($finalOutputPath));
            
            // Update the audio file record
            $audioFile->update([
                'mastered_path' => $relativeOutputPath,
                'status' => 'completed',
                'eq_applied' => true,
                'eq_settings' => $eqSettings,
                'metadata' => array_merge($audioFile->metadata ?? [], [
                    'lite_mastering_applied' => true,
                    'genre_preset' => $genrePreset,
                    'target_loudness' => $request->input('target_loudness'),
                    'bass_boost' => $request->input('bass_boost'),
                    'presence_boost' => $request->input('presence_boost'),
                    'ai_mastering_used' => $aiMasteringUsed,
                ])
            ]);

            // Clean up temporary files
            $eqProcessor->cleanupTempFiles();
            if (file_exists($outputPath) && $outputPath !== $fullInputPath) {
                unlink($outputPath);
            }
            if (file_exists($finalOutputPath) && $finalOutputPath !== $outputPath) {
                unlink($finalOutputPath);
            }

            return response()->json([
                'message' => 'Lite automatic mastering completed successfully',
                'audio_file' => $audioFile->fresh(),
                'genre_preset' => $genrePreset,
                'ai_mastering_used' => $aiMasteringUsed,
            ]);

        } catch (ValidationException $e) {
            Log::warning('Lite automatic mastering validation failed:', [
                'errors' => $e->errors(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Failed to apply lite automatic mastering:', [
                'error' => $e->getMessage(),
                'audio_file' => $audioFile,
                'user' => auth()->user(),
            ]);
            
            // Update status to failed
            $audioFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Lite automatic mastering failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apply AI mastering using the aimastering tool
     */
    private function applyAIMastering(string $inputPath, float $targetLoudness): string
    {
        $outputPath = tempnam(sys_get_temp_dir(), 'ai_mastered_') . '.wav';
        $aimasteringPath = base_path('aimastering-windows-amd64.exe');
        
        $command = sprintf(
            '"%s" -i "%s" -o "%s" -l %f',
            $aimasteringPath,
            $inputPath,
            $outputPath,
            $targetLoudness
        );
        
        $output = [];
        $returnCode = 0;
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($outputPath)) {
            throw new \Exception('AI mastering failed: ' . implode("\n", $output));
        }
        
        return $outputPath;
    }

    /**
     * Apply local mastering using SoX
     */
    private function applyLocalMastering(string $inputPath, float $targetLoudness): string
    {
        $outputPath = tempnam(sys_get_temp_dir(), 'local_mastered_') . '.wav';
        
        // Calculate gain adjustment based on target loudness
        // This is a simplified approach - in production you'd use proper loudness measurement
        $gainAdjustment = $targetLoudness + 14; // Rough approximation
        
        $command = sprintf(
            'sox "%s" "%s" gain %f',
            $inputPath,
            $outputPath,
            $gainAdjustment
        );
        
        $output = [];
        $returnCode = 0;
        
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($outputPath)) {
            throw new \Exception('Local mastering failed: ' . implode("\n", $output));
        }
        
        return $outputPath;
    }
} 