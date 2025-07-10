<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            // Add new columns (only the ones that don't exist in the first migration)
            $table->string('hash')->after('file_size')->nullable();
            
            // Add only new indexes (avoid duplicates)
            $table->index(['user_id', 'created_at']);
            $table->index('hash');
            
            // Add unique constraint for hash
            $table->unique('hash');
        });
    }

    public function down(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            // Remove indexes
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['hash']);
            
            // Remove unique constraint
            $table->dropUnique(['hash']);
            
            // Remove columns
            $table->dropColumn([
                'hash'
            ]);
        });
    }
}; 