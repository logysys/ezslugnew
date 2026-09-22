<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomeTooltip extends Model
{
    protected $table = 'hometooltips';
    
    protected $fillable = [
        'key',
        'group',
        'content',
        'fallback',
        'type',
        'metadata',
        'is_active',
        'sort_order'
    ];
    
    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
    
    /**
     * Get active tooltips grouped by key
     */
    public static function getActiveTooltips(): array
    {
        return self::where('is_active', 1)
            ->orderBy('sort_order')
            ->get()
            ->pluck('content', 'key')
            ->toArray();
    }
    
    /**
     * Get tooltips by group
     */
    public static function getTooltipsByGroup(string $group): array
    {
        return self::where('is_active', 1)
            ->where('group', $group)
            ->orderBy('sort_order')
            ->get()
            ->pluck('content', 'key')
            ->toArray();
    }
    
    /**
     * Get tooltips by type
     */
    public static function getTooltipsByType(string $type): array
    {
        return self::where('is_active', 1)
            ->where('type', $type)
            ->orderBy('sort_order')
            ->get()
            ->pluck('content', 'key')
            ->toArray();
    }
}