<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcessingHistory extends Model
{
    use HasFactory;

    protected $table = 'processing_history';

    protected $fillable = [
        'audio_file_id',
        'preset_id',
        'status',
        'input_parameters',
        'output_parameters',
        'processing_time',
        'error_message',
    ];

    protected $casts = [
        'input_parameters' => 'array',
        'output_parameters' => 'array',
        'processing_time' => 'float',
    ];

    public function audioFile(): BelongsTo
    {
        return $this->belongsTo(AudioFile::class);
    }

    public function preset(): BelongsTo
    {
        return $this->belongsTo(ProcessingPreset::class);
    }
} 