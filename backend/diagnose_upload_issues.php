<?php

/**
 * Comprehensive Audio Upload Diagnostic Script
 * 
 * This script checks all potential failure points for audio uploads:
 * - Storage permissions and directories
 * - Database connectivity
 * - Queue worker status
 * - System tools availability (ffmpeg, sox, aimastering)
 * - Laravel configuration
 * - File system permissions
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== AUDIO UPLOAD DIAGNOSTIC SCRIPT ===\n";
echo "Timestamp: " . now()->toISOString() . "\n\n";

$issues = [];
$warnings = [];
$successes = [];

// 1. Check Laravel Environment
echo "1. Checking Laravel Environment...\n";
try {
    $env = app()->environment();
    $debug = config('app.debug');
    $logLevel = config('logging.level', 'debug');
    
    echo "   - Environment: {$env}\n";
    echo "   - Debug Mode: " . ($debug ? 'ON' : 'OFF') . "\n";
    echo "   - Log Level: {$logLevel}\n";
    
    if ($debug) {
        $warnings[] = "Debug mode is ON - should be OFF in production";
    }
    
    $successes[] = "Laravel environment loaded successfully";
} catch (Exception $e) {
    $issues[] = "Laravel environment failed: " . $e->getMessage();
}

// 2. Check Database Connection
echo "\n2. Checking Database Connection...\n";
try {
    $connection = DB::connection();
    $pdo = $connection->getPdo();
    
    echo "   - Database: " . config('database.default') . "\n";
    echo "   - Connected: " . ($pdo ? 'YES' : 'NO') . "\n";
    
    if ($pdo) {
        $version = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
        echo "   - Version: {$version}\n";
        
        // Test write access
        $testTable = 'diagnostic_test_' . time();
        DB::statement("CREATE TABLE IF NOT EXISTS {$testTable} (id INT)");
        DB::statement("INSERT INTO {$testTable} (id) VALUES (1)");
        DB::statement("DROP TABLE {$testTable}");
        
        $successes[] = "Database connection and write access working";
    } else {
        $issues[] = "Database connection failed";
    }
} catch (Exception $e) {
    $issues[] = "Database connection error: " . $e->getMessage();
}

// 3. Check Storage Configuration
echo "\n3. Checking Storage Configuration...\n";
try {
    $storageDisk = config('audio.storage.disk', 'public');
    $storageInstance = Storage::disk($storageDisk);
    $storageRoot = $storageInstance->path('');
    
    echo "   - Storage Disk: {$storageDisk}\n";
    echo "   - Storage Root: {$storageRoot}\n";
    echo "   - Root Exists: " . (file_exists($storageRoot) ? 'YES' : 'NO') . "\n";
    echo "   - Root Writable: " . (is_writable($storageRoot) ? 'YES' : 'NO') . "\n";
    
    if (!file_exists($storageRoot)) {
        $issues[] = "Storage root directory does not exist: {$storageRoot}";
    } elseif (!is_writable($storageRoot)) {
        $issues[] = "Storage root directory is not writable: {$storageRoot}";
    } else {
        $successes[] = "Storage root directory accessible and writable";
    }
    
    // Check specific audio directories
    $audioDirs = [
        'audio/original',
        'audio/mastered',
        'temp',
        'audio/temp'
    ];
    
    foreach ($audioDirs as $dir) {
        $fullPath = $storageInstance->path($dir);
        echo "   - {$dir}: " . (file_exists($fullPath) ? 'EXISTS' : 'MISSING') . 
             " | " . (is_writable($fullPath) ? 'WRITABLE' : 'NOT WRITABLE') . "\n";
        
        if (!file_exists($fullPath)) {
            $warnings[] = "Directory missing: {$dir}";
        } elseif (!is_writable($fullPath)) {
            $issues[] = "Directory not writable: {$dir}";
        }
    }
    
} catch (Exception $e) {
    $issues[] = "Storage configuration error: " . $e->getMessage();
}

// 4. Check Storage Link
echo "\n4. Checking Storage Link...\n";
try {
    $publicStoragePath = public_path('storage');
    $storageLinkPath = public_path('storage');
    
    echo "   - Public Storage Path: {$publicStoragePath}\n";
    echo "   - Link Exists: " . (file_exists($publicStoragePath) ? 'YES' : 'NO') . "\n";
    echo "   - Is Link: " . (is_link($publicStoragePath) ? 'YES' : 'NO') . "\n";
    
    if (is_link($publicStoragePath)) {
        $linkTarget = readlink($publicStoragePath);
        echo "   - Link Target: {$linkTarget}\n";
        
        if (file_exists($linkTarget)) {
            $successes[] = "Storage link working correctly";
        } else {
            $issues[] = "Storage link target does not exist: {$linkTarget}";
        }
    } else {
        $warnings[] = "Storage link not found - run: php artisan storage:link";
    }
    
} catch (Exception $e) {
    $issues[] = "Storage link check error: " . $e->getMessage();
}

// 5. Check Queue Configuration
echo "\n5. Checking Queue Configuration...\n";
try {
    $queueConnection = config('queue.default');
    $queueConfig = config("queue.connections.{$queueConnection}");
    
    echo "   - Queue Connection: {$queueConnection}\n";
    echo "   - Queue Driver: " . ($queueConfig['driver'] ?? 'unknown') . "\n";
    
    if ($queueConnection === 'database') {
        echo "   - Queue Table: " . ($queueConfig['table'] ?? 'jobs') . "\n";
        
        // Check if jobs table exists
        $tableExists = DB::getSchemaBuilder()->hasTable($queueConfig['table'] ?? 'jobs');
        echo "   - Jobs Table Exists: " . ($tableExists ? 'YES' : 'NO') . "\n";
        
        if (!$tableExists) {
            $issues[] = "Jobs table does not exist";
        }
    }
    
    $successes[] = "Queue configuration loaded";
    
} catch (Exception $e) {
    $issues[] = "Queue configuration error: " . $e->getMessage();
}

// 6. Check System Tools
echo "\n6. Checking System Tools...\n";
$tools = [
    'ffmpeg' => ['ffmpeg', '-version'],
    'sox' => ['sox', '--version'],
    'aimastering' => ['aimastering', '--version'],
    'php' => ['php', '--version'],
];

foreach ($tools as $tool => $command) {
    try {
        $process = new Process($command);
        $process->setTimeout(10);
        $process->run();
        
        $available = $process->isSuccessful();
        $version = $available ? trim(explode("\n", $process->getOutput())[0]) : 'NOT AVAILABLE';
        
        echo "   - {$tool}: " . ($available ? 'AVAILABLE' : 'NOT AVAILABLE') . "\n";
        if ($available) {
            echo "     Version: {$version}\n";
            $successes[] = "{$tool} available: {$version}";
        } else {
            $warnings[] = "{$tool} not available: " . $process->getErrorOutput();
        }
        
    } catch (Exception $e) {
        $warnings[] = "{$tool} check failed: " . $e->getMessage();
    }
}

// 7. Check PHP Configuration
echo "\n7. Checking PHP Configuration...\n";
$phpSettings = [
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'max_file_uploads' => ini_get('max_file_uploads'),
    'file_uploads' => ini_get('file_uploads') ? 'ON' : 'OFF',
];

foreach ($phpSettings as $setting => $value) {
    echo "   - {$setting}: {$value}\n";
}

// Check if upload limits are sufficient
$uploadMax = $this->parseSize(ini_get('upload_max_filesize'));
$postMax = $this->parseSize(ini_get('post_max_size'));
$configMax = config('audio.file_size.max_upload_size');

if ($uploadMax < $configMax) {
    $issues[] = "upload_max_filesize ({$uploadMax}) is less than configured max ({$configMax})";
}

if ($postMax < $configMax) {
    $issues[] = "post_max_size ({$postMax}) is less than configured max ({$configMax})";
}

$successes[] = "PHP configuration loaded";

// 8. Check File Permissions
echo "\n8. Checking File Permissions...\n";
$criticalPaths = [
    storage_path(),
    storage_path('app'),
    storage_path('app/public'),
    storage_path('logs'),
    storage_path('framework'),
    storage_path('framework/cache'),
    storage_path('framework/sessions'),
    storage_path('framework/views'),
    public_path(),
    public_path('storage'),
];

foreach ($criticalPaths as $path) {
    if (file_exists($path)) {
        $perms = substr(sprintf('%o', fileperms($path)), -4);
        $writable = is_writable($path);
        echo "   - {$path}: {$perms} | " . ($writable ? 'WRITABLE' : 'NOT WRITABLE') . "\n";
        
        if (!$writable) {
            $issues[] = "Directory not writable: {$path}";
        }
    } else {
        echo "   - {$path}: MISSING\n";
        $warnings[] = "Directory missing: {$path}";
    }
}

// 9. Check Recent Logs
echo "\n9. Checking Recent Logs...\n";
try {
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $logSize = filesize($logFile);
        $logLines = count(file($logFile));
        echo "   - Log File: {$logFile}\n";
        echo "   - Size: " . $this->formatBytes($logSize) . "\n";
        echo "   - Lines: {$logLines}\n";
        
        // Check for recent errors
        $recentErrors = shell_exec("tail -100 {$logFile} | grep -i 'error\\|exception\\|failed' | wc -l");
        echo "   - Recent Errors: " . trim($recentErrors) . "\n";
        
        $successes[] = "Log file accessible";
    } else {
        $warnings[] = "Log file not found: {$logFile}";
    }
} catch (Exception $e) {
    $warnings[] = "Log check failed: " . $e->getMessage();
}

// 10. Check Queue Worker Status
echo "\n10. Checking Queue Worker Status...\n";
try {
    $queueWorkers = shell_exec("ps aux | grep 'queue:work' | grep -v grep | wc -l");
    $queueWorkers = trim($queueWorkers);
    
    echo "   - Queue Workers Running: {$queueWorkers}\n";
    
    if ($queueWorkers == 0) {
        $issues[] = "No queue workers running - processing jobs will not be executed";
    } elseif ($queueWorkers < 2) {
        $warnings[] = "Only {$queueWorkers} queue worker(s) running - consider running more for better performance";
    } else {
        $successes[] = "Queue workers running: {$queueWorkers}";
    }
    
} catch (Exception $e) {
    $warnings[] = "Queue worker check failed: " . $e->getMessage();
}

// Summary
echo "\n=== DIAGNOSTIC SUMMARY ===\n";
echo "Successes: " . count($successes) . "\n";
echo "Warnings: " . count($warnings) . "\n";
echo "Issues: " . count($issues) . "\n\n";

if (count($successes) > 0) {
    echo "✅ SUCCESSES:\n";
    foreach ($successes as $success) {
        echo "   - {$success}\n";
    }
    echo "\n";
}

if (count($warnings) > 0) {
    echo "⚠️  WARNINGS:\n";
    foreach ($warnings as $warning) {
        echo "   - {$warning}\n";
    }
    echo "\n";
}

if (count($issues) > 0) {
    echo "❌ ISSUES (Must Fix):\n";
    foreach ($issues as $issue) {
        echo "   - {$issue}\n";
    }
    echo "\n";
} else {
    echo "✅ No critical issues found!\n";
}

echo "=== END DIAGNOSTIC ===\n";

/**
 * Parse size string (e.g., "100M") to bytes
 */
function parseSize($size) {
    $unit = strtolower(substr($size, -1));
    $value = (int) substr($size, 0, -1);
    
    switch ($unit) {
        case 'k': return $value * 1024;
        case 'm': return $value * 1024 * 1024;
        case 'g': return $value * 1024 * 1024 * 1024;
        default: return $value;
    }
}

/**
 * Format bytes to human readable format
 */
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
} 