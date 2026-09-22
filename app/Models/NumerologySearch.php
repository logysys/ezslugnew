<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NumerologySearch extends Model
{
    use HasFactory;

    protected $table = 'numerology_searches';

    protected $fillable = [
        'user_number',
        'agent_used',
        'watch_out',
        'expect',
        'extra_nuance',
        'input_tokens',
        'output_tokens',
        'cost_usd',
        'ip_address',
        'user_agent'
    ];

    protected $casts = [
        'user_number' => 'integer',
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost_usd' => 'decimal:8',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Optional: Scope for filtering
    public function scopeByAgent($query, $agent)
    {
        return $query->where('agent_used', $agent);
    }

    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }
}