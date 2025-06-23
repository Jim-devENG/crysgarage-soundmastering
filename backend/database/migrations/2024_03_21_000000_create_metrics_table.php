<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metrics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->float('value');
            $table->timestamp('timestamp');
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index(['name', 'timestamp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metrics');
    }
}; 