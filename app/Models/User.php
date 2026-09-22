<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'linkedin_id',
        'linkedin_access_token',
        'provider_id',
        'reddit_token',
        'reddit_refresh_token',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    
    public function ezFunnels()
    {
        return $this->hasMany(EzFunnel::class);
    }
    
    public function magicLinks()
    {
        return $this->hasMany(MagicLink::class);
    }

    public function createMagicLink($redirectUrl = null)
    {
        return $this->magicLinks()->create([
            'token' => \Illuminate\Support\Str::random(64),
            'expires_at' => now()->addMinutes(config('auth.magic_link.expire', 60)),
            'redirect_url' => $redirectUrl ?? route('marketplace'), // Default to marketplace
        ]);
    }
    
    public function sendMagicLinkNotification($url)
    {
        $this->notify(new \App\Notifications\MagicLinkNotification($url));
    }
    
    public function tokenTransactions()
    {
        return $this->hasMany(TokenTransaction::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function balance()
    {
        return $this->hasOne(UserBalance::class);
    }

    public function aiSetting()
    {
        return $this->hasOne(AIUserSetting::class);
    }
}