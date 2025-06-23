<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TestAudioUpload extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audio:test-upload {--size=10 : Size in MB for test file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test audio upload functionality with various file sizes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sizeInMB = (int) $this->option('size');
        $sizeInBytes = $sizeInMB * 1024 * 1024;
        
        $this->info("Testing audio upload functionality...");
        $this->info("Configuration check:");
        
        // Check configuration
        $maxSize = config('audio.file_size.max_upload_size');
        $maxSizeKB = config('audio.file_size.max_upload_size_kb');
        $supportedFormats = config('audio.supported_formats.extensions');
        
        $this->table(['Setting', 'Value'], [
            ['Max Upload Size (bytes)', number_format($maxSize)],
            ['Max Upload Size (KB)', number_format($maxSizeKB)],
            ['Supported Formats', implode(', ', $supportedFormats)],
            ['Storage Disk', config('audio.storage.disk')],
            ['AI Mastering Enabled', config('audio.aimastering.enabled') ? 'Yes' : 'No'],
        ]);
        
        // Check PHP configuration
        $this->info("\nPHP Configuration:");
        $this->table(['PHP Setting', 'Value'], [
            ['upload_max_filesize', ini_get('upload_max_filesize')],
            ['post_max_size', ini_get('post_max_size')],
            ['max_execution_time', ini_get('max_execution_time')],
            ['memory_limit', ini_get('memory_limit')],
        ]);
        
        // Check if test size is within limits
        if ($sizeInBytes > $maxSize) {
            $this->error("Test size ({$sizeInMB}MB) exceeds maximum allowed size (" . ($maxSize / 1024 / 1024) . "MB)");
            return 1;
        }
        
        // Create test file
        $this->info("\nCreating test file ({$sizeInMB}MB)...");
        $testFileName = "test_audio_{$sizeInMB}mb.wav";
        $testFilePath = storage_path("app/temp/{$testFileName}");
        
        // Ensure temp directory exists
        if (!file_exists(dirname($testFilePath))) {
            mkdir(dirname($testFilePath), 0755, true);
        }
        
        // Create a simple WAV file header (44 bytes) + data
        $wavHeader = $this->createWavHeader($sizeInBytes - 44);
        $testData = str_repeat("\x00", $sizeInBytes - 44); // Silent audio data
        
        file_put_contents($testFilePath, $wavHeader . $testData);
        
        if (!file_exists($testFilePath)) {
            $this->error("Failed to create test file");
            return 1;
        }
        
        $actualSize = filesize($testFilePath);
        $this->info("Test file created: " . number_format($actualSize) . " bytes");
        
        // Test storage operations
        $this->info("\nTesting storage operations...");
        
        try {
            // Test storing file
            $storedPath = Storage::disk(config('audio.storage.disk'))->putFile(
                config('audio.processing.original_directory'),
                $testFilePath
            );
            
            if ($storedPath) {
                $this->info("✓ File stored successfully: {$storedPath}");
                
                // Test file exists
                if (Storage::disk(config('audio.storage.disk'))->exists($storedPath)) {
                    $this->info("✓ File exists in storage");
                    
                    // Test file size
                    $storedSize = Storage::disk(config('audio.storage.disk'))->size($storedPath);
                    $this->info("✓ Stored file size: " . number_format($storedSize) . " bytes");
                    
                    // Clean up stored file
                    Storage::disk(config('audio.storage.disk'))->delete($storedPath);
                    $this->info("✓ Test file cleaned up from storage");
                } else {
                    $this->error("✗ File not found in storage");
                }
            } else {
                $this->error("✗ Failed to store file");
            }
        } catch (\Exception $e) {
            $this->error("✗ Storage test failed: " . $e->getMessage());
        }
        
        // Clean up local test file
        if (file_exists($testFilePath)) {
            unlink($testFilePath);
            $this->info("✓ Local test file cleaned up");
        }
        
        $this->info("\nTest completed!");
        return 0;
    }
    
    /**
     * Create a minimal WAV file header
     */
    private function createWavHeader(int $dataSize): string
    {
        $fileSize = $dataSize + 36;
        
        return pack('A4VA4A4VvvVVvvA4V',
            'RIFF',           // ChunkID
            $fileSize,        // ChunkSize
            'WAVE',           // Format
            'fmt ',           // Subchunk1ID
            16,               // Subchunk1Size (PCM)
            1,                // AudioFormat (PCM)
            2,                // NumChannels (stereo)
            44100,            // SampleRate
            176400,           // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
            4,                // BlockAlign (NumChannels * BitsPerSample/8)
            16,               // BitsPerSample
            'data',           // Subchunk2ID
            $dataSize         // Subchunk2Size
        );
    }
} 