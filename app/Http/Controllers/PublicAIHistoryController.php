<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\AITooltip;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PublicAIHistoryController extends Controller
{
    /**
     * Display public AI search history page
     * Shows all public conversations
     */
    public function index()
    {
        // Get all public conversations (only conversation starters)
        $conversations = AISearchHistory::whereNull('parent_id')
            ->where('status', 'public')
            ->with(['ezFunnel' => function($query) { 
                $query->with([
                    'customDomains',
                    'handleDomains'
                ]);
            }])
            ->orderBy('pinned', 'desc')
            ->orderBy('pinned_order', 'asc') // Order pinned by their order
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        // Log total conversations found
        Log::info('PublicAIHistory index - Total conversations: ' . $conversations->total());
        
        // Enhance conversations with additional data
        $conversations->getCollection()->transform(function ($conversation) {
            // Get message count for this conversation
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->count();
            
            // Get last message in conversation
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Calculate conversation tokens from JSON usage field
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->get();
            $conversationTokens = 0;
            
            foreach ($conversationMessages as $message) {
                if ($message->usage) {
                    // Check if usage is already an array or need to decode
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $conversationTokens += $usage['total_tokens'] ?? 0;
                } else {
                    // Fallback to total_tokens column if usage is null
                    $conversationTokens += $message->total_tokens ?? 0;
                }
            }
            
            // Log the tokens for debugging
            Log::info('Public conversation tokens calculation:', [
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title,
                'tokens' => $conversationTokens,
                'query' => substr($conversation->query, 0, 50)
            ]);
            
            // Calculate cost: $0.01 per 1000 tokens
            $conversationCost = $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
            $conversationCost = round($conversationCost, 4);
            
            // Log the calculated cost
            Log::info('Public conversation cost calculation:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'cost' => $conversationCost
            ]);
            
            // Mask email for privacy
            $maskedEmail = null;
            if ($conversation->user && $conversation->user->email) {
                $email = $conversation->user->email;
                $parts = explode('@', $email);
                if (count($parts) === 2) {
                    $localPart = $parts[0];
                    $domain = $parts[1];
                    
                    // Show first 2 characters of local part, then ***
                    $maskedLocal = substr($localPart, 0, 2) . '***';
                    // Show last 3 characters of domain
                    $domainLength = strlen($domain);
                    $maskedDomain = '***' . substr($domain, max(0, $domainLength - 3));
                    
                    $maskedEmail = $maskedLocal . '@' . $maskedDomain;
                } else {
                    // Fallback masking
                    $maskedEmail = substr($email, 0, 2) . '***@***' . substr($email, -3);
                }
            }
            
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
            
            // If empty, check if any message in this conversation has hashtags
            if (empty($hashtag) && !empty($conversationMessages)) {
                foreach ($conversationMessages as $msg) {
                    if (!empty($msg->hashtag)) {
                        $msgTags = $msg->hashtag;
                        if (is_string($msgTags)) {
                            $msgTags = array_filter(array_map('trim', explode(',', $msgTags)));
                            if (empty($msgTags)) {
                                $msgTags = array_filter(array_map('trim', explode(' ', $msg->hashtag)));
                            }
                        }
                        if (is_array($msgTags)) {
                            $hashtag = array_values(array_unique(array_merge($hashtag, $msgTags)));
                        }
                    }
                }
            }

            return [
                'id' => $conversation->id,
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
                'user_email' => $maskedEmail,
                'pinned' => $conversation->pinned ?? false,
                'pinned_order' => $conversation->pinned_order,
                'ezFunnelToken' => $conversation->ezFunnel ? $conversation->ezFunnel->token : null,
                'ezFunnelId' => $conversation->ezFunnel ? $conversation->ezFunnel->id : null,
                'customDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->customDomains : [],
                'handleDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->handleDomains : [],
            ];
        });
        
        // Get all tooltips for PublicAIHistory component
        $tooltips = AITooltip::where('component', 'PublicAIHistory')
            ->orWhere('component', 'Public AI History')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                // Tooltips are stored as JSON arrays, extract the first string
                if (is_array($tooltip)) {
                    return $tooltip[0] ?? '';
                }
                if (is_string($tooltip)) {
                    $decoded = json_decode($tooltip, true);
                    if (is_array($decoded)) {
                        return $decoded[0] ?? $tooltip;
                    }
                }
                return $tooltip;
            })
            ->toArray();
        
        return Inertia::render('PublicAIHistory', [
            'conversations' => $conversations,
            'totalConversations' => $conversations->total(),
            'currentPage' => $conversations->currentPage(),
            'lastPage' => $conversations->lastPage(),
            'perPage' => $conversations->perPage(),
            'auth' => [
                'user' => Auth::user()
            ],
            'tooltips' => $tooltips,
        ]);
    }
    
    /**
     * Load more conversations (for infinite scroll)
     */
    public function loadMore(Request $request)
    {
        $request->validate([
            'page' => 'required|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);
        
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);
        
        Log::info('Public loadMore called', ['page' => $page, 'perPage' => $perPage]);
        
        $conversations = AISearchHistory::whereNull('parent_id')
            ->where('status', 'public')
            ->with(['ezFunnel' => function($query) { 
                $query->with([
                    'customDomains',
                    'handleDomains'
                ]);
            }])
            ->orderBy('pinned', 'desc')
            ->orderBy('pinned_order', 'asc') // Order pinned by their order
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        Log::info('Public loadMore - conversations found', ['count' => $conversations->count()]);
        
        // Transform conversations
        $transformedConversations = $conversations->getCollection()->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->count();
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Calculate conversation tokens from JSON usage field
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->get();
            $conversationTokens = 0;
            
            foreach ($conversationMessages as $message) {
                if ($message->usage) {
                    // Check if usage is already an array or need to decode
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $conversationTokens += $usage['total_tokens'] ?? 0;
                } else {
                    // Fallback to total_tokens column if usage is null
                    $conversationTokens += $message->total_tokens ?? 0;
                }
            }
            
            // Log the tokens for debugging
            Log::info('Public load more - Conversation tokens:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'query' => substr($conversation->query, 0, 50)
            ]);
            
            // Calculate cost: $0.01 per 1000 tokens
            $conversationCost = $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
            $conversationCost = round($conversationCost, 4);
            
            Log::info('Public load more - Cost calculated:', [
                'conversation_id' => $conversation->conversation_id,
                'tokens' => $conversationTokens,
                'cost' => $conversationCost
            ]);
            
            // Mask email for privacy
            $maskedEmail = null;
            if ($conversation->user && $conversation->user->email) {
                $email = $conversation->user->email;
                $parts = explode('@', $email);
                if (count($parts) === 2) {
                    $localPart = $parts[0];
                    $domain = $parts[1];
                    
                    // Show first 2 characters of local part, then ***
                    $maskedLocal = substr($localPart, 0, 2) . '***';
                    // Show last 3 characters of domain
                    $domainLength = strlen($domain);
                    $maskedDomain = '***' . substr($domain, max(0, $domainLength - 3));
                    
                    $maskedEmail = $maskedLocal . '@' . $maskedDomain;
                } else {
                    // Fallback masking
                    $maskedEmail = substr($email, 0, 2) . '***@***' . substr($email, -3);
                }
            }
            
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
            
            // If empty, check if any message in this conversation has hashtags
            if (empty($hashtag) && !empty($conversationMessages)) {
                foreach ($conversationMessages as $msg) {
                    if (!empty($msg->hashtag)) {
                        $msgTags = $msg->hashtag;
                        if (is_string($msgTags)) {
                            $msgTags = array_filter(array_map('trim', explode(',', $msgTags)));
                            if (empty($msgTags)) {
                                $msgTags = array_filter(array_map('trim', explode(' ', $msg->hashtag)));
                            }
                        }
                        if (is_array($msgTags)) {
                            $hashtag = array_values(array_unique(array_merge($hashtag, $msgTags)));
                        }
                    }
                }
            }

            return [
                'id' => $conversation->id,
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
                'user_email' => $maskedEmail,
                'pinned' => $conversation->pinned ?? false,
                'pinned_order' => $conversation->pinned_order,
                'ezFunnelToken' => $conversation->ezFunnel ? $conversation->ezFunnel->token : null,
                'ezFunnelId' => $conversation->ezFunnel ? $conversation->ezFunnel->id : null,
                'customDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->customDomains : [],
                'handleDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->handleDomains : [],
            ];
        });
        
        // Log the transformed data before sending
        Log::info('Public loadMore - Sending response', [
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
     * Get a specific public conversation by slug
     */
    public function show($slug)
    {
        $conversation = AISearchHistory::where('slug', $slug)
            ->where('status', 'public')
            ->firstOrFail();
        
        // Get all public messages in this conversation
        $messages = AISearchHistory::where('conversation_id', $conversation->conversation_id)
            ->where('status', 'public')->orderBy('position', 'asc')->orderBy('created_at', 'asc')
            ->get();
        
        // Transform messages for response
        $transformedMessages = $messages->map(function ($message) {
            return [
                'id' => $message->id,
                'slug' => $message->slug,
                'message_role' => $message->message_role,
                'query' => $message->query,
                'response' => $message->response,
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
                'share_url' => $message->getShareableUrl(),
                'conversation_url' => $message->getConversationUrl(),
            ];
        });
        
        // Get conversation summary
        $firstMessage = $messages->first();
        $lastMessage = $messages->last();
        
        $summary = [
            'id' => $conversation->conversation_id,
            'title' => $firstMessage->conversation_title ?? 'Untitled Conversation',
            'message_count' => $messages->count(),
            'total_tokens' => $messages->sum('total_tokens'),
            'created_at' => $firstMessage->created_at->toISOString(),
            'updated_at' => $lastMessage->created_at->toISOString(),
            'user' => $firstMessage->user ? [
                'id' => $firstMessage->user->id,
                'name' => $firstMessage->user->name,
                'email' => $firstMessage->user->email,
            ] : null,
        ];
        
        // Get tooltips for the page
        $tooltips = AITooltip::where('component', 'PublicAIHistory')
            ->orWhere('component', 'Public AI History')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                if (is_array($tooltip)) {
                    return $tooltip[0] ?? '';
                }
                if (is_string($tooltip)) {
                    $decoded = json_decode($tooltip, true);
                    if (is_array($decoded)) {
                        return $decoded[0] ?? $tooltip;
                    }
                }
                return $tooltip;
            })
            ->toArray();
        
        return Inertia::render('PublicAIConversation', [
            'conversation' => $summary,
            'messages' => $transformedMessages,
            'auth' => [
                'user' => Auth::user()
            ],
            'tooltips' => $tooltips,
        ]);
    }
    
    /**
     * Generate title from query if none exists
     */
    private function generateTitleFromQuery($query)
    {
        $query = trim($query);
        
        if (empty($query)) {
            return 'New Conversation';
        }
        
        // Handle different languages
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $query)) {
            return mb_substr($query, 0, 30, 'UTF-8') . (mb_strlen($query) > 30 ? '...' : '');
        }
        
        return Str::limit($query, 50);
    }
    
    /**
     * Get response preview
     */
    private function getResponsePreview($conversation)
    {
        if (empty($conversation->response)) {
            return 'No response yet';
        }
        
        $plainText = strip_tags($conversation->response);
        return Str::limit($plainText, 100);
    }
    
    /**
     * Detect language of query
     */
    private function detectLanguage($query)
    {
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
     * Get public conversation by ID (API endpoint)
     */
    public function getConversation($conversationId)
    {
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->where('status', 'public')->orderBy('position', 'asc')->orderBy('created_at', 'asc')
            ->get();
        
        if ($messages->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }
        
        $firstMessage = $messages->first();
        
        // Calculate conversation tokens and cost
        $conversationTokens = $messages->sum('total_tokens');
        $conversationCost = ($conversationTokens / 1000) * 0.01;
        
        return response()->json([
            'success' => true,
            'conversation_id' => $conversationId,
            'conversation_title' => $firstMessage->conversation_title,
            'created_at' => $firstMessage->created_at->toISOString(),
            'message_count' => $messages->count(),
            'conversation_tokens' => $conversationTokens,
            'conversation_cost' => $conversationCost,
            'messages' => $messages->map(function ($message) {
                return [
                    'id' => $message->id,
                    'slug' => $message->slug,
                    'message_role' => $message->message_role,
                    'parent_id' => $message->parent_id,
                    'query' => $message->query,
                    'response' => $message->response,
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
                    'share_url' => $message->getShareableUrl(),
                ];
            }),
        ]);
    }
    
    /**
     * Get pinned public conversations
     */
    public function getPinnedConversations()
    {
        $pinnedConversations = AISearchHistory::whereNull('parent_id')
            ->where('status', 'public')
            ->where('pinned', true)
            ->with(['ezFunnel' => function($query) { 
                $query->with([
                    'customDomains',
                    'handleDomains'
                ]);
            }])
            ->orderBy('pinned_order', 'asc') // Order by pinned_order
            ->orderBy('updated_at', 'desc')
            ->get();
        
        // Transform the conversations
        $transformed = $pinnedConversations->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->count();
            $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Calculate conversation tokens
            $conversationMessages = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                ->where('status', 'public')
                ->get();
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
            
            // Mask email for privacy
            $maskedEmail = null;
            if ($conversation->user && $conversation->user->email) {
                $email = $conversation->user->email;
                $parts = explode('@', $email);
                if (count($parts) === 2) {
                    $localPart = $parts[0];
                    $domain = $parts[1];
                    
                    $maskedLocal = substr($localPart, 0, 2) . '***';
                    $domainLength = strlen($domain);
                    $maskedDomain = '***' . substr($domain, max(0, $domainLength - 3));
                    
                    $maskedEmail = $maskedLocal . '@' . $maskedDomain;
                } else {
                    $maskedEmail = substr($email, 0, 2) . '***@***' . substr($email, -3);
                }
            }
            
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
            
            // If empty, check if any message in this conversation has hashtags
            if (empty($hashtag) && !empty($conversationMessages)) {
                foreach ($conversationMessages as $msg) {
                    if (!empty($msg->hashtag)) {
                        $msgTags = $msg->hashtag;
                        if (is_string($msgTags)) {
                            $msgTags = array_filter(array_map('trim', explode(',', $msgTags)));
                            if (empty($msgTags)) {
                                $msgTags = array_filter(array_map('trim', explode(' ', $msg->hashtag)));
                            }
                        }
                        if (is_array($msgTags)) {
                            $hashtag = array_values(array_unique(array_merge($hashtag, $msgTags)));
                        }
                    }
                }
            }

            return [
                'id' => $conversation->id,
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
                'user_email' => $maskedEmail,
                'pinned' => true,
                'pinned_order' => $conversation->pinned_order,
                'ezFunnelToken' => $conversation->ezFunnel ? $conversation->ezFunnel->token : null,
                'ezFunnelId' => $conversation->ezFunnel ? $conversation->ezFunnel->id : null,
                'customDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->customDomains : [],
                'handleDomains' => $conversation->ezFunnel ? $conversation->ezFunnel->handleDomains : [],
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $transformed
        ]);
    }
}