<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class AudioFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'preset_id',
        'original_path',
        'mastered_path',
        'automatic_mastered_path',
        'lite_automatic_mastered_path',
        'advanced_mastered_path',
        'mp3_path',
        'status',
        'error_message',
        'original_filename',
        'mime_type',
        'file_size',
        'hash',
        'metadata',
        'mastering_metadata',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'metadata' => 'array',
        'mastering_metadata' => 'array',
        'file_size' => 'integer',
    ];

    protected $appends = [
        'original_url',
        'mastered_url',
        'mp3_url',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function preset(): BelongsTo
    {
        return $this->belongsTo(ProcessingPreset::class);
    }

    public function processingHistory(): HasMany
    {
        return $this->hasMany(ProcessingHistory::class);
    }

    public function getOriginalUrlAttribute(): ?string
    {
        if (!$this->original_path) {
            return null;
        }
        
        // For development, use port 8000
        $baseUrl = config('app.env') === 'local' 
            ? 'http://localhost:8000' 
            : config('app.url');
            
        return $baseUrl . '/storage/' . $this->original_path;
    }

    public function getMasteredUrlAttribute(): ?string
    {
        if (!$this->mastered_path) {
            return null;
        }
        
        // For development, use port 8000
        $baseUrl = config('app.env') === 'local' 
            ? 'http://localhost:8000' 
            : config('app.url');
            
        return $baseUrl . '/storage/' . $this->mastered_path;
    }

    public function getMp3UrlAttribute(): ?string
    {
        if (!$this->mp3_path) {
            return null;
        }
        
        // For development, use port 8000
        $baseUrl = config('app.env') === 'local' 
            ? 'http://localhost:8000' 
            : config('app.url');
            
        return $baseUrl . '/storage/' . $this->mp3_path;
    }
}
