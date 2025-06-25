<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Audio Processing Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for audio file processing,
    | including supported formats, file size limits, and processing settings.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Supported Audio Formats
    |--------------------------------------------------------------------------
    |
    | Define the audio formats that the application can accept and process.
    | Both file extensions and MIME types are specified for validation.
    |
    */

    'supported_formats' => [
        'extensions' => [
            'wav', 'mp3', 'flac', 'aiff', 'aif', 'ogg', 'wma', 'mp4', 'm4a'
        ],
        'mime_types' => [
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/mpeg',
            'audio/mp3',
            'audio/flac',
            'audio/x-flac',
            'audio/aiff',
            'audio/x-aiff',
            'audio/aif',
            'audio/x-aif',
            'audio/ogg',
            'audio/vorbis',
            'audio/x-ms-wma',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Lite Automatic Mastering Formats
    |--------------------------------------------------------------------------
    |
    | Define the audio formats that lite automatic mastering can accept.
    | Lite automatic mastering only supports WAV files to eliminate conversion.
    |
    */

    'lite_automatic_formats' => [
        'extensions' => [
            'wav'
        ],
        'mime_types' => [
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Size Limits
    |--------------------------------------------------------------------------
    |
    | Configure the maximum file size for audio uploads.
    | Values are in bytes unless otherwise specified.
    |
    */

    'file_size' => [
        'max_upload_size' => 100 * 1024 * 1024, // 100MB in bytes
        'max_upload_size_kb' => 100 * 1024,     // 100MB in KB (for Laravel validation)
        'recommended_size' => 50 * 1024 * 1024,  // 50MB recommended
    ],

    /*
    |--------------------------------------------------------------------------
    | Processing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for audio processing including output formats,
    | quality settings, and processing timeouts.
    |
    */

    'processing' => [
        'output_format' => 'wav',
        'output_quality' => 'high',
        'timeout' => 300, // 5 minutes
        'memory_limit' => '256M',
        'temp_directory' => storage_path('app/temp/audio'),
        'output_directory' => 'audio/mastered',
        'original_directory' => 'audio/original',
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Mastering Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for AI mastering service integration.
    | These settings are used when the aimastering CLI tool is available.
    |
    */

    'aimastering' => [
        'enabled' => env('AIMASTERING_ENABLED', false),
        'cli_path' => env('AIMASTERING_CLI_PATH', 'aimastering'),
        'target_loudness' => env('AIMASTERING_TARGET_LOUDNESS', '-14'),
        'preset' => env('AIMASTERING_PRESET', 'default'),
        'timeout' => env('AIMASTERING_TIMEOUT', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for file storage including disk configuration,
    | cleanup policies, and backup settings.
    |
    */

    'storage' => [
        'disk' => env('AUDIO_STORAGE_DISK', 'public'),
        'cleanup_failed_after_days' => 7,
        'cleanup_completed_after_days' => 30,
        'enable_backup' => env('AUDIO_ENABLE_BACKUP', false),
        'backup_disk' => env('AUDIO_BACKUP_DISK', 's3'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Configure rate limiting for audio uploads and processing.
    |
    */

    'rate_limiting' => [
        'uploads_per_hour' => 10,
        'uploads_per_day' => 50,
        'max_concurrent_processing' => 3,
        'bypass_for_admin' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    |
    | Additional validation rules for audio files beyond basic format checking.
    |
    */

    'validation' => [
        'min_duration_seconds' => 1,
        'max_duration_seconds' => 600, // 10 minutes
        'min_sample_rate' => 8000,     // 8kHz
        'max_sample_rate' => 192000,   // 192kHz
        'allowed_bit_depths' => [16, 24, 32],
    ],

    /*
    |--------------------------------------------------------------------------
    | EQ Processing Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for post-AI mastering EQ enhancement processing.
    | These settings control the equalizer functionality.
    |
    */

    'eq_processing' => [
        'enabled' => env('EQ_PROCESSING_ENABLED', true),
        'temp_directory' => storage_path('app/temp/eq'),
        'keep_ai_only_version' => env('KEEP_AI_ONLY_VERSION', true),
        'max_gain_db' => 18,
        'min_gain_db' => -18,
        'cleanup_temp_files_hours' => 24,
        'bands' => [
            'bass' => [
                'frequency' => 80,
                'width' => 50,
                'label' => 'Bass',
                'description' => 'Low frequency enhancement (80Hz)'
            ],
            'low_mid' => [
                'frequency' => 200,
                'width' => 100,
                'label' => 'Low Mid',
                'description' => 'Lower midrange control (200Hz)'
            ],
            'mid' => [
                'frequency' => 1000,
                'width' => 200,
                'label' => 'Mid',
                'description' => 'Midrange presence (1kHz)'
            ],
            'high_mid' => [
                'frequency' => 5000,
                'width' => 500,
                'label' => 'High Mid',
                'description' => 'Upper midrange clarity (5kHz)'
            ],
            'treble' => [
                'frequency' => 10000,
                'width' => 1000,
                'label' => 'Treble',
                'description' => 'High frequency sparkle (10kHz)'
            ]
        ]
    ],
]; 