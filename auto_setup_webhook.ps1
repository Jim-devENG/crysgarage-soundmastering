# Auto Setup Webhook and Deploy Script for Windows/Linux
# This script will set up automatic deployment on git push

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🚀 Starting automatic webhook setup and deployment..." -ForegroundColor Cyan

# Get current directory
$PROJECT_DIR = Get-Location
Write-Status "Project directory: $PROJECT_DIR"

# Step 1: Stop existing services
Write-Status "Stopping existing services..."
pm2 stop all 2>$null
sudo systemctl stop apache2 2>$null

# Step 2: Pull latest changes
Write-Status "Pulling latest changes from git..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Step 3: Setup Backend
Write-Status "Setting up Laravel backend..."
Set-Location backend

# Install PHP dependencies
Write-Status "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Set proper permissions
Write-Status "Setting proper permissions..."
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Copy environment file if not exists
if (-not (Test-Path .env)) {
    Write-Status "Creating .env file..."
    Copy-Item .env.example .env
    php artisan key:generate
}

# Run migrations
Write-Status "Running database migrations..."
php artisan migrate --force

# Clear caches
Write-Status "Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

Set-Location ..

# Step 4: Setup Frontend
Write-Status "Setting up Next.js frontend..."
Set-Location frontend

# Install dependencies
Write-Status "Installing Node.js dependencies..."
npm install

# Build frontend
Write-Status "Building frontend..."
npm run build

Set-Location ..

# Step 5: Create webhook script
Write-Status "Creating webhook script..."
sudo mkdir -p /var/www/webhook
$webhookContent = @'
<?php
// Webhook script for automatic deployment
header('Content-Type: application/json');

// Verify GitHub webhook signature (optional but recommended)
$secret = 'your_webhook_secret_here'; // Change this to a secure secret
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');

if (!empty($secret) && !empty($signature)) {
    $expected_signature = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    if (!hash_equals($expected_signature, $signature)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
}

// Log the webhook
$log_file = '/var/www/webhook/deploy.log';
$timestamp = date('Y-m-d H:i:s');
file_put_contents($log_file, "[$timestamp] Webhook received\n", FILE_APPEND);

// Execute deployment script
$project_dir = '/home/ubuntu/crys-fresh'; // Update this path
$deploy_script = "$project_dir/deploy.sh";

if (file_exists($deploy_script)) {
    // Run deployment in background
    $output = shell_exec("cd $project_dir && bash $deploy_script 2>&1");
    file_put_contents($log_file, "[$timestamp] Deployment output: $output\n", FILE_APPEND);
    echo json_encode(['status' => 'success', 'message' => 'Deployment started']);
} else {
    file_put_contents($log_file, "[$timestamp] Error: Deploy script not found\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['error' => 'Deploy script not found']);
}
?>
'@

$webhookContent | sudo tee /var/www/webhook/deploy.php > $null

# Set webhook permissions
sudo chown -R www-data:www-data /var/www/webhook
sudo chmod +x /var/www/webhook/deploy.php

# Step 6: Configure Apache for webhook
Write-Status "Configuring Apache for webhook access..."
$webhookConfig = @'
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/webhook
    
    <Directory /var/www/webhook>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Allow POST requests for webhook
    <Location "/deploy.php">
        Require all granted
    </Location>
</VirtualHost>
'@

$webhookConfig | sudo tee /etc/apache2/sites-available/webhook.conf > $null

# Enable webhook site
sudo a2ensite webhook.conf

# Step 7: Create deploy script
Write-Status "Creating deploy script..."
$deployScript = @'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git fetch origin
git reset --hard origin/main
git clean -fd

# Deploy backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
cd ..

# Deploy frontend
cd frontend
npm install
npm run build
cd ..

# Restart services
pm2 restart all

echo "✅ Deployment completed!"
'@

$deployScript | Out-File -FilePath "deploy.sh" -Encoding UTF8

# Make deploy script executable
if (Get-Command chmod -ErrorAction SilentlyContinue) {
    chmod +x deploy.sh
}

# Step 8: Start services
Write-Status "Starting services..."

# Start Laravel backend with PM2
Write-Status "Starting Laravel backend..."
Set-Location backend
pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name "laravel-backend"
Set-Location ..

# Start Next.js frontend with PM2
Write-Status "Starting Next.js frontend..."
Set-Location frontend
pm2 start "npm start" --name "nextjs-frontend"
Set-Location ..

# Start Apache
Write-Status "Starting Apache..."
sudo systemctl start apache2
sudo systemctl enable apache2

# Step 9: Configure Apache proxy
Write-Status "Configuring Apache proxy..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel

$apacheConfig = @'
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    # Proxy frontend (Next.js)
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Proxy backend API
    ProxyPass /api http://localhost:8000/api
    ProxyPassReverse /api http://localhost:8000/api
    
    # Proxy backend auth
    ProxyPass /auth http://localhost:8000/auth
    ProxyPassReverse /auth http://localhost:8000/auth
    
    # Proxy backend storage
    ProxyPass /storage http://localhost:8000/storage
    ProxyPassReverse /storage http://localhost:8000/storage
    
    # WebSocket support for real-time features
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
</VirtualHost>
'@

$apacheConfig | sudo tee /etc/apache2/sites-available/000-default.conf > $null

# Restart Apache
sudo systemctl restart apache2

# Step 10: Save PM2 configuration
Write-Status "Saving PM2 configuration..."
pm2 save
pm2 startup

# Step 11: Get server IP
$SERVER_IP = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content
Write-Success "Server IP: $SERVER_IP"

# Step 12: Display webhook URL
$WEBHOOK_URL = "http://$SERVER_IP/deploy.php"
Write-Success "Webhook URL: $WEBHOOK_URL"

# Step 13: Display next steps
Write-Success "🎉 Setup completed successfully!"
Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Go to your GitHub repository"
Write-Host "2. Go to Settings > Webhooks"
Write-Host "3. Click 'Add webhook'"
Write-Host "4. Set Payload URL to: $WEBHOOK_URL"
Write-Host "5. Set Content type to: application/json"
Write-Host "6. Select 'Just the push event'"
Write-Host "7. Click 'Add webhook'"
Write-Host ""
Write-Status "Your application should now be running at:"
Write-Host "Frontend: http://$SERVER_IP"
Write-Host "Backend API: http://$SERVER_IP/api"
Write-Host ""
Write-Status "To check status:"
Write-Host "pm2 status"
Write-Host "sudo systemctl status apache2"
Write-Host ""
Write-Status "To view logs:"
Write-Host "pm2 logs"
Write-Host "tail -f /var/www/webhook/deploy.log"

Write-Success "✅ Automatic deployment setup completed!" 