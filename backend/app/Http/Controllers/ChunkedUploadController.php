<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAudioFile;
use App\Models\AudioFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ChunkedUploadController extends Controller
{
    /**
     * Handle chunked file upload
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'chunk' => 'required|file',
                'chunkIndex' => 'required|integer|min:0',
                'totalChunks' => 'required|integer|min:1',
                'fileName' => 'required|string',
                'fileSize' => 'required|integer|min:1',
                'uploadId' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $chunk = $request->file('chunk');
            $chunkIndex = (int) $request->input('chunkIndex');
            $totalChunks = (int) $request->input('totalChunks');
            $fileName = $request->input('fileName');
            $fileSize = (int) $request->input('fileSize');
            $uploadId = $request->input('uploadId');

            // Validate file size
            $maxSize = config('audio.file_size.max_upload_size');
            if ($fileSize > $maxSize) {
                return response()->json([
                    'message' => 'File too large',
                    'error' => 'The uploaded file exceeds the maximum allowed size of ' . ($maxSize / 1024 / 1024) . 'MB',
                    'max_size_mb' => $maxSize / 1024 / 1024,
                    'uploaded_size_mb' => round($fileSize / 1024 / 1024, 2),
                ], 413);
            }

            // Validate file extension
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExtensions = config('audio.supported_formats.extensions');
            if (!in_array($extension, $allowedExtensions)) {
                $supportedFormats = strtoupper(implode(', ', $allowedExtensions));
                return response()->json([
                    'message' => 'Invalid file type',
                    'error' => "Invalid file type. Allowed types: {$supportedFormats}",
                ], 422);
            }

            // Create temp directory for chunks
            $tempDir = storage_path("app/temp/chunks/{$uploadId}");
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Save chunk
            $chunkPath = "{$tempDir}/chunk_{$chunkIndex}";
            $chunk->move($tempDir, "chunk_{$chunkIndex}");

            Log::info('Chunk uploaded', [
                'upload_id' => $uploadId,
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
                'file_name' => $fileName,
            ]);

            // Check if all chunks are uploaded
            $uploadedChunks = glob("{$tempDir}/chunk_*");
            if (count($uploadedChunks) === $totalChunks) {
                // All chunks uploaded, combine them
                return $this->combineChunks($uploadId, $fileName, $totalChunks, $fileSize);
            }

            return response()->json([
                'message' => 'Chunk uploaded successfully',
                'chunk_index' => $chunkIndex,
                'total_chunks' => $totalChunks,
                'uploaded_chunks' => count($uploadedChunks),
            ]);

        } catch (\Exception $e) {
            Log::error('Chunked upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Upload failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Combine uploaded chunks into final file
     */
    private function combineChunks(string $uploadId, string $fileName, int $totalChunks, int $fileSize): JsonResponse
    {
        try {
            $tempDir = storage_path("app/temp/chunks/{$uploadId}");
            $finalPath = storage_path("app/temp/{$uploadId}_{$fileName}");

            // Combine chunks
            $finalFile = fopen($finalPath, 'wb');
            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = "{$tempDir}/chunk_{$i}";
                if (!file_exists($chunkPath)) {
                    throw new \Exception("Missing chunk {$i}");
                }
                
                $chunkData = file_get_contents($chunkPath);
                fwrite($finalFile, $chunkData);
            }
            fclose($finalFile);

            // Verify file size
            $actualSize = filesize($finalPath);
            if ($actualSize !== $fileSize) {
                throw new \Exception("File size mismatch. Expected: {$fileSize}, Actual: {$actualSize}");
            }

            // Validate MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $finalPath);
            finfo_close($finfo);

            $allowedMimeTypes = config('audio.supported_formats.mime_types');
            if (!in_array($mimeType, $allowedMimeTypes)) {
                throw new \Exception("Invalid MIME type: {$mimeType}");
            }

            // Move to storage
            $storagePath = 'audio/original/' . uniqid() . '_' . $fileName;
            Storage::disk('public')->put($storagePath, file_get_contents($finalPath));

            // Create audio file record
            $audioFile = AudioFile::create([
                'user_id' => auth()->id(),
                'original_path' => $storagePath,
                'original_filename' => $fileName,
                'mime_type' => $mimeType,
                'file_size' => $actualSize,
            ]);

            // Clean up temp files
            $this->cleanupTempFiles($uploadId, $finalPath);

            // Dispatch processing job
            ProcessAudioFile::dispatch($audioFile);

            Log::info('File upload completed', [
                'upload_id' => $uploadId,
                'audio_file_id' => $audioFile->id,
                'file_name' => $fileName,
                'file_size' => $actualSize,
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'audio_file' => $audioFile,
            ], 201);

        } catch (\Exception $e) {
            // Clean up on error
            $this->cleanupTempFiles($uploadId, $finalPath ?? null);
            
            Log::error('File combination failed', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'File upload failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clean up temporary files
     */
    private function cleanupTempFiles(string $uploadId, ?string $finalPath = null): void
    {
        try {
            // Remove chunk directory
            $tempDir = storage_path("app/temp/chunks/{$uploadId}");
            if (file_exists($tempDir)) {
                $files = glob("{$tempDir}/*");
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                rmdir($tempDir);
            }

            // Remove final temp file
            if ($finalPath && file_exists($finalPath)) {
                unlink($finalPath);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to cleanup temp files', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Cancel upload and clean up
     */
    public function cancelUpload(Request $request): JsonResponse
    {
        $uploadId = $request->input('uploadId');
        if ($uploadId) {
            $this->cleanupTempFiles($uploadId);
        }

        return response()->json(['message' => 'Upload cancelled']);
    }
} 