# Crys Audio Processing Application

A professional audio mastering application with AI-powered processing, real-time EQ controls, and multiple mastering workflows.

## 🎵 Features

### AI Mastering

- **Automatic Mastering**: AI-powered mastering with genre-specific presets
- **Lite Automatic**: Quick mastering with optimized settings
- **Advanced Mastering**: Full control over mastering parameters
- **Real-time Processing**: Live audio processing with Web Audio API
- **Multiple Output Formats**: WAV, MP3, and FLAC support

### Audio Controls

- **8-Band EQ**: Professional equalizer with frequency bands (32Hz - 8kHz)
- **Compressor**: Dynamic range compression with threshold, ratio, attack, and release controls
- **Stereo Width**: Adjustable stereo field enhancement
- **Target Loudness**: Configurable loudness targets (-20dB to -8dB)
- **Bass Enhancement**: Low-frequency boost controls
- **Presence Enhancement**: Mid-high frequency enhancement
- **Boost Control**: Additional gain enhancement
- **Limiter**: Peak limiting with configurable threshold and release

### User Interface

- **Real-time Visualizer**: Frequency spectrum analysis
- **Audio Comparison**: A/B testing between original and mastered audio
- **Playback Controls**: Professional audio player with waveform display
- **Processing Reports**: Detailed analysis of mastering results
- **Download Management**: Multiple format downloads with progress tracking

### Technical Features

- **Web Audio API**: Real-time audio processing in the browser
- **Queue System**: Background processing for large files
- **File Management**: Secure file upload and storage
- **Authentication**: User account management
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Prerequisites

- Node.js (v18 or higher)
- PHP 8.2 or higher
- Composer
- PostgreSQL 17
- npm or yarn
- SoX (Sound eXchange) for audio processing

## 📦 Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Jim-devENG/crysgarage-soundmastering.git
   cd crys-fresh
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment Variables**

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the following variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXTAUTH_SECRET`: Generate a secure random string
     - `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
     - `QUEUE_CONNECTION`: Set to 'database' for background processing

5. **Set Up Database**

   ```bash
   cd backend
   php artisan migrate
   php artisan db:seed
   ```

6. **Install SoX (Audio Processing)**

   **Windows:**

   ```bash
   # Run the PowerShell script in the backend directory
   cd backend
   .\install_sox.ps1
   ```

   **macOS:**

   ```bash
   brew install sox
   ```

   **Linux:**

   ```bash
   sudo apt-get install sox
   ```

7. **Start the Application**

   - Run `start.bat` in the root directory
   - Or start each service manually:

     ```bash
     # Terminal 1 - Backend
     cd backend
     php artisan serve

     # Terminal 2 - Queue Worker
     cd backend
     php artisan queue:work

     # Terminal 3 - Frontend
     cd frontend
     npm run dev
     ```

## 🌐 Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/documentation

## 🎛️ Usage Guide

### Uploading Audio

1. Navigate to the upload page
2. Drag and drop or select your audio file (WAV, MP3, FLAC supported)
3. Wait for the file to upload and process

### AI Mastering

1. **Automatic Mastering**: Select your genre and processing quality
2. **Lite Automatic**: Quick mastering with optimized settings
3. **Advanced Mastering**: Full control over all parameters

### Real-time Controls

- **EQ Section**: Adjust 8 frequency bands with visual feedback
- **Compressor**: Set threshold, ratio, attack, and release
- **Stereo Width**: Enhance stereo field with toggle control
- **Target Loudness**: Set desired output loudness with toggle
- **Boost Enhancement**: Additional gain control under compressor

### Download Options

- Download mastered audio in WAV, MP3, or FLAC format
- Compare original vs mastered audio
- View processing reports and analysis

## 🛠️ Development

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Laravel 10, PHP 8.2
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Audio Processing**: Web Audio API, SoX
- **Queue System**: Laravel Queues with database driver

### Project Structure

```
crys-fresh/
├── backend/                 # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/ # API controllers
│   │   ├── Services/         # Audio processing services
│   │   └── Jobs/            # Background jobs
│   ├── config/              # Configuration files
│   └── database/            # Migrations and seeders
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utility functions
│   └── public/              # Static assets
└── docs/                    # Documentation
```

### Key Components

- **AudioFileController**: Handles file uploads and processing
- **AdvancedAudioProcessor**: AI mastering implementation
- **EQProcessor**: Real-time EQ processing
- **CustomMasteringDashboard**: Main mastering interface
- **AudioPlaybackPopup**: Audio comparison component

## 🔧 Troubleshooting

### Common Issues

1. **Audio Processing Errors**

   - Ensure SoX is installed and accessible
   - Check audio file format compatibility
   - Verify storage permissions

2. **Queue Worker Issues**

   - Check Laravel logs in `storage/logs`
   - Verify queue configuration in `.env`
   - Restart queue worker: `php artisan queue:restart`

3. **Database Connection Issues**

   - Ensure PostgreSQL is running
   - Check `DATABASE_URL` in `.env` files
   - Run migrations: `php artisan migrate`

4. **Authentication Issues**

   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your frontend URL
   - Ensure database migrations are up to date

5. **File Upload Issues**
   - Check file size limits in `php.ini`
   - Verify storage directory permissions
   - Check CORS configuration

### Performance Optimization

- Use Redis for queue processing in production
- Configure proper file storage (S3 recommended for production)
- Enable caching for database queries
- Optimize audio processing parameters

## 📝 Recent Updates

### v2.0.0 - EQ Control Reorganization

- Moved 3D toggle to front of stereo width control
- Relocated stereo width toggle to its respective section
- Removed boost control from EQ and added under compressor
- Moved target loudness toggle to front of target loudness control
- Centered bass toggle in EQ section

### v1.5.0 - Separate Mastering Workflows

- Implemented distinct mastering types (automatic, lite automatic, advanced)
- Added separate mastered audio files for each workflow
- Created dedicated playback popups for each mastering type
- Enhanced download functionality with format selection

### v1.0.0 - Initial Release

- AI-powered audio mastering
- Real-time EQ controls
- Web Audio API integration
- Multi-format support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and support:

- Create an issue in the repository
- Check the troubleshooting section above
- Review the documentation in the `/docs` folder

## 🔗 Links

- [Repository](https://github.com/Jim-devENG/crysgarage-soundmastering)
- [API Documentation](http://localhost:8000/api/documentation)
- [Laravel Documentation](https://laravel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🧹 Safe Cleanup Script

To safely clean up build artifacts, logs, and caches without risking source code or important directories, use the following script:

```bash
#!/bin/bash
# safe_cleanup.sh
# Safely cleans Laravel and Next.js build artifacts, logs, and caches.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_success() {
    echo -e "${GREEN}$1${NC}"
}
function print_warn() {
    echo -e "${YELLOW}$1${NC}"
}

print_success "--- Cleaning up Laravel backend ---"
cd backend

# Check for PHP
if command -v php >/dev/null 2>&1; then
    php artisan config:clear || true
    php artisan cache:clear || true
    php artisan route:clear || true
    php artisan view:clear || true
else
    print_warn "PHP not found, skipping Laravel cache clear."
fi

# Remove only log files, not directories
find storage/logs/ -type f -name "*.log" -delete

# Remove only cache/session/view files, not directories
find storage/framework/cache/ -type f -delete
find storage/framework/sessions/ -type f -delete
find storage/framework/views/ -type f -delete

cd ..

print_success "--- Cleaning up Next.js frontend ---"
cd frontend

# Remove build artifacts only
rm -rf .next

cd ..

print_success "--- Project root: showing untracked files (not deleting) ---"
git clean -fdn

print_warn "If you want to delete the above untracked files, run: git clean -fd"

print_success "Safe cleanup complete!"
```

**Usage:**

1. Save as `safe_cleanup.sh` in your project root.
2. Run it from a Linux shell, WSL, or your server:
   ```bash
   bash safe_cleanup.sh
   ```

- The script will only remove safe files and show you untracked files before deleting anything extra.
- It will skip Laravel cache clearing if PHP is not available.
