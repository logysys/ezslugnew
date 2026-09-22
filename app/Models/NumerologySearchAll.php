<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NumerologySearchAll extends Model
{
    use HasFactory;

    protected $table = 'numerology_searches_all';

    protected $fillable = [
        'user_number',
        'agent_used',
        'language',
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