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
        Log::info('User attempting to upload audio file:', ['user' => auth()->user()]);

        try {
            // Check content length before processing
            $contentLength = $request->server('CONTENT_LENGTH');
            $maxSize = config('audio.file_size.max_upload_size');
            
            if ($contentLength && $contentLength > $maxSize) {
                return response()->json([
                    'message' => 'File too large',
                    'error' => 'The uploaded file exceeds the maximum allowed size of ' . ($maxSize / 1024 / 1024) . 'MB',
                    'max_size_mb' => $maxSize / 1024 / 1024,
                    'uploaded_size_mb' => round($contentLength / 1024 / 1024, 2),
                ], 413);
            }

            $allowedMimeTypes = config('audio.supported_formats.mime_types');
            $allowedExtensions = implode(',', config('audio.supported_formats.extensions'));
            $maxFileSize = config('audio.file_size.max_upload_size_kb');

            $validator = Validator::make($request->all(), [
                'audio' => [
                    'required',
                    'file',
                    'max:' . $maxFileSize,
                    'mimes:' . $allowedExtensions,
                ],
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $file = $request->file('audio');
            
            // Additional MIME type validation
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file->getPathname());
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedMimeTypes)) {
                $supportedFormats = strtoupper(implode(', ', config('audio.supported_formats.extensions')));
                throw ValidationException::withMessages([
                    'audio' => ["Invalid file type. Allowed types: {$supportedFormats}"],
                ]);
            }

            $path = $file->store('audio/original', 'public');

            $audioFile = AudioFile::create([
                'user_id' => auth()->id(),
                'original_path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $mimeType,
                'file_size' => $file->getSize(),
            ]);

            ProcessAudioFile::dispatch($audioFile);

            Log::info('Audio file uploaded successfully:', ['audio_file' => $audioFile]);

            return response()->json([
                'message' => 'Audio file uploaded successfully',
                'audio_file' => $audioFile,
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Audio file validation failed:', [
                'errors' => $e->errors(),
                'user' => auth()->user(),
            ]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Audio file upload failed:', [
                'error' => $e->getMessage(),
                'user' => auth()->user(),
            ]);
            return response()->json([
                'message' => 'Failed to upload audio file',
                'error' => $e->getMessage(),
            ], 500);
        }
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
} 