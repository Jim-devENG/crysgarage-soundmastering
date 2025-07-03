<?php
// GitHub Webhook Handler for Auto-Deployment
// Place this file in /var/www/html/webhook.php on your VPS

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log function
function logMessage($message) {
    $logFile = '/var/log/webhook.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Get the raw POST data
$payload = file_get_contents('php://input');
$headers = getallheaders();

logMessage("Webhook received");

// Verify GitHub webhook signature (optional but recommended)
$githubSecret = 'your-github-webhook-secret'; // Replace with your actual secret
$signature = isset($headers['X-Hub-Signature-256']) ? $headers['X-Hub-Signature-256'] : '';

if ($githubSecret && $signature) {
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $githubSecret);
    if (!hash_equals($expectedSignature, $signature)) {
        logMessage("Invalid signature");
        http_response_code(401);
        echo "Unauthorized";
        exit;
    }
}

// Parse the JSON payload
$data = json_decode($payload, true);

if (!$data) {
    logMessage("Invalid JSON payload");
    http_response_code(400);
    echo "Invalid payload";
    exit;
}

// Check if this is a push to main branch
$ref = isset($data['ref']) ? $data['ref'] : '';
$repository = isset($data['repository']['name']) ? $data['repository']['name'] : '';

logMessage("Repository: $repository, Ref: $ref");

if ($ref === 'refs/heads/main' && $repository === 'crys-fresh') {
    logMessage("Push to main branch detected, starting deployment");
    
    // Set response headers
    header('Content-Type: application/json');
    http_response_code(200);
    
    // Send immediate response
    echo json_encode(['status' => 'deployment_started']);
    
    // Execute deployment in background
    $deployScript = '/root/deploy.sh';
    
    if (file_exists($deployScript)) {
        // Run deployment script in background
        $command = "nohup bash $deployScript > /var/log/deploy.log 2>&1 &";
        exec($command);
        logMessage("Deployment script executed: $command");
    } else {
        logMessage("Deployment script not found: $deployScript");
    }
    
} else {
    logMessage("Ignoring webhook - not a push to main branch or wrong repository");
    http_response_code(200);
    echo json_encode(['status' => 'ignored']);
}

logMessage("Webhook processing completed");
?> 