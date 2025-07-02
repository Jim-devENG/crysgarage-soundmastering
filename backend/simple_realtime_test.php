<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Simple Real-Time Service Test\n";
echo "============================\n\n";

try {
    $service = new \App\Services\RealTimeWebAudioAnalysisService();
    echo "✓ Real-time service created successfully!\n";
    
    $result = $service->analyzeAudioRealTime('/test/file.wav');
    echo "✓ Real-time analysis test completed\n";
    echo "Analysis Quality: " . $result['analysis_quality'] . "\n";
    echo "API Source: " . $result['api_source'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
} 