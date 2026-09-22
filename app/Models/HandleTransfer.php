<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HandleTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recipient_id',
        'token',
        'handle_type', // 'custom' or 'domain'
        'handle_id',
        'handle_name',
        'used',
        'expires_at',
        'transferred_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'transferred_at' => 'datetime',
        'used' => 'boolean'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    // Relationship to get the associated handle (either custom domain or domain)
    public function handle()
    {
        if ($this->handle_type === 'custom') {
            return $this->belongsTo(Customdomain::class, 'handle_id');
        }
        return $this->belongsTo(Domain::class, 'handle_id');
    }

    // Helper method to get the handle URL
    public function getHandleUrlAttribute()
    {
        if ($this->handle_type === 'custom') {
            return "https://{$this->handle->domainselected}/{$this->handle->domain}";
        }
        return "https://{$this->handle->domain}.{$this->handle->domainselected}";
    }
}