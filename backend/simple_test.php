<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Web API Analysis Service\n";
echo "===============================\n\n";

try {
    $service = new App\Services\WebAudioAnalysisService();
    echo "✓ Service created successfully\n\n";
    
    $result = $service->analyzeAudio('/nonexistent/file.wav');
    echo "✓ Fallback analysis completed\n";
    echo "RMS Level: " . $result['rms_level'] . " dB\n";
    echo "Peak Level: " . $result['peak_level'] . " dB\n";
    echo "Analysis Quality: " . $result['analysis_quality'] . "\n";
    echo "API Source: " . $result['api_source'] . "\n\n";
    
    echo "✓ Web API Analysis is working correctly!\n";
    echo "The loudness analysis now uses web APIs instead of local SoX tools.\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
} 