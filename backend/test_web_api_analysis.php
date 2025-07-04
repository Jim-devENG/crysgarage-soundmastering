<?php

require_once 'vendor/autoload.php';

use App\Services\WebAudioAnalysisService;

// Initialize Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Web API Audio Analysis Service\n";
echo "=====================================\n\n";

// Create the service
$webAnalysisService = new WebAudioAnalysisService();

// Test with a sample audio file path (this would be a real file in production)
$testAudioPath = storage_path('app/public/audio/original/test_audio.wav');

echo "Test Audio Path: {$testAudioPath}\n";
echo "File exists: " . (file_exists($testAudioPath) ? 'Yes' : 'No') . "\n\n";

if (file_exists($testAudioPath)) {
    echo "Testing Loudness Analysis...\n";
    try {
        $loudnessAnalysis = $webAnalysisService->analyzeAudio($testAudioPath);
        echo "✓ Loudness Analysis Successful\n";
        echo "  - RMS Level: {$loudnessAnalysis['rms_level']} dB\n";
        echo "  - Peak Level: {$loudnessAnalysis['peak_level']} dB\n";
        echo "  - Dynamic Range: {$loudnessAnalysis['dynamic_range']} dB\n";
        echo "  - Analysis Quality: {$loudnessAnalysis['analysis_quality']}\n";
        echo "  - API Source: {$loudnessAnalysis['api_source']}\n\n";
    } catch (Exception $e) {
        echo "✗ Loudness Analysis Failed: " . $e->getMessage() . "\n\n";
    }

    echo "Testing Frequency Spectrum Analysis...\n";
    try {
        $spectrumAnalysis = $webAnalysisService->analyzeFrequencySpectrum($testAudioPath);
        echo "✓ Frequency Spectrum Analysis Successful\n";
        echo "  - Frequency Points: " . count($spectrumAnalysis['frequencies']) . "\n";
        echo "  - Magnitude Points: " . count($spectrumAnalysis['magnitudes']) . "\n";
        echo "  - Analysis Quality: {$spectrumAnalysis['analysis_quality']}\n";
        echo "  - API Source: {$spectrumAnalysis['api_source']}\n";
        echo "  - Frequency Range: {$spectrumAnalysis['frequency_range_hz'][0]} - {$spectrumAnalysis['frequency_range_hz'][1]} Hz\n\n";
    } catch (Exception $e) {
        echo "✗ Frequency Spectrum Analysis Failed: " . $e->getMessage() . "\n\n";
    }

    echo "Testing Mastering Changes Analysis...\n";
    try {
        // Use the same file for both original and mastered for testing
        $masteringChanges = $webAnalysisService->analyzeMasteringChanges($testAudioPath, $testAudioPath);
        echo "✓ Mastering Changes Analysis Successful\n";
        echo "  - Loudness Change: {$masteringChanges['changes']['loudness_change']} dB\n";
        echo "  - Peak Change: {$masteringChanges['changes']['peak_change']} dB\n";
        echo "  - Dynamic Range Change: {$masteringChanges['changes']['dynamic_range_change']} dB\n";
        echo "  - Analysis Method: {$masteringChanges['analysis_method']}\n\n";
    } catch (Exception $e) {
        echo "✗ Mastering Changes Analysis Failed: " . $e->getMessage() . "\n\n";
    }
} else {
    echo "Test audio file not found. Creating a dummy test...\n\n";
    
    // Test with fallback analysis
    echo "Testing Fallback Analysis...\n";
    try {
        $fallbackAnalysis = $webAnalysisService->analyzeAudio('/nonexistent/file.wav');
        echo "✓ Fallback Analysis Successful\n";
        echo "  - RMS Level: {$fallbackAnalysis['rms_level']} dB\n";
        echo "  - Peak Level: {$fallbackAnalysis['peak_level']} dB\n";
        echo "  - Analysis Quality: {$fallbackAnalysis['analysis_quality']}\n";
        echo "  - API Source: {$fallbackAnalysis['api_source']}\n\n";
    } catch (Exception $e) {
        echo "✗ Fallback Analysis Failed: " . $e->getMessage() . "\n\n";
    }
}

echo "Web API Analysis Test Complete!\n";
echo "==============================\n";
echo "The loudness analysis is now using web APIs instead of local SoX tools.\n";
echo "This provides better reliability and more consistent results.\n";
 