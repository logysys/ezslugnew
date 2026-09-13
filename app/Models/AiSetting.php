<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiSetting extends Model
{
    use HasFactory;

    protected $table = 'ai_settings';

    protected $fillable = [
        'guest_ai_enabled',
        'guest_char_limit',
        'user_ai_enabled',
        'user_char_limit',
    ];

    protected $casts = [
        'guest_ai_enabled' => 'boolean',
        'user_ai_enabled' => 'boolean',
        'guest_char_limit' => 'integer',
        'user_char_limit' => 'integer',
    ];

    /**
     * Get the singleton instance
     */
    public static function getInstance(): self
    {
        return self::first() ?? self::create([
            'guest_ai_enabled' => true,
            'guest_char_limit' => 300,
            'user_ai_enabled' => true,
            'user_char_limit' => 2000,
        ]);
    }
}