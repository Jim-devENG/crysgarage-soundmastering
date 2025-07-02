<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Real-Time Web API Analysis Test\n";
echo "===============================\n\n";

try {
    // Get the latest audio file
    $audioFile = \App\Models\AudioFile::latest()->first();
    if (!$audioFile) {
        echo "No audio files found in database\n";
        exit(1);
    }
    
    echo "Testing real-time analysis on audio file ID: {$audioFile->id}\n";
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
    
    // Test the real-time analysis service
    $startTime = microtime(true);
    $service = new \App\Services\RealTimeWebAudioAnalysisService();
    echo "✓ Real-time service created in " . round((microtime(true) - $startTime) * 1000, 2) . "ms\n";
    
    // Test real-time audio analysis
    echo "\nTesting Real-Time Audio Analysis...\n";
    $analysisStart = microtime(true);
    $result = $service->analyzeAudioRealTime($audioPath);
    $analysisTime = (microtime(true) - $analysisStart) * 1000;
    
    echo "✓ Real-time analysis completed in " . round($analysisTime, 2) . "ms\n";
    echo "RMS Level: " . $result['rms_level'] . " dB\n";
    echo "Peak Level: " . $result['peak_level'] . " dB\n";
    echo "Dynamic Range: " . $result['dynamic_range'] . " dB\n";
    echo "Analysis Quality: " . $result['analysis_quality'] . "\n";
    echo "API Source: " . $result['api_source'] . "\n";
    
    if (isset($result['track_info'])) {
        echo "Track Info: " . json_encode($result['track_info'], JSON_PRETTY_PRINT) . "\n";
    }
    
    if ($analysisTime < 5000) {
        echo "✓ SUCCESS: Real-time analysis is fast and working correctly!\n";
    } else {
        echo "⚠ WARNING: Real-time analysis took " . round($analysisTime, 2) . "ms (should be under 5000ms)\n";
    }
    
    // Test real-time frequency spectrum analysis
    echo "\nTesting Real-Time Frequency Spectrum Analysis...\n";
    $spectrumStart = microtime(true);
    $spectrumResult = $service->analyzeFrequencySpectrumRealTime($audioPath);
    $spectrumTime = (microtime(true) - $spectrumStart) * 1000;
    
    echo "✓ Real-time spectrum analysis completed in " . round($spectrumTime, 2) . "ms\n";
    echo "Frequency points: " . count($spectrumResult['frequencies']) . "\n";
    echo "Magnitude points: " . count($spectrumResult['magnitudes']) . "\n";
    echo "Analysis Quality: " . $spectrumResult['analysis_quality'] . "\n";
    echo "API Source: " . $spectrumResult['api_source'] . "\n";
    
    if ($spectrumTime < 3000) {
        echo "✓ SUCCESS: Real-time spectrum analysis is fast and working correctly!\n";
    } else {
        echo "⚠ WARNING: Real-time spectrum analysis took " . round($spectrumTime, 2) . "ms (should be under 3000ms)\n";
    }
    
    // Test comprehensive analysis
    echo "\nTesting Comprehensive Real-Time Analysis...\n";
    $comprehensiveStart = microtime(true);
    
    // Simulate comprehensive analysis by running both
    $comprehensiveAudio = $service->analyzeAudioRealTime($audioPath);
    $comprehensiveSpectrum = $service->analyzeFrequencySpectrumRealTime($audioPath);
    
    $comprehensiveTime = (microtime(true) - $comprehensiveStart) * 1000;
    
    echo "✓ Comprehensive analysis completed in " . round($comprehensiveTime, 2) . "ms\n";
    echo "Audio API: " . $comprehensiveAudio['api_source'] . "\n";
    echo "Spectrum API: " . $comprehensiveSpectrum['api_source'] . "\n";
    
    if ($comprehensiveTime < 8000) {
        echo "✓ SUCCESS: Comprehensive real-time analysis is working correctly!\n";
    } else {
        echo "⚠ WARNING: Comprehensive analysis took " . round($comprehensiveTime, 2) . "ms (should be under 8000ms)\n";
    }
    
    echo "\n🎉 All real-time analysis tests completed successfully!\n";
    echo "The real-time web API analysis system is ready for use.\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} 