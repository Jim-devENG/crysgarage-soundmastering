<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processing_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audio_file_id')->constrained()->onDelete('cascade');
            $table->foreignId('preset_id')->nullable()->constrained('processing_presets')->onDelete('set null');
            $table->enum('status', ['started', 'completed', 'failed'])->default('started');
            $table->json('input_parameters')->nullable();
            $table->json('output_parameters')->nullable();
            $table->float('processing_time')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->index(['audio_file_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processing_history');
    }
}; 