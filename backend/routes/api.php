<?php

use App\Http\Controllers\AudioFileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\ProcessingPresetController;
use App\Http\Controllers\Api\AudioFileController as ApiAudioFileController;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use App\Http\Controllers\ChunkedUploadController;
use Illuminate\Support\Facades\Log;

// Public routes
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Test route for debugging
Route::get('/test-storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    return response()->json([
        'path' => $path,
        'fullPath' => $fullPath,
        'exists' => file_exists($fullPath),
        'size' => file_exists($fullPath) ? filesize($fullPath) : null,
        'mimeType' => file_exists($fullPath) ? mime_content_type($fullPath) : null,
    ]);
})->where('path', '.*');

// Test download route
Route::get('/test-download/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    if (!file_exists($fullPath)) {
        return response()->json(['error' => 'File not found'], 404);
    }
    
    $filename = basename($path);
    $mimeType = mime_content_type($fullPath);
    
    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        'Content-Length' => filesize($fullPath),
        'Access-Control-Allow-Origin' => request()->header('Origin', 'http://localhost:3000'),
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials' => 'true',
    ]);
})->where('path', '.*');

// Storage file serving route with CORS
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    
    if (!file_exists($fullPath)) {
        abort(404);
    }
    
    $mimeType = mime_content_type($fullPath);
    
    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => request()->header('Origin', 'http://localhost:3000'),
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials' => 'true',
    ]);
})->where('path', '.*');

// Test route for debugging upload limits
Route::get('/test-upload-config', function () {
    return response()->json([
        'php_config' => [
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
            'max_file_uploads' => ini_get('max_file_uploads'),
        ],
        'app_config' => [
            'max_upload_size' => config('audio.file_size.max_upload_size'),
            'max_upload_size_kb' => config('audio.file_size.max_upload_size_kb'),
            'supported_formats' => config('audio.supported_formats.extensions'),
        ],
        'server_info' => [
            'content_length_limit' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'not set',
        ]
    ]);
});

// Public test upload route (no authentication required)
Route::post('/test-upload', function (Request $request) {
    Log::info('=== TEST UPLOAD START ===', [
        'request_method' => $request->method(),
        'content_type' => $request->header('Content-Type'),
        'content_length' => $request->header('Content-Length'),
        'has_file_audio' => $request->hasFile('audio'),
        'all_files' => $request->allFiles(),
        'post_data' => $request->post(),
        'user_agent' => $request->header('User-Agent'),
    ]);

    try {
        if (!$request->hasFile('audio')) {
            Log::error('Test upload failed: No file provided', [
                'files' => $request->allFiles(),
                'post_data' => $request->post(),
            ]);
            return response()->json([
                'error' => 'No file provided',
                'files' => $request->allFiles(),
                'post_data' => $request->post(),
            ], 400);
        }

        $file = $request->file('audio');
        
        Log::info('Test upload: File received', [
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'extension' => $file->getClientOriginalExtension(),
            'is_valid' => $file->isValid(),
            'error' => $file->getError(),
        ]);
        
        if (!$file->isValid()) {
            Log::error('Test upload failed: Invalid file', [
                'file_error' => $file->getError(),
            ]);
            return response()->json([
                'error' => 'Invalid file',
                'file_error' => $file->getError(),
            ], 400);
        }

        Log::info('Test upload: Success', [
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File received successfully',
            'file_info' => [
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Test upload failed: Exception', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json([
            'error' => 'Upload failed',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Audio file routes
    Route::post('/audio/upload', [AudioFileController::class, 'store']);
    Route::get('/audio/files', [AudioFileController::class, 'index']);
    Route::get('/audio/{audioFile}', [AudioFileController::class, 'show']);
    Route::get('/audio/{audioFile}/versions', [AudioFileController::class, 'getVersions']);
    Route::post('/audio/{audioFile}/apply-eq', [AudioFileController::class, 'applyEQ']);
    
    // New advanced audio processing routes
    Route::prefix('audio')->group(function () {
        // Get all audio files (simplified endpoint)
        Route::get('/', [ApiAudioFileController::class, 'index']);
        
        // Get specific audio file
        Route::get('/{audioFile}', [ApiAudioFileController::class, 'show']);
        
        // Debug route to test without route model binding
        Route::get('/debug/{id}', function ($id) {
            try {
                $audioFile = \App\Models\AudioFile::find($id);
                if (!$audioFile) {
                    return response()->json(['error' => 'Audio file not found'], 404);
                }
                
                if ($audioFile->user_id !== auth()->id()) {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
                
                return response()->json(['data' => $audioFile]);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 500);
            }
        });
        
        // Auth test route
        Route::get('/auth-test', function () {
            return response()->json([
                'authenticated' => auth()->check(),
                'user_id' => auth()->id(),
                'user' => auth()->user(),
            ]);
        });
        
        // Database test route
        Route::get('/db-test', function () {
            try {
                $count = \App\Models\AudioFile::count();
                $userCount = \App\Models\AudioFile::where('user_id', auth()->id())->count();
                
                return response()->json([
                    'total_audio_files' => $count,
                    'user_audio_files' => $userCount,
                    'database_connected' => true,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'database_connected' => false,
                ], 500);
            }
        });
        
        // Upload audio file
        Route::post('/upload', [ApiAudioFileController::class, 'upload']);
        
        // Advanced mastering
        Route::post('/{audioFile}/mastering', [ApiAudioFileController::class, 'applyAdvancedMastering']);
        
        // Real-time mastering (for immediate processing)
        Route::post('/{audioFile}/realtime-mastering', [ApiAudioFileController::class, 'applyRealTimeMastering']);
        
        // Reference audio upload
        Route::post('/{audioFile}/reference-audio', [ApiAudioFileController::class, 'uploadReferenceAudio']);
        
        // EQ processing
        Route::post('/{audioFile}/eq', [ApiAudioFileController::class, 'applyEQ']);
        
        // Convert to MP3 for browser compatibility
        Route::post('/{audioFile}/convert-mp3', [ApiAudioFileController::class, 'convertToMP3']);
        
        // Audio analysis
        Route::get('/{audioFile}/analysis', [ApiAudioFileController::class, 'getAnalysis']);
        
        // Test web API analysis
        Route::get('/{audioFile}/analysis/web-api-test', [ApiAudioFileController::class, 'testWebAPIAnalysis']);
        
        // Download processed audio
        Route::get('/{audioFile}/download', [ApiAudioFileController::class, 'download']);
        
        // Processing status
        Route::get('/{audioFile}/status', [ApiAudioFileController::class, 'getStatus']);
        
        // Retry failed processing
        Route::post('/{audioFile}/retry', [ApiAudioFileController::class, 'retryProcessing']);
        
        // Get available presets
        Route::get('/presets/available', [ApiAudioFileController::class, 'getAvailablePresets']);
        
        // Get genre presets for Automatic Mastery
        Route::get('/presets/genres', [ApiAudioFileController::class, 'getGenrePresets']);
        
        // Get frequency spectrum analysis
        Route::get('/{audioFile}/frequency-spectrum', [ApiAudioFileController::class, 'getFrequencySpectrum']);
    });
    
    // Chunked upload routes (for large files)
    Route::post('/audio/upload-chunk', [ChunkedUploadController::class, 'uploadChunk']);
    Route::post('/audio/cancel-upload', [ChunkedUploadController::class, 'cancelUpload']);
    
    // Processing preset routes
    Route::prefix('presets')->group(function () {
        Route::get('/', [ProcessingPresetController::class, 'index']);
        Route::post('/', [ProcessingPresetController::class, 'store']);
        Route::get('/{preset}', [ProcessingPresetController::class, 'show']);
        Route::put('/{preset}', [ProcessingPresetController::class, 'update']);
        Route::delete('/{preset}', [ProcessingPresetController::class, 'destroy']);
    });
    
    // Legacy processing preset routes (for backward compatibility)
    Route::get('/processing-presets', [ProcessingPresetController::class, 'index']);
    Route::post('/processing-presets', [ProcessingPresetController::class, 'store']);
    Route::get('/processing-presets/{preset}', [ProcessingPresetController::class, 'show']);
    Route::put('/processing-presets/{preset}', [ProcessingPresetController::class, 'update']);
    Route::delete('/processing-presets/{preset}', [ProcessingPresetController::class, 'destroy']);
    Route::get('/eq/bands', [ProcessingPresetController::class, 'getBands']);
    Route::get('/eq/stats', [ProcessingPresetController::class, 'getStats']);
    
    // User management routes
    Route::prefix('user')->group(function () {
        Route::get('/profile', function (Request $request) {
            return $request->user();
        });
        Route::put('/profile', function (Request $request) {
            $user = $request->user();
            $user->update($request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
            ]));
            return $user;
        });
        Route::put('/password', function (Request $request) {
            $request->validate([
                'current_password' => 'required|current_password',
                'password' => 'required|string|min:8|confirmed',
            ]);
            
            $request->user()->update([
                'password' => bcrypt($request->password)
            ]);
            
            return response()->json(['message' => 'Password updated successfully']);
        });
        Route::get('/stats', function (Request $request) {
            $user = $request->user();
            $audioFiles = $user->audioFiles();
            
            return response()->json([
                'total_files' => $audioFiles->count(),
                'completed_files' => $audioFiles->where('status', 'completed')->count(),
                'processing_files' => $audioFiles->where('status', 'processing')->count(),
                'failed_files' => $audioFiles->where('status', 'failed')->count(),
                'total_storage_used' => $audioFiles->sum('file_size'),
            ]);
        });
        Route::get('/usage', function (Request $request) {
            $user = $request->user();
            $monthlyUsage = $user->audioFiles()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
                
            return response()->json([
                'monthly_files_processed' => $monthlyUsage,
                'monthly_limit' => 100, // This could be based on user subscription
                'remaining_this_month' => max(0, 100 - $monthlyUsage),
            ]);
        });
    });
    
    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/create-intent', function (Request $request) {
            $request->validate([
                'amount' => 'required|numeric|min:100',
                'currency' => 'sometimes|string|size:3',
            ]);
            
            // This would integrate with Stripe or other payment processor
            return response()->json([
                'client_secret' => 'pi_test_secret_' . str_random(24),
                'payment_intent_id' => 'pi_' . str_random(24),
            ]);
        });
        
        Route::post('/confirm', function (Request $request) {
            $request->validate([
                'payment_intent_id' => 'required|string',
            ]);
            
            // Confirm payment with payment processor
            return response()->json(['message' => 'Payment confirmed']);
        });
        
        Route::get('/history', function (Request $request) {
            // Return payment history
            return response()->json([]);
        });
        
        Route::get('/subscription', function (Request $request) {
            // Return subscription status
            return response()->json([
                'status' => 'active',
                'plan' => 'basic',
                'next_billing' => now()->addMonth()->toDateString(),
            ]);
        });
    });
    
    // Monitoring routes
    Route::get('/monitoring/system', [MonitoringController::class, 'systemStatus']);
    Route::get('/monitoring/queues', [MonitoringController::class, 'queueStatus']);
    Route::get('/monitoring/audio-files', [MonitoringController::class, 'audioFileStats']);
});

// Health check endpoints
Route::prefix('health')->group(function () {
    Route::get('/', function () {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now(),
            'version' => config('app.version'),
        ]);
    });

    Route::get('/detailed', function () {
        $checks = [
            'database' => function () {
                try {
                    \DB::connection()->getPdo();
                    return true;
                } catch (\Exception $e) {
                    return false;
                }
            },
            'cache' => function () {
                try {
                    \Cache::put('health_check', true, 1);
                    return \Cache::get('health_check') === true;
                } catch (\Exception $e) {
                    return false;
                }
            },
            'storage' => function () {
                try {
                    \Storage::disk('public')->put('health_check.txt', 'ok');
                    \Storage::disk('public')->delete('health_check.txt');
                    return true;
                } catch (\Exception $e) {
                    return false;
                }
            },
        ];

        $results = [];
        foreach ($checks as $name => $check) {
            $results[$name] = $check();
        }

        return response()->json([
            'status' => !in_array(false, $results) ? 'healthy' : 'unhealthy',
            'timestamp' => now(),
            'checks' => $results,
            'version' => config('app.version'),
        ]);
    });
});

// Monitoring routes
Route::prefix('monitoring')->group(function () {
    Route::post('/', [MonitoringController::class, 'store']);
    Route::get('/', [MonitoringController::class, 'getMetrics']);
});

// Audio processing routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/audio/{audioFile}/master', [AudioFileController::class, 'applyMastering']);
    Route::post('/audio/{audioFile}/advanced-mastering', [AudioFileController::class, 'applyAdvancedMastering']);
    Route::post('/audio/{audioFile}/lite-automatic-mastering', [AudioFileController::class, 'applyLiteAutomaticMastering']);
    Route::get('/audio/{audioFile}/status', [AudioFileController::class, 'getStatus']);
    Route::get('/audio/{audioFile}/download', [AudioFileController::class, 'download']);
    Route::get('/audio/{audioFile}/download-mastered', [AudioFileController::class, 'downloadMastered']);
    Route::delete('/audio/{audioFile}', [AudioFileController::class, 'destroy']);
    
    // Preset routes
    Route::get('/processing-presets', [ProcessingPresetController::class, 'index']);
    Route::get('/lite-mastering-presets', [AudioFileController::class, 'getLiteMasteringPresets']);
});

// Real-time analysis routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/audio/{audioFile}/analysis/realtime', [ApiAudioFileController::class, 'getRealTimeAnalysis']);
    Route::get('/audio/{audioFile}/spectrum/realtime', [ApiAudioFileController::class, 'getRealTimeFrequencySpectrum']);
    Route::get('/audio/{audioFile}/analysis/comprehensive', [ApiAudioFileController::class, 'getComprehensiveRealTimeAnalysis']);
});

// Test routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/audio/{audioFile}/analysis/web-api-test', [ApiAudioFileController::class, 'testWebAPIAnalysis']);
    
    // Debug test route
    Route::get('/audio/test-analysis/{id}', function ($id) {
        try {
            $audioFile = \App\Models\AudioFile::find($id);
            if (!$audioFile) {
                return response()->json(['error' => 'Audio file not found'], 404);
            }
            
            return response()->json([
                'success' => true,
                'audio_file_id' => $audioFile->id,
                'original_filename' => $audioFile->original_filename,
                'user_id' => $audioFile->user_id,
                'auth_user_id' => auth()->id(),
                'authenticated' => auth()->check(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });
});

// Public test route (no authentication required)
Route::get('/audio/public-test-analysis/{id}', function ($id) {
    try {
        $audioFile = \App\Models\AudioFile::find($id);
        if (!$audioFile) {
            return response()->json(['error' => 'Audio file not found'], 404);
        }
        
        return response()->json([
            'success' => true,
            'audio_file_id' => $audioFile->id,
            'original_filename' => $audioFile->original_filename,
            'user_id' => $audioFile->user_id,
            'authenticated' => auth()->check(),
            'message' => 'Route is working, authentication is the issue',
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}); 