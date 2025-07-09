#!/bin/bash

# Deployment/update script for audio-app
# Run this script on your VPS to update and deploy the application

set -e  # Exit on any error

echo "🚀 Starting deployment/update process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "/root/audio-app" ]; then
    print_error "Directory /root/audio-app not found!"
    exit 1
fi

# 1. Navigate to project root
print_status "Navigating to /root/audio-app..."
cd /root/audio-app

# 2. Pull the latest changes
print_status "Pulling latest changes from origin/main..."
git fetch origin
git reset --hard origin/main
print_status "Git reset completed"

# 3. Backend setup
print_status "Setting up backend..."
cd backend

print_status "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

print_status "Running database migrations..."
php artisan migrate --force

print_status "Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

print_status "Backend setup completed"

# 4. Frontend setup
print_status "Setting up frontend..."
cd ../frontend

print_status "Installing Node.js dependencies..."
npm install

print_status "Clearing Next.js cache..."
rm -rf .next

print_status "Building frontend..."
npm run build

print_status "Frontend setup completed"

# 5. Restart services
print_status "Restarting services..."

# Check if pm2 is installed
if command -v pm2 &> /dev/null; then
    print_status "Restarting backend service..."
    pm2 restart backend || print_warning "Backend service restart failed or service not found"
    
    print_status "Restarting frontend service..."
    pm2 restart frontend || print_warning "Frontend service restart failed or service not found"
    
    print_status "PM2 services restarted"
else
    print_warning "PM2 not found. Please restart your services manually."
fi

# 6. Final checks
print_status "Performing final checks..."

# Check if backend is running
if curl -s http://localhost:8000/api/test-upload-config > /dev/null 2>&1; then
    print_status "✅ Backend is responding"
else
    print_warning "⚠️  Backend may not be responding on port 8000"
fi

# Check if frontend is running (assuming it's on port 3000)
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend is responding"
else
    print_warning "⚠️  Frontend may not be responding on port 3000"
fi

echo ""
print_status "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test your application at your domain"
echo "2. Check logs if there are any issues:"
echo "   - Backend logs: tail -f /root/audio-app/backend/storage/logs/laravel.log"
echo "   - PM2 logs: pm2 logs"
echo ""
echo "If you encounter any issues, check the logs above for error messages." 