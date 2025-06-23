<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class CheckAIMasteringService extends Command
{
    protected $signature = 'aimastering:check';
    protected $description = 'Check the health of the AI mastering service';

    public function handle(): void
    {
        $this->info('Checking AI mastering service...');

        try {
            // Check if aimastering CLI is available
            $checkProcess = new Process(['where', 'aimastering']);
            $checkProcess->run();

            if (!$checkProcess->isSuccessful()) {
                $this->error('AI mastering CLI tool not found');
                Log::error('AI mastering service check failed: CLI tool not found');
                return;
            }

            // Check version
            $versionProcess = new Process(['aimastering', '--version']);
            $versionProcess->run();

            if (!$versionProcess->isSuccessful()) {
                $this->error('Failed to get AI mastering version');
                Log::error('AI mastering service check failed: Version check failed');
                return;
            }

            $version = trim($versionProcess->getOutput());
            $this->info('AI mastering version: ' . $version);

            // Check if service can process a test file
            $testFile = storage_path('app/public/test.wav');
            if (!file_exists($testFile)) {
                $this->warn('Test file not found, skipping processing test');
            } else {
                $this->info('Testing processing capabilities...');
                $testProcess = new Process([
                    'aimastering',
                    'master',
                    '--input', $testFile,
                    '--output', storage_path('app/public/test_output.wav'),
                    '--target-loudness', '-14',
                ]);

                $testProcess->setTimeout(30);
                $testProcess->run();

                if (!$testProcess->isSuccessful()) {
                    $this->error('Processing test failed');
                    Log::error('AI mastering service check failed: Processing test failed', [
                        'error' => $testProcess->getErrorOutput(),
                    ]);
                    return;
                }

                $this->info('Processing test successful');
            }

            $this->info('AI mastering service is healthy');
            Log::info('AI mastering service check passed', ['version' => $version]);

        } catch (\Exception $e) {
            $this->error('Error checking AI mastering service: ' . $e->getMessage());
            Log::error('AI mastering service check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
} 