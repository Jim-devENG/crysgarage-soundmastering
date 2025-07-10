<?php

// Test script to check upload endpoint
echo "=== Testing Upload Endpoint ===\n";

// Test 1: Check if endpoint is accessible
echo "\n1. Testing endpoint accessibility...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/audio/upload');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: " . substr($response, 0, 500) . "\n";

// Test 2: Check authentication
echo "\n2. Testing authentication...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'test@example.com',
    'password' => 'password'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Login HTTP Code: $httpCode\n";
$loginData = json_decode($response, true);
echo "Login Response: " . substr($response, 0, 200) . "\n";

if (isset($loginData['token'])) {
    $token = $loginData['token'];
    echo "Token received: " . substr($token, 0, 20) . "...\n";
    
    // Test 3: Test upload with authentication but no file
    echo "\n3. Testing upload with auth but no file...\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/audio/upload');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Upload HTTP Code: $httpCode\n";
    echo "Upload Response: " . $response . "\n";
} else {
    echo "No token received from login\n";
}

echo "\n=== Test Complete ===\n";
echo "Check the Laravel logs for detailed upload information:\n";
echo "tail -f storage/logs/laravel.log\n"; 