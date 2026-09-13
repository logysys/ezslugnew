<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrivateAccessLog extends Model
{
    protected $table = 'private_access_logs';
    
    protected $fillable = [
        'conversation_id',
        'email',
        'access_number',
        'ip_address',
        'user_agent',
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AISearchHistory::class, 'conversation_id', 'conversation_id');
    }
    
    public function isValid(): bool
    {
        return true;
    }
    
    public function isUsed(): bool
    {
        return false;
    }
    
    public function scopeValid($query)
    {
        return $query;
    }
    
    public function scopeByConversation($query, string $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }
    
    public function scopeByEmail($query, string $email)
    {
        return $query->where('email', $email);
    }
}