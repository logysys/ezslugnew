<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SavedPage extends Model
{
    protected $fillable = [
        'title', 'slug', 'layout_mode', 'html',
        'slots', 'settings', 'edit_token', 'creator_ip', 'expires_at',
    ];

    protected $casts = [
        'slots'      => 'array',
        'settings'   => 'array',
        'expires_at' => 'datetime',
    ];

    protected $hidden = ['edit_token', 'creator_ip'];

    public static function generateSlug(): string
    {
        do {
            $slug = Str::lower(Str::random(10));
        } while (static::where('slug', $slug)->exists());

        return $slug;
    }

    public static function generateEditToken(): string
    {
        return hash('sha256', Str::random(40));
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}