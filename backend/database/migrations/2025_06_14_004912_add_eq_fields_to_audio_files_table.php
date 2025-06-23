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
        Schema::table('audio_files', function (Blueprint $table) {
            $table->boolean('eq_applied')->default(false)->after('metadata');
            $table->string('ai_only_path')->nullable()->after('eq_applied');
            $table->json('eq_settings')->nullable()->after('ai_only_path');
            
            // Add indexes for performance
            $table->index('eq_applied');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            $table->dropIndex(['eq_applied']);
            $table->dropColumn(['eq_applied', 'ai_only_path', 'eq_settings']);
        });
    }
};
