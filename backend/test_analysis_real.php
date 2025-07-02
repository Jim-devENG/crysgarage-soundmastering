<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Real Audio File Analysis Test\n";
echo "============================\n\n";

try {
    // Get the latest audio file
    $audioFile = \App\Models\AudioFile::latest()->first();
    if (!$audioFile) {
        echo "No audio files found in database\n";
        exit(1);
    }
    
    echo "Testing analysis on audio file ID: {$audioFile->id}\n";
    echo "Original path: {$audioFile->original_path}\n";
    echo "Status: {$audioFile->status}\n\n";
    
    // Check if the file exists
    $audioPath = storage_path('app/public/' . $audioFile->original_path);
    if (!file_exists($audioPath)) {
        echo "✗ Audio file not found at: {$audioPath}\n";
        exit(1);
    }
    
    echo "✓ Audio file found at: {$audioPath}\n";
    echo "File size: " . number_format(filesize($audioPath) / 1024 / 1024, 2) . " MB\n\n";
    
    // Test the analysis
    $startTime = microtime(true);
    $service = new \App\Services\WebAudioAnalysisService();
    echo "✓ Service created in " . round((microtime(true) - $startTime) * 1000, 2) . "ms\n";
    
    $analysisStart = microtime(true);
    $result = $service->analyzeAudio($audioPath);
    $analysisTime = (microtime(true) - $analysisStart) * 1000;
    
    echo "✓ Analysis completed in " . round($analysisTime, 2) . "ms\n";
    echo "RMS Level: " . $result['rms_level'] . " dB\n";
    echo "Peak Level: " . $result['peak_level'] . " dB\n";
    echo "Dynamic Range: " . $result['dynamic_range'] . " dB\n";
    echo "Analysis Quality: " . $result['analysis_quality'] . "\n";
    echo "API Source: " . $result['api_source'] . "\n\n";
    
    if ($analysisTime < 1000) {
        echo "✓ SUCCESS: Analysis is fast and working correctly!\n";
        echo "The loudness analysis should no longer hang.\n";
    } else {
        echo "⚠ WARNING: Analysis took " . round($analysisTime, 2) . "ms (should be under 1000ms)\n";
    }
    
    // Test frequency spectrum analysis
    echo "\nTesting Frequency Spectrum Analysis...\n";
    $spectrumStart = microtime(true);
    $spectrumResult = $service->analyzeFrequencySpectrum($audioPath);
    $spectrumTime = (microtime(true) - $spectrumStart) * 1000;
    
    echo "✓ Spectrum analysis completed in " . round($spectrumTime, 2) . "ms\n";
    echo "Frequency points: " . count($spectrumResult['frequencies']) . "\n";
    echo "Magnitude points: " . count($spectrumResult['magnitudes']) . "\n";
    echo "Analysis Quality: " . $spectrumResult['analysis_quality'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} 