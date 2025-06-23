<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProcessingPreset extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'settings',
        'is_default',
        'user_id',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function audioFiles(): HasMany
    {
        return $this->hasMany(AudioFile::class, 'preset_id');
    }

    public function processingHistory(): HasMany
    {
        return $this->hasMany(ProcessingHistory::class, 'preset_id');
    }
} 