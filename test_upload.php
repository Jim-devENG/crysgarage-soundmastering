<?php

// Test script to verify upload functionality
$apiUrl = 'http://localhost:8000/api/audio/upload';

// Create a test file
$testFile = 'test_audio.wav';
if (!file_exists($testFile)) {
    // Create a simple WAV file for testing
    $wavHeader = pack('H*', '524946460000000057415645666D7420100000000100010044AC000088580100020010006461746100000000');
    file_put_contents($testFile, $wavHeader);
}

echo "Testing upload endpoint...\n";
echo "API URL: $apiUrl\n";
echo "Test file: $testFile\n";

// Test without authentication first
$postData = [
    'audio' => new CURLFile($testFile, 'audio/wav', 'test_audio.wav')
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
if ($error) {
    echo "cURL Error: $error\n";
}

// Clean up test file
if (file_exists($testFile)) {
    unlink($testFile);
} 