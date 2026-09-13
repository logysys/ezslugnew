<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\EzFunnelField;
use App\Models\EzFunnel;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\AISearchHistory;
use App\Models\CouponUsage;
use App\Models\Admindomain;
use App\Models\Tooltip;
use App\Models\Reserve;
use App\Models\Powerstring;
use App\Models\Coupon;
use App\Models\User;
use App\Models\Page;
use App\Models\Emaildesign;
use App\Models\HandlePurchase;
use App\Models\FunnelSeoSetting;
use App\Models\FunnelLogoSetting;
use App\Models\Themecollection;
use App\Models\Defaultpage;
use App\Models\Invoice;
use App\Models\StripeTransaction;
use App\Models\AiSetting;
use App\Models\AITooltip;
use App\Models\AIUserSetting;
use App\Models\TokenInfo;
use App\Models\PrivateAccessLog;
use App\Models\Sell;
use App\Models\MessageReaction;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SearchController extends Controller
{
    private $stripeSecretKey;
    private $aiSettings;
    private $openaiApiKey;
    private $openaiBaseUrl;
    private $deepseekApiKey;
    private $deepseekBaseUrl;
    private $perplexityApiKey;
    private $perplexityBaseUrl;
    private $geminiApiKey;
    private $geminiBaseUrl;
    private $geminiModel;

    // Supported models list - Includes Moonshot/Kimi, OpenAI, DeepSeek, Perplexity, and Gemini models
    // UPDATED: Fixed Perplexity model names to match current API
    private $supportedModels = [
        // Moonshot/Kimi K3 Series (Latest)
        'kimi-k3',                      // Flagship K3, 256K context
        'kimi-k3-turbo-preview',        // High-speed variant
        
        // Moonshot/Kimi K2.6 Series (Released April 2026)
        'kimi-k2.6',                    // Flagship: 1T params, 32B active, 256K context, native multimodal
        'kimi-k2.6-instant',            // Fast responses, lower latency
        'kimi-k2.6-thinking',           // Deep reasoning with chain-of-thought
        'kimi-k2.6-agent',              // Autonomous research & document tasks
        'kimi-k2.6-agent-swarm',        // 300 sub-agents, 4,000 coordinated steps
        
        // Moonshot/Kimi K2.5 Series (Previous generation - still supported)
        'kimi-k2.5',                    // Previous flagship, 256K context
        'kimi-k2.5-turbo-preview',      // High-speed variant
        
        // Kimi K2 Series (Deprecated May 25, 2026 - kept for backward compatibility)
        'kimi-k2-0905-preview',         // Enhanced agentic coding, 256K context
        'kimi-k2-0711-preview',         // Base MoE model, 128K context
        'kimi-k2-turbo-preview',        // LEGACY: High-speed K2 (deprecated)
        'kimi-k2-thinking',             // LEGACY: Long-term thinking (deprecated)
        'kimi-k2-thinking-turbo',       // High-speed thinking, 60-100 t/s, 256K context
        
        // Kimi K1.5 Series (Legacy - deprecated but kept for compatibility)
        'kimi-k1.5',                    // LEGACY
        'kimi-k1.5-long-context',       // LEGACY
        
        // Moonshot V1 Generation Models
        'moonshot-v1-8k',               // Short text, 8K context
        'moonshot-v1-32k',              // Long text, 32K context
        'moonshot-v1-128k',             // Very long text, 128K context
        'moonshot-v1-8k-vision-preview',   // Vision model, 8K context
        'moonshot-v1-32k-vision-preview',  // Vision model, 32K context
        'moonshot-v1-128k-vision-preview', // Vision model, 128K context        
        // OpenAI models
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-32k',
        'gpt-4-vision-preview',
        
        // DeepSeek models
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-v3',
        'deepseek-r1',
        
        // Perplexity models - UPDATED with correct model names
        'sonar',
        'sonar-pro',
        
        // Google Gemini models
        'gemini-3-flash-preview',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-pro',
        'gemini-pro-latest',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
    ];

    public function __construct()
    {
        $this->stripeSecretKey = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecretKey);
        
        // Initialize OpenAI configuration
        $this->openaiApiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));
        $this->openaiBaseUrl = config('services.openai.base_url', 'https://api.openai.com/v1');
        
        // Initialize DeepSeek configuration
        $this->deepseekApiKey = config('services.deepseek.api_key', env('DEEPSEEK_API_KEY'));
        $this->deepseekBaseUrl = config('services.deepseek.base_url', 'https://api.deepseek.com/v1');
        
        // Initialize Perplexity configuration - FIXED
        $this->perplexityApiKey = config('services.perplexity.api_key', env('PERPLEXITY_API_KEY'));
        $this->perplexityBaseUrl = config('services.perplexity.base_url', 'https://api.perplexity.ai');
        
        // Initialize Gemini configuration
        $this->geminiApiKey = config('services.gemini.api_key', env('GEMINI_API_KEY'));
        $this->geminiBaseUrl = config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta');
        $this->geminiModel = config('services.gemini.model', 'gemini-2.0-flash');
        
        // Load AI settings once per request
        $this->loadAiSettings();
    }
    
    /**
     * Load AI settings from database without caching
     */
    private function loadAiSettings(): void
    {
        // Always get fresh settings from database
        $this->aiSettings = AiSetting::getInstance();
    }
    
    /**
     * Get max characters based on authentication status
     */
    private function getMaxChars(): int
    {
        if (Auth::check()) {
            return $this->aiSettings->user_ai_enabled 
                ? $this->aiSettings->user_char_limit 
                : 0;
        }
        
        return $this->aiSettings->guest_ai_enabled 
            ? $this->aiSettings->guest_char_limit 
            : 0;
    }
    
    /**
     * Check if AI is enabled for current user
     */
    private function isAiEnabled(): bool
    {
        if (Auth::check()) {
            return $this->aiSettings->user_ai_enabled;
        }
        
        return $this->aiSettings->guest_ai_enabled;
    }
    
    /**
     * Get character limit message
     */
    private function getCharLimitMessage(): string
    {
        $maxChars = $this->getMaxChars();
        
        if (Auth::check()) {
            return "Query must be between 1 and {$maxChars} characters.";
        }
        
        return "Query must be between 1 and {$maxChars} characters. Please login for higher limits.";
    }
    
    /**
     * Validate and get model, falling back to default if invalid
     */
    private function getValidatedModel(?string $requestedModel): string
    {
        $defaultModel = config('services.moonshot.model', 'kimi-k3');
        
        if (empty($requestedModel)) {
            return $defaultModel;
        }
        
        // Check if the requested model is in supported list
        if (in_array($requestedModel, $this->supportedModels)) {
            return $requestedModel;
        }
        
        // Log invalid model attempt
        Log::warning('Invalid model requested', [
            'requested_model' => $requestedModel,
            'ip' => request()->ip(),
            'user_id' => Auth::id()
        ]);
        
        return $defaultModel;
    }
    
    /**
     * Get API key based on model provider - FIXED for Perplexity
     */
    private function getApiKeyForModel(string $model): ?string
    {
        // Gemini models
        if (str_starts_with($model, 'gemini-')) {
            return $this->geminiApiKey;
        }
        
        // Perplexity models - FIXED: Using correct model names 'sonar' and 'sonar-pro'
        if ($model === 'sonar' || $model === 'sonar-pro') {
            $apiKey = $this->perplexityApiKey ?: config('services.perplexity.api_key', env('PERPLEXITY_API_KEY'));
            
            Log::debug('Perplexity API Key retrieval', [
                'model' => $model,
                'has_key' => !empty($apiKey),
                'key_prefix' => $apiKey ? substr($apiKey, 0, 10) . '...' : 'null'
            ]);
            
            return $apiKey;
        }
        
        // DeepSeek models
        if (str_starts_with($model, 'deepseek-')) {
            return $this->deepseekApiKey;
        }
        
        // OpenAI models
        if (str_starts_with($model, 'gpt-')) {
            return $this->openaiApiKey;
        }
        
        // Moonshot/Kimi models
        return config('services.moonshot.api_key', env('MOONSHOT_API_KEY'));
    }
    
    /**
     * Get API endpoint based on model provider with fallback endpoints - FIXED for Perplexity
     */
    private function getApiEndpointForModel(string $model): string
    {
        // Gemini models
        if (str_starts_with($model, 'gemini-')) {
            return $this->geminiBaseUrl . '/models/' . $model . ':generateContent';
        }
        
        // Perplexity models - FIXED: Use correct endpoint with /chat/completions
        if ($model === 'sonar' || $model === 'sonar-pro') {
            return rtrim($this->perplexityBaseUrl, '/') . '/chat/completions';
        }
        
        // DeepSeek models
        if (str_starts_with($model, 'deepseek-')) {
            return rtrim($this->deepseekBaseUrl, '/') . '/chat/completions';
        }
        
        // OpenAI models
        if (str_starts_with($model, 'gpt-')) {
            return $this->openaiBaseUrl . '/chat/completions';
        }
        
        // Moonshot/Kimi
        return 'https://api.moonshot.ai/v1/chat/completions';
    }
    
    /**
     * Get API headers based on model provider - FIXED for Perplexity
     */
    private function getApiHeaders(string $model, string $apiKey): array
    {
        $headers = [
            'Content-Type' => 'application/json',
        ];
        
        // Gemini uses API key as query parameter, not in headers
        if (str_starts_with($model, 'gemini-')) {
            return $headers;
        }
        
        // Standard Bearer token for other providers
        $headers['Authorization'] = 'Bearer ' . $apiKey;
        
        // Add OpenAI specific headers if needed
        if (str_starts_with($model, 'gpt-')) {
            $headers['OpenAI-Beta'] = 'assistants=v2';
        }
        
        // Add Perplexity specific headers - FIXED
        if ($model === 'sonar' || $model === 'sonar-pro') {
            $headers['Accept'] = 'application/json';
        }
        
        return $headers;
    }
    
    /**
     * Get conversation status from root message
     */
    private function getConversationStatus(?string $conversationId): string
    {
        if (!$conversationId) {
            return 'public';
        }
        
        $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first();
        
        return $firstMessage ? $firstMessage->status : 'public';
    }
    
    /**
     * Check if guests are allowed to interact with a conversation based on owner's settings
     */
    private function canGuestsInteract(?AISearchHistory $message): bool
    {
        if (!$message) {
            return true;
        }
        
        $firstMessage = $message->getFirstMessage();
        
        if (!$firstMessage || !$firstMessage->user_id) {
            return true;
        }
        
        $ownerSettings = AIUserSetting::where('user_id', $firstMessage->user_id)->first();
        
        if ($ownerSettings && $ownerSettings->guest_ai_enabled === false) {
            return false;
        }
        
        return true;
    }

    /**
     * Enhanced check message access with guest interaction permissions
     */
    private function checkMessageAccess(AISearchHistory $message): bool
    {
        if ($message->status === 'hidden') {
            return false;
        }
        
        $hasPrivateAccess = false;
        $sessionData = session('private_access_' . $message->conversation_id);
        if (!is_null($sessionData) && isset($sessionData['token'])) {
            $hasPrivateAccess = true;
        }
        
        if ($hasPrivateAccess) {
            return true;
        }
        
        if ($message->status === 'public') {
            return true;
        }
        
        if ($message->status === 'private') {
            $firstMessage = $message->getFirstMessage();
            if ($firstMessage) {
                $privateAccess = session('private_access_' . $firstMessage->conversation_id);
                if (!is_null($privateAccess) && isset($privateAccess['token'])) {
                    return true;
                }
            }
            if ($this->isMessageOwner($message)) {
                return true;
            }
            return false;
        }
        
        return false;
    }

    /**
     * Check if current user/session owns a message
     */
    private function isMessageOwner(AISearchHistory $message): bool
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        
        return $message->isOwnedBy($user, $sessionId);
    }

    /**
	 * Enhanced filtered conversation messages with guest interaction permissions
	 */
	private function getFilteredConversationMessages(string $conversationId)
	{
		$messages = AISearchHistory::where('conversation_id', $conversationId)
			->with('user')
			->orderBy('position', 'asc')
			->orderBy('created_at', 'asc')
			->get();
		
		$user = Auth::user();
		$sessionId = Session::getId();
		
		$hasPrivateAccess = false;
		$sessionData = session('private_access_' . $conversationId);
		if (!is_null($sessionData) && isset($sessionData['token'])) {
			$hasPrivateAccess = true;
		}
		
		return $messages->filter(function ($message) use ($user, $sessionId, $hasPrivateAccess) {
			if ($message->status === 'hidden') {
				return $this->isMessageOwner($message);
			}
			
			if ($message->status === 'private') {
				if ($this->isMessageOwner($message)) {
					return true;
				}
				if ($hasPrivateAccess) {
					return true;
				}
				return false;
			}
			
			if ($message->status === 'public') {
				return true;
			}
			
			return false;
		})->values();
	}

    /**
     * Check if user can ask questions in this conversation
     */
    private function canUserAskQuestion(AISearchHistory $conversation): bool
    {
        $firstMessage = $conversation->getFirstMessage();
        
        if (!$firstMessage) {
            return false;
        }
        
        $hasPrivateAccess = false;
        $sessionData = session('private_access_' . $firstMessage->conversation_id);
        if (!is_null($sessionData) && isset($sessionData['token'])) {
            $hasPrivateAccess = true;
        }
        
        if ($hasPrivateAccess) {
            return true;
        }
        
        if ($this->isMessageOwner($firstMessage)) {
            return true;
        }
        
        if ($firstMessage->status === 'public') {
            return $this->canGuestsInteract($firstMessage);
        }
        
        if ($firstMessage->status === 'private') {
            return false;
        }
        
        return false;
    }

    /**
     * Render the ezbar page
     */
    public function ezbar()
    {
        $tooltips = AITooltip::where('component', 'ezbar')
            ->orWhere('component', 'Home')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                return is_array($tooltip) ? $tooltip[0] : (is_string($tooltip) ? json_decode($tooltip, true)[0] ?? $tooltip : $tooltip);
            })
            ->toArray();

        return Inertia::render('ezbar', [
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'aiSettings' => $this->aiSettings,
            'tooltips' => $tooltips,
        ])->withViewData([
            'meta' => [
                'title' => 'The Ez Way To WiKi and Co-WiKi',
                'description' => 'The Ez Way To WiKi and Co-WiKi',
                'keywords' => 'ai',
                'siteurl' => 'https://ez.wiki',
                'sitename' => 'ez.wiki',
                'metalogo' => 'https://ez.wiki/ezlogo.png'
            ],
            'favicon' => 'https://ez.wiki/ezlogo.png'
        ]);
    }
    
    /**
     * Search for links/URLs in the database
     */
    public function searchLinks(Request $request)
    {
        $query = $request->input('query', '');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        
        Log::info('Search request received', [
            'query' => $query,
            'page' => $page,
            'per_page' => $perPage,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        $cacheKey = 'search_links_' . md5($query . '_' . $page . '_' . $perPage);
        
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response()->json($cachedResponse);
        }
        
        if (empty($query)) {
            $response = [
                'success' => true,
                'results' => [],
                'suggestions' => $this->getSmartSuggestions($query),
                'query' => $query,
                'count' => 0,
                'total' => 0,
                'current_page' => $page,
                'total_pages' => 0,
                'per_page' => $perPage,
                'has_more' => false
            ];
            
            Cache::put($cacheKey, $response, now()->addMinutes(5));
            return response()->json($response);
        }
        
        $allResults = collect();
        
        // Search in EzFunnel token
        $funnelResults = EzFunnel::query()
            ->where('token', 'LIKE', "%{$query}%")
            ->get()
            ->map(function ($funnel) use ($query) {
                $score = $this->calculateRelevanceScore($funnel->token ?? '', $query, 'funnel');
                
                return [
                    'type' => 'funnel',
                    'id' => $funnel->id,
                    'token' => $funnel->token,
                    'url' => 'https://ez.wiki/'.($funnel->token ?? ''),
                    'title' => 'Funnel: https://ez.wiki/'.($funnel->token ?? ''),
                    'created_at' => $funnel->created_at?->diffForHumans(),
                    'score' => $score,
                ];
            });
        
        $allResults = $allResults->merge($funnelResults);
        
        // Search in EzFunnelField
        $fieldResults = EzFunnelField::query()
            ->where(function($q) use ($query) {
                $q->where('unique_id', 'LIKE', "%{$query}%")
                  ->orWhere('caption', 'LIKE', "%{$query}%")
                  ->orWhere('url', 'LIKE', "%{$query}%")
                  ->orWhere('link_url', 'LIKE', "%{$query}%");
            })
            ->get()
            ->map(function ($field) use ($query) {
                $score = $this->calculateRelevanceScore($field->unique_id ?? '', $query, 'field');
                
                if (stripos($field->caption ?? '', $query) !== false) {
                    $score += 20;
                }
                if (stripos($field->url ?? '', $query) !== false) {
                    $score += 15;
                }
                
                return [
                    'type' => 'field',
                    'id' => $field->id,
                    'unique_id' => $field->unique_id,
                    'url' => 'https://ez.wiki/'.($field->unique_id ?? ''),
                    'title' => 'https://ez.wiki/'.($field->unique_id ?? ''),
                    'subtitle' => $field->caption ?? 'No caption',
                    'created_at' => $field->created_at?->diffForHumans(),
                    'score' => $score,
                ];
            });
        
        $allResults = $allResults->merge($fieldResults);
        
        // Search in Customdomain
        $customDomainResults = Customdomain::query()
            ->where(function($q) use ($query) {
                $q->where('domain', 'LIKE', "%{$query}%")
                  ->orWhere('domainselected', 'LIKE', "%{$query}%");
            })
            ->get()
            ->map(function ($domain) use ($query) {
                $score = $this->calculateRelevanceScore($domain->domain ?? '', $query, 'custom_domain');
                
                if ($domain->domainselected == $query) {
                    $score += 30;
                }
                
                return [
                    'type' => 'custom_domain',
                    'id' => $domain->id,
                    'domain' => $domain->domain,
                    'domainselected' => $domain->domainselected ?? '',
                    'url' => 'https://'.$domain->domainselected.'/'.$domain->domain,
                    'title' => 'Custom Domain: https://'.$domain->domainselected.'/'.$domain->domain,
                    'score' => $score,
                ];
            });
        
        $allResults = $allResults->merge($customDomainResults);
        
        // Search in Domain
        $domainResults = Domain::query()
            ->where(function($q) use ($query) {
                $q->where('domain', 'LIKE', "{$query}%")
                  ->orWhere('domain', 'LIKE', "%{$query}%")
                  ->orWhere('domainselected', 'LIKE', "%{$query}%");
            })
            ->get()
            ->map(function ($domain) use ($query) {
                $score = $this->calculateRelevanceScore($domain->domain ?? '', $query, 'domain');
                
                if ($domain->domainselected == $query) {
                    $score += 30;
                }
                
                return [
                    'type' => 'domain',
                    'id' => $domain->id,
                    'domain' => $domain->domain,
                    'domainselected' => $domain->domainselected ?? '',
                    'url' => 'https://'.$domain->domain.'.'.$domain->domainselected,
                    'title' => 'Domain: https://'.$domain->domain.'.'.$domain->domainselected,
                    'score' => $score,
                ];
            });
        
        $allResults = $allResults->merge($domainResults);
        
        // Search in Theme
        $themeResults = Template::query()
            ->where(function($q) use ($query) {
                $q->where('unique_id', 'LIKE', "%{$query}%")
                  ->orWhere('title', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            })
            ->get()
            ->map(function ($theme) use ($query) {
                $score = $this->calculateRelevanceScore($theme->unique_id ?? '', $query, 'theme');
                
                if (stripos($theme->title ?? '', $query) !== false) {
                    $score += 25;
                }
                if (stripos($theme->description ?? '', $query) !== false) {
                    $score += 15;
                }
                
                return [
                    'type' => 'theme',
                    'id' => $theme->id,
                    'unique_id' => $theme->unique_id,
                    'title' => 'Theme: ' . ($theme->title ?? $theme->unique_id ?? 'Untitled').'- https://ez.wiki/'.($theme->unique_id ?? ''),
                    'subtitle' => $theme->description ?? 'No description',
                    'url' => 'https://ez.wiki/'.($theme->unique_id ?? ''),
                    'score' => $score,
                ];
            });
        
        $allResults = $allResults->merge($themeResults);
        
        // Search in AISearchHistory
        $aiHistoryResults = AISearchHistory::query()
            ->where(function($q) use ($query) {
                $q->where('slug', 'LIKE', "%{$query}%")
                  ->orWhere('conversation_title', 'LIKE', "%{$query}%")
                  ->orWhere('query', 'LIKE', "%{$query}%");
            })
            ->where('message_role', 'user')
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($history) use ($query) {
                $score = $this->calculateRelevanceScore($history->slug ?? '', $query, 'ai_history');
                
                if (stripos($history->conversation_title ?? '', $query) !== false) {
                    $score += 25;
                }
                if (stripos($history->query ?? '', $query) !== false) {
                    $score += 20;
                }
                
                if ($history->slug === $query) {
                    $score += 50;
                }
                
                return [
                    'type' => 'ai_conversation',
                    'id' => $history->id,
                    'slug' => $history->slug,
                    'conversation_id' => $history->conversation_id,
                    'url' => url('/X/' . urlencode($history->slug)),
                    'title' => 'AI Conversation: ' . ($history->conversation_title ?? $history->query ?? 'Untitled'),
                    'subtitle' => 'Query: ' . ($history->query ?? 'No query') . ' • ' . $history->formatted_created_at,
                    'created_at' => $history->created_at?->diffForHumans(),
                    'score' => $score,
                    'conversation_title' => $history->conversation_title,
                    'message_count' => $history->message_count,
                ];
            });
        
        $allResults = $allResults->merge($aiHistoryResults);
        
        $sortedResults = $allResults->sortByDesc('score')->values();
        
        $totalResults = $sortedResults->count();
        $totalPages = ceil($totalResults / $perPage);
        
        $paginatedResults = [];
        if ($totalResults > 0) {
            $startIndex = ($page - 1) * $perPage;
            $paginatedResults = $sortedResults->slice($startIndex, $perPage)->toArray();
        }
        
        $smartSuggestions = $this->getSmartSuggestions($query);
        
        $categoryCounts = [
            'funnel' => $funnelResults->count(),
            'field' => $fieldResults->count(),
            'custom_domain' => $customDomainResults->count(),
            'domain' => $domainResults->count(),
            'theme' => $themeResults->count(),
            'ai_conversation' => $aiHistoryResults->count(),
        ];
        
        $response = [
            'success' => true,
            'results' => $paginatedResults,
            'all_results_count' => $totalResults,
            'suggestions' => $smartSuggestions,
            'query' => $query,
            'count' => count($paginatedResults),
            'total' => $totalResults,
            'current_page' => (int)$page,
            'total_pages' => $totalPages,
            'per_page' => (int)$perPage,
            'has_more' => $page < $totalPages,
            'categories' => $categoryCounts,
            'pagination' => [
                'current_page' => (int)$page,
                'last_page' => $totalPages,
                'per_page' => (int)$perPage,
                'total' => $totalResults,
                'from' => $totalResults > 0 ? (($page - 1) * $perPage) + 1 : 0,
                'to' => min($page * $perPage, $totalResults),
            ]
        ];
        
        Cache::put($cacheKey, $response, now()->addSeconds(30));
        
        return response()->json($response);
    }

    /**
     * Search for AI conversation slugs
     */
    public function searchAISlugs(Request $request)
    {
        $query = $request->input('query', '');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);
        
        Log::info('AI Slug Search request received', [
            'query' => $query,
            'page' => $page,
            'per_page' => $perPage,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        $cacheKey = 'search_ai_slugs_' . md5($query . '_' . $page . '_' . $perPage);
        
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response()->json($cachedResponse);
        }
        
        if (empty($query)) {
            $response = [
                'success' => true,
                'results' => [],
                'query' => $query,
                'count' => 0,
                'total' => 0,
                'current_page' => $page,
                'total_pages' => 0,
                'per_page' => $perPage,
                'has_more' => false
            ];
            
            Cache::put($cacheKey, $response, now()->addMinutes(5));
            return response()->json($response);
        }
        
        $user = Auth::user();
        $sessionId = Session::getId();
        
        $results = AISearchHistory::query()
            ->where(function($q) use ($query) {
                $q->where('slug', 'LIKE', "%{$query}%")
                  ->orWhere('conversation_title', 'LIKE', "%{$query}%")
                  ->orWhere('query', 'LIKE', "%{$query}%");
            })
            ->where('message_role', 'user')
            ->whereNull('parent_id')
            ->where(function($q) use ($user, $sessionId) {
                $q->where('status', 'public')
                  ->orWhere(function($q2) use ($user, $sessionId) {
                      $q2->where('status', 'private')
                         ->where(function($q3) use ($user, $sessionId) {
                             if ($user) {
                                 $q3->where('user_id', $user->id);
                             }
                             $q3->orWhere('session_id', $sessionId);
                         });
                  })
                  ->orWhere(function($q2) use ($user) {
                      if ($user) {
                          $q2->where('user_id', $user->id);
                      }
                  });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        $formattedResults = $results->map(function ($history) use ($query) {
            $score = $this->calculateRelevanceScore($history->slug ?? '', $query, 'ai_slug');
            
            if (stripos($history->conversation_title ?? '', $query) !== false) {
                $score += 25;
            }
            if (stripos($history->query ?? '', $query) !== false) {
                $score += 20;
            }
            if ($history->slug === $query) {
                $score += 50;
            }
            
            return [
                'type' => 'ai_conversation',
                'id' => $history->id,
                'slug' => $history->slug,
                'conversation_id' => $history->conversation_id,
                'url' => url('/X/' . urlencode($history->slug)),
                'title' => 'AI: ' . ($history->conversation_title ?? $history->query ?? 'Untitled'),
                'subtitle' => 'Slug: ' . $history->slug . ' • ' . $history->formatted_created_at,
                'created_at' => $history->created_at?->diffForHumans(),
                'score' => $score,
                'conversation_title' => $history->conversation_title,
                'message_count' => $history->message_count,
                'query_preview' => Str::limit($history->query, 100),
                'status' => $history->status,
            ];
        });
        
        $response = [
            'success' => true,
            'results' => $formattedResults,
            'all_results_count' => $results->total(),
            'query' => $query,
            'count' => $results->count(),
            'total' => $results->total(),
            'current_page' => $results->currentPage(),
            'total_pages' => $results->lastPage(),
            'per_page' => $results->perPage(),
            'has_more' => $results->hasMorePages(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
            ]
        ];
        
        Cache::put($cacheKey, $response, now()->addSeconds(30));
        
        return response()->json($response);
    }

    /**
     * AI Search using multiple providers with conversation support
     * FULLY FIXED FOR PERPLEXITY with correct model names (sonar, sonar-pro)
     */
    public function aiSearch(Request $request)
    {
        // Check if AI is enabled
        if (!$this->isAiEnabled()) {
            $message = Auth::check() 
                ? 'AI search is currently disabled for logged-in users. Please try again later.'
                : 'AI search is currently disabled for guests. Please log in or try again later.';
                
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 403);
        }
        
        $maxChars = $this->getMaxChars();
        
        if ($maxChars === 0) {
            return response()->json([
                'success' => false,
                'message' => 'AI search is currently disabled. Please try again later.',
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1|max:' . $maxChars,
            'sources' => 'nullable|array',
            'sources.*' => 'string',
            'enable_thinking' => 'nullable|boolean',
            'temperature' => 'nullable|numeric|min:0.1|max:1.0',
            'max_tokens' => 'nullable|integer|min:100|max:4000',
            'stream' => 'nullable|boolean',
            'conversation_id' => 'nullable|string',
            'parent_slug' => 'nullable|string',
            'thread_id' => 'nullable|string',
            'model' => 'nullable|string',
            'as_comment' => 'nullable|boolean',
            'message_id' => 'nullable|integer',
            'content_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $this->getCharLimitMessage(),
            ], 422);
        }
        
        $customSlug = $request->input('custom_slug');
        $query = $request->input('query');
        $sources = $request->input('sources', []);
        $enableThinking = $request->input('enable_thinking', false);
        $temperature = $request->input('temperature', config('services.moonshot.temperature', 0.6));
        $maxTokens = $request->input('max_tokens', config('services.moonshot.max_tokens', 2000));
        $stream = $request->input('stream', false);
        
        $requestedModel = $request->input('model');
        $selectedModel = $this->getValidatedModel($requestedModel);
        
        $conversationId = $request->input('conversation_id');
        $parentSlug = $request->input('parent_slug');
        $threadId = $request->input('thread_id');
        
        try {
            $apiKey = $this->getApiKeyForModel($selectedModel);
            $apiEndpoint = $this->getApiEndpointForModel($selectedModel);
            
            // Log API key status for debugging
            Log::info('API Key check for model', [
                'model' => $selectedModel,
                'has_api_key' => !empty($apiKey),
                'endpoint' => $apiEndpoint,
                'provider' => $this->getProviderName($selectedModel)
            ]);
            
            if (!$apiKey) {
                $provider = $this->getProviderName($selectedModel);
                Log::error($provider . ' API key not configured for model: ' . $selectedModel);
                
                // Try fallback for Perplexity - FIXED with correct model names
                if ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                    $fallbackModel = 'kimi-k3';
                    Log::warning('Perplexity API key missing, falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                // Try fallback for DeepSeek
                if (str_starts_with($selectedModel, 'deepseek-')) {
                    $fallbackModel = 'kimi-k3';
                    Log::warning('DeepSeek API key missing, falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                // Try fallback for Gemini
                if (str_starts_with($selectedModel, 'gemini-')) {
                    $fallbackModel = 'kimi-k3';
                    Log::warning('Gemini API key missing, falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => $provider . ' API key not configured. Please add the API key to your .env file.',
                ], 500);
            }

            $parentMessage = null;
            if ($parentSlug) {
                $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();
                
                if ($parentMessage && !$this->canUserAskQuestion($parentMessage)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to continue this conversation.',
                    ], 403);
                }
                
                if ($parentMessage && !$conversationId) {
                    $conversationId = $parentMessage->conversation_id;
                    $threadId = $parentMessage->thread_id;
                }
            }

            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();
                    
                if ($firstMessage && !$this->canUserAskQuestion($firstMessage)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to continue this conversation.',
                    ], 403);
                }
            }

            $conversationStatus = $this->getConversationStatus($conversationId);
            $conversationHistory = [];
            
            if ($conversationId) {
                $conversation = AISearchHistory::where('conversation_id', $conversationId)
                    ->orderBy('created_at', 'asc')
                    ->get();
                
                foreach ($conversation as $message) {
                    if ($message->status === 'hidden' && !$this->isMessageOwner($message)) {
                        continue;
                    }
                    
                    if ($message->message_role === 'user') {
                        $conversationHistory[] = [
                            'role' => 'user',
                            'content' => $message->query,
                        ];
                    }
                    
                    if ($message->message_role === 'assistant' && $message->response) {
                        $conversationHistory[] = [
                            'role' => 'assistant',
                            'content' => $message->response,
                        ];
                    }
                }
                
                $system_prompt = "You are an AI assistant, and today's date is " . date('D M d Y H:i:s e') . "";
                $messages = [
                    [
                        'role' => 'system',
                        'content' => $system_prompt,
                    ]
                ];
                
                $recentHistory = array_slice($conversationHistory, -10);
                $messages = array_merge($messages, $recentHistory);
                
                $messages[] = [
                    'role' => 'user',
                    'content' => $query,
                ];
            } else {
                $system_prompt = "You are an AI assistant, and today's date is " . date('D M d Y H:i:s e') . "";
                $messages = [
                    [
                        'role' => 'system',
                        'content' => $system_prompt,
                    ],
                    [
                        'role' => 'user',
                        'content' => $query,
                    ],
                ];
            }

            $requestData = [
                'model' => $selectedModel,
                'messages' => $messages,
                'temperature' => (float)$temperature,
                'max_tokens' => (int)$maxTokens,
            ];

            // Provider-specific handling
            if (str_starts_with($selectedModel, 'gemini-')) {
                // Convert to Gemini format
                $geminiContents = [];
                $systemInstruction = null;
                
                foreach ($messages as $message) {
                    if ($message['role'] === 'system') {
                        $systemInstruction = $message['content'];
                    } elseif ($message['role'] === 'user') {
                        $geminiContents[] = [
                            'role' => 'user',
                            'parts' => [['text' => $message['content']]]
                        ];
                    } elseif ($message['role'] === 'assistant') {
                        $geminiContents[] = [
                            'role' => 'model',
                            'parts' => [['text' => $message['content']]]
                        ];
                    }
                }
                
                $requestData = [
                    'contents' => $geminiContents,
                    'generationConfig' => [
                        'temperature' => (float)$temperature,
                        'maxOutputTokens' => (int)$maxTokens,
                        'topP' => 0.95,
                        'topK' => 40,
                    ],
                ];
                
                if ($systemInstruction) {
                    $requestData['systemInstruction'] = [
                        'parts' => [['text' => $systemInstruction]]
                    ];
                }
                
                $requestData['safetySettings'] = [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ]
                ];
                
                if ($enableThinking) {
                    if (!empty($geminiContents)) {
                        $lastIndex = count($geminiContents) - 1;
                        $requestData['contents'][$lastIndex]['parts'][0]['text'] = 
                            "Please think step by step and show your reasoning before providing the final answer:\n\n" . 
                            $requestData['contents'][$lastIndex]['parts'][0]['text'];
                    }
                }
            } elseif (str_starts_with($selectedModel, 'gpt-')) {
                // OpenAI handling
                if ($enableThinking) {
                    $requestData['messages'][0]['content'] .= " Please think step by step and show your reasoning.";
                }
            } elseif (str_starts_with($selectedModel, 'deepseek-')) {
                // DeepSeek handling - Never send 'none' for reasoning_effort
                if ($enableThinking) {
                    $requestData['reasoning_effort'] = 'high';
                }
                if ($maxTokens > 8000) {
                    $requestData['max_tokens'] = min($maxTokens, 8192);
                }
            } elseif ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                // Perplexity handling - FIXED with correct model names
                $requestData['online'] = $enableThinking;
                $requestData['temperature'] = max(0.0, min(2.0, $temperature));
                if ($maxTokens > 4096) {
                    $requestData['max_tokens'] = min($maxTokens, 4096);
                }
            } else {
                // Moonshot/Kimi handling
                if ($enableThinking) {
                    $requestData['thinking'] = ['type' => 'enabled'];
                } else {
                    $requestData['thinking'] = ['type' => 'disabled'];
                }
            }

            if ($stream) {
                $requestData['stream'] = true;
            }

            $headers = $this->getApiHeaders($selectedModel, $apiKey);
            
            $finalEndpoint = $apiEndpoint;
            if (str_starts_with($selectedModel, 'gemini-')) {
                $finalEndpoint = $apiEndpoint . '?key=' . $apiKey;
            }

            // Log request for debugging
            Log::info('Making API request', [
                'model' => $selectedModel,
                'endpoint' => $finalEndpoint,
                'has_api_key' => !empty($apiKey),
                'has_reasoning_effort' => isset($requestData['reasoning_effort']),
                'reasoning_effort_value' => $requestData['reasoning_effort'] ?? 'not_set'
            ]);

            $response = Http::withHeaders($headers)
                ->timeout(60)
                ->post($finalEndpoint, $requestData);

            if (!$response->successful()) {
                $statusCode = $response->status();
                $errorBody = $response->body();
                
                Log::error('API request failed for model ' . $selectedModel, [
                    'status' => $statusCode,
                    'body' => $errorBody,
                    'model' => $selectedModel,
                    'endpoint' => $finalEndpoint
                ]);
                
                // Handle Perplexity errors with fallback - FIXED
                if (($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') && $statusCode >= 400) {
                    $errorData = json_decode($errorBody, true);
                    $errorMessage = $errorData['error']['message'] ?? 'Unknown Perplexity error';
                    
                    Log::error('Perplexity API specific error', [
                        'message' => $errorMessage,
                        'status' => $statusCode,
                        'full_response' => $errorData
                    ]);
                    
                    if ($statusCode >= 400 && $statusCode < 500) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Perplexity API Error: ' . $errorMessage,
                            'answer' => "Perplexity API Error: {$errorMessage}\n\nPlease try using another AI model (Kimi, OpenAI, DeepSeek, or Gemini) from the model selector dropdown, or try again later.",
                            'fallback' => true,
                            'model' => $selectedModel,
                        ], 503);
                    }
                    
                    $fallbackModel = 'kimi-k3';
                    Log::warning('Perplexity returned error ' . $statusCode . ', falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                // Handle DeepSeek errors with fallback
                if (str_starts_with($selectedModel, 'deepseek-') && $statusCode >= 400) {
                    $errorData = json_decode($errorBody, true);
                    $errorMessage = $errorData['error']['message'] ?? 'Unknown DeepSeek error';
                    
                    Log::error('DeepSeek API specific error', [
                        'message' => $errorMessage,
                        'status' => $statusCode,
                        'full_response' => $errorData
                    ]);
                    
                    if ($statusCode >= 400 && $statusCode < 500) {
                        return response()->json([
                            'success' => false,
                            'message' => 'DeepSeek API Error: ' . $errorMessage,
                            'answer' => "DeepSeek API Error: {$errorMessage}\n\nPlease try using another AI model (Kimi, OpenAI, Perplexity, or Gemini) from the model selector dropdown, or try again later.",
                            'fallback' => true,
                            'model' => $selectedModel,
                        ], 503);
                    }
                    
                    $fallbackModel = 'kimi-k3';
                    Log::warning('DeepSeek returned error ' . $statusCode . ', falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                // Handle Gemini errors with fallback
                if (str_starts_with($selectedModel, 'gemini-')) {
                    $errorData = json_decode($errorBody, true);
                    $errorMessage = $errorData['error']['message'] ?? 'Unknown Gemini error';
                    
                    Log::error('Gemini API specific error', [
                        'message' => $errorMessage,
                        'status' => $statusCode,
                        'full_response' => $errorData
                    ]);
                    
                    if ($statusCode >= 400 && $statusCode < 500) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Gemini API Error: ' . $errorMessage,
                            'answer' => "I'm having trouble connecting to Google Gemini. Error: {$errorMessage}\n\nPlease try using another AI model (Kimi, OpenAI, DeepSeek, or Perplexity) from the model selector dropdown, or try again later.",
                            'fallback' => true,
                            'model' => $selectedModel,
                        ], 503);
                    }
                    
                    $fallbackModel = 'kimi-k3';
                    Log::warning('Gemini returned error ' . $statusCode . ', falling back to ' . $fallbackModel);
                    
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                }
                
                throw new \Exception('API request failed: ' . $errorBody);
            }

            $data = $response->json();
            $aiResponse = null;
            $usage = null;
            $finishReason = null;
            $citations = [];
            
            // Parse response based on provider
            if (str_starts_with($selectedModel, 'gemini-')) {
                // Parse Gemini response
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $aiResponse = $data['candidates'][0]['content']['parts'][0]['text'];
                    $finishReason = $data['candidates'][0]['finishReason'] ?? null;
                    $usage = [
                        'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                        'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                        'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                    ];
                } else {
                    Log::error('Gemini response missing expected structure', ['data' => $data]);
                    throw new \Exception('Invalid response format from Gemini API');
                }
            } elseif (str_starts_with($selectedModel, 'deepseek-')) {
                // DeepSeek response parsing
                if (isset($data['choices'][0]['message']['content'])) {
                    $aiResponse = $data['choices'][0]['message']['content'];
                    $finishReason = $data['choices'][0]['finish_reason'] ?? null;
                    
                    if ($enableThinking && isset($data['choices'][0]['message']['reasoning_content'])) {
                        $aiResponse = "**[Thinking Process]**\n\n" . 
                                     $data['choices'][0]['message']['reasoning_content'] . 
                                     "\n\n**[Final Answer]**\n\n" . 
                                     $aiResponse;
                    }
                    
                    $usage = $data['usage'] ?? null;
                } else {
                    Log::error('DeepSeek response missing expected structure', ['data' => $data]);
                    throw new \Exception('Invalid response format from DeepSeek API');
                }
            } elseif (str_starts_with($selectedModel, 'gpt-')) {
                // OpenAI parsing
                $aiResponse = $data['choices'][0]['message']['content'] ?? null;
                $finishReason = $data['choices'][0]['finish_reason'] ?? null;
                $usage = $data['usage'] ?? null;
            } elseif ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                // Perplexity parsing - FIXED with correct model names
                if (isset($data['choices'][0]['message']['content'])) {
                    $aiResponse = $data['choices'][0]['message']['content'];
                    $finishReason = $data['choices'][0]['finish_reason'] ?? null;
                    $usage = $data['usage'] ?? null;
                    
                    // Perplexity may return citations in the response
                    if (isset($data['citations']) && is_array($data['citations'])) {
                        $citations = $data['citations'];
                        if (!empty($citations)) {
                            $aiResponse .= "\n\n**Sources:**\n";
                            foreach ($citations as $index => $citation) {
                                $aiResponse .= ($index + 1) . ". " . $citation . "\n";
                            }
                        }
                    }
                    
                    Log::info('Perplexity response parsed successfully', [
                        'response_length' => strlen($aiResponse),
                        'has_citations' => !empty($citations),
                        'citation_count' => count($citations),
                        'finish_reason' => $finishReason
                    ]);
                } else {
                    Log::error('Perplexity response missing expected structure', ['data' => $data]);
                    throw new \Exception('Invalid response format from Perplexity API');
                }
            } else {
                // Moonshot/Kimi parsing
                $aiResponse = $data['choices'][0]['message']['content'] ?? null;
                $finishReason = $data['choices'][0]['finish_reason'] ?? null;
                $usage = $data['usage'] ?? null;
            }
            
            if ($finishReason === 'length') {
                $aiResponse .= "\n\n*Note: The response was cut short due to token limits. Consider refining your query or increasing max tokens.*";
            }
            
            $aiResponse = $this->formatAIResponse($aiResponse);

            // User requirement: "comments only store in comment table in the db not in conversation as a conversation also for ask ai"
            // If requested as comment / Ask AI comment, store strictly in comments table and return early
            if ($request->boolean('as_comment') || $request->input('content_type') === 'comment') {
                $user = Auth::user();
                $userId = Auth::id();
                $userName = $user ? ($user->name ?? $user->email) : 'Guest';
                $userAvatar = $user ? $user->avatar : null;
                $userEmail = $user ? $user->email : null;

                $targetMessageId = $request->input('message_id') ?: ($parentMessage ? $parentMessage->id : null);
                $targetMessageSlug = $parentSlug ?: ($parentMessage ? $parentMessage->slug : null);

                // 1. Create User Question Comment
                $userComment = \App\Models\Comment::create([
                    'message_id' => $targetMessageId,
                    'message_slug' => $targetMessageSlug,
                    'conversation_id' => $conversationId,
                    'parent_id' => $targetMessageId,
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'user_avatar' => $userAvatar,
                    'user_email' => $userEmail,
                    'content' => $query,
                    'format' => 'markdown',
                    'content_type' => 'comment',
                    'status' => 'approved',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ]);

                // 2. Create AI Response Comment
                $aiComment = \App\Models\Comment::create([
                    'message_id' => $targetMessageId,
                    'message_slug' => $targetMessageSlug,
                    'conversation_id' => $conversationId,
                    'parent_id' => $userComment->id,
                    'user_id' => null,
                    'user_name' => 'AI Assistant',
                    'user_avatar' => null,
                    'user_email' => null,
                    'content' => $aiResponse,
                    'format' => 'markdown',
                    'content_type' => 'ai',
                    'status' => 'approved',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ]);

                $totalComments = \App\Models\Comment::where(function($q) use ($targetMessageId, $targetMessageSlug) {
                    if ($targetMessageId) $q->where('message_id', $targetMessageId);
                    if ($targetMessageSlug) $q->orWhere('message_slug', $targetMessageSlug);
                })->where('status', '!=', 'deleted')->count();

                $formattedUserComment = [
                    'id' => $userComment->id,
                    'message_id' => $userComment->message_id,
                    'message_slug' => $userComment->message_slug,
                    'conversation_id' => $userComment->conversation_id,
                    'parent_id' => $userComment->parent_id,
                    'user_id' => $userComment->user_id,
                    'user_name' => $userComment->user_name ?: 'Anonymous',
                    'user_avatar' => $userComment->user_avatar,
                    'content' => $userComment->content,
                    'format' => $userComment->format ?: 'markdown',
                    'content_type' => $userComment->content_type ?: 'comment',
                    'media' => [],
                    'content_warning' => null,
                    'status' => $userComment->status,
                    'likes_count' => 0,
                    'created_at' => $userComment->created_at ? $userComment->created_at->toISOString() : null,
                    'created_at_formatted' => 'Just now',
                    'is_owner' => true,
                ];

                $formattedAiComment = [
                    'id' => $aiComment->id,
                    'message_id' => $aiComment->message_id,
                    'message_slug' => $aiComment->message_slug,
                    'conversation_id' => $aiComment->conversation_id,
                    'parent_id' => $aiComment->parent_id,
                    'user_id' => null,
                    'user_name' => 'AI Assistant',
                    'user_avatar' => null,
                    'content' => $aiComment->content,
                    'format' => $aiComment->format ?: 'markdown',
                    'content_type' => 'ai',
                    'media' => [],
                    'content_warning' => null,
                    'status' => $aiComment->status,
                    'likes_count' => 0,
                    'created_at' => $aiComment->created_at ? $aiComment->created_at->toISOString() : null,
                    'created_at_formatted' => 'Just now',
                    'is_owner' => false,
                ];

                return response()->json([
                    'success' => true,
                    'is_comment' => true,
                    'message' => 'AI comment posted successfully',
                    'answer' => $aiResponse,
                    'user_comment' => $formattedUserComment,
                    'ai_comment' => $formattedAiComment,
                    'comments_count' => $totalComments,
                    'data' => [$formattedUserComment, $formattedAiComment],
                ]);
            }

            if ($conversationId) {
                AISearchHistory::ensureConversationPositions($conversationId);
                if ($parentMessage) {
                    $parentMessage->refresh();
                }
            }
            $userPosition = null;
			if ($parentMessage) {
				$userPosition = ($parentMessage->position ?? 0) + 1;
				AISearchHistory::where('conversation_id', $conversationId)
					->where('position', '>=', $userPosition)
					->increment('position');
			} else {
				$maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position') ?? -1;
				$userPosition = $maxPosition + 1;
			}
            $userMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'thread_id' => $threadId,
                'query' => $query,
                'response' => null,
                'sources' => array_merge($sources, $citations),
                'usage' => null,
                'thinking_enabled' => $enableThinking,
                'model' => $selectedModel,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => null,
                'status' => $conversationStatus,
				'position' => $userPosition,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);
            
            if ($customSlug && !$conversationId && AISearchHistory::isSlugAvailable($customSlug)) {
                $userMessage->slug = AISearchHistory::cleanSlugForUrl($customSlug);
                $userMessage->save();
            }
            
            if (!$conversationId) {
                $domainfull = idn_to_utf8('ez.wiki');
                $defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
                    $query->where('domain', $domainfull);
                })->first();
                if(Auth::check())
                {
                    $user_id=Auth::id();
                }else
                {
                    $user_id=72;
                }
                $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
                $themeData = [
                    'user_id' => $user_id,
                    'title' => $userMessage->conversation_title,
                    'description' => $userMessage->conversation_title,
                    'price' => 0,
                    'leftwidth' => 0,
                    'rightwidth' => 0,
                    'option' => 'autoplay',
                    'bgcolour' => '#000000',
                    'image' => 'https://ez.wiki/X/'.urldecode($userMessage->slug),
                    'status' => 'active'
                ];
                
                $theme = Template::create($themeData);
                $themetemplate = null;
            
                if (!empty($originalFunnel->theme)) {
                    $themeIds = array_filter(explode(',', $originalFunnel->theme));
                    if ($theme->id !== null) {
                        $templateIds = [$theme->id];
                        $themeIds = array_merge($templateIds, $themeIds);
                    }
                    $themetemplate = implode(',', $themeIds);
                }
                $themetemplate = $theme->id;
                
                $clonedFunnel = $originalFunnel->replicate();
                $clonedFunnel->displaymode = 'ai';
                $clonedFunnel->user_id = $user_id;
                $clonedFunnel->theme = $themetemplate;
                $clonedFunnel->aiid = $userMessage->id;
                $clonedFunnel->save(); 
                
                if (!empty($originalFunnel->theme)) {
                    $themeIds = array_filter(explode(',', $originalFunnel->theme));
                    $existingThemes = Themecollection::where('user_id', $user_id)
                        ->whereIn('theme_id', $themeIds)
                        ->pluck('theme_id')
                        ->toArray();
                    
                    $newThemes = array_diff($themeIds, $existingThemes);
                    $userID = $user_id;
                    $themeData = array_map(function($themeId) use ($userID) {
                        return [
                            'user_id' => $userID,
                            'theme_id' => $themeId
                        ];
                    }, $newThemes);

                    if (!empty($themeData)) {
                        Themecollection::insert($themeData);
                    }
                }
                
                $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
                foreach ($originalFields as $originalField) {
                    $clonedField = $originalField->replicate();
                    $clonedField->ez_funnel_id = $clonedFunnel->id;
                    $clonedField->unique_id = null;
                    $clonedField->save();
                }

                $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
                if ($originalLogo) {
                    $clonedLogo = $originalLogo->replicate();
                    $clonedLogo->funnel_id = $clonedFunnel->id;
                    $clonedLogo->save();
                }

                $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
                if ($originalSeo) {
                    $clonedSeo = $originalSeo->replicate();
                    $clonedSeo->funnel_id = $clonedFunnel->id;
                    $clonedSeo->save();
                }
                if(Auth::check())
                {
                    $ezFunnel = EzFunnel::findOrFail($clonedFunnel->id);
                    $emaildesign = Emaildesign::where('id', 34)->first();
                    $fullfunnel="https://ez.wiki/".$ezFunnel->token;
                    $str = ['{fullfunnel}', '{url}', '{createdate}'];
                    $rplc = [$fullfunnel, $fullfunnel, now()];
                    $div = str_replace($str, $rplc, $emaildesign['design']);
                    $mailData = ['design' => $div];
                    $email = Auth::user()->email;
                    try {
                        $subject = "Ez.wiki Congratulations on your new AI funnel.";
                        Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                        Mail::getSymfonyTransport()->stop();
                    } catch (\Exception $e) {
                        $subject = "Ez.wiki Congratulations on your new AI funnel.";
                        @mail($email, $subject, $div, null, 'funnel@ez.wiki');
                    }
                }
            }
            $aiPosition = $userPosition + 1;
			AISearchHistory::where('conversation_id', $conversationId)
				->where('position', '>=', $aiPosition)
				->increment('position');
    
            $aiMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $userMessage->conversation_id,
                'parent_id' => $userMessage->id,
                'message_role' => 'assistant',
                'thread_id' => $userMessage->thread_id,
                'conversation_title' => $userMessage->conversation_title,
                'query' => $query,
                'response' => $aiResponse,
                'sources' => array_merge($sources, $citations),
                'usage' => $usage,
                'thinking_enabled' => $enableThinking,
                'model' => $selectedModel,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => $finishReason,
                'status' => $conversationStatus,
				'position' => $aiPosition,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
                'file_metadata' => !empty($citations) ? ['citations' => $citations] : null,
            ]);
            
            if (!$parentMessage) {
                AISearchHistory::where('conversation_id', $userMessage->conversation_id)
                    ->update(['conversation_title' => $this->generateConversationTitle($query)]);
            }
            
            $conversationMessages = $this->getFilteredConversationMessages($aiMessage->conversation_id);
            
            if (is_array($conversationMessages)) {
                $conversationMessages = collect($conversationMessages);
            }
            
            $conversationTokens = $conversationMessages->sum('total_tokens');
            $conversationCost = ($conversationTokens / 1000) * 0.01;
            
            $formattedConversationMessages = $conversationMessages->map(function ($message) {
                return AISearchHistory::formatMessageForDisplay($message);
            });
            
            Log::info('API successful response', [
                'provider' => $this->getProviderName($selectedModel),
                'slug' => $aiMessage->slug,
                'model' => $selectedModel,
                'total_tokens' => $usage['total_tokens'] ?? 0,
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'finish_reason' => $finishReason,
                'conversation_id' => $userMessage->conversation_id,
                'message_count' => $conversationMessages->count(),
                'conversation_status' => $conversationStatus,
                'has_citations' => !empty($citations),
            ]);
            
            return response()->json([
                'success' => true,
                'query' => $query,
                'answer' => $aiResponse,
                'usage' => $usage,
                'thinking_enabled' => $enableThinking,
                'sources' => array_merge($sources, $citations),
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => $finishReason,
                'model' => $selectedModel,
                'slug' => $userMessage->slug,
                'parent_slug' => $userMessage->slug,
                'conversation_id' => $userMessage->conversation_id,
                'thread_id' => $userMessage->thread_id,
                'conversation_title' => $aiMessage->conversation_title,
                'conversation_url' => $aiMessage->getConversationUrl(),
                'share_url' => $aiMessage->getShareableUrl(),
                'id' => $aiMessage->id,
                'created_at' => $aiMessage->created_at->toISOString(),
                'created_at_formatted' => $aiMessage->created_at->format('M d, Y \a\t h:i A'),
                'message_count' => $conversationMessages->count(),
                'conversation_messages' => $formattedConversationMessages,
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'status' => $conversationStatus,
                'user' => Auth::user() ? [
                    'id' => Auth::user()->id,
                    'name' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'avatar' => Auth::user()->avatar,
                ] : null,
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Search error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'query' => $query,
                'temperature' => $temperature,
                'user_id' => Auth::id(),
                'model' => $selectedModel,
            ]);

            // Try fallback for Perplexity errors - FIXED
            if ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                $fallbackModel = 'kimi-k3';
                Log::warning('Perplexity error, attempting fallback to ' . $fallbackModel);
                
                try {
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                } catch (\Exception $fallbackError) {
                    Log::error('Fallback also failed: ' . $fallbackError->getMessage());
                }
            }

            // Try fallback for DeepSeek errors
            if (str_starts_with($selectedModel, 'deepseek-')) {
                $fallbackModel = 'kimi-k3';
                Log::warning('DeepSeek error, attempting fallback to ' . $fallbackModel);
                
                try {
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                } catch (\Exception $fallbackError) {
                    Log::error('Fallback also failed: ' . $fallbackError->getMessage());
                }
            }

            // Try fallback for Gemini errors
            if (str_starts_with($selectedModel, 'gemini-')) {
                $fallbackModel = 'kimi-k3';
                Log::warning('Gemini error, attempting fallback to ' . $fallbackModel);
                
                try {
                    $fallbackRequest = new Request($request->all());
                    $fallbackRequest->merge(['model' => $fallbackModel]);
                    return $this->aiSearch($fallbackRequest);
                } catch (\Exception $fallbackError) {
                    Log::error('Fallback also failed: ' . $fallbackError->getMessage());
                }
            }

            $fallbackResponse = "I apologize, but I'm unable to process your request at the moment. ";
            $fallbackResponse .= "Please try again in a few moments or rephrase your question.";
            
            // Add provider-specific message
            if ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                $fallbackResponse = "Perplexity is temporarily unavailable. Please try using a different AI model (Kimi, OpenAI, DeepSeek, or Gemini) from the model selector dropdown, or try again later.\n\n" . $fallbackResponse;
            } elseif (str_starts_with($selectedModel, 'deepseek-')) {
                $fallbackResponse = "DeepSeek is temporarily unavailable. Please try using a different AI model (Kimi, OpenAI, Perplexity, or Gemini) from the model selector dropdown, or try again later.\n\n" . $fallbackResponse;
            } elseif (str_starts_with($selectedModel, 'gemini-')) {
                $fallbackResponse = "Google Gemini is temporarily unavailable. Please try using a different AI model (Kimi, OpenAI, DeepSeek, or Perplexity) from the model selector dropdown, or try again later.\n\n" . $fallbackResponse;
            }
            
            $conversationStatus = $this->getConversationStatus($conversationId);
            
            if ($conversationId) {
                AISearchHistory::ensureConversationPositions($conversationId);
                if ($parentMessage) {
                    $parentMessage->refresh();
                }
            }

            $userPosition = null;
			if ($parentMessage) {
				$userPosition = ($parentMessage->position ?? 0) + 1;
				AISearchHistory::where('conversation_id', $conversationId)
					->where('position', '>=', $userPosition)
					->increment('position');
			} else {
				$maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position');
				$userPosition = ($maxPosition !== null) ? ($maxPosition + 1) : 0;
			}
            
            $userMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'thread_id' => $threadId,
                'query' => $query,
                'response' => null,
                'sources' => $sources,
                'thinking_enabled' => $enableThinking,
                'model' => $selectedModel,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'status' => $conversationStatus,
                'position' => $userPosition,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);
            
            $aiPosition = $userPosition + 1;
			AISearchHistory::where('conversation_id', $conversationId)
				->where('position', '>=', $aiPosition)
				->increment('position');
            
            $aiMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $userMessage->conversation_id,
                'parent_id' => $userMessage->id,
                'message_role' => 'assistant',
                'thread_id' => $userMessage->thread_id,
                'query' => $query,
                'response' => $fallbackResponse,
                'sources' => $sources,
                'thinking_enabled' => $enableThinking,
                'model' => $selectedModel,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'status' => $conversationStatus,
                'position' => $aiPosition,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);
            
            $conversationMessages = $this->getFilteredConversationMessages($aiMessage->conversation_id);
            
            if (is_array($conversationMessages)) {
                $conversationMessages = collect($conversationMessages);
            }
            
            $conversationTokens = $conversationMessages->sum('total_tokens');
            $conversationCost = ($conversationTokens / 1000) * 0.01;
            
            return response()->json([
                'success' => false,
                'message' => ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro')
                    ? 'Perplexity service is temporarily unavailable. Please try a different model.'
                    : (str_starts_with($selectedModel, 'deepseek-')
                        ? 'DeepSeek service is temporarily unavailable. Please try a different model.'
                        : (str_starts_with($selectedModel, 'gemini-')
                            ? 'Google Gemini service is temporarily unavailable. Please try a different model.'
                            : 'AI service temporarily unavailable. Please try again.')),
                'answer' => $fallbackResponse,
                'fallback' => true,
                'model' => $selectedModel,
                'slug' => $aiMessage->slug,
                'parent_slug' => $userMessage->slug,
                'conversation_id' => $userMessage->conversation_id,
                'thread_id' => $userMessage->thread_id,
                'share_url' => $aiMessage->getShareableUrl(),
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'status' => $conversationStatus,
            ], 503);
        }
    }

    /**
     * Stream AI Search response with model selection
     */
    public function aiSearchStream(Request $request): StreamedResponse
    {
        if (!$this->isAiEnabled()) {
            return response()->stream(function () {
                echo 'data: ' . json_encode(['error' => 'AI search is currently disabled. Please try again later.']) . "\n\n";
                ob_flush();
                flush();
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
            ]);
        }
        
        $maxChars = $this->getMaxChars();
        
        if ($maxChars === 0) {
            return response()->stream(function () {
                echo 'data: ' . json_encode(['error' => 'AI search is currently disabled. Please try again later.']) . "\n\n";
                ob_flush();
                flush();
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
            ]);
        }
        
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1|max:' . $maxChars,
            'enable_thinking' => 'nullable|boolean',
            'temperature' => 'nullable|numeric|min:0.1|max:1.0',
            'max_tokens' => 'nullable|integer|min:100|max:4000',
            'conversation_id' => 'nullable|string',
            'parent_slug' => 'nullable|string',
            'thread_id' => 'nullable|string',
            'model' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->stream(function () use ($validator) {
                echo 'data: ' . json_encode(['error' => $validator->errors()->first()]) . "\n\n";
                ob_flush();
                flush();
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
            ]);
        }

        $query = $request->input('query');
        $enableThinking = $request->input('enable_thinking', false);
        $temperature = $request->input('temperature', config('services.moonshot.temperature', 0.6));
        $maxTokens = $request->input('max_tokens', config('services.moonshot.max_tokens', 2000));
        $conversationId = $request->input('conversation_id');
        $parentSlug = $request->input('parent_slug');
        $threadId = $request->input('thread_id');
        $requestedModel = $request->input('model');
        $selectedModel = $this->getValidatedModel($requestedModel);

        return response()->stream(function () use ($query, $enableThinking, $temperature, $maxTokens, $conversationId, $parentSlug, $threadId, $maxChars, $selectedModel) {
            $apiKey = $this->getApiKeyForModel($selectedModel);
            $apiEndpoint = $this->getApiEndpointForModel($selectedModel);
            
            if (!$apiKey) {
                $provider = $this->getProviderName($selectedModel);
                echo 'data: ' . json_encode(['error' => $provider . ' API key not configured']) . "\n\n";
                ob_flush();
                flush();
                return;
            }
            
            $client = new \GuzzleHttp\Client();
            
            try {
                $parentMessage = null;
                if ($parentSlug) {
                    $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();
                    
                    if ($parentMessage) {
                        $hasAccess = $this->checkMessageAccess($parentMessage);
                        if (!$hasAccess) {
                            echo 'data: ' . json_encode(['error' => 'You do not have permission to continue this conversation.']) . "\n\n";
                            ob_flush();
                            flush();
                            return;
                        }
                        
                        if ($parentMessage && !$conversationId) {
                            $conversationId = $parentMessage->conversation_id;
                            $threadId = $parentMessage->thread_id;
                        }
                    }
                }

                if ($conversationId) {
                    $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                        ->whereNull('parent_id')
                        ->first();
                        
                    if ($firstMessage) {
                        $hasAccess = $this->checkMessageAccess($firstMessage);
                        if (!$hasAccess) {
                            echo 'data: ' . json_encode(['error' => 'You do not have permission to continue this conversation.']) . "\n\n";
                            ob_flush();
                            flush();
                            return;
                        }
                    }
                }

                $conversationHistory = [];
                
                if ($conversationId) {
                    $conversation = AISearchHistory::where('conversation_id', $conversationId)
                        ->orderBy('created_at', 'asc')
                        ->get();
                    
                    foreach ($conversation as $message) {
                        if ($message->status === 'hidden' && !$this->isMessageOwner($message)) {
                            continue;
                        }
                        
                        if ($message->message_role === 'user') {
                            $conversationHistory[] = [
                                'role' => 'user',
                                'content' => $message->query,
                            ];
                        }
                        
                        if ($message->message_role === 'assistant' && $message->response) {
                            $conversationHistory[] = [
                                'role' => 'assistant',
                                'content' => $message->response,
                            ];
                        }
                    }
                    
                    $system_prompt = "You are an AI assistant, and today's date is " . date('D M d Y H:i:s e') . "";
                    $messages = [
                        [
                            'role' => 'system',
                            'content' => $system_prompt,
                        ]
                    ];
                    
                    $recentHistory = array_slice($conversationHistory, -10);
                    $messages = array_merge($messages, $recentHistory);
                    
                    $messages[] = [
                        'role' => 'user',
                        'content' => $query,
                    ];
                } else {
                    $system_prompt = "You are an AI assistant, and today's date is " . date('D M d Y H:i:s e') . "";
                    $messages = [
                        [
                            'role' => 'system',
                            'content' => $system_prompt,
                        ],
                        [
                            'role' => 'user',
                            'content' => $query,
                        ],
                    ];
                }

                $requestData = [
                    'model' => $selectedModel,
                    'messages' => $messages,
                    'temperature' => (float)$temperature,
                    'max_tokens' => (int)$maxTokens,
                    'stream' => true,
                ];

                // Provider-specific streaming handling
                if (str_starts_with($selectedModel, 'gemini-')) {
                    $geminiContents = [];
                    $systemInstruction = null;
                    
                    foreach ($messages as $message) {
                        if ($message['role'] === 'system') {
                            $systemInstruction = $message['content'];
                        } elseif ($message['role'] === 'user') {
                            $geminiContents[] = [
                                'role' => 'user',
                                'parts' => [['text' => $message['content']]]
                            ];
                        } elseif ($message['role'] === 'assistant') {
                            $geminiContents[] = [
                                'role' => 'model',
                                'parts' => [['text' => $message['content']]]
                            ];
                        }
                    }
                    
                    $requestData = [
                        'contents' => $geminiContents,
                        'generationConfig' => [
                            'temperature' => (float)$temperature,
                            'maxOutputTokens' => (int)$maxTokens,
                            'topP' => 0.95,
                            'topK' => 40,
                        ],
                    ];
                    
                    if ($systemInstruction) {
                        $requestData['systemInstruction'] = [
                            'parts' => [['text' => $systemInstruction]]
                        ];
                    }
                    
                    if ($enableThinking) {
                        if (!empty($geminiContents)) {
                            $lastIndex = count($geminiContents) - 1;
                            $requestData['contents'][$lastIndex]['parts'][0]['text'] = 
                                "Please think step by step and show your reasoning before providing the final answer:\n\n" . 
                                $requestData['contents'][$lastIndex]['parts'][0]['text'];
                        }
                    }
                } elseif (str_starts_with($selectedModel, 'gpt-')) {
                    if ($enableThinking) {
                        $requestData['messages'][0]['content'] .= " Please think step by step and show your reasoning.";
                    }
                } elseif (str_starts_with($selectedModel, 'deepseek-')) {
                    if ($enableThinking) {
                        $requestData['reasoning_effort'] = 'high';
                    }
                } elseif ($selectedModel === 'sonar' || $selectedModel === 'sonar-pro') {
                    // Perplexity streaming - FIXED with correct model names
                    $requestData['online'] = $enableThinking;
                    $requestData['temperature'] = max(0.0, min(2.0, $temperature));
                } else {
                    if ($enableThinking) {
                        $requestData['thinking'] = ['type' => 'enabled'];
                    } else {
                        $requestData['thinking'] = ['type' => 'disabled'];
                    }
                }

                $headers = $this->getApiHeaders($selectedModel, $apiKey);
                $headers['Accept'] = 'text/event-stream';
                $headers['Cache-Control'] = 'no-cache';
                
                $finalEndpoint = $apiEndpoint;
                if (str_starts_with($selectedModel, 'gemini-')) {
                    $finalEndpoint = $apiEndpoint . '?key=' . $apiKey;
                }

                $response = $client->post($finalEndpoint, [
                    'headers' => $headers,
                    'json' => $requestData,
                    'stream' => true,
                ]);

                $body = $response->getBody();
                
                while (!$body->eof()) {
                    $chunk = $body->read(1024);
                    if (!empty(trim($chunk))) {
                        echo $chunk;
                        ob_flush();
                        flush();
                    }
                }

            } catch (\Exception $e) {
                echo 'data: ' . json_encode(['error' => $e->getMessage()]) . "\n\n";
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Get AI search result by slug with conversation support and access control
     */
    public function getAISearchBySlug($slug)
    {
        $decodedSlug = urldecode($slug);
        
        $search = AISearchHistory::where('slug', $decodedSlug)->first();
        
        if (!$search) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI search not found',
                ], 404);
            }
            
            return redirect('/')->with('error', 'AI search not found');
        }
        
        $firstMessage = $search->getFirstMessage();
        $conversationStatus = $firstMessage ? $firstMessage->status : $search->status;
        $guestsAllowed = $this->canGuestsInteract($firstMessage);
        
        $guestInteractionDisabled = false;
        $requiresLogin = false;
        
        $hasPrivateAccess = false;
        $sessionData = session('private_access_' . $firstMessage->conversation_id);
        if (!is_null($sessionData) && isset($sessionData['token'])) {
            $hasPrivateAccess = true;
        }
        
        $isOwner = Auth::check() && $firstMessage && $firstMessage->user_id === Auth::id();
        $hasViewAccess = false;
        
        if ($conversationStatus === 'private') {
            if ($isOwner || $hasPrivateAccess) {
                $hasViewAccess = true;
                $requiresLogin = false;
                $guestInteractionDisabled = false;
            } else {
                $hasViewAccess = false;
                $requiresLogin = false;
                $guestInteractionDisabled = false;
            }
        } else {
            $hasViewAccess = true;
            $guestInteractionDisabled = false;
            $requiresLogin = false;
        }
        
        if ($hasPrivateAccess && $conversationStatus === 'private') {
            $guestInteractionDisabled = false;
            $requiresLogin = false;
        }
        
        AISearchHistory::ensureConversationPositions($search->conversation_id);
        $conversationMessages = $this->getFilteredConversationMessages($search->conversation_id);
        
        if ($hasPrivateAccess && !$isOwner) {
            $conversationMessages = AISearchHistory::where('conversation_id', $search->conversation_id)
                ->orderBy('position', 'asc')
                ->orderBy('created_at', 'asc')
                ->get()
                ->filter(function ($message) use ($hasPrivateAccess, $isOwner) {
                    if ($message->status === 'hidden' && !$isOwner) {
                        return false;
                    }
                    return true;
                })
                ->values();
        }
        
        if (is_array($conversationMessages)) {
            $conversationMessages = collect($conversationMessages);
        }
        
        $conversationTokens = $conversationMessages->sum('total_tokens');
        $conversationCost = ($conversationTokens / 1000) * 0.01;
        
        $firstMessage = $search->getFirstMessage();
        
        $relatedSearches = $firstMessage ? $firstMessage->getRelatedSearches(5) : collect();
        $relatedSearches = $relatedSearches->filter(function($related) {
            return $related->status === 'public';
        })->take(3);
        
        $formattedMessages = $conversationMessages->map(function ($message) {
            return AISearchHistory::formatMessageForDisplay($message);
        });
        
        $tooltips = AITooltip::where('component', 'AISearchView')
            ->orWhere('component', 'AI Search View')
            ->get()
            ->pluck('tooltips', 'reference')
            ->map(function($tooltip) {
                return is_array($tooltip) ? $tooltip[0] : (is_string($tooltip) ? json_decode($tooltip, true)[0] ?? $tooltip : $tooltip);
            })
            ->toArray();
        
        $landingPageUrl = null;
        if ($firstMessage && $firstMessage->landing_page_url) {
            $landingPageUrl = $firstMessage->landing_page_url;
        } elseif ($search->landing_page_url) {
            $landingPageUrl = $search->landing_page_url;
        }
        
        if (request()->expectsJson()) {
            $response = [
                'success' => true,
                'data' => [
                    'id' => $search->id,
                    'slug' => $search->slug,
                    'conversation_id' => $search->conversation_id,
                    'thread_id' => $search->thread_id,
                    'conversation_title' => $search->conversation_title,
                    'message_role' => $search->message_role,
                    'content_type' => $search->content_type,
                    'query' => $search->query,
                    'response' => $search->response,
                    'sources' => $search->sources,
                    'usage' => $search->usage,
                    'thinking_enabled' => $search->thinking_enabled,
                    'model' => $search->model,
                    'temperature' => $search->temperature,
                    'max_tokens' => $search->max_tokens,
                    'finish_reason' => $search->finish_reason,
                    'created_at' => $search->created_at->toISOString(),
                    'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                    'updated_at' => $search->updated_at->toISOString(),
                    'user' => $search->user ? [
                        'id' => $search->user->id,
                        'name' => $search->user->name,
                        'email' => $search->user->email,
                        'avatar' => $search->user->avatar,
                    ] : null,
                    'status' => $search->status,
                    'share_url' => $search->getShareableUrl(),
                    'conversation_url' => $search->getConversationUrl(),
                    'total_tokens' => $search->total_tokens,
                    'conversation_tokens' => $conversationTokens,
                    'conversation_cost' => $conversationCost,
                    'landing_page_url' => $landingPageUrl,
                ],
                'conversation_messages' => $formattedMessages,
                'message_count' => $conversationMessages->count(),
                'first_message' => $firstMessage ? [
                    'slug' => $firstMessage->slug,
                    'query' => $firstMessage->query,
                    'created_at' => $firstMessage->created_at->toISOString(),
                    'status' => $firstMessage->status,
                    'landing_page_url' => $firstMessage->landing_page_url,
                ] : null,
                'related' => $relatedSearches->map(function ($related) {
                    return [
                        'slug' => $related->slug,
                        'query' => $related->query,
                        'conversation_title' => $related->conversation_title,
                        'created_at' => $related->created_at->toISOString(),
                        'share_url' => $related->getShareableUrl(),
                        'message_count' => $related->message_count,
                        'status' => $related->status,
                    ];
                }),
                'guest_interaction_disabled' => $guestInteractionDisabled,
                'requires_login' => $requiresLogin,
                'has_private_access' => $hasPrivateAccess,
            ];
            
            return response()->json($response);
        }
        
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
        $codepage = Page::where('id',5)->value('code');
		$metaTitle = 'Ez way to WiKi and CoWiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'ez.wiki';
		$metaLogo = 'https://ez.wiki/ezlogo.png';
		$favicon = 'https://ez.wiki/ezlogo.png';
		$qrcodelogo= 'https://ez.wiki/ezlogo.png';
		$funnelData = EzFunnel::where('ez_funnels.aiid', $search->id)->value('id');
		if ($funnelData) {
			$seoSettings = FunnelSeoSetting::where('funnel_id', $funnelData)->first();   
			if ($seoSettings) {
				$metaTitle = $seoSettings->meta_title ?? $metaTitle;
				$metaDescription = $seoSettings->meta_description ?? $metaDescription;
				$metaKeywords = $seoSettings->meta_keywords ?? $metaKeywords;
				$metaSiteUrl = $seoSettings->meta_site_url ?? $metaSiteUrl;
				$metaSiteName = $seoSettings->meta_site_name ?? $metaSiteName;
				$metaLogo = $seoSettings->meta_logo ?? $metaLogo;
			}
			
			$logoSettings = FunnelLogoSetting::where('funnel_id', $funnelData)->first();
			if ($logoSettings) {
				if ($logoSettings->favicon_logo == 1) {
					$favicon = 'https://ez.wiki/'.$logoSettings->logoimage ?? $favicon;
				}
				if ($logoSettings->meta_logo == 1) {
					$metaLogo = 'https://ez.wiki/'.$logoSettings->logoimage ?? $metaLogo;
				}
				if ($logoSettings->fly_sign_logo == 1 && $effect->isNotEmpty()) {
					$effect->first()->moving_effect = 'none';
					$effect->first()->avatar_link = 'https://ez.wiki/'.$logoSettings->logoimage;
				}
				$qrcodelogo= 'https://ez.wiki/'.$logoSettings->logoimage ?? $qrcodelogo;
			}
		}

        // Fetch comments for this conversation and its messages
        $convMessageIds = $conversationMessages->pluck('id')->toArray();
        $convMessageSlugs = $conversationMessages->pluck('slug')->toArray();
        $initialComments = \App\Models\Comment::with(['user:id,name,avatar,email'])
            ->where('status', '!=', 'deleted')
            ->where(function ($q) use ($search, $convMessageIds, $convMessageSlugs) {
                if ($search->conversation_id) {
                    $q->where('conversation_id', $search->conversation_id);
                }
                if (!empty($convMessageIds)) {
                    $q->orWhereIn('message_id', $convMessageIds);
                }
                if (!empty($convMessageSlugs)) {
                    $q->orWhereIn('message_slug', $convMessageSlugs);
                }
            })
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
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
                    'is_owner' => \Illuminate\Support\Facades\Auth::check() && $comment->user_id === \Illuminate\Support\Facades\Auth::id(),
                ];
            });

        return Inertia::render('AISearchView', [
            'initial_comments' => $initialComments,
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
            'tooltips' => $tooltips,
            'codepage' => $codepage,
            'checkDomainUrl' => url('/check-custom-domain'),
            'checkStandardDomainUrl' => url('/check-ezpressstandard-domain'),
            'aiSettings' => $this->aiSettings,
            'search' => [
                'id' => $search->id,
                'slug' => $search->slug,
                'conversation_id' => $search->conversation_id,
                'thread_id' => $search->thread_id,
                'conversation_title' => $search->conversation_title,
                'message_role' => $search->message_role,
                'content_type' => $search->content_type,
                'query' => $search->query,
                'response' => $search->response,
                'sources' => $search->sources,
                'usage' => $search->usage,
                'thinking_enabled' => $search->thinking_enabled,
                'model' => $search->model,
                'temperature' => $search->temperature,
                'max_tokens' => $search->max_tokens,
                'finish_reason' => $search->finish_reason,
                'created_at' => $search->created_at->toISOString(),
                'created_at_formatted' => $search->created_at->format('M d, Y \a\t h:i A'),
                'updated_at' => $search->updated_at->toISOString(),
                'share_url' => $search->getShareableUrl(),
                'conversation_url' => $search->getConversationUrl(),
                'total_tokens' => $search->total_tokens,
                'conversation_tokens' => $conversationTokens,
                'conversation_cost' => $conversationCost,
                'status' => $search->status,
                'user' => $search->user ? [
                    'id' => $search->user->id,
                    'name' => $search->user->name,
                    'email' => $search->user->email,
                    'avatar' => $search->user->avatar,
                ] : null,
                'landing_page_url' => $landingPageUrl,
            ],
            'conversation_messages' => $formattedMessages,
            'message_count' => $conversationMessages->count(),
            'share_url' => $search->getShareableUrl(),
            'related_searches' => $relatedSearches->map(function ($related) {
                return [
                    'slug' => $related->slug,
                    'query' => $related->query,
                    'conversation_title' => $related->conversation_title,
                    'created_at' => $related->created_at->toISOString(),
                    'share_url' => $related->getShareableUrl(),
                    'message_count' => $related->message_count,
                    'status' => $related->status,
                ];
            }),
            'guestInteractionDisabled' => $guestInteractionDisabled,
            'requiresLogin' => $requiresLogin,
            'hasPrivateAccess' => $hasPrivateAccess,
        ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
    }

    /**
     * Get conversation by ID with access control
     */
    public function getConversation($conversationId)
    {
        $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first();
        
        if (!$firstMessage) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }
        
        $hasAccess = $this->checkMessageAccess($firstMessage);
        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view this conversation.',
            ], 403);
        }
        
        $guestsAllowed = $this->canGuestsInteract($firstMessage);
        
        $messages = $this->getFilteredConversationMessages($conversationId);
        
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
            'status' => $firstMessage->status,
            'guests_allowed' => $guestsAllowed,
            'messages' => $messages->map(function ($message) {
                return [
                    'id' => $message->id,
                    'slug' => $message->slug,
                    'message_role' => $message->message_role,
                    'content_type' => $message->content_type,
                    'parent_id' => $message->parent_id,
                    'position' => $message->position ?? null,
                    'query' => $message->query,
                    'response' => $message->response,
                    'file_data' => $message->file_data,
                    'file_metadata' => $message->file_metadata,
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
					'social_media_metadata' => $message->social_media_metadata,
                    'user' => $message->user ? [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'email' => $message->user->email,
                        'avatar' => $message->user->avatar,
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Delete entire conversation with access control
     */
    public function deleteConversation($conversationId)
    {
        $messages = AISearchHistory::where('conversation_id', $conversationId)->get();
        
        if ($messages->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }
        
        $user = Auth::user();
        $sessionId = Session::getId();
        $rootMessage = $messages->whereNull('parent_id')->first() ?? $messages->first();
        
        $isOwner = $rootMessage->isOwnedBy($user, $sessionId);
        
        if (!$isOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this conversation',
            ], 403);
        }
        
        $deletedCount = AISearchHistory::where('conversation_id', $conversationId)->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
            'deleted_count' => $deletedCount,
        ]);
    }

    /**
     * Get user's AI conversation history with access control
     */
    public function getAISearchHistory(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            $sessionId = Session::getId();
            $conversations = AISearchHistory::where('session_id', $sessionId)
                ->whereNull('parent_id')
                ->where('status', '!=', 'hidden')
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } else {
            $conversations = AISearchHistory::where('user_id', $user->id)
                ->whereNull('parent_id')
                ->where('status', '!=', 'hidden')
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        }
        
        return response()->json([
            'success' => true,
            'data' => $conversations->map(function ($conversation) {
                $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->where('status', '!=', 'hidden')
                    ->count();
                
                $lastMessage = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->where('status', '!=', 'hidden')
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                $conversationTokens = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->where('status', '!=', 'hidden')
                    ->sum('total_tokens');
                $conversationCost = ($conversationTokens / 1000) * 0.01;
                
                return [
                    'id' => $conversation->id,
                    'slug' => $conversation->slug,
                    'conversation_id' => $conversation->conversation_id,
                    'conversation_title' => $conversation->conversation_title,
                    'query' => $conversation->query,
                    'response_preview' => $conversation->response_preview,
                    'created_at' => $conversation->created_at->toISOString(),
                    'created_at_formatted' => $conversation->formatted_created_at,
                    'updated_at' => $lastMessage ? $lastMessage->created_at->toISOString() : $conversation->created_at->toISOString(),
                    'share_url' => $conversation->getConversationUrl(),
                    'thinking_enabled' => $conversation->thinking_enabled,
                    'model' => $conversation->model,
                    'temperature' => $conversation->temperature,
                    'max_tokens' => $conversation->max_tokens,
                    'total_tokens' => $conversationTokens,
                    'conversation_cost' => $conversationCost,
                    'message_count' => $messageCount,
                    'status' => $conversation->status,
                    'last_message_preview' => $lastMessage ? Str::limit(strip_tags($lastMessage->response ?? $lastMessage->query), 100) : null,
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
     * Delete AI search by slug with access control
     */
    public function deleteAISearch(Request $request, $slug)
    {
        $decodedSlug = urldecode($slug);
        
        $search = AISearchHistory::where('slug', $decodedSlug)->first()
            ?? AISearchHistory::where('id', $slug)->first();
        
        if (!$search) {
            return response()->json([
                'success' => false,
                'message' => 'AI search not found',
            ], 404);
        }
        
        $user = Auth::user();
        $sessionId = Session::getId();
        $isOwner = $search->isOwnedBy($user, $sessionId);
        
        if (!$isOwner) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this search',
            ], 403);
        }
        
        if (empty($search->parent_id)) {
            return $this->deleteConversation($search->conversation_id);
        }
        
        $search->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'AI search deleted successfully',
        ]);
    }

    /**
     * Get popular AI searches (only public ones)
     */
    public function getPopularAISearches(Request $request)
    {
        $limit = $request->input('limit', 10);
        
        $popularSearches = AISearchHistory::select('query')
            ->selectRaw('COUNT(*) as search_count')
            ->whereNull('parent_id')
            ->where('status', 'public')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('query')
            ->orderByDesc('search_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'query' => $item->query,
                    'search_count' => $item->search_count,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $popularSearches,
        ]);
    }

    /**
     * Get search suggestions (autocomplete)
     */
    public function suggestions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['suggestions' => []]);
        }

        $query = $request->input('query');
        $suggestions = [];

        $titles = Template::query()
            ->where('title', 'like', "%{$query}%")
            ->limit(3)
            ->pluck('title');
        
        $suggestions = array_merge($suggestions, $titles->toArray());
        
        $funnelTokens = EzFunnel::query()
            ->where('token', 'like', "%{$query}%")
            ->limit(2)
            ->pluck('token')
            ->map(fn($token) => 'ez.wiki/' . $token);
        
        $suggestions = array_merge($suggestions, $funnelTokens->toArray());
        
        $aiSlugs = AISearchHistory::query()
            ->where('slug', 'like', "%{$query}%")
            ->where('message_role', 'user')
            ->whereNull('parent_id')
            ->limit(2)
            ->pluck('slug')
            ->map(fn($slug) => '/X/' . $slug);
        
        $suggestions = array_merge($suggestions, $aiSlugs->toArray());
        
        $smartSuggestions = $this->getSmartSuggestions($query);
        $suggestions = array_merge($suggestions, $smartSuggestions);

        return response()->json([
            'suggestions' => array_slice(array_unique($suggestions), 0, 5),
        ]);
    }

    /**
     * Get system prompt based on sources
     */
    private function getSystemPrompt(array $sources = []): string
    {
        $basePrompt = 'You are a helpful AI assistant for a link bookmarking and discovery platform called Ez.wiki. ';
        $basePrompt .= 'Provide concise, accurate, and helpful answers. ';
        $basePrompt .= 'When referencing sources, be clear and specific. ';
        $basePrompt .= 'You can help users find links, summarize content, and answer questions about web resources. ';
        $basePrompt .= 'Format your responses in clear, readable markdown. Use bullet points for lists and bold text for important information.';
        $basePrompt .= 'If you reference a website or source, include the full URL if available.';

        if (!empty($sources)) {
            $basePrompt .= ' The user has referenced the following sources: ' . implode(', ', $sources) . '. ';
            $basePrompt .= 'Prioritize information from these sources when available.';
        }

        return $basePrompt;
    }

    /**
     * Format AI response for better readability
     */
    private function formatAIResponse(string $response): string
    {
        $response = trim($response);
        
        $response = preg_replace('/\*\*(.*?)\*\*/', '**$1**', $response);
        $response = preg_replace('/\*(.*?)\*/', '*$1*', $response);
        
        $response = preg_replace('/(?<!\.)\n(?!\n)/', "  \n", $response);
        
        $response = preg_replace('/```(.*?)```/s', "```$1```", $response);
        
        return $response;
    }

    /**
     * Generate conversation title for different languages
     */
    private function generateConversationTitle(string $query): string
    {
        $query = trim($query);
        
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $query)) {
            $title = '中文对话: ' . mb_substr($query, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $query)) {
            $title = '日本語の会話: ' . mb_substr($query, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{AC00}-\x{D7AF}]/u', $query)) {
            $title = '한국어 대화: ' . mb_substr($query, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{0600}-\x{06FF}]/u', $query)) {
            $title = 'محادثة عربية: ' . mb_substr($query, 0, 30, 'UTF-8');
        } else {
            $title = Str::limit($query, 60);
        }
        
        return $title;
    }

    /**
     * Calculate relevance score for search results
     */
    private function calculateRelevanceScore(string $text, string $query, string $type = ''): int
    {
        if (empty($text) || empty($query)) {
            return 0;
        }
        
        $score = 0;
        $query = strtolower($query);
        $text = strtolower($text);
        
        if ($text === $query) {
            $score += 100;
        }
        
        if (str_starts_with($text, $query)) {
            $score += 50;
        }
        
        if (str_contains($text, $query)) {
            $score += 30;
        }
        
        $queryWords = explode(' ', $query);
        foreach ($queryWords as $word) {
            if (str_contains($text, $word) && strlen($word) > 2) {
                $score += 10;
            }
        }
        
        switch ($type) {
            case 'funnel':
                $score += 5;
                break;
            case 'field':
                $score += 3;
                break;
            case 'custom_domain':
                $score += 7;
                break;
            case 'domain':
                $score += 6;
                break;
            case 'theme':
                $score += 4;
                break;
            case 'ai_history':
                $score += 8;
                break;
            case 'ai_slug':
                $score += 10;
                break;
        }
        
        return max(0, $score);
    }

    /**
     * Get smart search suggestions based on query
     */
    private function getSmartSuggestions(string $query): array
    {
        if (empty($query)) {
            return [];
        }
        
        $suggestions = [];
        
        $popularQueries = [
            'parenting', 'news', 'travel', 'technology',
            'health', 'finance', 'education', 'entertainment',
            'business', 'sports', 'science', 'art',
            'music', 'food', 'fashion', 'gaming'
        ];
        
        foreach ($popularQueries as $popular) {
            if (str_starts_with($popular, strtolower($query)) || 
                str_contains($popular, strtolower($query))) {
                $suggestions[] = ucfirst($popular);
            }
        }
        
        if (strlen($query) > 3) {
            $suggestions[] = $query . ' guide';
            $suggestions[] = $query . ' tips';
            $suggestions[] = 'best ' . $query;
            $suggestions[] = $query . ' tutorial';
            $suggestions[] = 'how to ' . $query;
        }
        
        if (preg_match('/[a-z0-9\-]+/i', $query)) {
            $suggestions[] = 'ez.wiki/' . $query;
            $suggestions[] = 'https://' . $query . '.com';
            $suggestions[] = '/X/' . $query;
        }
        
        return array_slice(array_unique($suggestions), 0, 5);
    }
    
    /**
     * Generate QR code for a URL
     */
    public function generateQrCode(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'url' => 'required|url',
                'size' => 'nullable|integer|min:100|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $url = $request->input('url');
            $size = $request->input('size', 200);
            
            $qrCodeUrl = 'https://chart.googleapis.com/chart?chs=' . $size . 'x' . $size . '&cht=qr&chl=' . urlencode($url) . '&choe=UTF-8&chld=H|2&chco=22c55e';
            
            $image = file_get_contents($qrCodeUrl);
            
            return response($image, 200)
                ->header('Content-Type', 'image/png')
                ->header('Content-Disposition', 'inline; filename="ez-qr.png"');
                
        } catch (\Exception $e) {
            Log::error('QR code generation error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code',
            ], 500);
        }
    }
    
    /**
     * Check standard domain availability
     */
    public function checkStandardDomainAvailability(Request $request)
    {
        $request->validate([
            'handle' => 'required|string',
            'domain' => 'required|string',
        ]);

        $handle = strtolower(trim($request->input('handle')));
        $domain = $request->input('domain');

        $domainExists = Domain::whereRaw('BINARY `domain` = ?', [$handle])
            ->where('domainselected', $domain)
            ->exists();
       
        $reserved = Reserve::where('reserve', $handle)->exists();

        $available = !$domainExists && !$reserved;
        
        $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
        
        $priceString = Powerstring::where('min_word', '<=', $charCount)
            ->where('max_word', '>=', $charCount)
            ->first();

        $price = $priceString ? $priceString->dollar_price : 0;
        $promoPrice = 0;

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Domain is available' : 'Domain is not available',
            'charCount' => $charCount,
            'price' => $price,
            'promoPrice' => $promoPrice,
            'handle' => $handle,
            'domain' => $domain
        ]);
    }
    
    /**
     * Check standard domain availability for custom
     */
    public function checkStandardCustomAvailability(Request $request)
    {
        $request->validate([
            'handle' => 'required|string',
            'domain' => 'required|string',
        ]);

        $handle = strtolower(trim($request->input('handle')));
        $domain = $request->input('domain');

        $domainExists = Customdomain::whereRaw('BINARY `domain` = ?', [$handle])
            ->where('domainselected', $domain)
            ->exists();
       
        $reserved = Reserve::where('reserve', $handle)->exists();

        $available = !$domainExists && !$reserved;
        
        $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
        
        $priceString = Powerstring::where('min_word', '<=', $charCount)
            ->where('max_word', '>=', $charCount)
            ->first();

        $price = $priceString ? $priceString->dollar_price : 0;
        $promoPrice = 0;

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Slug is available' : 'Slug is not available',
            'charCount' => $charCount,
            'price' => $price,
            'promoPrice' => $promoPrice,
            'handle' => $handle,
            'domain' => $domain
        ]);
    }
    
    /**
     * Validate coupon code for custom domain
     */
    public function couponcodecustomdomain(Request $request)
    {
        $request->validate([
            'couponcode' => 'required|string',
            'domainurl' => 'required|string',
            'type' => 'required|string'
        ]);

        $pricestring = Powerstring::get()->toArray();
        $value = iconv_strlen(str_replace(' ', '', urldecode($request->domainurl)),'UTF-8');
        $wordprice = 0;
        $price = 0;
        
        if($request->type=='domain')
        {
            foreach ($pricestring as $priceTier) {
                if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
                    $wordprice = $priceTier['dollar_price'] * 1;
                    $price = $priceTier['dollar_price'];
                    break;
                }
            }
        } else {
            foreach ($pricestring as $priceTier) {
                if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
                    $wordprice = $priceTier['custom_price'] * 1;
                    $price = $priceTier['custom_price'];
                    break;
                }
            }
        }

        $response = [
            'original_price' => $price,
            'offprice' => $price,
            'title' => '',
            'valid' => false
        ];

        $coupon = Coupon::where('coupon', urldecode($request->couponcode))->first();
        
        if($coupon) {
            $response['valid'] = true;
            $response['title'] = $coupon['title'];
            
            if($coupon['type'] == 'percentage') {
                $response['title'] .= ' '.$coupon['offer'].'% off';
                $response['offprice'] = $price - ($price * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $response['offprice'] = $coupon['offer'];
            }
        }

        return response()->json($response);
    }
        
    /**
     * Check if user exists by email
     */
    public function checkUserExists(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $userExists = User::where('email', $request->email)->exists();

        return response()->json([
            'exists' => $userExists,
        ]);
    }
    
    /**
     * Handle zero dollar (free) purchase
     */
    public function handleZeroDollarPurchase(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'type' => 'required|in:handle,domain',
            'coupon_code' => 'nullable|string',
            'password' => 'nullable|string|min:8',
        ]);
        
        $email = $validated['email'];
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $type = $validated['type'];
        $password = $validated['password'] ?? null;
        $couponCode = $validated['coupon_code'];
        $coupon = null;
        
        try {
            $user = User::where('email', $email)->first();
            if (empty($user)) {
                $userData = ['email' => $email];
                if ($password) {
                    $userData['password'] = Hash::make($password);
                }
                $user = User::create($userData);
                
                $magicLink = $user->createMagicLink();
                $signedUrl = URL::temporarySignedRoute(
                    'magic-link.verify',
                    now()->addMinutes(60),
                    ['token' => $magicLink->token]
                );
                
                $emaildesign = Emaildesign::where('id', 16)->first();
                $str = ['{token}'];
                $rplc = [$signedUrl];
                $div = str_replace($str,$rplc,$emaildesign['design']);
                $mailData = ['design' => $div];
                
                try {
                    $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                } catch (\Exception $e) {
                    $subject = "Ez.wiki Your Magic Login Link";
                    @mail($email, $subject, $div, null, 'funnel@ez.wiki');
                }
            }
            
            if ($couponCode) {
                $coupon = Coupon::where('coupon', $couponCode)->first();
                
                if (!$coupon) {
                    return response()->json([
                        'error' => 'Invalid coupon code.'
                    ], 400);
                }
                
                if (!$coupon->isValidForUser($user->id)) {
                    if ($coupon->status !== 'Active') {
                        return response()->json([
                            'error' => 'This coupon is not active.'
                        ], 400);
                    }
                    if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                        return response()->json([
                            'error' => 'This coupon has reached its usage limit.'
                        ], 400);
                    }
                }
            }
            $search = AISearchHistory::where('id', $request->slug_id)->first();
			$Funnel = EzFunnel::where('aiid', $request->slug_id)->first();            
            $expiryDate = now()->addYear();
            
            if ($type === 'handle') {
                $customDomain = Customdomain::create([
                    'domain' => $customHandle,
                    'domainselected' => $domain,
                    'user_id' => $user->id,
                    'funnelid' => $Funnel->id,
                    'hashtag' => $Funnel->seo_tag,
                    'expire' => $expiryDate,
                ]);
            } else {
                $customDomain = Domain::create([
                    'domain' => $customHandle,
                    'domainselected' => $domain,
                    'user_id' => $user->id,
                    'funnelid' => $Funnel->id,
                    'hashtag' => $Funnel->seo_tag,
                    'expire' => $expiryDate,
                ]);
            }

            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                ($type === 'handle' ? 'customdomain_id' : 'domain_id') => $customDomain->id,
                'amount' => 0,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'free',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'discount_amount' => 0,
                'status' => 'completed',
                'transaction_id' => 'FREE-' . strtoupper(Str::random(8))
            ]);
            
            if ($coupon) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
            }
            
            $invoicenumber = 'INV-FREE-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => null,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => 0,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => $type === 'handle' 
                            ? "Free Custom Handle Purchase: {$domain}/{$customHandle}"
                            : "Free Domain Purchase: {$customHandle}.{$domain}",
                        'quantity' => 1,
                        'unit_price' => 0,
                        'amount' => 0,
                    ]
                ],
                'notes' => 'Thank you for your free purchase!',
            ]);
            
            $fulldomain = $type === 'handle' 
                ? "https://{$domain}/{$customHandle}"
                : "https://{$customHandle}.{$domain}";
                
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
            $rplc = [$fulldomain, 0, $invoicenumber, now(), 'Congratulations on your new ' . ($type === 'handle' ? 'custom domain' : 'domain')];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
                @mail($email, $subject, $div, null, 'funnel@ez.wiki');
            }

            return response()->json([
                'success' => true,
                'url' => $fulldomain,
                'html' => '<a href="' . $fulldomain . '" target="_blank" class="btn btn-warning reloadcreatenew">' . $fulldomain . '</a>',
                'available' => true
            ]);
            
        } catch (\Exception $e) {
            Log::error('Free purchase error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred during free purchase.'
            ], 500);
        }
    }
    
    /**
     * Handle zero dollar (free) purchase after login
     */
    public function handleZeroDollarPurchaseafterlogin(Request $request)
    {
        $validated = $request->validate([
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'type' => 'required|in:handle,domain',
            'coupon_code' => 'nullable|string',
            'ezFunnelId' => 'nullable|integer',
        ]);
        
        $user = Auth::user();
        $email = $user->email;
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $type = $validated['type'];
        $couponCode = $validated['coupon_code'];
        $ezFunnelId = $validated['ezFunnelId'];
        $coupon = null;
         
        if ($couponCode) {
            $coupon = Coupon::where('coupon', $couponCode)->first();
            
            if (!$coupon) {
                return response()->json([
                    'error' => 'Invalid coupon code.'
                ], 400);
            }
            
            if (!$coupon->isValidForUser($user->id)) {
                if ($coupon->status !== 'Active') {
                    return response()->json([
                        'error' => 'This coupon is not active.'
                    ], 400);
                }
                if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                    return response()->json([
                        'error' => 'This coupon has reached its usage limit.'
                    ], 400);
                }
            }
        }
        
        $expiryDate = now()->addYear();
        
        $customDomain = Domain::create([
            'domain' => $customHandle,
            'domainselected' => $domain,
            'user_id' => $user->id,
            'funnelid' => $ezFunnelId,
            'hashtag' => null,
            'expire' => $expiryDate,
        ]);
        
        $handlePurchase = HandlePurchase::create([
            'user_id' => $user->id,
            ($type === 'handle' ? 'customdomain_id' : 'domain_id') => $customDomain->id,
            'amount' => 0,
            'currency' => 'USD',
            'bee_points_amount' => null,
            'payment_method' => 'free',
            'coupon_code' => $validated['coupon_code'] ?? null,
            'discount_amount' => 0,
            'status' => 'completed',
            'transaction_id' => 'FREE-' . strtoupper(Str::random(8))
        ]);
        
        if ($coupon) {
            CouponUsage::create([
                'coupon_id' => $coupon->id,
                'user_id' => $user->id,
                'coupon_code' => $coupon->coupon,
                'used_at' => now(),
            ]);
        }
        
        $invoicenumber = 'INV-FREE-' . strtoupper(Str::random(8));
        $invoice = $handlePurchase->invoice()->create([
            'invoice_number' => $invoicenumber,
            'user_id' => $user->id,
            'stripe_transaction_id' => null,
            'handle_purchase_id' => $handlePurchase->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'amount' => 0,
            'status' => 'paid',
            'items' => [
                [
                    'description' => $type === 'handle' 
                        ? "Free Custom Handle Purchase: {$domain}/{$customHandle}"
                        : "Free Domain Purchase: {$customHandle}.{$domain}",
                    'quantity' => 1,
                    'unit_price' => 0,
                    'amount' => 0,
                ]
            ],
            'notes' => 'Thank you for your free purchase!',
        ]);
        
        $fulldomain = $type === 'handle' 
            ? "https://{$domain}/{$customHandle}"
            : "https://{$customHandle}.{$domain}";
            
        $emaildesign = Emaildesign::where('id', 19)->first();
        $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
        $rplc = [$fulldomain, 0, $invoicenumber, now(), 'Congratulations on your new ' . ($type === 'handle' ? 'custom domain' : 'domain')];
        $div = str_replace($str, $rplc, $emaildesign['design']);
        $mailData = ['design' => $div];
        
        try {
            $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
            Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
            Mail::getSymfonyTransport()->stop();
        } catch (\Exception $e) {
            $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
            @mail($email, $subject, $div, null, 'funnel@ez.wiki');
        }

        return response()->json([
            'success' => true,
            'url' => $fulldomain,
            'html' => '<a href="' . $fulldomain . '" target="_blank" class="btn btn-warning reloadcreatenew">' . $fulldomain . '</a>',
            'available' => true
        ]);
    }
    
    /**
     * Initiate domain payment with Stripe
     */
    public function initiateDomainPayment(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'selling_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required',
            'password' => 'nullable|string|min:8',
        ]);
        
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $email = $validated['email'];
        $paymentMethod = $validated['payment_method'];
        $password = $validated['password'] ?? null;
        
        $existingLink = Domain::whereRaw('BINARY `domain` = ?', [$customHandle])
            ->where('domainselected', $domain)
            ->first();

        if ($existingLink) {
            return response()->json([
                'error' => 'This handle is already taken',
                'available' => false
            ], 409);
        }

        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
        $coupon = Coupon::where('coupon', urldecode($couponCode))->first();
        
        if($coupon) {
            if($coupon['type'] == 'percentage') {
                $actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $actualPrice = $coupon['offer'];
            }
        }
        $actualPrice = max(1, $actualPrice);
        
        try {
            $user = User::where('email', $email)->first();
            if(empty($user)) {                        
                $userData = ['email' => $email];
                if ($password) {
                    $userData['password'] = Hash::make($password);
                }
                $user = User::create($userData);
                
                $magicLink = $user->createMagicLink();
                $signedUrl = URL::temporarySignedRoute(
                    'magic-link.verify',
                    now()->addMinutes(60),
                    ['token' => $magicLink->token]
                );

                $emaildesign = Emaildesign::where('id', 16)->first();
                $str = ['{token}'];
                $rplc =[$signedUrl];
                $div=str_replace($str,$rplc,$emaildesign['design']);
                $mailData = ['design' => $div];
                
                try{
                    $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                    $subject = "Ez.wiki Your Magic Login Link";
                    @mail($email, $subject, $div, null,'funnel@ez.wiki');
                }
            }
            
            if ($couponCode) {
                $coupon = Coupon::where('coupon', $couponCode)->first();
                
                if (!$coupon) {
                    return response()->json([
                        'error' => 'Invalid coupon code.'
                    ], 400);
                }
                
                if (!$coupon->isValidForUser($user->id)) {
                    if ($coupon->status !== 'Active') {
                        return response()->json([
                            'error' => 'This coupon is not active.'
                        ], 400);
                    }
                    if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                        return response()->json([
                            'error' => 'This coupon has reached its usage limit.'
                        ], 400);
                    }
                }
            }
            
            $paymentIntent = PaymentIntent::create([
                'amount' => round($actualPrice * 100),
                'currency' => 'usd',
                'metadata' => [
                    'user_id' => $user->id,
                    'domain' => $customHandle,
                    'domainselected' => $domain,
                    'email' => $email,
                    'coupon_code' => $validated['coupon_code'],
                    'selling_price' => $validated['selling_price'],
                    'payment_method' => $validated['payment_method'],
                    'promo_price' => $validated['promo_price'],
                ],
                'receipt_email' => $email,
                'description' => "Purchase of Domain handle {$customHandle}.{$domain}",
            ]);

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ]);

        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Payment processing error. Please try again.'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Handle Payment Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred.'
            ], 500);
        }
    }
    
    /**
     * Handle successful domain payment
     */
    public function domainpaymentsuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $paymentIntentId = $request->payment_intent_id;
        $coupon = null;
        
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            
            if ($paymentIntent->metadata->coupon_code) {
                $coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
                
                if (!$coupon) {
                    return response()->json([
                        'error' => 'Invalid coupon code.'
                    ], 400);
                }
                
                if (!$coupon->isValidForUser($user->id)) {
                    if ($coupon->status !== 'Active') {
                        return response()->json([
                            'error' => 'This coupon is not active.'
                        ], 400);
                    }
                    if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                        return response()->json([
                            'error' => 'This coupon has reached its usage limit.'
                        ], 400);
                    }
                }
            }
			
			$search = AISearchHistory::where('id', $request->slug_id)->first();
			$Funnel = EzFunnel::where('aiid', $request->slug_id)->first(); 
            $expiryDate = now()->addYear();
            
            $customDomain = Domain::create([
                'domain' => $paymentIntent->metadata->domain,
                'domainselected' => $paymentIntent->metadata->domainselected,
                'user_id' => $user->id,
                'funnelid' => $Funnel->id,
                'hashtag' => $Funnel->seo_tag,
                'expire' => $expiryDate,
            ]);

            if (!empty($request->selling_price)) {
                Sell::updateOrCreate(
                    [
                        'sellid' => $customDomain->id,
                        'type' => 'DOMAIN',
                        'user_id' => $user->id
                    ],
                    [
                        'uniquesellid' => time(),
                        'price' => $paymentIntent->metadata->selling_price,
                        'expire' => $expiryDate
                    ]
                );
            }
            
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                'domain_id' => $customDomain->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'stripe',
                'coupon_code' => $paymentIntent->metadata->coupon_code,
                'discount_amount' => $paymentIntent->metadata->promo_price,
                'status' => 'completed',
                'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
            ]);
            
            if ($coupon) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
            }
            
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
            
            $customHandle = $paymentIntent->metadata->domain;
            $domain = $paymentIntent->metadata->domainselected;
            
            $invoicenumber='INV-HNDL-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => $stripeTransaction->id,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $paymentIntent->amount / 100,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Custom Handle Purchase: {$customHandle}.{$domain}",
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!',
            ]);
            
            $fulldomain = 'https://'.$customHandle.'.'.$domain;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new domain'];
            $div = str_replace($str,$rplc,$emaildesign['design']);
            $mailData = ['design' => $div];
            
            try{
                $subject = "Ez.wiki Congratulations on your new domain";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            }catch (\Exception $e){
                $subject = "Ez.wiki Congratulations on your new domain";
                @mail($email, $subject, $div, null,'funnel@ez.wiki');
            }
            
            return response()->json([
                'success' => true,
                'url' => "https://{$customHandle}.{$domain}",
                'html' => '<a href="https://'.$customHandle.'.'.$domain.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$customHandle.'.'.$domain.'</a>',
                'available' => true
            ]);
            
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get AI settings (for admin panel)
     */
    public function getAiSettings()
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $this->aiSettings,
        ]);
    }

    /**
     * Update AI settings (for admin panel)
     */
    public function updateAiSettings(Request $request)
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'guest_ai_enabled' => 'sometimes|boolean',
            'guest_char_limit' => 'sometimes|integer|min:0|max:10000',
            'user_ai_enabled' => 'sometimes|boolean',
            'user_char_limit' => 'sometimes|integer|min:0|max:100000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $settings = AiSetting::first();
        
        if (!$settings) {
            $settings = new AiSetting();
        }
        
        $fillable = $request->only([
            'guest_ai_enabled',
            'guest_char_limit',
            'user_ai_enabled',
            'user_char_limit',
        ]);
        
        foreach ($fillable as $key => $value) {
            if ($request->has($key)) {
                $settings->$key = $value;
            }
        }
        
        $settings->save();
        
        Cache::forget('ai_settings');
        
        $this->loadAiSettings();
        
        return response()->json([
            'success' => true,
            'message' => 'AI settings updated successfully',
            'data' => $settings,
        ]);
    }
    
    /**
     * Get provider name for logging
     */
    private function getProviderName(string $model): string
    {
        if (str_starts_with($model, 'gemini-')) {
            return 'Google Gemini';
        }
        if ($model === 'sonar' || $model === 'sonar-pro') {
            return 'Perplexity';
        }
        if (str_starts_with($model, 'deepseek-')) {
            return 'DeepSeek';
        }
        if (str_starts_with($model, 'gpt-')) {
            return 'OpenAI';
        }
        return 'Moonshot';
    }
    
    /**
     * Initiate domain payment with Stripe after login
     */
    public function initiateDomainPaymentafterlogin(Request $request)
    {
        $validated = $request->validate([
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'selling_price' => 'nullable|numeric|min:0',
            'payment_method' => 'required',
        ]);
        
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $user = Auth::user();
        $email = $user->email;
        $paymentMethod = $validated['payment_method'];
        
        $existingLink = Domain::whereRaw('BINARY `domain` = ?', [$customHandle])
            ->where('domainselected', $domain)
            ->first();

        if ($existingLink) {
            return response()->json([
                'error' => 'This handle is already taken',
                'available' => false
            ], 409);
        }

        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
        $coupon = Coupon::where('coupon', urldecode($couponCode))->first();
        
        if($coupon) {
            if($coupon['type'] == 'percentage') {
                $actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $actualPrice = $coupon['offer'];
            }
        }
        $actualPrice = max(1, $actualPrice);
        
        if ($couponCode) {
            $coupon = Coupon::where('coupon', $couponCode)->first();
            
            if (!$coupon) {
                return response()->json([
                    'error' => 'Invalid coupon code.'
                ], 400);
            }
            
            if (!$coupon->isValidForUser($user->id)) {
                if ($coupon->status !== 'Active') {
                    return response()->json([
                        'error' => 'This coupon is not active.'
                    ], 400);
                }
                if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                    return response()->json([
                        'error' => 'This coupon has reached its usage limit.'
                    ], 400);
                }
            }
        }
        
        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => round($actualPrice * 100),
                'currency' => 'usd',
                'metadata' => [
                    'user_id' => $user->id,
                    'domain' => $customHandle,
                    'domainselected' => $domain,
                    'email' => $email,
                    'coupon_code' => $validated['coupon_code'],
                    'selling_price' => $validated['selling_price'],
                    'payment_method' => $validated['payment_method'],
                    'promo_price' => $validated['promo_price'],
                ],
                'receipt_email' => $email,
                'description' => "Purchase of Domain handle {$customHandle}.{$domain}",
            ]);

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ]);

        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Payment processing error. Please try again.'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Handle Payment Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred.'
            ], 500);
        }
    }
    
    /**
     * Handle successful domain payment after login
     */
    public function domainpaymentsuccessafterlogin(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $paymentIntentId = $request->payment_intent_id;
        $coupon = null;
        
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            
            if ($paymentIntent->metadata->coupon_code) {
                $coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
                
                if (!$coupon) {
                    return response()->json([
                        'error' => 'Invalid coupon code.'
                    ], 400);
                }
                
                if (!$coupon->isValidForUser($user->id)) {
                    if ($coupon->status !== 'Active') {
                        return response()->json([
                            'error' => 'This coupon is not active.'
                        ], 400);
                    }
                    if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
                        return response()->json([
                            'error' => 'This coupon has reached its usage limit.'
                        ], 400);
                    }
                }
            }
            
            $expiryDate = now()->addYear();
            
            $customDomain = Domain::create([
                'domain' => $paymentIntent->metadata->domain,
                'domainselected' => $paymentIntent->metadata->domainselected,
                'user_id' => $user->id,
                'funnelid' => $request->ezFunnelId,
                'hashtag' => null,
                'expire' => $expiryDate,
            ]);

            if (!empty($request->selling_price)) {
                Sell::updateOrCreate(
                    [
                        'sellid' => $customDomain->id,
                        'type' => 'DOMAIN',
                        'user_id' => $user->id
                    ],
                    [
                        'uniquesellid' => time(),
                        'price' => $paymentIntent->metadata->selling_price,
                        'expire' => $expiryDate
                    ]
                );
            }
            
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                'domain_id' => $customDomain->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'stripe',
                'coupon_code' => $paymentIntent->metadata->coupon_code,
                'discount_amount' => $paymentIntent->metadata->promo_price,
                'status' => 'completed',
                'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
            ]);
            
            if ($coupon) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
            }
            
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
            
            $customHandle = $paymentIntent->metadata->domain;
            $domain = $paymentIntent->metadata->domainselected;
            
            $invoicenumber='INV-HNDL-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => $stripeTransaction->id,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $paymentIntent->amount / 100,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Custom Handle Purchase: {$customHandle}.{$domain}",
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!',
            ]);
            
            $fulldomain = 'https://'.$customHandle.'.'.$domain;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new domain'];
            $div = str_replace($str,$rplc,$emaildesign['design']);
            $mailData = ['design' => $div];
            
            try{
                $subject = "Ez.wiki Congratulations on your new domain";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            }catch (\Exception $e){
                $subject = "Ez.wiki Congratulations on your new domain";
                @mail($email, $subject, $div, null,'funnel@ez.wiki');
            }
            
            return response()->json([
                'success' => true,
                'url' => "https://{$customHandle}.{$domain}",
                'html' => '<a href="https://'.$customHandle.'.'.$domain.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$customHandle.'.'.$domain.'</a>',
                'available' => true
            ]);
            
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Request private access to a conversation
     */
    public function requestPrivateAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string',
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Invalid request data',
            ], 422);
        }

        $slug = urldecode($request->slug);
        $search = AISearchHistory::where('slug', $slug)->first();

        if (!$search) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $firstMessage = $search->getFirstMessage();

        if ($firstMessage->status !== 'private') {
            return response()->json([
                'success' => false,
                'message' => 'This conversation is not private',
            ], 400);
        }

        $accessNumber = $search->private_access_number;

        $accessLog = PrivateAccessLog::create([
            'conversation_id' => $firstMessage->conversation_id,
            'email' => $request->email,
            'access_number' => $accessNumber,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $conversationTitle = $firstMessage->conversation_title ?? 'Private Conversation';
        $conversationUrl = $firstMessage->getShareableUrl();
        
        $emaildesign = Emaildesign::where('id', 33)->first();
        $str = ['{conversationTitle}','{conversationId}','{requestDate}','{accessNumber}','{conversationUrl}'];
        $rplc =[$conversationTitle,$firstMessage->conversation_id,now(),$accessNumber,$conversationUrl];
        $div = str_replace($str,$rplc,$emaildesign['design']);
        $mailData = ['design' => $div];
        
        try {
            try{
                $subject = "Ez.wiki Private Conversation Access";
                Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            }catch (\Exception $e){
                $subject = "Ez.wiki Private Conversation Access";
                @mail($request->email, $subject, $div, null,'funnel@ez.wiki');
            }

            return response()->json([
                'success' => true,
                'message' => 'Access code has been sent to your email. Please check your inbox.',
                'email' => $request->email,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send private access email: ' . $e->getMessage());
            
            $accessLog->delete();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send access email. Please try again later.',
            ], 500);
        }
    }
    
    /**
     * Verify private access to a conversation
     */
    public function verifyPrivateAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string',
            'access_number' => 'required|string|size:4',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Invalid verification data',
            ], 422);
        }

        $slug = urldecode($request->slug);
        $search = AISearchHistory::where('slug', $slug)->first();

        if (!$search) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $firstMessage = $search->getFirstMessage();

        if ($firstMessage->status !== 'private') {
            return response()->json([
                'success' => false,
                'message' => 'This conversation is not private',
            ], 400);
        }

        $accessLog = PrivateAccessLog::where('conversation_id', $firstMessage->conversation_id)
            ->where('email', $request->email)
            ->where('access_number', $request->access_number)
            ->first();

        if (!$accessLog) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid access code. Please check and try again.',
            ], 403);
        }

        if ($firstMessage->private_access_limit !== null) {
            $firstMessage->increment('private_views_count');
            
            if ($firstMessage->private_views_count >= $firstMessage->private_access_limit) {
                Log::info('Private conversation limit reached', [
                    'conversation_id' => $firstMessage->conversation_id,
                    'views' => $firstMessage->private_views_count,
                    'limit' => $firstMessage->private_access_limit,
                    'email' => $request->email,
                ]);
            }
        }

        $accessToken = Str::random(64);
        Session::put('private_access_' . $firstMessage->conversation_id, [
            'token' => $accessToken,
            'email' => $request->email,
            'granted_at' => now(),
            'conversation_id' => $firstMessage->conversation_id,
        ]);

        Session::put('has_private_access_' . $firstMessage->conversation_id, true);

        return response()->json([
            'success' => true,
            'message' => 'Access granted successfully',
            'access_token' => $accessToken,
            'conversation_url' => $firstMessage->getShareableUrl(),
            'conversation_id' => $firstMessage->conversation_id,
        ]);
    }

    /**
     * Check private access status
     */
    public function checkPrivateAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $slug = urldecode($request->slug);
        $search = AISearchHistory::where('slug', $slug)->first();

        if (!$search) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }

        $firstMessage = $search->getFirstMessage();

        $sessionData = session('private_access_' . $firstMessage->conversation_id);
        $hasSessionAccess = !is_null($sessionData) && isset($sessionData['token']);

        $isOwner = Auth::check() && $firstMessage && $firstMessage->user_id === Auth::id();

        $hasAccess = $hasSessionAccess || $isOwner;

        $conversationMessages = [];
        if ($hasSessionAccess && !$isOwner) {
            AISearchHistory::ensureConversationPositions($firstMessage->conversation_id);
            $conversationMessages = AISearchHistory::where('conversation_id', $firstMessage->conversation_id)
                ->with('user')
                ->orderBy('position', 'asc')
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($message) {
                    return AISearchHistory::formatMessageForDisplay($message);
                });
        }

        return response()->json([
            'success' => true,
            'has_access' => $hasAccess,
            'is_owner' => $isOwner,
            'conversation_status' => $firstMessage->status,
            'private_access_info' => $firstMessage->private_access_info,
            'session_active' => $hasSessionAccess,
            'is_private_access' => $hasSessionAccess && !$isOwner,
            'conversation_messages' => $conversationMessages,
            'message_count' => count($conversationMessages),
        ]);
    }
    
    /**
     * Revoke private access
     */
    public function revokePrivateAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        Session::forget('private_access_' . $request->conversation_id);
        Session::forget('has_private_access_' . $request->conversation_id);

        return response()->json([
            'success' => true,
            'message' => 'Access revoked successfully',
        ]);
    }

    /**
     * Get private access logs
     */
    public function getPrivateAccessLogs(Request $request, $conversationId)
    {
        $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
            ->whereNull('parent_id')
            ->first();
            
        if (!$firstMessage) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found',
            ], 404);
        }
        
        if (Auth::id() !== $firstMessage->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        $logs = PrivateAccessLog::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
    
    /**
     * Get pinned conversations for the current user/session
     */
    public function getPinnedConversations(Request $request)
    {
        $pinnedConversations = AISearchHistory::whereNull('parent_id')
            ->where('pinned', 1)
            ->where('status', 'public')
            ->orderBy('pinned_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($conversation) {
                $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)
                    ->where('status', '!=', 'hidden')
                    ->count();
                
                return [
                    'id' => $conversation->id,
                    'slug' => $conversation->slug,
                    'conversation_id' => $conversation->conversation_id,
                    'conversation_title' => $conversation->conversation_title ?? 'Untitled Conversation',
                    'query_preview' => Str::limit($conversation->query ?? 'No query', 60),
                    'message_count' => $messageCount,
                    'created_at' => $conversation->created_at->toISOString(),
                    'formatted_created_at' => $conversation->formatted_created_at,
                    'share_url' => $conversation->getShareableUrl(),
                    'status' => $conversation->status,
                ];
            });
            
        return response()->json([
            'success' => true,
            'data' => $pinnedConversations,
        ]);
    }
    
    /**
     * Check if a slug is available for a conversation
     */
    public function checkSlugAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|min:2|max:100',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'available' => false,
                'message' => 'Invalid slug format. Only letters, numbers, and hyphens allowed.',
            ], 422);
        }

        $slug = strtolower(trim($request->input('slug')));
        
        $exists = AISearchHistory::where('slug', $slug)->exists();
        
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
	 * Check if the provided email belongs to the conversation owner
	 */
	public function checkEmailOwnership(Request $request)
	{
		$validated = $request->validate([
			'email' => 'required|email',
			'slug' => 'required|integer',
		]);

		$email = $request->input('email');
		$slug = $request->input('slug');

		// Find the conversation
		$search = AISearchHistory::where('id', $slug)->first();

		if (!$search) {
			return response()->json([
				'success' => false,
				'message' => 'Conversation not found',
			], 404);
		}

		// Check if the email belongs to the owner
		$isOwner = false;
		$ownerEmail = null;
		$ownerName = null;

		if ($search->user_id) {
			$owner = User::find($search->user_id);
			if ($owner) {
				$ownerEmail = $owner->email;
				$ownerName = $owner->name;
				// Case-insensitive comparison
				$isOwner = strtolower($email) === strtolower($ownerEmail);
			}
		}

		return response()->json([
			'success' => true,
			'is_owner' => $isOwner,
			'owner_email' => $ownerEmail,
			'owner_name' => $ownerName,
			'message' => $isOwner 
				? 'Email matches the conversation owner.'
				: 'This email does not belong to the conversation owner. Please use the email that created this conversation, or create a new conversation with "New".',
		]);
	}	

}