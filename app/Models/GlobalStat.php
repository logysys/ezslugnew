<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GlobalStat extends Model
{
    use HasFactory;
    
    protected $table = 'global_stats';
    
    protected $fillable = [
        'total_cost_usd',
        'total_tokens',
        'total_requests'
    ];
    
    protected $casts = [
        'total_cost_usd' => 'decimal:8',
        'total_tokens' => 'integer',
        'total_requests' => 'integer'
    ];
    
    public static function updateStats($cost, $tokens)
    {
        $stats = self::first();
        if (!$stats) {
            $stats = self::create([
                'total_cost_usd' => 0,
                'total_tokens' => 0,
                'total_requests' => 0
            ]);
        }
        
        $stats->total_cost_usd += $cost;
        $stats->total_tokens += $tokens;
        $stats->total_requests += 1;
        $stats->save();
        
        return $stats;
    }
}