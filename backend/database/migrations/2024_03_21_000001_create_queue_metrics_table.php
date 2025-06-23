<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_metrics', function (Blueprint $table) {
            $table->id();
            $table->integer('queue_size');
            $table->integer('failed_jobs');
            $table->float('processing_time');
            $table->bigInteger('memory_usage');
            $table->timestamp('timestamp');
            $table->timestamps();

            $table->index('timestamp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_metrics');
    }
}; 