<?php

namespace App\Console\Commands;

use App\Services\EQProcessor;
use Illuminate\Console\Command;

class CleanupEQTempFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'eq:cleanup {--hours=24 : Hours old files to clean up}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up temporary EQ processing files older than specified hours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        
        $this->info("Cleaning up EQ temporary files older than {$hours} hours...");
        
        $eqProcessor = new EQProcessor();
        $cleaned = $eqProcessor->cleanupTempFiles($hours);
        
        if ($cleaned > 0) {
            $this->info("Successfully cleaned up {$cleaned} temporary EQ files.");
        } else {
            $this->info("No temporary EQ files found to clean up.");
        }
        
        // Show current stats
        $stats = $eqProcessor->getProcessingStats();
        $this->table(
            ['Metric', 'Value'],
            [
                ['Remaining temp files', $stats['temp_files_count']],
                ['Total temp size', $stats['temp_files_size_mb'] . ' MB'],
                ['Temp directory', $stats['temp_directory']],
                ['FFmpeg available', $stats['ffmpeg_available'] ? 'Yes' : 'No'],
            ]
        );
        
        return Command::SUCCESS;
    }
}
