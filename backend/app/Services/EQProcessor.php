<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Exception;

class EQProcessor
{
    private string $tempDirectory;
    private int $maxGainDb;
    private int $minGainDb;
    private int $sampleRate;
    private int $channels;
    private array $bandConfigs;

    public function __construct()
    {
        $this->tempDirectory = config('audio.eq_processing.temp_directory', storage_path('app/temp/eq'));
        $this->maxGainDb = config('audio.eq_processing.max_gain_db', 18);
        $this->minGainDb = config('audio.eq_processing.min_gain_db', -18);
        $this->sampleRate = 44100; // Standard sample rate
        $this->channels = 2; // Stereo
        
        // Define band configurations with optimal Q factors and bandwidths
        $this->bandConfigs = [
            'bass' => [
                'frequency' => 80,
                'q' => 0.7, // Wider bandwidth for bass
                'shelf' => true // Use shelf filter for bass
            ],
            'low_mid' => [
                'frequency' => 200,
                'q' => 1.0,
                'shelf' => false
            ],
            'mid' => [
                'frequency' => 1000,
                'q' => 1.4, // Narrower bandwidth for mid
                'shelf' => false
            ],
            'high_mid' => [
                'frequency' => 5000,
                'q' => 1.0,
                'shelf' => false
            ],
            'treble' => [
                'frequency' => 10000,
                'q' => 0.7, // Wider bandwidth for treble
                'shelf' => true // Use shelf filter for treble
            ]
        ];
        
        if (!file_exists($this->tempDirectory)) {
            mkdir($this->tempDirectory, 0755, true);
        }
    }

    /**
     * Apply EQ enhancement to AI-mastered audio
     */
    public function enhanceAIMaster(string $aiMasteredPath, array $eqSettings): string
    {
        if (!file_exists($aiMasteredPath)) {
            throw new Exception("AI mastered file not found: {$aiMasteredPath}");
        }

        $this->validateEQSettings($eqSettings);
        $outputPath = $this->generateOutputPath($aiMasteredPath);
        
        try {
            $this->processAudio($aiMasteredPath, $outputPath, $eqSettings);
            
            Log::info('Audio processing completed', [
                'input_path' => $aiMasteredPath,
                'output_path' => $outputPath,
                'eq_settings' => $eqSettings,
                'output_size' => filesize($outputPath)
            ]);

            return $outputPath;
        } catch (\Exception $e) {
            if (file_exists($outputPath)) {
                unlink($outputPath);
            }
            
            Log::error('Audio processing failed', [
                'input_path' => $aiMasteredPath,
                'eq_settings' => $eqSettings,
                'error' => $e->getMessage()
            ]);
            
            return $aiMasteredPath;
        }
    }

    /**
     * Process audio with EQ settings
     */
    private function processAudio(string $inputPath, string $outputPath, array $eqSettings): void
    {
        Log::info('Starting audio processing', [
            'input_path' => $inputPath,
            'output_path' => $outputPath,
            'eq_settings' => $eqSettings
        ]);

        // Read the input file
        $inputData = file_get_contents($inputPath);
        if ($inputData === false) {
            throw new Exception("Failed to read input file");
        }

        // Convert to PCM samples
        $samples = $this->wavToSamples($inputData);
        
        // Apply EQ settings with improved processing
        foreach ($eqSettings as $band => $settings) {
            $gain = (float)$settings['gain'];
            if ($gain != 0) { // Only process if there's a change
                $this->applyEQBand($samples, $band, $gain);
            }
        }

        // Apply final normalization to prevent clipping
        $this->normalizeSamples($samples);
        
        // Convert back to WAV
        $outputData = $this->samplesToWav($samples);
        
        // Write the output file
        if (file_put_contents($outputPath, $outputData) === false) {
            throw new Exception("Failed to write output file");
        }

        Log::info('Audio processing completed successfully', [
            'input_path' => $inputPath,
            'output_path' => $outputPath,
            'output_size' => filesize($outputPath)
        ]);
    }

    /**
     * Apply EQ band to samples with improved filter implementation
     */
    private function applyEQBand(array &$samples, string $band, float $gain): void
    {
        $config = $this->bandConfigs[$band];
        $frequency = $config['frequency'];
        $q = $config['q'];
        $isShelf = $config['shelf'];

        if ($isShelf) {
            $this->applyShelfFilter($samples, $frequency, $gain, $q);
        } else {
            $this->applyPeakFilter($samples, $frequency, $gain, $q);
        }
    }

    /**
     * Apply a shelf filter (for bass and treble)
     */
    private function applyShelfFilter(array &$samples, float $frequency, float $gain, float $q): void
    {
        $w0 = 2 * M_PI * $frequency / $this->sampleRate;
        $alpha = sin($w0) / (2 * $q);
        $A = pow(10, $gain / 40);
        
        $a0 = (A + 1) + (A - 1) * cos($w0) + 2 * sqrt(A) * $alpha;
        $a1 = -2 * ((A - 1) + (A + 1) * cos($w0));
        $a2 = (A + 1) + (A - 1) * cos($w0) - 2 * sqrt(A) * $alpha;
        $b0 = A * ((A + 1) - (A - 1) * cos($w0) + 2 * sqrt(A) * $alpha);
        $b1 = 2 * A * ((A - 1) - (A + 1) * cos($w0));
        $b2 = A * ((A + 1) - (A - 1) * cos($w0) - 2 * sqrt(A) * $alpha);

        $this->applyBiquadFilter($samples, $a0, $a1, $a2, $b0, $b1, $b2);
    }

    /**
     * Apply a peak filter (for mid frequencies)
     */
    private function applyPeakFilter(array &$samples, float $frequency, float $gain, float $q): void
    {
        $w0 = 2 * M_PI * $frequency / $this->sampleRate;
        $alpha = sin($w0) / (2 * $q);
        $A = pow(10, $gain / 40);
        
        $a0 = 1 + $alpha;
        $a1 = -2 * cos($w0);
        $a2 = 1 - $alpha;
        $b0 = 1 + $alpha * A;
        $b1 = -2 * cos($w0);
        $b2 = 1 - $alpha * A;

        $this->applyBiquadFilter($samples, $a0, $a1, $a2, $b0, $b1, $b2);
    }

    /**
     * Apply a biquad filter with improved precision
     */
    private function applyBiquadFilter(array &$samples, float $a0, float $a1, float $a2, float $b0, float $b1, float $b2): void
    {
        $x1 = 0;
        $x2 = 0;
        $y1 = 0;
        $y2 = 0;
        
        // Normalize coefficients
        $b0 /= $a0;
        $b1 /= $a0;
        $b2 /= $a0;
        $a1 /= $a0;
        $a2 /= $a0;
        
        foreach ($samples as $i => &$sample) {
            $y = $b0 * $sample + $b1 * $x1 + $b2 * $x2 - $a1 * $y1 - $a2 * $y2;
            
            $x2 = $x1;
            $x1 = $sample;
            $y2 = $y1;
            $y1 = $y;
            
            $sample = $y;
        }
    }

    /**
     * Normalize samples to prevent clipping
     */
    private function normalizeSamples(array &$samples): void
    {
        $maxSample = 0;
        foreach ($samples as $sample) {
            $maxSample = max($maxSample, abs($sample));
        }
        
        if ($maxSample > 0.99) {
            $scale = 0.99 / $maxSample;
            foreach ($samples as &$sample) {
                $sample *= $scale;
            }
        }
    }

    /**
     * Convert WAV data to PCM samples
     */
    private function wavToSamples(string $wavData): array
    {
        // Skip WAV header (44 bytes)
        $pcmData = substr($wavData, 44);
        
        // Convert to 16-bit PCM samples
        $samples = [];
        for ($i = 0; $i < strlen($pcmData); $i += 2) {
            $sample = unpack('s', substr($pcmData, $i, 2))[1];
            $samples[] = $sample / 32768.0; // Normalize to [-1, 1]
        }
        
        return $samples;
    }

    /**
     * Convert PCM samples to WAV data
     */
    private function samplesToWav(array $samples): string
    {
        // Create WAV header
        $header = $this->createWavHeader(count($samples));
        
        // Convert samples to 16-bit PCM
        $pcmData = '';
        foreach ($samples as $sample) {
            // Clamp to [-1, 1] and convert to 16-bit
            $sample = max(-1, min(1, $sample));
            $pcmData .= pack('s', (int)($sample * 32767));
        }
        
        return $header . $pcmData;
    }

    /**
     * Create WAV header
     */
    private function createWavHeader(int $numSamples): string
    {
        $header = 'RIFF';
        $header .= pack('V', 36 + $numSamples * 2); // File size
        $header .= 'WAVE';
        $header .= 'fmt ';
        $header .= pack('V', 16); // Subchunk1Size
        $header .= pack('v', 1); // AudioFormat (PCM)
        $header .= pack('v', $this->channels); // NumChannels
        $header .= pack('V', $this->sampleRate); // SampleRate
        $header .= pack('V', $this->sampleRate * $this->channels * 2); // ByteRate
        $header .= pack('v', $this->channels * 2); // BlockAlign
        $header .= pack('v', 16); // BitsPerSample
        $header .= 'data';
        $header .= pack('V', $numSamples * 2); // Subchunk2Size
        
        return $header;
    }

    /**
     * Validate EQ settings
     */
    private function validateEQSettings(array $eqSettings): void
    {
        foreach ($eqSettings as $band => $settings) {
            if (!isset($settings['gain'])) {
                throw new Exception("Invalid EQ settings for band: {$band}");
            }
            
            $gain = (float)$settings['gain'];
            if ($gain < $this->minGainDb || $gain > $this->maxGainDb) {
                throw new Exception("Gain value out of range for band: {$band}");
            }
        }
    }

    /**
     * Generate unique output path
     */
    private function generateOutputPath(string $inputPath): string
    {
        $pathInfo = pathinfo($inputPath);
        $timestamp = time();
        $random = substr(md5(uniqid()), 0, 8);
        
        return $this->tempDirectory . '/' . $pathInfo['filename'] . '_processed_' . $timestamp . '_' . $random . '.wav';
    }

    /**
     * Clean up temporary files
     */
    public function cleanupTempFiles(int $hoursOld = 24): int
    {
        $cleaned = 0;
        $cutoffTime = time() - ($hoursOld * 3600);
        
        if (!is_dir($this->tempDirectory)) {
            return $cleaned;
        }
        
        $files = glob($this->tempDirectory . '/*_processed_*.wav');
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                if (unlink($file)) {
                    $cleaned++;
                }
            }
        }
        
        Log::info("Temp file cleanup completed", [
            'files_cleaned' => $cleaned,
            'hours_old' => $hoursOld
        ]);
        
        return $cleaned;
    }
} 