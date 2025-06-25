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
            $table->string('automatic_mastered_path')->nullable()->after('mastered_path');
            $table->string('lite_automatic_mastered_path')->nullable()->after('automatic_mastered_path');
            $table->string('advanced_mastered_path')->nullable()->after('lite_automatic_mastered_path');
            $table->json('mastering_metadata')->nullable()->after('metadata');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audio_files', function (Blueprint $table) {
            $table->dropColumn([
                'automatic_mastered_path',
                'lite_automatic_mastered_path', 
                'advanced_mastered_path',
                'mastering_metadata'
            ]);
        });
    }
};
