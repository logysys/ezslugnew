<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'otp',
        'attempts',
        'is_verified',
        'is_subscribed',
        'expires_at',
        'ez_funnel_id'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_verified' => 'boolean',
        'is_subscribed' => 'boolean'
    ];

    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class, 'ez_funnel_id');
    }
}