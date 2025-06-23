<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processing_presets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->json('settings');
            $table->boolean('is_default')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            
            $table->index(['user_id', 'is_default']);
        });
        
        // Add preset_id to audio_files
        Schema::table('audio_files', function (Blueprint $table) {
            $table->foreignId('preset_id')->nullable()->after('user_id')
                  ->constrained('processing_presets')->onDelete('set null');
            $table->index('preset_id');
        });
    }

    public function down(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            $table->dropForeign(['preset_id']);
            $table->dropColumn('preset_id');
        });
        
        Schema::dropIfExists('processing_presets');
    }
}; 