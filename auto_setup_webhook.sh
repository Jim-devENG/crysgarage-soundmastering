#!/bin/bash

# Auto Setup Webhook and Deploy Script
# This script will set up automatic deployment on git push

set -e  # Exit on any error

echo "🚀 Starting automatic webhook setup and deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Run as your regular user."
    exit 1
fi

# Get current directory
PROJECT_DIR=$(pwd)
print_status "Project directory: $PROJECT_DIR"

# Step 1: Stop existing services
print_status "Stopping existing services..."
pm2 stop all 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true

# Step 2: Pull latest changes
print_status "Pulling latest changes from git..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Step 3: Setup Backend
print_status "Setting up Laravel backend..."
cd backend

# Install PHP dependencies
print_status "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Copy environment file if not exists
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp .env.example .env
    php artisan key:generate
fi

# Run migrations
print_status "Running database migrations..."
php artisan migrate --force

# Clear caches
print_status "Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

cd ..

# Step 4: Setup Frontend
print_status "Setting up Next.js frontend..."
cd frontend

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Build frontend
print_status "Building frontend..."
npm run build

cd ..

# Step 5: Create webhook script
print_status "Creating webhook script..."
sudo mkdir -p /var/www/webhook
sudo tee /var/www/webhook/deploy.php > /dev/null << 'EOF'
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
EOF

# Set webhook permissions
sudo chown -R www-data:www-data /var/www/webhook
sudo chmod +x /var/www/webhook/deploy.php

# Step 6: Configure Apache for webhook
print_status "Configuring Apache for webhook access..."
sudo tee /etc/apache2/sites-available/webhook.conf > /dev/null << 'EOF'
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
EOF

# Enable webhook site
sudo a2ensite webhook.conf

# Step 7: Create deploy script
print_status "Creating deploy script..."
tee deploy.sh > /dev/null << 'EOF'
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
EOF

chmod +x deploy.sh

# Step 8: Start services
print_status "Starting services..."

# Start Laravel backend with PM2
print_status "Starting Laravel backend..."
cd backend
pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name "laravel-backend"
cd ..

# Start Next.js frontend with PM2
print_status "Starting Next.js frontend..."
cd frontend
pm2 start "npm start" --name "nextjs-frontend"
cd ..

# Start Apache
print_status "Starting Apache..."
sudo systemctl start apache2
sudo systemctl enable apache2

# Step 9: Configure Apache proxy
print_status "Configuring Apache proxy..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel

sudo tee /etc/apache2/sites-available/000-default.conf > /dev/null << 'EOF'
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
EOF

# Restart Apache
sudo systemctl restart apache2

# Step 10: Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
pm2 startup

# Step 11: Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_success "Server IP: $SERVER_IP"

# Step 12: Display webhook URL
WEBHOOK_URL="http://$SERVER_IP/deploy.php"
print_success "Webhook URL: $WEBHOOK_URL"

# Step 13: Display next steps
print_success "🎉 Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Go to Settings > Webhooks"
echo "3. Click 'Add webhook'"
echo "4. Set Payload URL to: $WEBHOOK_URL"
echo "5. Set Content type to: application/json"
echo "6. Select 'Just the push event'"
echo "7. Click 'Add webhook'"
echo ""
print_status "Your application should now be running at:"
echo "Frontend: http://$SERVER_IP"
echo "Backend API: http://$SERVER_IP/api"
echo ""
print_status "To check status:"
echo "pm2 status"
echo "sudo systemctl status apache2"
echo ""
print_status "To view logs:"
echo "pm2 logs"
echo "tail -f /var/www/webhook/deploy.log"

print_success "✅ Automatic deployment setup completed!" 