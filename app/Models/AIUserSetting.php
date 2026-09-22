<?php
// app/Models/AIUserSetting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIUserSetting extends Model
{
    protected $table = 'ai_user_settings';
    
    protected $fillable = [
        'user_id',
        'guest_ai_enabled',
    ];
    
    protected $casts = [
        'guest_ai_enabled' => 'boolean',
    ];
    
    /**
     * Get the user that owns the settings.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the default settings for a user.
     */
    public static function getDefaultSettings()
    {
        return [
            'guest_ai_enabled' => true, // Default to allowing guests
        ];
    }
    
    /**
     * Get settings for a specific user, or create default if none exist.
     */
    public static function getForUser($userId)
    {
        $settings = self::where('user_id', $userId)->first();
        
        if (!$settings) {
            $settings = self::create(array_merge(
                ['user_id' => $userId],
                self::getDefaultSettings()
            ));
        }
        
        return $settings;
    }
    
    /**
     * Check if guests are allowed to interact with conversations owned by this user.
     */
    public function areGuestsAllowed(): bool
    {
        return $this->guest_ai_enabled;
    }
}