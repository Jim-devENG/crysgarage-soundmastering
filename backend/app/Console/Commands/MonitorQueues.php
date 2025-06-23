<?php

namespace App\Console\Commands;

use App\Jobs\MonitorQueue;
use Illuminate\Console\Command;

class MonitorQueues extends Command
{
    protected $signature = 'queue:monitor';
    protected $description = 'Monitor queue health and performance';

    public function handle(): void
    {
        $this->info('Starting queue monitoring...');
        
        MonitorQueue::dispatch();
        
        $this->info('Queue monitoring job dispatched.');
    }
} 