<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\AITooltip;
use App\Models\EzFunnel;
use App\Models\Template;
use App\Models\PrivateAccessLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use App\Models\Admindomain;
use App\Models\TokenInfo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AIHistoryController extends Controller
{
    /**
     * Display a listing of conversations.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = Auth::user();
        
        $firstRecordIdsQuery = AISearchHistory::select(DB::raw('MIN(id) as id'))
            ->groupBy('conversation_id');
            
        if ($user) {
            $firstRecordIdsQuery->where('user_id', $user->id);
        } else {
            $firstRecordIdsQuery->where('session_id', Session::getId());
        }
        
        $query = AISearchHistory::whereIn('id', $firstRecordIdsQuery)
                ->with(['ezFunnel' => function($query) { 
                    $query->with([
                        'fields' => function($q) { 
                            $q->orderBy('position', 'asc')
                              ->with(['user' => function($uq) {
                                  $uq->select('id', 'email', 'name');
                              }]);
                        }, 
                        'customDomains',
                        'handleDomains'
                    ]);
                }])
                ->orderBy('created_at', 'desc');
        
        $conversations = $query->paginate(20);
        
        Log::info('AIHistory index - Total conversations: ' . $conversations->total());
        
        $tooltips = AITooltip::where('component', 'AIHistory')
            ->orWhere('component', 'AI History')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                return is_array($tooltip) ? $tooltip[0] : (is_string($tooltip) ? json_decode($tooltip, true)[0] ?? $tooltip : $tooltip);
            })
            ->toArray();
        
        $conversations->getCollection()->transform(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
            
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)->get();
            $conversationTokens = 0;
            
            foreach ($conversationMessages as $message) {
                if ($message->usage) {
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $conversationTokens += $usage['total_tokens'] ?? 0;
                } else {
                    $conversationTokens += $message->total_tokens ?? 0;
                }
            }
            
            Log::info('Conversation tokens calculation:', [
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title,
                'tokens' => $conversationTokens,
                'query' => substr($conversation->query, 0, 50)
            ]);
            
            $conversationCost = $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
            $conversationCost = round($conversationCost, 4);
            
            Log::info('Conversation cost calculation:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'cost' => $conversationCost
            ]);
            
            // Get hashtag as array or string (support legacy format)
            $hashtag = $conversation->hashtag;
            if (is_string($hashtag)) {
                // Legacy format - split by comma or space
                $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                if (empty($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(' ', $conversation->hashtag)));
                }
                $hashtag = array_values(array_unique($hashtag));
            } elseif (is_null($hashtag)) {
                $hashtag = [];
            }

            // Get social_media_metadata from the first message of the conversation
            $firstMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'asc')
                ->first();
            
            $socialMediaMetadata = $firstMessage ? $firstMessage->social_media_metadata : null;
            if (is_string($socialMediaMetadata)) {
                try {
                    $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                } catch (\Exception $e) {
                    $socialMediaMetadata = null;
                }
            }
            
            return [
                'id' => $conversation->id,
                'parent_id' => $conversation->parent_id,
                'slug' => $conversation->slug,
                'hashtag' => $hashtag,
                'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
                'hashtag_csv' => implode(',', $hashtag),
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                'query' => $conversation->query,
                'response_preview' => $this->getResponsePreview($conversation),
                'created_at' => $conversation->created_at->toISOString(),
                'created_at_formatted' => $conversation->created_at->format('M d, Y \a\t h:i A'),
                'updated_at' => $lastMessage ? $lastMessage->created_at->toISOString() : $conversation->created_at->toISOString(),
                'updated_at_formatted' => $lastMessage ? $lastMessage->created_at->format('M d, Y \a\t h:i A') : $conversation->created_at->format('M d, Y \a\t h:i A'),
                'share_url' => $conversation->getConversationUrl(),
                'message_count' => $messageCount,
                'total_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'thinking_enabled' => $conversation->thinking_enabled,
                'model' => $conversation->model,
                'temperature' => $conversation->temperature,
                'language' => $this->detectLanguage($conversation->query),
                'user_email' => $conversation->user ? $conversation->user->email : null,
                'user_id' => $conversation->user_id,
                'status' => $conversation->status ?? 'public',
                'pinned' => $conversation->pinned ?? false,
                'private_views_count' => $conversation->private_views_count ?? 0,
                'landing_page_url' => $conversation->landing_page_url ?? null,
                'ezFunnelToken' => $conversation->ezFunnel ? $conversation->ezFunnel->token : null,
                'ezFunnelId' => $conversation->ezFunnel ? $conversation->ezFunnel->id : null,
                'customDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->customDomains : [],
                'handleDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->handleDomains : [],
                'social_media_metadata' => $socialMediaMetadata,
            ];
        });
        
        $dayOfWeek = strtolower(Carbon::now()->format('D'));
        $domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['domain']);
        
        $tokenInfo = TokenInfo::first();
        $promoprice = 0;
        
        return Inertia::render('AIHistory', [
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
            'tooltips' => $tooltips,
            'conversations' => $conversations,
            'totalConversations' => $conversations->total(),
            'currentPage' => $conversations->currentPage(),
            'lastPage' => $conversations->lastPage(),
            'perPage' => $conversations->perPage(),
            'auth' => [
                'user' => $user
            ],
        ]);
    }
    
    /**
     * Load more conversations for pagination.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function loadMore(Request $request)
    {
        $request->validate([
            'page' => 'required|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);
        
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);
        $user = Auth::user();
        
        Log::info('loadMore called', ['page' => $page, 'perPage' => $perPage, 'user' => $user ? $user->id : 'guest']);
        
        $firstRecordIdsQuery = AISearchHistory::select(DB::raw('MIN(id) as id'))
            ->groupBy('conversation_id');
            
        if ($user) {
            $firstRecordIdsQuery->where('user_id', $user->id);
        } else {
            $firstRecordIdsQuery->where('session_id', Session::getId());
        }
        
        $query = AISearchHistory::whereIn('id', $firstRecordIdsQuery)
            ->with(['ezFunnel' => function($query) { 
                $query->with([
                    'fields' => function($q) { 
                        $q->orderBy('position', 'asc')
                          ->with(['user' => function($uq) {
                              $uq->select('id', 'email', 'name');
                          }]);
                    }, 
                    'customDomains',
                    'handleDomains'
                ]);
            }])
            ->orderBy('created_at', 'desc');
        
        $conversations = $query->paginate($perPage, ['*'], 'page', $page);
        
        Log::info('loadMore - conversations found', ['count' => $conversations->count()]);
        
        $transformedConversations = $conversations->getCollection()->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)->get();
            $conversationTokens = 0;
            
            foreach ($conversationMessages as $message) {
                if ($message->usage) {
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $conversationTokens += $usage['total_tokens'] ?? 0;
                } else {
                    $conversationTokens += $message->total_tokens ?? 0;
                }
            }
            
            Log::info('Load more - Conversation tokens:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'query' => substr($conversation->query, 0, 50)
            ]);
            
            $conversationCost = $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
            $conversationCost = round($conversationCost, 4);
            
            Log::info('Load more - Cost calculated:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'cost' => $conversationCost
            ]);
            
            // Get hashtag as array or string (support legacy format)
            $hashtag = $conversation->hashtag;
            if (is_string($hashtag)) {
                // Legacy format - split by comma or space
                $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                if (empty($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(' ', $conversation->hashtag)));
                }
                $hashtag = array_values(array_unique($hashtag));
            } elseif (is_null($hashtag)) {
                $hashtag = [];
            }

            // Get social_media_metadata from the first message of the conversation
            $firstMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'asc')
                ->first();
            
            $socialMediaMetadata = $firstMessage ? $firstMessage->social_media_metadata : null;
            if (is_string($socialMediaMetadata)) {
                try {
                    $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                } catch (\Exception $e) {
                    $socialMediaMetadata = null;
                }
            }
            
            return [
                'id' => $conversation->id,
                'parent_id' => $conversation->parent_id,
                'slug' => $conversation->slug,
                'hashtag' => $hashtag,
                'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
                'hashtag_csv' => implode(',', $hashtag),
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                'query' => $conversation->query,
                'response_preview' => $this->getResponsePreview($conversation),
                'created_at' => $conversation->created_at->toISOString(),
                'created_at_formatted' => $conversation->created_at->format('M d, Y \a\t h:i A'),
                'updated_at_formatted' => $lastMessage ? $lastMessage->created_at->format('M d, Y \a\t h:i A') : $conversation->created_at->format('M d, Y \a\t h:i A'),
                'share_url' => $conversation->getConversationUrl(),
                'message_count' => $messageCount,
                'total_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'thinking_enabled' => $conversation->thinking_enabled,
                'model' => $conversation->model,
                'temperature' => $conversation->temperature,
                'language' => $this->detectLanguage($conversation->query),
                'user_email' => $conversation->user ? $conversation->user->email : null,
                'user_id' => $conversation->user_id,
                'status' => $conversation->status ?? 'public',
                'pinned' => $conversation->pinned ?? false,
                'private_views_count' => $conversation->private_views_count ?? 0,
                'landing_page_url' => $conversation->landing_page_url ?? null,
                'ezFunnelToken' => $conversation->ezFunnel ? $conversation->ezFunnel->token : null,
                'ezFunnelId' => $conversation->ezFunnel ? $conversation->ezFunnel->id : null,
                'customDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->customDomains : [],
                'handleDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->handleDomains : [],
                'social_media_metadata' => $socialMediaMetadata,
            ];
        });
        
        Log::info('loadMore - Sending response', [
            'data_count' => $transformedConversations->count(),
            'sample_cost' => $transformedConversations->first() ? $transformedConversations->first()['conversation_cost'] : null
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $transformedConversations->values()->toArray(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'total' => $conversations->total(),
                'per_page' => $conversations->perPage(),
            ],
        ]);
    }
    
    /**
     * Display a specific conversation.
     *
     * @param string $slug
     * @return \Inertia\Response
     */
    public function show($slug)
    {
        $conversation = AISearchHistory::where('slug', $slug)->firstOrFail();
        
        $messages = AISearchHistory::where('conversation_id', $conversation->conversation_id)
            ->orderBy('position', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
        
        $transformedMessages = $messages->map(function ($message) {
            // Get hashtag as array or string (support legacy format)
            $hashtag = $message->hashtag;
            if (is_string($hashtag)) {
                $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                if (empty($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(' ', $message->hashtag)));
                }
                $hashtag = array_values(array_unique($hashtag));
            } elseif (is_null($hashtag)) {
                $hashtag = [];
            }

            // Get social_media_metadata and decode if needed
            $socialMediaMetadata = $message->social_media_metadata;
            if (is_string($socialMediaMetadata)) {
                try {
                    $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                } catch (\Exception $e) {
                    $socialMediaMetadata = null;
                }
            }
            
            return [
                'id' => $message->id,
                'slug' => $message->slug,
                'hashtag' => $hashtag,
                'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
                'conversation_id' => $message->conversation_id,
                'message_role' => $message->message_role,
                'content_type' => $message->content_type,
                'query' => $message->query,
                'response' => $message->response,
                'file_data' => $message->file_data,
                'parent_id' => $message->parent_id,
                'position' => $message->position,
                'created_at' => $message->created_at->toISOString(),
                'created_at_formatted' => $message->created_at->format('M d, Y \a\t h:i A'),
                'thinking_enabled' => $message->thinking_enabled,
                'model' => $message->model,
                'temperature' => $message->temperature,
                'max_tokens' => $message->max_tokens,
                'total_tokens' => $message->total_tokens,
                'usage' => $message->usage,
                'finish_reason' => $message->finish_reason,
                'sources' => $message->sources,
                'status' => $message->status ?? 'public',
                'share_url' => $message->getShareableUrl(),
                'conversation_url' => $message->getConversationUrl(),
                'user_id' => $message->user_id,
                'session_id' => $message->session_id,
                'social_media_metadata' => $socialMediaMetadata, // FIXED: Added this line
            ];
        });
        
        $firstMessage = $messages->first();
        $lastMessage = $messages->last();
        
        // Get hashtags from first message
        $hashtag = $firstMessage ? $firstMessage->hashtag : [];
        if (is_string($hashtag)) {
            $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
            if (empty($hashtag)) {
                $hashtag = array_filter(array_map('trim', explode(' ', $firstMessage->hashtag ?? '')));
            }
            $hashtag = array_values(array_unique($hashtag));
        } elseif (is_null($hashtag)) {
            $hashtag = [];
        }
        
        $summary = [
            'id' => $conversation->conversation_id,
            'title' => $firstMessage->conversation_title ?? 'Untitled Conversation',
            'message_count' => $messages->count(),
            'total_tokens' => $messages->sum('total_tokens'),
            'created_at' => $firstMessage->created_at->toISOString(),
            'updated_at' => $lastMessage->created_at->toISOString(),
            'status' => $firstMessage->status ?? 'public',
            'hashtag' => $hashtag,
            'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
            'user' => $firstMessage->user ? [
                'id' => $firstMessage->user->id,
                'name' => $firstMessage->user->name,
                'email' => $firstMessage->user->email,
            ] : null,
        ];
        
        return Inertia::render('AIConversation', [
            'conversation' => $summary,
            'messages' => $transformedMessages,
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    }
    
    /**
     * Get conversation messages via API.
     *
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getConversation($conversationId)
    {
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->orderBy('position', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
        
        if ($messages->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }
        
        $firstMessage = $messages->first();
        
        $conversationTokens = $messages->sum('total_tokens');
        $conversationCost = ($conversationTokens / 1000) * 0.01;
        
        // Get hashtags from first message
        $hashtag = $firstMessage->hashtag;
        if (is_string($hashtag)) {
            $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
            if (empty($hashtag)) {
                $hashtag = array_filter(array_map('trim', explode(' ', $firstMessage->hashtag ?? '')));
            }
            $hashtag = array_values(array_unique($hashtag));
        } elseif (is_null($hashtag)) {
            $hashtag = [];
        }
        
        return response()->json([
            'success' => true,
            'conversation_id' => $conversationId,
            'conversation_title' => $firstMessage->conversation_title,
            'created_at' => $firstMessage->created_at->toISOString(),
            'message_count' => $messages->count(),
            'conversation_tokens' => $conversationTokens,
            'conversation_cost' => $conversationCost,
            'hashtag' => $hashtag,
            'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
            'messages' => $messages->map(function ($message) {
                // Get hashtag as array or string (support legacy format)
                $hashtag = $message->hashtag;
                if (is_string($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                    if (empty($hashtag)) {
                        $hashtag = array_filter(array_map('trim', explode(' ', $message->hashtag)));
                    }
                    $hashtag = array_values(array_unique($hashtag));
                } elseif (is_null($hashtag)) {
                    $hashtag = [];
                }

                // Get social_media_metadata and decode if needed
                $socialMediaMetadata = $message->social_media_metadata;
                if (is_string($socialMediaMetadata)) {
                    try {
                        $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                    } catch (\Exception $e) {
                        $socialMediaMetadata = null;
                    }
                }
                
                return [
                    'id' => $message->id,
                    'slug' => $message->slug,
                    'hashtag' => $hashtag,
                    'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(fn($tag) => '#' . $tag, $hashtag)) : '',
                    'conversation_id' => $message->conversation_id,
                    'message_role' => $message->message_role,
                    'content_type' => $message->content_type,
                    'parent_id' => $message->parent_id,
                    'position' => $message->position,
                    'query' => $message->query,
                    'response' => $message->response,
                    'file_data' => $message->file_data,
                    'created_at' => $message->created_at->toISOString(),
                    'formatted_created_at' => $message->formatted_created_at,
                    'thinking_enabled' => $message->thinking_enabled,
                    'model' => $message->model,
                    'temperature' => $message->temperature,
                    'max_tokens' => $message->max_tokens,
                    'total_tokens' => $message->total_tokens,
                    'usage' => $message->usage,
                    'finish_reason' => $message->finish_reason,
                    'sources' => $message->sources,
                    'status' => $message->status ?? 'public',
                    'share_url' => $message->getShareableUrl(),
                    'ip_address' => $message->ip_address,
                    'user_id' => $message->user_id,
                    'session_id' => $message->session_id,
                    'social_media_metadata' => $socialMediaMetadata, // FIXED: Added this line
                ];
            }),
        ]);
    }
    
    /**
     * Delete a conversation.
     *
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($conversationId)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
       
        // Get all messages in the conversation ordered by depth (children first)
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->orderBy('parent_id', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        
        if ($messages->isEmpty()) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        $rootMessage = $messages->whereNull('parent_id')->first() ?? $messages->last();
        
        // Check ownership (parent slug owner or message owner)
        if (!$rootMessage->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Delete files for upload messages first
        foreach ($messages as $message) {
            if ($message->isUpload() && $message->file_data && isset($message->file_data['path'])) {
                try {
                    $filePath = public_path($message->file_data['path']);
                    if (file_exists($filePath)) {
                        unlink($filePath);
                        Log::info('File deleted for upload message during conversation deletion', [
                            'message_id' => $message->id,
                            'file_path' => $filePath
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to delete file for upload message during conversation deletion', [
                        'message_id' => $message->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
        
        // Delete all messages
        $deletedCount = 0;
        foreach ($messages as $message) {
			$funnel = EzFunnel::where('aiid', $message->id)
			->where('user_id', auth()->id())
			->firstOrFail();
			$funnel->fields()->delete();
			$funnel->effectSettings()->delete();
			$funnel->seoSettings()->delete();
			$funnel->logoSettings()->delete();

			// Then delete the funnel
			$funnel->delete();
            $message->delete();
            $deletedCount++;
        }
		
        Log::info('Conversation deleted', [
            'conversation_id' => $conversationId,
            'deleted_count' => $deletedCount,
            'user_id' => $user ? $user->id : null,
            'session_id' => $sessionId
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
            'deleted_count' => $deletedCount
        ]);
    }
    
    /**
     * Update conversation status.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $conversationId)
    {
        $request->validate([
            'status' => 'required|in:public,private'
        ]);
        
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        AISearchHistory::where('conversation_id', $conversationId)
            ->update(['status' => $request->status]);
        
        Log::info('Conversation status updated', [
            'conversation_id' => $conversationId,
            'status' => $request->status,
            'user_id' => $user ? $user->id : null,
            'session_id' => $sessionId
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Conversation status updated successfully',
            'status' => $request->status
        ]);
    }
    
    /**
     * Update conversation slug.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSlug(Request $request, $conversationId)
    {
        $request->validate([
            'slug' => 'required|string',
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $cleanSlug = str_replace(' ', '-', $request->slug);
        
        $existingSlug = AISearchHistory::where('slug', $cleanSlug)
            ->where('conversation_id', '!=', $conversationId)
            ->exists();
        
        if ($existingSlug) {
            return response()->json([
                'error' => 'Slug already taken',
                'message' => 'This slug is already in use by another conversation. Please choose another one.'
            ], 422);
        }
        
        $oldSlug = $conversation->slug;
        $templates = Template::where('image', 'LIKE', '%/X/' . $oldSlug)->get();
        foreach ($templates as $template) {
            // Replace the old slug with new slug in the image path
            $newImagePath = str_replace('/X/' . $oldSlug, '/X/' . $cleanSlug, $template->image);
            
            $template->update([
                'image' => $newImagePath
            ]);
        }
        
        try {
            DB::beginTransaction();
            
            $messages = AISearchHistory::where('conversation_id', $conversationId)
                ->orderBy('id', 'asc')
                ->get();
            
            $counter = 0;
            foreach ($messages as $message) {
                if ($counter === 0) {
                    $message->slug = $cleanSlug;
                } else {
                    $message->slug = $cleanSlug . '-' . $counter;
                }
                $message->save();
                $counter++;
            }
            
            DB::commit();
            
            Log::info('Conversation slug updated', [
                'conversation_id' => $conversationId,
                'old_slug' => $oldSlug,
                'new_slug' => $cleanSlug,
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId,
                'messages_updated' => $counter
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Slug updated successfully',
                'slug' => $cleanSlug,
                'share_url' => url('/X/' . $cleanSlug),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update conversation slug', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to update slug',
                'message' => 'An error occurred while updating the slug.'
            ], 500);
        }
    }
    
    /**
     * Update conversation hashtags.
     * Supports emoji and multilingual hashtags.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateHashtag(Request $request, $conversationId)
    {
        $request->validate([
            'hashtag' => 'nullable|string|max:255',
            'hashtags' => 'nullable|array',
            'hashtags.*' => 'string|max:50',
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        try {
            DB::beginTransaction();
            
            $hashtags = [];
            
            // Support both single hashtag (legacy) and array of hashtags
            if ($request->has('hashtags') && is_array($request->hashtags)) {
                // Don't clean/filter - keep as-is
                // Use array_filter with a proper callback to remove empty values
                $hashtags = array_values(array_filter($request->hashtags, function($tag) {
                    return !empty(trim($tag));
                }));
            } elseif ($request->has('hashtag') && $request->hashtag !== null && $request->hashtag !== '') {
                // Legacy single hashtag - could be comma or space separated
                $rawTags = $request->hashtag;
                // Split by comma first, then by space
                $tagParts = array_filter(array_map('trim', explode(',', $rawTags)));
                if (empty($tagParts)) {
                    $tagParts = array_filter(array_map('trim', explode(' ', $rawTags)));
                }
                foreach ($tagParts as $tag) {
                    $cleaned = $this->cleanHashtag($tag);
                    if ($cleaned) {
                        $hashtags[] = $cleaned;
                    }
                }
            }
            
            // Remove empty values and duplicates (case-insensitive for Latin, but preserve Unicode)
            $uniqueHashtags = [];
            $seen = [];
            foreach ($hashtags as $tag) {
                // For case-insensitive comparison of Latin characters, but preserve Unicode
                $key = mb_strtolower($tag);
                if (!isset($seen[$key])) {
                    $seen[$key] = true;
                    $uniqueHashtags[] = $tag;
                }
            }
            
            // Update as JSON array
            AISearchHistory::where('conversation_id', $conversationId)
                ->update(['hashtag' => json_encode($uniqueHashtags)]);
            
            DB::commit();
            
            Log::info('Conversation hashtags updated', [
                'conversation_id' => $conversationId,
                'hashtags' => $uniqueHashtags,
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Hashtags updated successfully',
                'hashtags' => $uniqueHashtags,
                'hashtag_display' => !empty($uniqueHashtags) ? implode(' ', array_map(function($tag) {
                    return '#' . $tag;
                }, $uniqueHashtags)) : '',
                'hashtag_csv' => implode(',', $uniqueHashtags),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update conversation hashtags', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to update hashtags',
                'message' => 'An error occurred while updating the hashtags.'
            ], 500);
        }
    }
    
    /**
     * Clean a hashtag - remove # only if at start, preserve all other characters
     * including emojis and multilingual characters.
     *
     * @param string $tag
     * @return string
     */
    private function cleanHashtag($tag): string
    {
        $tag = trim($tag);
        
        // Remove only if the first character is # (don't remove if # appears elsewhere)
        if (mb_substr($tag, 0, 1) === '#') {
            $tag = mb_substr($tag, 1);
        }
        
        $tag = trim($tag);
        
        // Remove control characters only - preserve emojis and all valid Unicode
        $tag = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $tag);
        
        // Return as-is, preserving all valid characters including emojis and multilingual
        return $tag;
    }
    
    /**
     * Update message status.
     *
     * @param Request $request
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMessageStatus(Request $request, $slug)
    {
        $request->validate([
            'status' => 'required|in:public,hidden'
        ]);
        
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $message = AISearchHistory::where('slug', urldecode($slug))->first()
            ?? AISearchHistory::where('id', $slug)->first();
        
        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }
        
        if (!$message->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $message->status = $request->status;
        $message->save();
        
        Log::info('Message status updated', [
            'message_id' => $message->id,
            'slug' => $slug,
            'status' => $request->status,
            'user_id' => $user ? $user->id : null,
            'session_id' => $sessionId
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Message status updated successfully',
            'status' => $request->status
        ]);
    }
    
    /**
     * Delete a single message.
     *
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteMessage($slug)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $message = AISearchHistory::where('id', $slug)->first()
            ?? AISearchHistory::where('slug', urldecode($slug))->first();
        
        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }
        
        // Check ownership (either message owner OR parent slug owner)
        if (!$message->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if this is the root message of the conversation
        $rootMessage = $message->getRootMessage();
        $isRootMessage = $rootMessage && $rootMessage->id === $message->id;

        if ($isRootMessage) {
            // Check if there are any other messages in this conversation
            $otherCount = AISearchHistory::where('conversation_id', $message->conversation_id)
                ->where('id', '!=', $message->id)
                ->count();
            
            if ($otherCount > 0) {
                return response()->json([
                    'error' => 'Cannot delete parent message',
                    'message' => 'This message has ' . $otherCount . ' other message(s). Please delete all other messages first before deleting this root message, or delete the entire conversation.',
                    'child_count' => $otherCount
                ], 400);
            }
        }

        // If it's an upload message with file_data, delete the physical file
        if ($message->isUpload() && $message->file_data && isset($message->file_data['path'])) {
            try {
                $filePath = public_path($message->file_data['path']);
                if (file_exists($filePath)) {
                    unlink($filePath);
                    Log::info('File deleted for upload message', [
                        'message_id' => $message->id,
                        'file_path' => $filePath
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to delete file for upload message', [
                    'message_id' => $message->id,
                    'error' => $e->getMessage()
                ]);
                // Continue with message deletion even if file deletion fails
            }
        }
        
        // Actually delete the message from database
        $message->delete();
        
        Log::info('Message deleted', [
            'message_id' => $message->id,
            'slug' => $message->slug,
            'is_parent' => $message->parent_id === null,
            'user_id' => $user ? $user->id : null,
            'session_id' => $sessionId
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully'
        ]);
    }
    
    /**
     * Toggle pin status for a conversation.
     *
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function togglePin($conversationId)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $newPinStatus = !$conversation->pinned;
        $conversation->pinned = $newPinStatus;
        $conversation->save();
        
        AISearchHistory::where('conversation_id', $conversationId)
            ->update(['pinned' => $newPinStatus]);
        
        Log::info('Conversation pin status toggled', [
            'conversation_id' => $conversationId,
            'pinned' => $newPinStatus,
            'user_id' => $user ? $user->id : null,
            'session_id' => $sessionId
        ]);
        
        return response()->json([
            'success' => true,
            'pinned' => $newPinStatus,
            'message' => $newPinStatus ? 'Conversation pinned' : 'Conversation unpinned'
        ]);
    }
    
    /**
     * Get pinned conversations.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPinnedConversations()
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $firstRecordIdsQuery = AISearchHistory::select(DB::raw('MIN(id) as id'))
            ->groupBy('conversation_id');
            
        if ($user) {
            $firstRecordIdsQuery->where('user_id', $user->id);
        } else {
            $firstRecordIdsQuery->where('session_id', $sessionId);
        }

        $query = AISearchHistory::whereIn('id', $firstRecordIdsQuery)
            ->where('pinned', true)
            ->orderBy('updated_at', 'desc');
        
        $pinnedConversations = $query->get();
        
        $transformed = $pinnedConversations->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)->get();
            $conversationTokens = 0;
            
            foreach ($conversationMessages as $message) {
                if ($message->usage) {
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $conversationTokens += $usage['total_tokens'] ?? 0;
                } else {
                    $conversationTokens += $message->total_tokens ?? 0;
                }
            }
            
            $conversationCost = $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
            $conversationCost = round($conversationCost, 4);
            
            // Get hashtag as array or string (support legacy format)
            $hashtag = $conversation->hashtag;
            if (is_string($hashtag)) {
                $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                if (empty($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(' ', $conversation->hashtag)));
                }
                $hashtag = array_values(array_unique($hashtag));
            } elseif (is_null($hashtag)) {
                $hashtag = [];
            }

            // Get social_media_metadata from the first message of the conversation
            $firstMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'asc')
                ->first();
            
            $socialMediaMetadata = $firstMessage ? $firstMessage->social_media_metadata : null;
            if (is_string($socialMediaMetadata)) {
                try {
                    $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                } catch (\Exception $e) {
                    $socialMediaMetadata = null;
                }
            }
            
            return [
                'id' => $conversation->id,
                'slug' => $conversation->slug,
                'hashtag' => $hashtag,
                'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(function($tag) {
                    return '#' . $tag;
                }, $hashtag)) : '',
                'hashtag_csv' => implode(',', $hashtag),
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                'query' => $conversation->query,
                'response_preview' => $this->getResponsePreview($conversation),
                'created_at' => $conversation->created_at->toISOString(),
                'created_at_formatted' => $conversation->created_at->format('M d, Y \a\t h:i A'),
                'updated_at_formatted' => $lastMessage ? $lastMessage->created_at->format('M d, Y \a\t h:i A') : $conversation->created_at->format('M d, Y \a\t h:i A'),
                'share_url' => $conversation->getConversationUrl(),
                'message_count' => $messageCount,
                'total_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'thinking_enabled' => $conversation->thinking_enabled,
                'model' => $conversation->model,
                'temperature' => $conversation->temperature,
                'language' => $this->detectLanguage($conversation->query),
                'user_email' => $conversation->user ? $conversation->user->email : null,
                'user_id' => $conversation->user_id,
                'status' => $conversation->status ?? 'public',
                'pinned' => $conversation->pinned ?? false,
                'private_views_count' => $conversation->private_views_count ?? 0,
                'landing_page_url' => $conversation->landing_page_url ?? null,
                'social_media_metadata' => $socialMediaMetadata,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $transformed
        ]);
    }
    
    /**
     * Get AI search history via API.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAISearchHistory(Request $request)
    {
        $user = Auth::user();
        
        $firstRecordIdsQuery = AISearchHistory::select(DB::raw('MIN(id) as id'))
            ->groupBy('conversation_id');

        if (!$user) {
            $sessionId = Session::getId();
            $firstRecordIdsQuery->where('session_id', $sessionId);
        } else {
            $firstRecordIdsQuery->where('user_id', $user->id);
        }

        $conversations = AISearchHistory::whereIn('id', $firstRecordIdsQuery)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $conversations->map(function ($conversation) {
                $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
                
                $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                $conversationTokens = AISearchHistory::where('conversation_id', $conversation->conversation_id)->sum('total_tokens');
                $conversationCost = ($conversationTokens / 1000) * 0.01;
                
                // Get hashtag as array or string (support legacy format)
                $hashtag = $conversation->hashtag;
                if (is_string($hashtag)) {
                    $hashtag = array_filter(array_map('trim', explode(',', $hashtag)));
                    if (empty($hashtag)) {
                        $hashtag = array_filter(array_map('trim', explode(' ', $conversation->hashtag)));
                    }
                    $hashtag = array_values(array_unique($hashtag));
                } elseif (is_null($hashtag)) {
                    $hashtag = [];
                }

                // Get social_media_metadata from the first message of the conversation
                $firstMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->orderBy('created_at', 'asc')
                    ->first();
                
                $socialMediaMetadata = $firstMessage ? $firstMessage->social_media_metadata : null;
                if (is_string($socialMediaMetadata)) {
                    try {
                        $socialMediaMetadata = json_decode($socialMediaMetadata, true);
                    } catch (\Exception $e) {
                        $socialMediaMetadata = null;
                    }
                }
                
                return [
                    'id' => $conversation->id,
                    'slug' => $conversation->slug,
                    'hashtag' => $hashtag,
                    'hashtag_display' => !empty($hashtag) ? implode(' ', array_map(function($tag) {
                        return '#' . $tag;
                    }, $hashtag)) : '',
                    'conversation_id' => $conversation->conversation_id,
                    'conversation_title' => $conversation->conversation_title,
                    'query' => $conversation->query,
                    'response_preview' => $conversation->response_preview,
                    'created_at' => $conversation->created_at->toISOString(),
                    'created_at_formatted' => $conversation->formatted_created_at,
                    'updated_at' => $lastMessage ? $lastMessage->created_at->toISOString() : $conversation->created_at->toISOString(),
                    'share_url' => $conversation->getConversationUrl(),
                    'thinking_enabled' => $conversation->thinking_enabled,
                    'temperature' => $conversation->temperature,
                    'max_tokens' => $conversation->max_tokens,
                    'total_tokens' => $conversationTokens,
                    'conversation_cost' => $conversationCost,
                    'message_count' => $messageCount,
                    'last_message_preview' => $lastMessage ? Str::limit(strip_tags($lastMessage->response ?? $lastMessage->query), 100) : null,
                    'status' => $conversation->status ?? 'public',
                    'pinned' => $conversation->pinned ?? false,
                    'social_media_metadata' => $socialMediaMetadata,
                ];
            }),
            'meta' => [
                'total' => $conversations->total(),
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
            ],
        ]);
    }
    
    /**
     * Check if a slug is available for a conversation.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkSlugAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|min:2|max:100',
            'conversation_id' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'available' => false,
                'message' => 'Invalid slug format.',
            ], 422);
        }

        $slug = strtolower(trim($request->input('slug')));
        $conversationId = $request->input('conversation_id');
        
        // Check if the slug exists in the database, excluding the current conversation
        $query = AISearchHistory::where('slug', $slug);
        
        if ($conversationId) {
            $query->where('conversation_id', '!=', $conversationId);
        }
        
        $exists = $query->exists();
        
        // Reserved slugs that cannot be used
        $reservedSlugs = [
            'admin', 'api', 'login', 'register', 'dashboard', 'home', 
            'search', 'settings', 'profile', 'logout', 'X', 'x',
            'ez', 'wiki', 'ezbar', 'ezbar.ai', 'www', 'mail', 'ftp',
            'ai', 'searchai', 'content', 'qr', 'theme', 'funnel'
        ];
        
        $isReserved = in_array($slug, $reservedSlugs);
        
        if ($exists) {
            return response()->json([
                'available' => false,
                'message' => 'This slug is already taken. Please choose another one.',
            ]);
        }
        
        if ($isReserved) {
            return response()->json([
                'available' => false,
                'message' => 'This slug is reserved and cannot be used.',
            ]);
        }
        
        return response()->json([
            'available' => true,
            'message' => 'Slug is available!',
            'slug' => $slug,
        ]);
    }
    
    /**
     * Suggest alternative slugs.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function suggestSlug(Request $request)
    {
        $request->validate([
            'slug' => 'required|string|max:255',
            'conversation_id' => 'nullable|string'
        ]);
        
        $baseSlug = $this->cleanSlug(trim($request->slug, '-'));
        $conversationId = $request->conversation_id;
        $suggestions = [];
        
        for ($i = 1; $i <= 5; $i++) {
            $suggestion = $baseSlug . '-' . $i;
            
            $query = AISearchHistory::where('slug', $suggestion);
            
            if ($conversationId) {
                $query->where('conversation_id', '!=', $conversationId);
            }
            
            if (!$query->exists()) {
                $suggestions[] = $suggestion;
            }
            
            if (count($suggestions) >= 3) {
                break;
            }
        }
        
        if (count($suggestions) < 3) {
            for ($i = 0; $i < 3 - count($suggestions); $i++) {
                $suggestions[] = $baseSlug . '-' . Str::random(4);
            }
        }
        
        return response()->json([
            'success' => true,
            'suggestions' => $suggestions
        ]);
    }
    
    /**
     * Update conversation title.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateTitle(Request $request, $conversationId)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $oldSlug = $conversation->slug;
        $templates = Template::where('image', 'LIKE', '%/X/' . $oldSlug)->get();
        foreach ($templates as $template) {
            $template->update([
                'title' => $request->title
            ]);
        }
        
        $oldTitle = $conversation->conversation_title;
        
        try {
            DB::beginTransaction();
            
            AISearchHistory::where('conversation_id', $conversationId)
                ->update(['conversation_title' => $request->title]);
            
            DB::commit();
            
            Log::info('Conversation title updated', [
                'conversation_id' => $conversationId,
                'old_title' => $oldTitle,
                'new_title' => $request->title,
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Title updated successfully',
                'title' => $request->title
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update conversation title', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to update title',
                'message' => 'An error occurred while updating the title.'
            ], 500);
        }
    }
    
    /**
     * Update message content.
     *
     * @param Request $request
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMessageContent(Request $request, $slug)
    {
        $request->validate([
            'content' => 'required|string',
            'content_type' => 'nullable|string|in:ai,comment,upload,landing_page,embed,social,social_media'
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        // Decode the slug (it might contain special characters)
        $decodedSlug = urldecode($slug);
        
        // Find the message
        $message = AISearchHistory::where('id', $slug)->first()
            ?? AISearchHistory::where('slug', $decodedSlug)->first();
        
        if (!$message) {
            Log::warning('Message not found for update', ['slug' => $decodedSlug]);
            return response()->json([
                'success' => false,
                'error' => 'Message not found'
            ], 404);
        }
        
        // Check ownership (message owner or parent slug owner)
        if (!$message->isOwnedBy($user, $sessionId)) {
            Log::warning('Unauthorized message update attempt', [
                'message_id' => $message->id,
                'user_id' => $user ? $user->id : null,
                'message_user_id' => $message->user_id
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 403);
        }
        
        try {
            DB::beginTransaction();
            
            // Store old content for logging
            $oldContent = $message->content_type === 'ai' ? $message->response : $message->query;
            
            // Update the appropriate field based on content type
            if ($message->content_type === 'ai') {
                $message->response = $request->content;
            } else {
                $message->query = $request->content;
            }
            
            $message->save();
            
            DB::commit();
            
            Log::info('Message content updated successfully', [
                'message_id' => $message->id,
                'slug' => $decodedSlug,
                'content_type' => $message->content_type,
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId,
                'old_content_length' => strlen($oldContent ?? ''),
                'new_content_length' => strlen($request->content)
            ]);
            
            // Only update conversation title if this is the first USER message
            // Check: parent_id is null (first message), message_role is 'user', AND content_type is standard text query
            if ($message->parent_id === null && 
                $message->message_role === 'user' && 
                $message->content_type !== 'landing_page' &&
                $message->content_type !== 'embed' &&
                $message->content_type !== 'ai') {
                
                $firstMessage = AISearchHistory::where('conversation_id', $message->conversation_id)
                    ->whereNull('parent_id')
                    ->orderBy('created_at', 'asc')
                    ->first();
                    
                if ($firstMessage && $firstMessage->id === $message->id) {
                    // This is the first user message, update conversation title
                    $newTitle = $this->generateTitleFromQuery($request->content);
                    
                    AISearchHistory::where('conversation_id', $message->conversation_id)
                        ->update(['conversation_title' => $newTitle]);
                        
                    Log::info('Conversation title updated from first user message edit', [
                        'conversation_id' => $message->conversation_id,
                        'new_title' => $newTitle
                    ]);
                }
            }
            
            // Prepare response data
            $responseData = [
                'success' => true,
                'message' => 'Message updated successfully',
                'data' => [
                    'id' => $message->id,
                    'slug' => $message->slug,
                    'content_type' => $message->content_type,
                    'updated_content' => $request->content,
                    'updated_at' => $message->updated_at->toISOString(),
                    'updated_at_formatted' => $message->updated_at->format('M d, Y \a\t h:i A'),
                ]
            ];
            
            // If this was an AI message, include token info
            if ($message->content_type === 'ai' && $message->usage) {
                $responseData['data']['total_tokens'] = $message->total_tokens;
                $responseData['data']['cost_estimate'] = $message->cost_estimate;
            }
            
            return response()->json($responseData);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update message content', [
                'message_id' => $message->id,
                'slug' => $decodedSlug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to update message',
                'message' => 'An error occurred while updating the message. Please try again.'
            ], 500);
        }
    }
    
    /**
     * Get private access logs for a conversation.
     *
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPrivateAccessLogs($conversationId)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        // Check ownership
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Fetch private access logs
        $logs = PrivateAccessLog::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'email' => $log->email,
                    'access_number' => $log->access_number,
                    'accessed_at' => $log->accessed_at ? $log->accessed_at->toISOString() : null,
                    'accessed_at_formatted' => $log->accessed_at ? $log->accessed_at->format('M d, Y \a\t h:i A') : null,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'is_used' => !is_null($log->accessed_at),
                    'created_at' => $log->created_at->toISOString(),
                    'created_at_formatted' => $log->created_at->format('M d, Y \a\t h:i A'),
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $logs,
            'total' => $logs->count(),
            'used_count' => $logs->where('is_used', true)->count(),
            'pending_count' => $logs->where('is_used', false)->count(),
        ]);
    }
    
    /**
     * Update landing page URL for a conversation.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateLandingPage(Request $request, $conversationId)
    {
        $request->validate([
            'landing_page_url' => 'nullable|url|max:500'
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        // Check ownership
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        try {
            DB::beginTransaction();
            
            // Update landing page URL for all messages in conversation
            AISearchHistory::where('conversation_id', $conversationId)
                ->update(['landing_page_url' => $request->landing_page_url]);
            
            DB::commit();
            
            Log::info('Landing page URL updated for conversation', [
                'conversation_id' => $conversationId,
                'landing_page_url' => $request->landing_page_url,
                'user_id' => $user ? $user->id : null
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Landing page URL updated successfully',
                'landing_page_url' => $request->landing_page_url
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update landing page URL', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to update landing page URL',
                'message' => 'An error occurred while updating the URL.'
            ], 500);
        }
    }
    
    /**
     * Generate title from query.
     *
     * @param string|null $query
     * @return string
     */
    private function generateTitleFromQuery($query): string
    {
        $query = trim($query ?? '');
        
        if (empty($query)) {
            return 'New Conversation';
        }
        
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $query)) {
            return mb_substr($query, 0, 30, 'UTF-8') . (mb_strlen($query) > 30 ? '...' : '');
        }
        
        return Str::limit($query, 50);
    }
    
    /**
     * Get response preview.
     *
     * @param AISearchHistory $conversation
     * @return string
     */
    private function getResponsePreview($conversation): string
    {
        if (empty($conversation->response)) {
            return 'No response yet';
        }
        
        $plainText = strip_tags($conversation->response);
        return Str::limit($plainText, 100);
    }
    
    /**
     * Detect language from query.
     *
     * @param string|null $query
     * @return string
     */
    private function detectLanguage($query): string
    {
        $query = $query ?? '';
        
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $query)) {
            return 'zh';
        } elseif (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $query)) {
            return 'ja';
        } elseif (preg_match('/[\x{AC00}-\x{D7AF}]/u', $query)) {
            return 'ko';
        } elseif (preg_match('/[\x{0600}-\x{06FF}]/u', $query)) {
            return 'ar';
        } else {
            return 'en';
        }
    }
    
    /**
     * Clean slug for URL use.
     *
     * @param string $slug
     * @return string
     */
    private function cleanSlug($slug): string
    {
        $slug = mb_strtolower($slug, 'UTF-8');
        $slug = str_replace(' ', '-', $slug);
        $slug = preg_replace('/[^a-zA-Z0-9\-]/', '', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        
        if (empty($slug)) {
            $slug = 'conversation-' . Str::random(8);
        }
        
        return $slug;
    }
    
    /**
     * Update private access settings for a conversation.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePrivateSettings(Request $request, $conversationId)
    {
        $request->validate([
            'access_number' => 'required|string|size:4|regex:/^\d{4}$/',
            'access_limit' => 'nullable|integer|min:0'
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        // Check ownership
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        try {
            DB::beginTransaction();
            
            // Update private access settings for all messages in conversation
            AISearchHistory::where('conversation_id', $conversationId)
                ->update([
                    'private_access_number' => $request->access_number,
                    'private_access_limit' => $request->access_limit === null ? null : (int)$request->access_limit
                ]);
            
            DB::commit();
            
            Log::info('Private settings updated for conversation', [
                'conversation_id' => $conversationId,
                'access_number' => $request->access_number,
                'access_limit' => $request->access_limit,
                'user_id' => $user ? $user->id : null
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Private access settings updated successfully',
                'access_number' => $request->access_number,
                'access_limit' => $request->access_limit
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update private settings', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to update private settings',
                'message' => 'An error occurred while updating the settings.'
            ], 500);
        }
    }

    /**
     * Get private access settings for a conversation.
     *
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPrivateSettings($conversationId)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        // Check ownership
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        return response()->json([
            'success' => true,
            'access_number' => $conversation->private_access_number,
            'access_limit' => $conversation->private_access_limit,
            'views_count' => $conversation->private_views_count ?? 0
        ]);
    }

    /**
     * Update message order for a conversation.
     * 
     * This method allows users to reorder messages in a conversation
     * by providing an array of message IDs in the desired order.
     *
     * @param Request $request
     * @param string $conversationId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMessageOrder(Request $request, $conversationId)
    {
        $request->validate([
            'message_order' => 'required|array',
            'message_order.*' => 'integer|exists:ai_search_histories,id',
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();
        
        // Verify the conversation exists and belongs to the user
        $conversation = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first() ?? AISearchHistory::where('conversation_id', $conversationId)->first();
        
        if (!$conversation) {
            return response()->json([
                'error' => 'Conversation not found',
                'message' => 'The specified conversation does not exist.'
            ], 404);
        }
        
        // Check ownership
        if (!$conversation->isOwnedBy($user, $sessionId)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You do not have permission to modify this conversation.'
            ], 403);
        }
        
        try {
            DB::beginTransaction();
            
            $order = $request->input('message_order');
            
            // Verify all messages belong to this conversation
            $messageIds = AISearchHistory::where('conversation_id', $conversationId)
                ->pluck('id')
                ->toArray();
            
            foreach ($order as $messageId) {
                if (!in_array($messageId, $messageIds)) {
                    throw new \Exception('Message ID ' . $messageId . ' does not belong to this conversation.');
                }
            }
            
            // Update position for each message
            foreach ($order as $index => $messageId) {
                AISearchHistory::where('id', $messageId)
                    ->where('conversation_id', $conversationId)
                    ->update(['position' => $index]);
            }
            
            DB::commit();
            
            Log::info('Message order updated successfully', [
                'conversation_id' => $conversationId,
                'message_count' => count($order),
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId,
                'order' => $order
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Message order updated successfully',
                'data' => [
                    'conversation_id' => $conversationId,
                    'message_count' => count($order),
                    'order' => $order
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update message order', [
                'conversation_id' => $conversationId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to update message order',
                'message' => $e->getMessage() ?: 'An error occurred while updating the message order.'
            ], 500);
        }
    }
}