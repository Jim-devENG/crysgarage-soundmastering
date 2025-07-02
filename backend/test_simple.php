<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Simple Web API Analysis Test\n";
echo "===========================\n\n";

try {
    $service = new \App\Services\WebAudioAnalysisService();
    echo "✓ Service created\n";
    
    $result = $service->analyzeAudio('/nonexistent/file.wav');
    echo "✓ Analysis completed\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
} 