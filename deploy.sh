#!/bin/bash

echo "Starting deployment..."

cd /var/www/audio-app

# Pull latest changes
git pull origin main

# Backend fixes
cd backend

# Set proper permissions
sudo chown -R apache:apache storage/
sudo chown -R apache:apache bootstrap/cache/
sudo chmod -R 775 storage/
sudo chmod -R 775 bootstrap/cache/
sudo chmod -R 777 storage/app/public/audio/
sudo chmod -R 777 storage/app/private/audio/

# Create storage directories if they don't exist
mkdir -p storage/app/public/audio/original
mkdir -p storage/app/public/audio/mastered
mkdir -p storage/app/private/audio/original

# Create storage link
php artisan storage:link

# Fix CORS configuration
cat > config/cors.php << 'EOF'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://crysgarage.studio:3000',
        'http://crysgarage.studio',
        'https://crysgarage.studio:3000',
        'https://crysgarage.studio',
        '*'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition', 'Content-Length', 'Content-Type'],
    'max_age' => 0,
    'supports_credentials' => true,
];
EOF

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Install dependencies
composer install --no-dev --optimize-autoloader

# Frontend fixes
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Restart frontend
pm2 restart frontend

# Set final permissions
sudo chown -R apache:apache /var/www/audio-app
sudo chmod -R 755 /var/www/audio-app

# Restart Apache to apply CORS changes
sudo systemctl restart httpd

echo "Deployment completed successfully!" 