<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Direct Web API Analysis Test\n";
echo "===========================\n\n";

try {
    // Get the latest audio file
    $audioFile = \App\Models\AudioFile::latest()->first();
    if (!$audioFile) {
        echo "No audio files found in database\n";
        exit(1);
    }
    
    echo "Testing analysis on audio file ID: {$audioFile->id}\n";
    echo "Original path: {$audioFile->original_path}\n\n";
    
    // Create the web analysis service
    $startTime = microtime(true);
    $service = new \App\Services\WebAudioAnalysisService();
    echo "✓ Service created in " . round((microtime(true) - $startTime) * 1000, 2) . "ms\n";
    
    // Test analysis
    $analysisStart = microtime(true);
    $result = $service->analyzeAudio(storage_path('app/public/' . $audioFile->original_path));
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
    $spectrumResult = $service->analyzeFrequencySpectrum(storage_path('app/public/' . $audioFile->original_path));
    $spectrumTime = (microtime(true) - $spectrumStart) * 1000;
    
    echo "✓ Spectrum analysis completed in " . round($spectrumTime, 2) . "ms\n";
    echo "Frequency points: " . count($spectrumResult['frequencies']) . "\n";
    echo "Magnitude points: " . count($spectrumResult['magnitudes']) . "\n";
    echo "Analysis Quality: " . $spectrumResult['analysis_quality'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} 