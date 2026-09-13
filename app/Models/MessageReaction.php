<?php
// app/Models/MessageReaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'message_slug',
        'user_id',
        'session_id',
        'ip_address',
        'reaction_type',
    ];

    protected $casts = [
        'message_id' => 'integer',
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function message()
    {
        return $this->belongsTo(AISearchHistory::class, 'message_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get reactions for a specific message with user's reaction
     */
    public static function getMessageReactions($messageId, $userId = null, $sessionId = null, $ipAddress = null)
    {
        $reactions = self::where('message_id', $messageId)->get();
        
        $breakdown = [
            'like' => 0,
            'love' => 0,
            'care' => 0,
            'haha' => 0,
            'wow' => 0,
            'sad' => 0,
            'angry' => 0,
        ];
        
        $userReaction = null;
        
        foreach ($reactions as $reaction) {
            $breakdown[$reaction->reaction_type] = ($breakdown[$reaction->reaction_type] ?? 0) + 1;
            
            // Check if this reaction belongs to the current user/session
            if ($userId && $reaction->user_id === $userId) {
                $userReaction = $reaction->reaction_type;
            } elseif ($sessionId && $reaction->session_id === $sessionId && !$userId) {
                $userReaction = $reaction->reaction_type;
            } elseif ($ipAddress && $reaction->ip_address === $ipAddress && !$userId && !$sessionId) {
                $userReaction = $reaction->reaction_type;
            }
        }
        
        $total = array_sum($breakdown);
        
        return [
            'total' => $total,
            'breakdown' => $breakdown,
            'user_reaction' => $userReaction,
        ];
    }

    /**
     * Toggle a reaction (add or remove)
     */
    public static function toggleReaction($messageId, $messageSlug, $reactionType, $userId = null, $sessionId = null, $ipAddress = null)
    {
        // Find existing reaction
        $query = self::where('message_id', $messageId);
        
        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId)->whereNull('user_id');
        } elseif ($ipAddress) {
            $query->where('ip_address', $ipAddress)->whereNull('user_id')->whereNull('session_id');
        }
        
        $existing = $query->first();
        
        if ($existing) {
            if ($existing->reaction_type === $reactionType) {
                // Remove reaction (toggle off)
                $existing->delete();
                return ['action' => 'removed', 'type' => $reactionType];
            } else {
                // Update reaction (change type)
                $existing->reaction_type = $reactionType;
                $existing->save();
                return ['action' => 'updated', 'type' => $reactionType, 'old_type' => $existing->getOriginal('reaction_type')];
            }
        }
        
        // Create new reaction
        self::create([
            'message_id' => $messageId,
            'message_slug' => $messageSlug,
            'user_id' => $userId,
            'session_id' => $sessionId,
            'ip_address' => $ipAddress,
            'reaction_type' => $reactionType,
        ]);
        
        return ['action' => 'added', 'type' => $reactionType];
    }
}