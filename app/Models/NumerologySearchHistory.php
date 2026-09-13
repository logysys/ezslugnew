<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NumerologySearchHistory extends Model
{
    use HasFactory;

    protected $table = 'numerology_searches_histories';

    protected $fillable = [
        'user_number',
        'agent_used',
        'watch_out',
        'expect',
        'extra_nuance',
        'input_tokens',
        'output_tokens',
        'cost_usd'
    ];

    protected $casts = [
        'user_number' => 'integer',
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost_usd' => 'decimal:8'
    ];
}