<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

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
            'content' => 'required_without_all:media,files,file|nullable|string',
            'message_id' => 'nullable|integer',
            'message_slug' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'parent_id' => 'nullable|integer',
            'format' => 'nullable|string|in:markdown,html',
            'content_type' => 'nullable|string',
            'media' => 'nullable',
            'content_warning' => 'nullable|string|max:255',
            'file' => 'nullable|file|max:102400',
            'files.*' => 'nullable|file|max:102400',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            $content = $request->input('content', '') ?: $request->input('description', '');
            $messageId = $request->input('message_id');
            $messageSlug = $request->input('message_slug');
            $conversationId = $request->input('conversation_id');
            $parentId = $request->input('parent_id');

            // Handle file uploads (same as conversation upload storage)
            $uploadedMediaList = [];
            $filesToProcess = [];
            if ($request->hasFile('files')) {
                $f = $request->file('files');
                $filesToProcess = is_array($f) ? $f : [$f];
            } elseif ($request->hasFile('file')) {
                $filesToProcess = [$request->file('file')];
            }

            if (!empty($filesToProcess)) {
                $destinationPath = public_path('aicontent');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }

                $allowedMimeTypes = [
                    // Images
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
                    // PDF
                    'application/pdf',
                    // Videos
                    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
                    // Audio
                    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm', 'audio/x-wav',
                    // HTML files
                    'text/html',
                    'application/xhtml+xml',
                ];

                foreach ($filesToProcess as $index => $fileItem) {
                    if (!$fileItem || !$fileItem->isValid()) {
                        continue;
                    }

                    $mimeType = $fileItem->getMimeType();
                    $extension = strtolower($fileItem->getClientOriginalExtension());
                    if (empty($extension)) {
                        $extension = $fileItem->guessExtension() ?? 'bin';
                    }

                    $originalName = $fileItem->getClientOriginalName();
                    $fileSize = $fileItem->getSize();

                    // Generate unique filename
                    $imageName = time() . '_' . Str::random(6) . '_' . $index . '.' . $extension;
                    $fileItem->move($destinationPath, $imageName);

                    $imageUrl = 'aicontent/' . $imageName;
                    $accessToken = bin2hex(random_bytes(16));

                    $fileMetadata = [
                        'original_name' => $originalName,
                        'size' => $fileSize,
                        'mime_type' => $mimeType,
                        'extension' => $extension,
                        'path' => $imageUrl,
                        'url' => asset($imageUrl),
                        'access_token' => $accessToken,
                        'uploaded_at' => now()->toISOString(),
                        'storage_disk' => 'local',
                    ];

                    if (strpos($mimeType, 'image/') === 0) {
                        try {
                            $movedPath = $destinationPath . '/' . $imageName;
                            if (file_exists($movedPath)) {
                                list($width, $height) = getimagesize($movedPath);
                                $fileMetadata['width'] = $width;
                                $fileMetadata['height'] = $height;
                            }
                        } catch (\Exception $e) {
                            // Continue gracefully
                        }
                    }

                    if (in_array($mimeType, ['text/html', 'application/xhtml+xml']) || in_array($extension, ['html', 'htm'])) {
                        $fileMetadata['is_html'] = true;
                        $fileMetadata['sanitized'] = false;
                    }

                    $uploadedMediaList[] = $fileMetadata;
                }
            }

            // Merge with any pre-existing media parameter (e.g. JSON or array)
            $existingMedia = $request->input('media', []);
            if (is_string($existingMedia)) {
                $decoded = json_decode($existingMedia, true);
                $existingMedia = is_array($decoded) ? $decoded : ($existingMedia ? [$existingMedia] : []);
            }
            if (!is_array($existingMedia)) {
                $existingMedia = [];
            }
            $finalMedia = array_merge($existingMedia, $uploadedMediaList);

            // If files were uploaded and content is still blank, provide default text
            if (empty($content) && !empty($uploadedMediaList)) {
                $content = $uploadedMediaList[0]['original_name'] ?? 'Uploaded media';
            }

            $contentType = $request->input('content_type');
            if (!$contentType) {
                $contentType = !empty($uploadedMediaList) ? 'upload' : 'comment';
            }

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
                'content_type' => $contentType,
                'media' => !empty($finalMedia) ? $finalMedia : null,
                'content_warning' => $request->input('content_warning', null),
                'status' => 'approved',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);

            // Calculate total comments for this message / conversation
            $totalComments = 0;
            if ($messageId) {
                $totalComments = Comment::where('message_id', $messageId)
                    ->where('status', '!=', 'deleted')
                    ->count();
            } elseif ($conversationId) {
                $totalComments = Comment::where('conversation_id', $conversationId)
                    ->where('status', '!=', 'deleted')
                    ->count();
            } elseif ($messageSlug) {
                $totalComments = Comment::where('message_slug', $messageSlug)
                    ->where('status', '!=', 'deleted')
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
