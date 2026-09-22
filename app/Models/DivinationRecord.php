<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DivinationRecord extends Model
{
    use HasFactory;
    
    protected $table = 'divination_records';
    
    protected $fillable = [
        'character',
        'structure',
        'fortune',
        'luck_level',
        'ai_source',
        'cost_data',
        'response_time_ms',
        'is_favorite'
    ];
    
    protected $casts = [
        'cost_data' => 'array',
        'is_favorite' => 'boolean',
        'response_time_ms' => 'integer'
    ];
    
    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }
    
    public function scopeByCharacter($query, $char)
    {
        return $query->where('character', $char);
    }
}