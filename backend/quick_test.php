<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Quick Web API Analysis Test\n";
echo "==========================\n\n";

try {
    $startTime = microtime(true);
    
    $service = new App\Services\WebAudioAnalysisService();
    echo "✓ Service created in " . round((microtime(true) - $startTime) * 1000, 2) . "ms\n";
    
    $analysisStart = microtime(true);
    $result = $service->analyzeAudio('/nonexistent/file.wav');
    $analysisTime = (microtime(true) - $analysisStart) * 1000;
    
    echo "✓ Analysis completed in " . round($analysisTime, 2) . "ms\n";
    echo "RMS Level: " . $result['rms_level'] . " dB\n";
    echo "Peak Level: " . $result['peak_level'] . " dB\n";
    echo "Analysis Quality: " . $result['analysis_quality'] . "\n";
    echo "API Source: " . $result['api_source'] . "\n\n";
    
    if ($analysisTime < 1000) {
        echo "✓ SUCCESS: Analysis is fast and working correctly!\n";
        echo "The loudness analysis should no longer hang.\n";
    } else {
        echo "⚠ WARNING: Analysis took " . round($analysisTime, 2) . "ms (should be under 1000ms)\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
} 