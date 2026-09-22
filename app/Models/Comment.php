<?php
// app/Models/Comment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $table = 'comments';

    protected $fillable = [
        'message_id',
        'message_slug',
        'conversation_id',
        'parent_id',
        'user_id',
        'user_name',
        'user_avatar',
        'user_email',
        'content',
        'format',
        'content_type',
        'media',
        'content_warning',
        'status',
        'ip_address',
        'user_agent',
        'session_id',
        'likes_count',
    ];

    protected $casts = [
        'message_id' => 'integer',
        'parent_id' => 'integer',
        'user_id' => 'integer',
        'media' => 'array',
        'likes_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function message()
    {
        return $this->belongsTo(AISearchHistory::class, 'message_id');
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id')
            ->where('status', 'approved')
            ->orderBy('created_at', 'asc');
    }
}
