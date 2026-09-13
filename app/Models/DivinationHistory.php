<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DivinationHistory extends Model
{
    use HasFactory;

    protected $table = 'divination_histories';

    protected $fillable = [
        'character',
        'parts',
        'imagery',
        'fortune',
        'advice',
        'frequency_id',
        'brainwave_id',
        'frequency_reason',
        'input_tokens',
        'output_tokens',
        'cost_usd'
    ];

    protected $casts = [
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost_usd' => 'decimal:8'
    ];
}