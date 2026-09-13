<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    /**
     * Get comments for a specific message or conversation
     */
    public function getComments(Request $request)
    {
        $messageId = $request->query('message_id');
        $messageSlug = $request->query('message_slug');
        $conversationId = $request->query('conversation_id');

        if (!$messageId && !$messageSlug && !$conversationId) {
            return response()->json([
                'success' => false,
                'message' => 'message_id, message_slug, or conversation_id is required',
            ], 422);
        }

        try {
            $query = Comment::with(['user:id,name,avatar,email', 'parent.user:id,name,avatar,email', 'replies.user:id,name,avatar,email'])
                ->where('status', '!=', 'deleted');

            if ($conversationId) {
                $convMessageIds = AISearchHistory::where('conversation_id', $conversationId)->pluck('id')->toArray();
                $convMessageSlugs = AISearchHistory::where('conversation_id', $conversationId)->pluck('slug')->toArray();

                $query->where(function ($q) use ($conversationId, $convMessageIds, $convMessageSlugs) {
                    $q->where('conversation_id', $conversationId);
                    if (!empty($convMessageIds)) {
                        $q->orWhereIn('message_id', $convMessageIds);
                    }
                    if (!empty($convMessageSlugs)) {
                        $q->orWhereIn('message_slug', $convMessageSlugs);
                    }
                });
            } elseif ($messageId) {
                // If message belongs to a conversation, also check if conversation_id matches
                $msg = AISearchHistory::find($messageId);
                $query->where(function ($q) use ($messageId, $msg) {
                    $q->where('message_id', $messageId);
                    if ($msg && $msg->slug) {
                        $q->orWhere('message_slug', $msg->slug);
                    }
                });
            } elseif ($messageSlug) {
                $decodedSlug = urldecode($messageSlug);
                $msg = AISearchHistory::where('slug', $decodedSlug)->first();
                $query->where(function ($q) use ($decodedSlug, $msg) {
                    $q->where('message_slug', $decodedSlug);
                    if ($msg) {
                        $q->orWhere('message_id', $msg->id);
                    }
                });
            }

            $comments = $query->orderBy('created_at', 'asc')->get();

            $formatted = $comments->map(function ($comment) {
                $aiReply = $comment->replies ? $comment->replies->firstWhere('content_type', 'ai') : null;
                $parentComment = $comment->parent;

                return [
                    'id' => $comment->id,
                    'message_id' => $comment->message_id,
                    'message_slug' => $comment->message_slug,
                    'conversation_id' => $comment->conversation_id,
                    'parent_id' => $comment->parent_id,
                    'user_id' => $comment->user_id,
                    'user_name' => $comment->user ? ($comment->user->name ?? $comment->user_name) : ($comment->user_name ?: 'Anonymous'),
                    'user_avatar' => $comment->user ? ($comment->user->avatar ?? $comment->user_avatar) : $comment->user_avatar,
                    'content' => $comment->content,
                    'format' => $comment->format ?: 'markdown',
                    'content_type' => $comment->content_type ?: 'comment',
                    'media' => $comment->media ?: [],
                    'content_warning' => $comment->content_warning,
                    'status' => $comment->status,
                    'likes_count' => $comment->likes_count ?: 0,
                    'created_at' => $comment->created_at ? $comment->created_at->toISOString() : null,
                    'created_at_formatted' => $comment->created_at ? $comment->created_at->diffForHumans() : '',
                    'is_owner' => Auth::check() && $comment->user_id === Auth::id(),
                    'ai_reply' => $aiReply ? [
                        'id' => $aiReply->id,
                        'user_name' => $aiReply->user_name ?: 'AI Assistant',
                        'content' => $aiReply->content,
                        'format' => $aiReply->format ?: 'markdown',
                        'content_type' => 'ai',
                        'created_at' => $aiReply->created_at ? $aiReply->created_at->toISOString() : null,
                        'created_at_formatted' => $aiReply->created_at ? $aiReply->created_at->diffForHumans() : '',
                    ] : null,
                    'parent' => $parentComment ? [
                        'id' => $parentComment->id,
                        'user_id' => $parentComment->user_id,
                        'user_name' => $parentComment->user ? ($parentComment->user->name ?? $parentComment->user_name) : ($parentComment->user_name ?: 'Anonymous'),
                        'user_avatar' => $parentComment->user ? ($parentComment->user->avatar ?? $parentComment->user_avatar) : $parentComment->user_avatar,
                        'content' => $parentComment->content,
                        'content_type' => $parentComment->content_type,
                        'created_at' => $parentComment->created_at ? $parentComment->created_at->toISOString() : null,
                        'created_at_formatted' => $parentComment->created_at ? $parentComment->created_at->diffForHumans() : '',
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'total' => $formatted->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a comment in the new comments database table
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required_without:media|nullable|string',
            'message_id' => 'nullable|integer',
            'message_slug' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'parent_id' => 'nullable|integer',
            'format' => 'nullable|string|in:markdown,html',
            'content_type' => 'nullable|string',
            'media' => 'nullable|array',
            'content_warning' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            $content = $request->input('content', '');
            $messageId = $request->input('message_id');
            $messageSlug = $request->input('message_slug');
            $conversationId = $request->input('conversation_id');
            $parentId = $request->input('parent_id');

            // Attempt to resolve message details if partially provided
            if (!$messageId && $messageSlug) {
                $decodedSlug = urldecode($messageSlug);
                $msg = AISearchHistory::where('slug', $decodedSlug)->first();
                if ($msg) {
                    $messageId = $msg->id;
                    if (!$conversationId) {
                        $conversationId = $msg->conversation_id;
                    }
                }
            } elseif ($messageId && !$messageSlug) {
                $msg = AISearchHistory::find($messageId);
                if ($msg) {
                    $messageSlug = $msg->slug;
                    if (!$conversationId) {
                        $conversationId = $msg->conversation_id;
                    }
                }
            }

            $user = Auth::user();
            $userId = Auth::id();
            $userName = $user ? ($user->name ?? $user->email) : ($request->input('author_name') ?: 'Guest');
            $userAvatar = $user ? $user->avatar : null;
            $userEmail = $user ? $user->email : null;

            $comment = Comment::create([
                'message_id' => $messageId,
                'message_slug' => $messageSlug,
                'conversation_id' => $conversationId,
                'parent_id' => $parentId,
                'user_id' => $userId,
                'user_name' => $userName,
                'user_avatar' => $userAvatar,
                'user_email' => $userEmail,
                'content' => $content,
                'format' => $request->input('format', 'markdown'),
                'content_type' => $request->input('content_type', 'comment'),
                'media' => $request->input('media', null),
                'content_warning' => $request->input('content_warning', null),
                'status' => 'approved',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);

            // Calculate total comments for this message
            $totalComments = 0;
            if ($messageId) {
                $totalComments = Comment::where('message_id', $messageId)
                    ->where('status', 'approved')
                    ->count();
            }

            return response()->json([
                'success' => true,
                'message' => 'Comment posted successfully',
                'data' => [
                    'id' => $comment->id,
                    'message_id' => $comment->message_id,
                    'message_slug' => $comment->message_slug,
                    'conversation_id' => $comment->conversation_id,
                    'parent_id' => $comment->parent_id,
                    'user_id' => $comment->user_id,
                    'user_name' => $comment->user_name,
                    'user_avatar' => $comment->user_avatar,
                    'content' => $comment->content,
                    'format' => $comment->format,
                    'content_type' => $comment->content_type,
                    'media' => $comment->media,
                    'content_warning' => $comment->content_warning,
                    'status' => $comment->status,
                    'likes_count' => 0,
                    'created_at' => $comment->created_at->toISOString(),
                    'created_at_formatted' => $comment->created_at->diffForHumans(),
                    'is_owner' => true,
                ],
                'comments_count' => $totalComments,
            ]);
        } catch (\Exception $e) {
            Log::error('Error storing comment in database: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to post comment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a comment
     */
    public function destroy($id)
    {
        try {
            $comment = Comment::findOrFail($id);

            // Allow if user is owner of comment, or owner of the message/conversation, or admin
            $canDelete = false;
            if (Auth::check()) {
                if ($comment->user_id === Auth::id()) {
                    $canDelete = true;
                } else {
                    $isMsgOwner = AISearchHistory::where('id', $comment->message_id)->where('user_id', Auth::id())->exists()
                        || ($comment->conversation_id && AISearchHistory::where('conversation_id', $comment->conversation_id)->where('user_id', Auth::id())->exists());
                    if ($isMsgOwner) {
                        $canDelete = true;
                    }
                }
            }

            if ($canDelete) {
                $comment->update(['status' => 'deleted']);
                // Cascade delete to child comments (e.g. AI replies)
                Comment::where('parent_id', $comment->id)->update(['status' => 'deleted']);
                return response()->json([
                    'success' => true,
                    'message' => 'Comment deleted successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this comment',
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
