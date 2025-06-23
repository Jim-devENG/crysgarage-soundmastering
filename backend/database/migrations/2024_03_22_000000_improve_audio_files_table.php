<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            // Add new columns
            $table->string('original_filename')->after('user_id');
            $table->string('mime_type')->after('original_filename');
            $table->bigInteger('file_size')->after('mime_type');
            $table->string('hash')->after('file_size')->nullable();
            $table->json('metadata')->after('error_message')->nullable();
            
            // Add indexes
            $table->index('status');
            $table->index('created_at');
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
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['hash']);
            
            // Remove unique constraint
            $table->dropUnique(['hash']);
            
            // Remove columns
            $table->dropColumn([
                'original_filename',
                'mime_type',
                'file_size',
                'hash',
                'metadata'
            ]);
        });
    }
}; 