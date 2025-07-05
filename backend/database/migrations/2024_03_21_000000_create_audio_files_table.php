<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audio_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('original_filename');
            $table->string('original_path');
            $table->string('mastered_path')->nullable();
            $table->string('mp3_path')->nullable();
            $table->bigInteger('file_size');
            $table->string('mime_type');
            $table->enum('status', ['uploaded', 'processing', 'completed', 'failed'])->default('uploaded');
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->json('processing_settings')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audio_files');
    }
}; 