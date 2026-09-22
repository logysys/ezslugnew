<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AISearchHistory;
use App\Models\MessageReaction;
use App\Models\VisitorAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

class MessageReactionController extends Controller
{
    /**
     * Get reactions for a specific message
     */
    public function getReactions($messageId)
    {
        try {
            $message = AISearchHistory::find($messageId);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message not found',
                ], 404);
            }

            // Get user identifiers for checking user's reaction
            $userId = Auth::id();
            $sessionId = Session::getId();
            $ipAddress = request()->ip();

            $reactionData = MessageReaction::getMessageReactions(
                $messageId, 
                $userId, 
                $sessionId, 
                $ipAddress
            );

            // Fetch visit count using VisitorAnalytic model for this message slug
            $visitsCount = VisitorAnalytic::getVisitsCountForSlug($message->slug);
            $reactionData['visits_count'] = $visitsCount;

            return response()->json([
                'success' => true,
                'data' => $reactionData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching reactions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reactions',
            ], 500);
        }
    }

    /**
     * Toggle a reaction (add/remove/update)
     * Supports both authenticated users and visitors (tracked by user_id, session_id, or IP)
     */
    public function toggleReaction(Request $request)
    {
        try {
            $request->validate([
                'message_id' => 'required|integer|exists:ai_search_histories,id',
                'message_slug' => 'required|string',
                'reaction_type' => 'required|string|in:like,love,care,haha,wow,sad,angry',
            ]);

            $messageId = $request->input('message_id');
            $messageSlug = $request->input('message_slug');
            $reactionType = $request->input('reaction_type');

            // Get user identifiers
            $userId = Auth::id();
            $sessionId = Session::getId();
            $ipAddress = $request->ip();

            // Toggle the reaction
            $result = MessageReaction::toggleReaction(
                $messageId,
                $messageSlug,
                $reactionType,
                $userId,
                $sessionId,
                $ipAddress
            );

            // Get updated counts
            $updatedData = MessageReaction::getMessageReactions(
                $messageId,
                $userId,
                $sessionId,
                $ipAddress
            );

            // Fetch visit count using VisitorAnalytic model for this message slug
            $updatedData['visits_count'] = VisitorAnalytic::getVisitsCountForSlug($messageSlug);

            return response()->json([
                'success' => true,
                'message' => 'Reaction ' . $result['action'] . ' successfully',
                'data' => $updatedData,
                'action' => $result['action'],
                'type' => $result['type'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error toggling reaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle reaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get reactions for multiple messages at once
     */
    public function getMultipleReactions(Request $request)
    {
        try {
            $request->validate([
                'message_ids' => 'required|array',
                'message_ids.*' => 'integer|exists:ai_search_histories,id',
            ]);

            $messageIds = $request->input('message_ids');
            $userId = Auth::id();
            $sessionId = Session::getId();
            $ipAddress = $request->ip();

            // Fetch messages to get slugs
            $messages = AISearchHistory::whereIn('id', $messageIds)->get()->keyBy('id');

            $results = [];
            foreach ($messageIds as $messageId) {
                $reactionData = MessageReaction::getMessageReactions(
                    $messageId,
                    $userId,
                    $sessionId,
                    $ipAddress
                );
                
                $message = $messages->get($messageId);
                $reactionData['visits_count'] = $message ? VisitorAnalytic::getVisitsCountForSlug($message->slug) : 0;
                
                $results[$messageId] = $reactionData;
            }

            return response()->json([
                'success' => true,
                'data' => $results,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching multiple reactions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reactions',
            ], 500);
        }
    }
}