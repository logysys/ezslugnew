<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Session;

class AISearchHistory extends Model
{
    use HasFactory;

    /**
     * Content type constants
     */
    const CONTENT_TYPE_AI = 'ai';
    const CONTENT_TYPE_COMMENT = 'comment';
    const CONTENT_TYPE_UPLOAD = 'upload';
    const CONTENT_TYPE_SOCIAL = 'social';
    const CONTENT_TYPE_SOCIAL_MEDIA = 'social_media';
    const CONTENT_TYPE_LANDING_PAGE = 'landing_page';
    const CONTENT_TYPE_EMBED = 'embed';

    /**
     * Status constants
     */
    const STATUS_PUBLIC = 'public';
    const STATUS_PRIVATE = 'private';
    const STATUS_HIDDEN = 'hidden';

    /**
     * Message role constants
     */
    const ROLE_USER = 'user';
    const ROLE_ASSISTANT = 'assistant';
    const ROLE_SYSTEM = 'system';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ai_search_histories';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'slug',
        'hashtag',
        'conversation_id',
        'conversation_title',
        'parent_id',
        'message_role',
        'content_type',
        'thread_id',
        'user_id',
        'query',
        'position',
        'response',
        'sources',
        'file_data',
        'file_metadata',
        'usage',
        'thinking_enabled',
        'model',
        'temperature',
        'max_tokens',
        'finish_reason',
        'ip_address',
        'user_agent',
        'session_id',
        'status',
        'pinned',
        'pinned_order',
        'private_access_number',
        'private_access_limit',
        'private_views_count',
        'content_warning',
        'media_count',
        'social_media_metadata',
        'landing_page_url',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'sources' => 'array',
        'file_data' => 'array',
        'file_metadata' => 'array',
        'social_media_metadata' => 'array',
        'usage' => 'array',
        'thinking_enabled' => 'boolean',
        'temperature' => 'float',
        'max_tokens' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'status' => 'string',
        'pinned' => 'boolean',
        'pinned_order' => 'integer',
        'private_access_number' => 'string',
        'private_access_limit' => 'integer',
        'private_views_count' => 'integer',
        'media_count' => 'integer',
        'hashtag' => 'array', // Store as array for multiple hashtags
    ];
    
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'ip_address',
        'user_agent',
    ];
    
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'formatted_created_at',
        'response_preview',
        'total_tokens',
        'conversation_tokens',
        'cost_estimate',
        'conversation_cost',
        'response_time',
        'message_count',
        'share_url',
        'conversation_url',
        'pinned',
        'content_type_label',
        'file_info',
        'private_access_info',
        'hashtag_display',
        'hashtag_list',
        'hashtag_csv',
    ];
    
    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            // Only generate slug if not set (for new records)
            if (empty($model->slug)) {
                $model->slug = static::generateUniqueSlug($model->query ?? $model->content_type ?? 'conversation');
            }
            
            // Set conversation ID if this is the first message
            if (empty($model->conversation_id)) {
                $model->conversation_id = Str::uuid()->toString();
            }
            
            // Generate thread ID for conversation tracking
            if (empty($model->thread_id)) {
                $model->thread_id = 'thread_' . Str::random(16);
            }
            
            // Set message role if not specified
            if (empty($model->message_role)) {
                $model->message_role = self::ROLE_USER;
            }
            
            // Set content type if not specified
            if (empty($model->content_type)) {
                $model->content_type = self::CONTENT_TYPE_AI;
            }
            
            // Set conversation title from first query if not set
            if (empty($model->conversation_title) && empty($model->parent_id)) {
                $model->conversation_title = static::generateConversationTitle(
                    $model->query ?? $model->content_type
                );
            }
            
            // Set session ID if not set
            if (empty($model->session_id)) {
                $model->session_id = Session::getId();
            }
            
            // Set IP address if not set
            if (empty($model->ip_address) && isset($_SERVER['REMOTE_ADDR'])) {
                $model->ip_address = $_SERVER['REMOTE_ADDR'];
            }
            
            // Set user agent if not set
            if (empty($model->user_agent) && isset($_SERVER['HTTP_USER_AGENT'])) {
                $model->user_agent = $_SERVER['HTTP_USER_AGENT'];
            }
            
            // Set default values for AI messages
            if ($model->content_type === self::CONTENT_TYPE_AI) {
                if (empty($model->temperature)) {
                    $model->temperature = 0.7;
                }
                
                if (empty($model->max_tokens)) {
                    $model->max_tokens = 2000;
                }
                
                if (empty($model->model)) {
                    $model->model = 'kimi-k3';
                }
            }
            
            // Set default values for social media posts
            if ($model->content_type === self::CONTENT_TYPE_SOCIAL || $model->content_type === self::CONTENT_TYPE_SOCIAL_MEDIA) {
                if (empty($model->media_count) && isset($model->file_data['count'])) {
                    $model->media_count = $model->file_data['count'];
                }
            }
            
            // Set default status if not specified
            if (empty($model->status)) {
                $model->status = self::STATUS_PUBLIC;
            }
            
            // Set default pinned if not specified
            if (!isset($model->pinned)) {
                $model->pinned = false;
            }
            
            // Set default pinned order if pinned
            if ($model->pinned && empty($model->pinned_order)) {
                $maxOrder = static::where('pinned', true)->max('pinned_order') ?? 0;
                $model->pinned_order = $maxOrder + 1;
            }
            
            // Set default private access values if not specified
            if (empty($model->private_access_number)) {
                $model->private_access_number = null;
            }
            
            if (!isset($model->private_access_limit)) {
                $model->private_access_limit = null;
            }
            
            if (!isset($model->private_views_count)) {
                $model->private_views_count = 0;
            }
            
            // Set default media count
            if (!isset($model->media_count)) {
                $model->media_count = 0;
            }
            
            // Set default hashtag as empty array
            if (!isset($model->hashtag)) {
                $model->hashtag = [];
            }
            
            // Calculate position if not explicitly set
            if (!isset($model->position) || $model->position === null) {
                if (!empty($model->conversation_id)) {
                    static::ensureConversationPositions($model->conversation_id);
                }
                if (!empty($model->parent_id)) {
                    $parent = static::find($model->parent_id);
                    $parentPos = ($parent && $parent->position !== null) ? $parent->position : 0;
                    $model->position = $parentPos + 1;
                    static::where('conversation_id', $model->conversation_id)
                        ->where('position', '>=', $model->position)
                        ->increment('position');
                } else {
                    $maxPos = static::where('conversation_id', $model->conversation_id)->max('position');
                    $model->position = ($maxPos !== null) ? ($maxPos + 1) : 0;
                }
            }
        });
        
        // Handle slug updates - only when explicitly changed
        static::updating(function ($model) {
            // Check if slug was manually changed and is dirty
            if ($model->isDirty('slug') && !empty($model->slug)) {
                // Ensure the new slug is unique
                $newSlug = $model->slug;
                $originalSlug = $model->getOriginal('slug');
                
                if ($newSlug !== $originalSlug) {
                    $model->slug = static::ensureUniqueSlug($newSlug, $model->id);
                }
            }
            
            // Handle hashtag conversion if it's a string (legacy format)
            if ($model->isDirty('hashtag')) {
                $hashtag = $model->hashtag;
                if (is_string($hashtag)) {
                    // Convert legacy string to array
                    $tags = array_filter(array_map('trim', explode(',', $hashtag)));
                    if (empty($tags)) {
                        $tags = array_filter(array_map('trim', explode(' ', $hashtag)));
                    }
                    $model->hashtag = array_values(array_unique($tags));
                } elseif (is_null($hashtag)) {
                    $model->hashtag = [];
                }
            }
        });
        
        // After retrieving, ensure hashtag is always an array
        static::retrieved(function ($model) {
            if (is_string($model->hashtag)) {
                // Convert legacy string format to array - preserve all characters
                $tags = array_filter(array_map('trim', explode(',', $model->hashtag)));
                if (empty($tags)) {
                    $tags = array_filter(array_map('trim', explode(' ', $model->hashtag)));
                }
                // Don't filter out characters, just remove empty values
                $model->hashtag = array_values(array_filter($tags));
            } elseif (is_null($model->hashtag)) {
                $model->hashtag = [];
            }
        });
    }

    /**
     * Ensure all messages in a conversation have valid sequential positions
     */
    public static function ensureConversationPositions(?string $conversationId): void
    {
        if (empty($conversationId)) {
            return;
        }

        $hasNullPositions = static::where('conversation_id', $conversationId)
            ->whereNull('position')
            ->exists();
            
        if ($hasNullPositions) {
            $messages = static::where('conversation_id', $conversationId)
                ->orderByRaw('CASE WHEN position IS NULL THEN 1 ELSE 0 END ASC')
                ->orderBy('position', 'asc')
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->get();
                
            foreach ($messages as $index => $msg) {
                if ($msg->position !== $index) {
                    $msg->timestamps = false;
                    $msg->position = $index;
                    $msg->saveQuietly();
                }
            }
        }
    }
    
    /**
     * Normalize text by handling special characters and whitespace
     * Converts: newlines, tabs, multiple spaces, and other whitespace to single spaces
     *
     * @param string $text
     * @return string
     */
    protected static function normalizeText(string $text): string
    {
        // Decode URL encoded characters
        $text = urldecode($text);
        
        // Replace common encoded characters
        $replacements = [
            '%20' => ' ',        // Space
            '%0A' => ' ',        // Line Feed (new line)
            '%0D' => ' ',        // Carriage Return
            '%0D%0A' => ' ',     // Windows-style new line
            '%09' => ' ',        // Tab
            "\n" => ' ',         // Actual newline
            "\r" => ' ',         // Actual carriage return
            "\r\n" => ' ',       // Actual Windows newline
            "\t" => ' ',         // Actual tab
            '&nbsp;' => ' ',     // HTML non-breaking space
        ];
        
        $text = str_replace(array_keys($replacements), array_values($replacements), $text);
        
        // Replace multiple spaces with single space
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Trim the result
        return trim($text);
    }
    
    /**
     * Generate a unique slug from text - Creates URL-friendly slugs
     *
     * @param string $text
     * @param int $attempt
     * @return string
     */
    public static function generateUniqueSlug(string $text, int $attempt = 0): string
    {
        // Remove HTML tags from the text
        $cleanText = strip_tags($text);
        
        // Normalize the text (handle special characters, newlines, tabs, etc.)
        $normalizedText = static::normalizeText($cleanText);
        
        // Generate base slug from normalized text
        $baseSlug = static::createSlugFromQuery($normalizedText);
        
        // Trim the base slug
        $baseSlug = trim($baseSlug);
        
        // If attempt is 0, try the base slug first
        if ($attempt === 0) {
            $slug = $baseSlug;
        } else {
            // For subsequent attempts, append the attempt number with a hyphen
            $slug = $baseSlug . '-' . $attempt;
        }
        
        // Trim the final slug
        $slug = trim($slug, '-');
        
        // Check if slug exists
        if (static::where('slug', $slug)->exists()) {
            // Increment attempt and try again
            return static::generateUniqueSlug($text, $attempt + 1);
        }
        
        return $slug;
    }
    
    /**
     * Ensure a slug is unique (for updates)
     *
     * @param string $slug
     * @param int|null $excludeId
     * @return string
     */
    public static function ensureUniqueSlug(string $slug, ?int $excludeId = null, int $attempt = 0): string
    {
        $query = static::where('slug', $slug);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        if (!$query->exists()) {
            return $slug;
        }
        
        $baseSlug = preg_replace('/-\d+$/', '', $slug);
        $newSlug = $baseSlug . '-' . ($attempt + 1);
        
        // Trim the new slug
        $newSlug = trim($newSlug, '-');
        
        return static::ensureUniqueSlug($newSlug, $excludeId, $attempt + 1);
    }
    
    /**
     * Check if a slug is available for a specific conversation
     *
     * @param string $slug
     * @param string|null $conversationId
     * @return bool
     */
    public static function isSlugAvailable(string $slug, ?string $conversationId = null): bool
    {
        $query = static::where('slug', $slug);
        
        // If editing an existing conversation, exclude its own records
        if ($conversationId) {
            $query->where('conversation_id', '!=', $conversationId);
        }
        
        return !$query->exists();
    }
    
    /**
     * Update slug for an entire conversation
     *
     * @param string $conversationId
     * @param string $newSlug
     * @return bool
     */
    public static function updateConversationSlug(string $conversationId, string $newSlug): bool
    {
        // First check if the new slug is available
        if (!static::isSlugAvailable($newSlug, $conversationId)) {
            return false;
        }
        
        // Clean the slug
        $cleanSlug = static::cleanSlugForUrl($newSlug);
        
        // Update all messages in the conversation
        return static::where('conversation_id', $conversationId)
            ->update(['slug' => $cleanSlug]) > 0;
    }
    
    /**
     * Clean slug for URL use - Converts to URL-friendly format
     * Removes all special characters, converts spaces to hyphens, makes lowercase
     *
     * @param string $slug
     * @return string
     */
    public static function cleanSlugForUrl(string $slug): string
    {
        // Normalize the slug first
        $slug = static::normalizeText($slug);
        
        // Convert to lowercase (preserves Unicode)
        $slug = mb_strtolower($slug, 'UTF-8');
        
        // Remove unwanted symbols: / & * # @ % $ ! ? = + [ ] { } ( ) ; : " ' < > , . | \ ` ~ ^ and all punctuation
        $slug = preg_replace('/[\/&\*#@%\$!\?=\+\[\]{}\(\);:\"\'<>,\.\|\\\\`~^\p{P}]/u', '', $slug);
        
        // Replace spaces with hyphens
        $slug = str_replace(' ', '-', $slug);
        
        // Remove multiple consecutive hyphens (from multiple spaces)
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Remove leading/trailing hyphens
        $slug = trim($slug, '-');
        
        // Limit length for URL safety
        $slug = mb_substr($slug, 0, 80, 'UTF-8');
        
        // Trim again after potential length reduction
        $slug = trim($slug, '-');
        
        // If slug is empty, generate a random one
        if (empty($slug)) {
            $slug = 'conversation-' . Str::random(8);
        }
        
        return $slug;
    }
    
    /**
     * Create slug from query - Creates URL-friendly slug from text
     * Converts to lowercase, removes special characters, replaces spaces with hyphens
     *
     * @param string $text
     * @return string
     */
    protected static function createSlugFromQuery(string $text): string
    {
        $text = trim($text);
        
        // If text is empty or very short, use a generic slug
        if (empty($text) || strlen($text) < 1) {
            return 'conversation';
        }
        
        // Convert to lowercase (preserves Unicode)
        $slug = mb_strtolower($text, 'UTF-8');
        
        // Remove unwanted symbols: / & * # @ % $ ! ? = + [ ] { } ( ) ; : " ' < > , . | \ ` ~ ^ and all punctuation
        $slug = preg_replace('/[\/&\*#@%\$!\?=\+\[\]{}\(\);:\"\'<>,\.\|\\\\`~^\p{P}]/u', '', $slug);
        
        // Replace all spaces with hyphens
        $slug = str_replace(' ', '-', $slug);
        
        // Remove multiple consecutive hyphens (from multiple spaces or other issues)
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Trim leading and trailing hyphens
        $slug = trim($slug, '-');
        
        // Limit length for URL safety (but preserve all characters)
        $slug = mb_substr($slug, 0, 80, 'UTF-8');
        
        // Trim again after potential length reduction
        $slug = trim($slug, '-');
        
        // If slug is empty after cleaning, use a random one
        if (empty($slug)) {
            $slug = 'item-' . Str::random(8);
        }
        
        return $slug;
    }
    
    /**
     * Validate if a string is a valid URL-friendly slug
     *
     * @param string $slug
     * @return bool
     */
    public static function isValidSlug(string $slug): bool
    {
        // Slug should only contain lowercase letters, numbers, hyphens, and Unicode characters
        return preg_match('/^[a-z0-9\p{L}\-]+$/u', $slug) === 1;
    }
    
    /**
     * Generate conversation title from content.
     *
     * @param string $content
     * @return string
     */
    protected static function generateConversationTitle(string $content): string
    {
        $content = trim($content);
        
        // Handle landing pages specially
        if (str_starts_with($content, 'Landing Page:')) {
            return trim($content);
        }
        
        // Handle different languages
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $content)) {
            // Chinese characters
            $title = '中文对话: ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $content)) {
            // Japanese characters
            $title = '日本語の会話: ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{AC00}-\x{D7AF}]/u', $content)) {
            // Korean characters
            $title = '한국어 대화: ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{0600}-\x{06FF}]/u', $content)) {
            // Arabic characters
            $title = 'محادثة عربية: ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{0400}-\x{04FF}]/u', $content)) {
            // Cyrillic characters
            $title = 'Разговор: ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{1F300}-\x{1F9FF}]/u', $content)) {
            // Emojis
            $title = '💬 ' . mb_substr($content, 0, 30, 'UTF-8');
        } elseif (filter_var($content, FILTER_VALIDATE_URL)) {
            // URL
            $parsed = parse_url($content);
            $title = 'Link: ' . ($parsed['host'] ?? substr($content, 0, 50));
        } else {
            // Other languages, use default
            $title = Str::limit($content, 60);
        }
        
        return $title;
    }
    
    /**
     * Get the user that owns the search.
     */
    public function user()
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => 'Guest User',
            'id' => null,
        ]);
    }
    
    /**
     * Get parent message.
     */
    public function parent()
    {
        return $this->belongsTo(AISearchHistory::class, 'parent_id');
    }
    
    /**
     * Get child messages (replies).
     */
    public function children()
    {
        return $this->hasMany(AISearchHistory::class, 'parent_id')->orderBy('created_at', 'asc');
    }
    
    /**
     * Get all messages in the conversation.
     */
    public function conversation()
    {
        return $this->hasMany(AISearchHistory::class, 'conversation_id', 'conversation_id')
        ->orderBy('position', 'asc')
        ->orderBy('created_at', 'asc')
        ->orderBy('id', 'asc');
    }
    
    /**
     * Get conversation messages as a threaded array.
     */
    public function getConversationThreadAttribute()
    {
        $messages = $this->conversation()->get();
        
        // Build threaded structure
        $threaded = [];
        $byId = [];
        
        foreach ($messages as $message) {
            $byId[$message->id] = $message;
            $message->children = [];
        }
        
        foreach ($messages as $message) {
            if ($message->parent_id && isset($byId[$message->parent_id])) {
                $byId[$message->parent_id]->children[] = $message;
            } else {
                $threaded[] = $message;
            }
        }
        
        return $threaded;
    }
    
    /**
     * Get shareable URL.
     *
     * @return string
     */
    public function getShareableUrl(): string
    {
        $url = url('/X/' . $this->slug);
        
        // Parse the URL to handle domain separately
        $parsedUrl = parse_url($url);
        
        if (isset($parsedUrl['host'])) {
            // Convert domain if it contains non-ASCII characters
            $parsedUrl['host'] = idn_to_utf8($parsedUrl['host'], IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
            
            // Rebuild URL
            $scheme = isset($parsedUrl['scheme']) ? $parsedUrl['scheme'] . '://' : '';
            $host = $parsedUrl['host'] ?? '';
            $port = isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '';
            $path = $parsedUrl['path'] ?? '';
            $query = isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '';
            $fragment = isset($parsedUrl['fragment']) ? '#' . $parsedUrl['fragment'] : '';
            
            return $scheme . $host . $port . $path . $query . $fragment;
        }
        
        return $url;
    }
    
    /**
     * Get conversation URL (always points to first message).
     *
     * @return string
     */
    public function getConversationUrl(): string
    {
        $firstMessage = $this->getFirstMessage();
        return $firstMessage ? $firstMessage->getShareableUrl() : $this->getShareableUrl();
    }
    
    /**
     * Get first message in conversation.
     *
     * @return AISearchHistory|null
     */
    public function getFirstMessage()
    {
        return static::where('conversation_id', $this->conversation_id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'asc')
            ->first();
    }
    
    /**
     * Get the root message (parent slug / conversation owner) of this conversation.
     *
     * @return AISearchHistory|null
     */
    public function getRootMessage()
    {
        // 1. If this message has a conversation_id, find the earliest root message (parent_id = null)
        if (!empty($this->conversation_id)) {
            $root = static::where('conversation_id', $this->conversation_id)
                ->whereNull('parent_id')
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->first();

            if ($root) {
                return $root;
            }

            // Fallback: earliest created message in this conversation
            $earliest = static::where('conversation_id', $this->conversation_id)
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->first();

            if ($earliest) {
                return $earliest;
            }
        }

        // 2. If parent_id exists, traverse parent relation
        if ($this->parent_id) {
            $parent = $this->parent;
            if ($parent) {
                return $parent->getRootMessage();
            }
        }

        return $this;
    }

    /**
     * Check if a user or session owns this message OR is the owner of the parent slug / root conversation.
     *
     * @param \App\Models\User|int|string|null $user
     * @param string|null $sessionId
     * @return bool
     */
    public function isOwnedBy($user = null, ?string $sessionId = null): bool
    {
        if ($user === null && \Illuminate\Support\Facades\Auth::check()) {
            $user = \Illuminate\Support\Facades\Auth::user();
        }
        if ($sessionId === null) {
            $sessionId = \Illuminate\Support\Facades\Session::getId();
        }

        $userId = $user ? (is_object($user) ? $user->id : $user) : null;

        // 1. Direct owner of this message
        if ($userId && $this->user_id == $userId) {
            return true;
        }
        if ($sessionId && !empty($this->session_id) && $this->session_id === $sessionId) {
            return true;
        }

        // 2. Owner of the parent slug / root conversation
        $rootMessage = $this->getRootMessage();
        if ($rootMessage && $rootMessage->id !== $this->id) {
            if ($userId && $rootMessage->user_id == $userId) {
                return true;
            }
            if ($sessionId && !empty($rootMessage->session_id) && $rootMessage->session_id === $sessionId) {
                return true;
            }
        }

        return false;
    }
    
    /**
     * Get last message in conversation.
     *
     * @return AISearchHistory|null
     */
    public function getLastMessage()
    {
        return static::where('conversation_id', $this->conversation_id)
            ->orderBy('created_at', 'desc')
            ->first();
    }
    
    /**
     * Get conversation message count.
     *
     * @return int
     */
    public function getMessageCountAttribute(): int
    {
        return static::where('conversation_id', $this->conversation_id)->count();
    }
    
    /**
     * Get short URL.
     *
     * @return string
     */
    public function getShortUrl(): string
    {
        return url('/s/' . urlencode($this->slug));
    }
    
    /**
     * Get response preview (first 200 characters).
     *
     * @return string
     */
    public function getResponsePreviewAttribute(): string
    {
        if (empty($this->response)) {
            if ($this->content_type === self::CONTENT_TYPE_COMMENT) {
                return Str::limit($this->query ?? 'Comment', 200);
            } elseif ($this->content_type === self::CONTENT_TYPE_UPLOAD) {
                return 'File: ' . ($this->file_data['original_name'] ?? 'Uploaded file');
            } elseif ($this->content_type === self::CONTENT_TYPE_SOCIAL || $this->content_type === self::CONTENT_TYPE_SOCIAL_MEDIA) {
                $plainText = strip_tags($this->query ?? '');
                return Str::limit($plainText, 200) ?: 'Social media post';
            } elseif ($this->content_type === self::CONTENT_TYPE_LANDING_PAGE) {
                return 'Landing Page: ' . ($this->landing_page_url ?? 'No URL');
            } elseif ($this->content_type === self::CONTENT_TYPE_EMBED) {
                $plainText = strip_tags($this->query ?? '');
                return Str::limit($plainText, 200) ?: 'Embed Layout';
            }
            return 'No response yet';
        }
        
        $plainText = strip_tags($this->response);
        return Str::limit($plainText, 200);
    }
    
    /**
     * Get formatted created date.
     *
     * @return string
     */
    public function getFormattedCreatedAtAttribute(): string
    {
        return $this->created_at->format('M d, Y \a\t h:i A');
    }
    
    /**
     * Get total tokens used.
     *
     * @return int
     */
    public function getTotalTokensAttribute(): int
    {
        return $this->usage['total_tokens'] ?? 0;
    }
    
    /**
     * Get conversation total tokens.
     *
     * @return int
     */
    public function getConversationTokensAttribute(): int
    {
        return static::where('conversation_id', $this->conversation_id)
            ->sum('total_tokens');
    }
    
    /**
     * Get estimated cost based on Kimi API pricing.
     *
     * @return float
     */
    public function getCostEstimateAttribute(): float
    {
        // Kimi API pricing estimate: ~$0.01 per 1000 tokens
        $totalTokens = $this->total_tokens;
        return round(($totalTokens / 1000) * 0.01, 4);
    }
    
    /**
     * Get conversation cost estimate.
     *
     * @return float
     */
    public function getConversationCostAttribute(): float
    {
        $totalTokens = $this->conversation_tokens;
        return round(($totalTokens / 1000) * 0.01, 4);
    }
    
    /**
     * Get response time in seconds.
     *
     * @return int|null
     */
    public function getResponseTimeAttribute(): ?int
    {
        if (!$this->created_at || !$this->updated_at) {
            return null;
        }
        
        return $this->created_at->diffInSeconds($this->updated_at);
    }
    
    /**
     * Get share URL attribute.
     *
     * @return string
     */
    public function getShareUrlAttribute(): string
    {
        return $this->getShareableUrl();
    }
    
    /**
     * Get conversation URL attribute.
     *
     * @return string
     */
    public function getConversationUrlAttribute(): string
    {
        return $this->getConversationUrl();
    }
    
    /**
     * Get pinned attribute.
     * This is the accessor for the 'pinned' attribute.
     *
     * @return bool
     */
    public function getPinnedAttribute(): bool
    {
        return $this->attributes['pinned'] ?? false;
    }
    
    /**
     * Get content type label.
     *
     * @return string
     */
    public function getContentTypeLabelAttribute(): string
    {
        switch ($this->content_type) {
            case self::CONTENT_TYPE_AI:
                return 'AI Response';
            case self::CONTENT_TYPE_COMMENT:
                return 'Comment';
            case self::CONTENT_TYPE_UPLOAD:
                return 'File Upload';
            case self::CONTENT_TYPE_SOCIAL:
                return 'Social Media Post';
            case self::CONTENT_TYPE_SOCIAL_MEDIA:
                return 'Social Media Post';
            case self::CONTENT_TYPE_LANDING_PAGE:
                return 'Landing Page';
            case self::CONTENT_TYPE_EMBED:
                return 'Embed';
            default:
                return 'Message';
        }
    }
    
    /**
     * Get file information.
     *
     * @return array|null
     */
    public function getFileInfoAttribute(): ?array
    {
        if ($this->content_type !== self::CONTENT_TYPE_UPLOAD || !$this->file_data) {
            return null;
        }
        
        return [
            'name' => $this->file_data['original_name'] ?? 'Unknown',
            'size' => $this->file_data['size'] ?? 0,
            'size_formatted' => $this->formatFileSize($this->file_data['size'] ?? 0),
            'type' => $this->file_data['mime_type'] ?? 'application/octet-stream',
            'extension' => $this->file_data['extension'] ?? '',
            'url' => $this->file_data['url'] ?? null,
            'download_url' => $this->file_data['url'] ?? null,
            'is_image' => $this->isImageFile(),
            'dimensions' => $this->getImageDimensions(),
        ];
    }
    
    /**
     * Format file size.
     *
     * @param int $bytes
     * @return string
     */
    private function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Check if file is an image.
     *
     * @return bool
     */
    public function isImageFile(): bool
    {
        if (!$this->file_data || !isset($this->file_data['mime_type'])) {
            return false;
        }
        
        return strpos($this->file_data['mime_type'], 'image/') === 0;
    }
    
    /**
     * Get image dimensions.
     *
     * @return array|null
     */
    public function getImageDimensions(): ?array
    {
        if (!$this->isImageFile() || !isset($this->file_data['width'])) {
            return null;
        }
        
        return [
            'width' => $this->file_data['width'] ?? null,
            'height' => $this->file_data['height'] ?? null,
        ];
    }
    
    /**
     * Get private access information.
     *
     * @return array|null
     */
    public function getPrivateAccessInfoAttribute(): ?array
    {
        if ($this->status !== self::STATUS_PRIVATE) {
            return null;
        }
        
        return [
            'has_access_number' => !empty($this->private_access_number),
            'has_access_limit' => !is_null($this->private_access_limit),
            'access_limit' => $this->private_access_limit,
            'views_count' => $this->private_views_count ?? 0,
            'is_limit_reached' => $this->private_access_limit !== null && 
                                  ($this->private_views_count ?? 0) >= $this->private_access_limit,
            'remaining_views' => $this->private_access_limit !== null ? 
                                  max(0, $this->private_access_limit - ($this->private_views_count ?? 0)) : null,
        ];
    }
    
    /**
     * Increment private view count.
     *
     * @return void
     */
    public function incrementPrivateViewCount(): void
    {
        if ($this->status === self::STATUS_PRIVATE) {
            $this->increment('private_views_count');
        }
    }
    
    /**
     * Check if private access is valid for a given number.
     *
     * @param string $accessNumber
     * @return bool
     */
    public function isValidPrivateAccess(string $accessNumber): bool
    {
        if ($this->status !== self::STATUS_PRIVATE) {
            return false;
        }
        
        // Check if access number matches
        if (empty($this->private_access_number) || $this->private_access_number !== $accessNumber) {
            return false;
        }
        
        // Check if limit is reached
        if ($this->private_access_limit !== null && 
            ($this->private_views_count ?? 0) >= $this->private_access_limit) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get remaining private views.
     *
     * @return int|null
     */
    public function getRemainingPrivateViews(): ?int
    {
        if ($this->status !== self::STATUS_PRIVATE || $this->private_access_limit === null) {
            return null;
        }
        
        return max(0, $this->private_access_limit - ($this->private_views_count ?? 0));
    }
    
    /**
     * Check if private view limit is reached.
     *
     * @return bool
     */
    public function isPrivateLimitReached(): bool
    {
        if ($this->status !== self::STATUS_PRIVATE || $this->private_access_limit === null) {
            return false;
        }
        
        return ($this->private_views_count ?? 0) >= $this->private_access_limit;
    }
    
    /**
     * ============================================================
     * HASHTAG METHODS - Multiple hashtag support with emoji and multilingual
     * ============================================================
     */
    
    /**
     * Clean a hashtag - remove # only if at start, preserve all other characters
     * including emojis and multilingual characters
     *
     * @param string $tag
     * @return string
     */
    public function cleanHashtag(string $tag): string
    {
        $tag = trim($tag);
        
        // Remove only if the first character is # (don't remove if # appears elsewhere)
        if (mb_substr($tag, 0, 1) === '#') {
            $tag = mb_substr($tag, 1);
        }
        
        // Trim again after removing #
        $tag = trim($tag);
        
        // Don't remove special characters - allow emojis and all Unicode
        // Only remove control characters and invalid UTF-8 sequences
        $tag = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $tag);
        
        // Return as-is, preserving all valid characters
        return $tag;
    }
    
    /**
     * Get hashtag as array (accessor)
     *
     * @return array
     */
    public function getHashtagListAttribute(): array
    {
        if (is_string($this->hashtag)) {
            // Handle legacy string format
            $tags = array_filter(array_map('trim', explode(',', $this->hashtag)));
            if (empty($tags)) {
                $tags = array_filter(array_map('trim', explode(' ', $this->hashtag)));
            }
            return array_values(array_unique($tags));
        }
        
        if (is_null($this->hashtag)) {
            return [];
        }
        
        return is_array($this->hashtag) ? $this->hashtag : [];
    }
    
    /**
     * Get hashtags as display string with # prefix
     *
     * @return string
     */
    public function getHashtagDisplayAttribute(): string
    {
        $tags = $this->getHashtagListAttribute();
        if (empty($tags)) {
            return '';
        }
        return implode(' ', array_map(fn($tag) => '#' . $tag, $tags));
    }
    
    /**
     * Get hashtags as CSV string
     *
     * @return string
     */
    public function getHashtagCsvAttribute(): string
    {
        return implode(',', $this->getHashtagListAttribute());
    }
    
    /**
     * Add a single hashtag
     *
     * @param string $tag
     * @return self
     */
    public function addHashtag(string $tag): self
    {
        $tags = $this->getHashtagListAttribute();
        $cleanTag = $this->cleanHashtag($tag);
        
        if ($cleanTag && !in_array($cleanTag, $tags)) {
            $tags[] = $cleanTag;
            $this->hashtag = $tags;
            $this->save();
        }
        
        return $this;
    }
    
    /**
     * Remove a hashtag
     *
     * @param string $tag
     * @return self
     */
    public function removeHashtag(string $tag): self
    {
        $tags = $this->getHashtagListAttribute();
        $cleanTag = $this->cleanHashtag($tag);
        
        $filtered = array_values(array_filter($tags, fn($t) => $t !== $cleanTag));
        $this->hashtag = $filtered;
        $this->save();
        
        return $this;
    }
    
    /**
     * Set multiple hashtags
     *
     * @param array $tags
     * @return self
     */
    public function setHashtags(array $tags): self
    {
        $cleaned = array_filter(array_map([$this, 'cleanHashtag'], $tags));
        $this->hashtag = array_values(array_unique($cleaned));
        $this->save();
        
        return $this;
    }
    
    /**
     * Check if a hashtag exists
     *
     * @param string $tag
     * @return bool
     */
    public function hasHashtag(string $tag): bool
    {
        $cleanTag = $this->cleanHashtag($tag);
        return in_array($cleanTag, $this->getHashtagListAttribute());
    }
    
    /**
     * Get hashtag count
     *
     * @return int
     */
    public function getHashtagCountAttribute(): int
    {
        return count($this->getHashtagListAttribute());
    }
    
    /**
     * Scope for searching by hashtags
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|array $tags
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithHashtags($query, $tags)
    {
        $searchTags = is_array($tags) ? $tags : [$tags];
        $cleanedTags = array_map([$this, 'cleanHashtag'], $searchTags);
        
        return $query->where(function($q) use ($cleanedTags) {
            foreach ($cleanedTags as $tag) {
                $q->orWhereJsonContains('hashtag', $tag);
            }
        });
    }
    
    /**
     * Scope for filtering by hashtag count
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $min
     * @param int|null $max
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeHashtagCount($query, int $min, ?int $max = null)
    {
        $raw = "JSON_LENGTH(hashtag)";
        $query->whereRaw("{$raw} >= ?", [$min]);
        
        if ($max !== null) {
            $query->whereRaw("{$raw} <= ?", [$max]);
        }
        
        return $query;
    }
    
    /**
     * ============================================================
     * END HASHTAG METHODS
     * ============================================================
     */
    
    /**
     * Scope a query to only include AI responses.
     */
    public function scopeAiResponses($query)
    {
        return $query->where('content_type', self::CONTENT_TYPE_AI);
    }
    
    /**
     * Scope a query to only include comments.
     */
    public function scopeComments($query)
    {
        return $query->where('content_type', self::CONTENT_TYPE_COMMENT);
    }
    
    /**
     * Scope a query to only include file uploads.
     */
    public function scopeUploads($query)
    {
        return $query->where('content_type', self::CONTENT_TYPE_UPLOAD);
    }
    
    /**
     * Scope a query to only include social media posts.
     */
    public function scopeSocialPosts($query)
    {
        return $query->whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA]);
    }
    
    /**
     * Scope a query to only include landing pages.
     */
    public function scopeLandingPages($query)
    {
        return $query->where('content_type', self::CONTENT_TYPE_LANDING_PAGE);
    }
    
    /**
     * Scope a query to only include embeds.
     */
    public function scopeEmbeds($query)
    {
        return $query->where('content_type', self::CONTENT_TYPE_EMBED);
    }
    
    /**
     * Scope a query to only include public searches.
     */
    public function scopePublic($query)
    {
        return $query->where('status', self::STATUS_PUBLIC);
    }
    
    /**
     * Scope a query to only include private searches.
     */
    public function scopePrivate($query)
    {
        return $query->where('status', self::STATUS_PRIVATE);
    }
    
    /**
     * Scope a query to only include hidden messages.
     */
    public function scopeHidden($query)
    {
        return $query->where('status', self::STATUS_HIDDEN);
    }
    
    /**
     * Scope a query to only include pinned conversations.
     */
    public function scopePinned($query)
    {
        return $query->where('pinned', true);
    }
    
    /**
     * Scope a query to only include unpinned conversations.
     */
    public function scopeUnpinned($query)
    {
        return $query->where('pinned', false);
    }
    
    /**
     * Scope a query to only include user's searches.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
    
    /**
     * Scope a query to only include searches from session.
     */
    public function scopeForSession($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }
    
    /**
     * Scope a query to only include conversations (first messages).
     */
    public function scopeConversations($query)
    {
        return $query->whereNull('parent_id');
    }
    
    /**
     * Scope a query to only include messages (non-root).
     */
    public function scopeMessages($query)
    {
        return $query->whereNotNull('parent_id');
    }
    
    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate = null)
    {
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        
        return $query;
    }
    
    /**
     * Scope a query to filter by model.
     */
    public function scopeByModel($query, $model)
    {
        return $query->where('model', $model);
    }
    
    /**
     * Scope a query to filter by content type.
     */
    public function scopeByContentType($query, $contentType)
    {
        return $query->where('content_type', $contentType);
    }
    
    /**
     * Scope a query to filter by private access status.
     */
    public function scopeHasPrivateAccess($query)
    {
        return $query->where('status', self::STATUS_PRIVATE)
            ->whereNotNull('private_access_number');
    }
    
    /**
     * Scope a query to filter by private access limit not reached.
     */
    public function scopePrivateLimitNotReached($query)
    {
        return $query->where('status', self::STATUS_PRIVATE)
            ->where(function($q) {
                $q->whereNull('private_access_limit')
                  ->orWhereRaw('private_views_count < private_access_limit');
            });
    }
    
    /**
     * Get related items (similar queries or content).
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRelatedItems($limit = 5)
    {
        $keywords = explode(' ', $this->query ?? '');
        $keywords = array_filter($keywords, function($word) {
            return strlen($word) > 3;
        });
        
        if (empty($keywords)) {
            return collect();
        }
        
        return static::where('id', '!=', $this->id)
            ->where(function($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('query', 'LIKE', '%' . $keyword . '%');
                }
            })
            ->whereNull('parent_id') // Only show top-level items
            ->public() // Only public items
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Get related searches (similar queries or content) - alias for getRelatedItems
     * This method is used by SearchController
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getRelatedSearches($limit = 5)
    {
        return $this->getRelatedItems($limit);
    }
    
    /**
     * Get popular searches.
     *
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getPopularSearches($limit = 10)
    {
        return static::whereNull('parent_id')
            ->public()
            ->select('query', \DB::raw('COUNT(*) as count'))
            ->groupBy('query')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Format a single message or collection of messages for API/Inertia display.
     * Ensures user (with avatar, email, name, id), ip_address, parent_id, position, 
     * social_media_metadata, format, file_data, etc. are always consistently formatted.
     */
    public static function formatMessageForDisplay($message): array
    {
        if (is_array($message)) {
            $message = (object) $message;
        }

        $createdAtIso = null;
        if (isset($message->created_at)) {
            if ($message->created_at instanceof \Carbon\Carbon) {
                $createdAtIso = $message->created_at->toISOString();
            } else {
                $createdAtIso = $message->created_at;
            }
        }

        $formattedCreatedAt = null;
        if (isset($message->formatted_created_at)) {
            $formattedCreatedAt = $message->formatted_created_at;
        } elseif (isset($message->created_at) && $message->created_at instanceof \Carbon\Carbon) {
            $formattedCreatedAt = $message->created_at->format('M d, Y \a\t h:i A');
        }

        $userObj = null;
        if (isset($message->user) && $message->user) {
            if (is_array($message->user)) {
                $userObj = [
                    'id' => $message->user['id'] ?? null,
                    'name' => $message->user['name'] ?? null,
                    'email' => $message->user['email'] ?? null,
                    'avatar' => $message->user['avatar'] ?? null,
                    'profile_photo_url' => $message->user['profile_photo_url'] ?? null,
                ];
            } else {
                $userObj = [
                    'id' => $message->user->id ?? null,
                    'name' => $message->user->name ?? null,
                    'email' => $message->user->email ?? null,
                    'avatar' => $message->user->avatar ?? null,
                    'profile_photo_url' => $message->user->profile_photo_url ?? null,
                ];
            }
        }

        $shareUrl = null;
        if (is_object($message) && method_exists($message, 'getShareableUrl')) {
            $shareUrl = $message->getShareableUrl();
        } elseif (isset($message->share_url)) {
            $shareUrl = $message->share_url;
        }

        $conversationUrl = null;
        if (is_object($message) && method_exists($message, 'getConversationUrl')) {
            $conversationUrl = $message->getConversationUrl();
        } elseif (isset($message->conversation_url)) {
            $conversationUrl = $message->conversation_url;
        }

        $socialMetadata = $message->social_media_metadata ?? null;
        $format = 'markdown';
        if (is_array($socialMetadata) && isset($socialMetadata['format'])) {
            $format = $socialMetadata['format'];
        } elseif (isset($message->format)) {
            $format = $message->format;
        }

        return [
            'id' => $message->id ?? null,
            'slug' => $message->slug ?? null,
            'message_role' => $message->message_role ?? null,
            'content_type' => $message->content_type ?? 'ai',
            'parent_id' => $message->parent_id ?? null,
            'position' => $message->position ?? null,
            'query' => $message->query ?? null,
            'response' => $message->response ?? null,
            'file_data' => $message->file_data ?? null,
            'file_metadata' => $message->file_metadata ?? null,
            'created_at' => $createdAtIso,
            'formatted_created_at' => $formattedCreatedAt,
            'thinking_enabled' => $message->thinking_enabled ?? false,
            'model' => $message->model ?? null,
            'temperature' => $message->temperature ?? 0.6,
            'max_tokens' => $message->max_tokens ?? 2000,
            'total_tokens' => $message->total_tokens ?? 0,
            'usage' => $message->usage ?? null,
            'finish_reason' => $message->finish_reason ?? null,
            'sources' => $message->sources ?? [],
            'status' => $message->status ?? self::STATUS_PUBLIC,
            'share_url' => $shareUrl,
            'conversation_url' => $conversationUrl,
            'landing_page_url' => $message->landing_page_url ?? null,
            'ip_address' => $message->ip_address ?? null,
            'user_id' => $message->user_id ?? null,
            'social_media_metadata' => $socialMetadata,
            'session_id' => $message->session_id ?? null,
            'format' => $format,
            'user' => $userObj,
            // Include hashtag info for messages
            'hashtag' => isset($message->hashtag) ? 
                (is_array($message->hashtag) ? $message->hashtag : []) : [],
            'hashtag_display' => isset($message->hashtag_display) ? 
                $message->hashtag_display : '',
        ];
    }

    /**
     * Get conversation messages for API response.
     * This method ensures all messages include the status field.
     *
     * @return array
     */
    public function getConversationMessages(): array
    {
        $messages = $this->conversation()->with('user')->get();
        
        return $messages->map(function ($message) {
            return self::formatMessageForDisplay($message);
        })->toArray();
    }
    
    /**
     * Get conversation summary.
     *
     * @return array
     */
    public function getConversationSummary(): array
    {
        $firstMessage = $this->getFirstMessage();
        $lastMessage = $this->getLastMessage();
        
        return [
            'id' => $this->conversation_id,
            'title' => $firstMessage->conversation_title ?? 'Untitled Conversation',
            'message_count' => $this->message_count,
            'content_types' => $this->getContentTypeCounts(),
            'total_tokens' => $this->conversation_tokens,
            'total_cost' => $this->conversation_cost,
            'created_at' => $firstMessage->created_at->toISOString(),
            'updated_at' => $lastMessage->created_at->toISOString(),
            'status' => $firstMessage->status ?? self::STATUS_PUBLIC,
            'pinned' => $firstMessage->pinned ?? false,
            'private_access_info' => $firstMessage->private_access_info,
            'hashtags' => $firstMessage->getHashtagListAttribute(),
            'hashtag_display' => $firstMessage->getHashtagDisplayAttribute(),
            'user' => $firstMessage->user ? [
                'id' => $firstMessage->user->id,
                'name' => $firstMessage->user->name,
            ] : null,
            'first_message_url' => $firstMessage ? $firstMessage->getShareableUrl() : null,
        ];
    }
    
    /**
     * Get counts by content type for a conversation.
     *
     * @return array
     */
    public function getContentTypeCounts(): array
    {
        $counts = [];
        
        $types = static::where('conversation_id', $this->conversation_id)
            ->select('content_type', \DB::raw('count(*) as count'))
            ->groupBy('content_type')
            ->pluck('count', 'content_type')
            ->toArray();
        
        foreach ([self::CONTENT_TYPE_AI, self::CONTENT_TYPE_COMMENT, self::CONTENT_TYPE_UPLOAD, self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_LANDING_PAGE, self::CONTENT_TYPE_EMBED] as $type) {
            $counts[$type] = $types[$type] ?? 0;
        }
        
        return $counts;
    }
    
    /**
     * Check if the search is public.
     *
     * @return bool
     */
    public function isPublic(): bool
    {
        return $this->status === self::STATUS_PUBLIC;
    }
    
    /**
     * Check if the search is private.
     *
     * @return bool
     */
    public function isPrivate(): bool
    {
        return $this->status === self::STATUS_PRIVATE;
    }
    
    /**
     * Check if the message is hidden.
     *
     * @return bool
     */
    public function isHidden(): bool
    {
        return $this->status === self::STATUS_HIDDEN;
    }
    
    /**
     * Check if the conversation is pinned.
     *
     * @return bool
     */
    public function isPinned(): bool
    {
        return $this->pinned ?? false;
    }
    
    /**
     * Check if this is an AI message.
     *
     * @return bool
     */
    public function isAi(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_AI;
    }
    
    /**
     * Check if this is a comment.
     *
     * @return bool
     */
    public function isComment(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_COMMENT;
    }
    
    /**
     * Check if this is a file upload.
     *
     * @return bool
     */
    public function isUpload(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_UPLOAD;
    }
    
    /**
     * Check if this is a social media post.
     *
     * @return bool
     */
    public function isSocialPost(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_SOCIAL || 
               $this->content_type === self::CONTENT_TYPE_SOCIAL_MEDIA;
    }
    
    /**
     * Check if this is a landing page.
     *
     * @return bool
     */
    public function isLandingPage(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_LANDING_PAGE;
    }
    
    /**
     * Check if this is an embed.
     *
     * @return bool
     */
    public function isEmbed(): bool
    {
        return $this->content_type === self::CONTENT_TYPE_EMBED;
    }
    
    /**
     * Toggle status between public and private.
     *
     * @return $this
     */
    public function toggleStatus()
    {
        $this->status = $this->isPublic() ? self::STATUS_PRIVATE : self::STATUS_PUBLIC;
        $this->save();
        
        return $this;
    }
    
    /**
     * Toggle pin status.
     *
     * @return $this
     */
    public function togglePin()
    {
        $this->pinned = !$this->pinned;
        $this->save();
        
        return $this;
    }
    
    /**
     * Make the search public.
     *
     * @return $this
     */
    public function makePublic()
    {
        $this->status = self::STATUS_PUBLIC;
        $this->save();
        
        return $this;
    }
    
    /**
     * Make the search private.
     *
     * @return $this
     */
    public function makePrivate()
    {
        $this->status = self::STATUS_PRIVATE;
        $this->save();
        
        return $this;
    }
    
    /**
     * Hide the message.
     *
     * @return $this
     */
    public function hide()
    {
        $this->status = self::STATUS_HIDDEN;
        $this->save();
        
        return $this;
    }
    
    /**
     * Unhide the message.
     *
     * @return $this
     */
    public function unhide()
    {
        $this->status = self::STATUS_PUBLIC;
        $this->save();
        
        return $this;
    }
    
    /**
     * Pin the conversation.
     *
     * @return $this
     */
    public function pin()
    {
        if (!$this->pinned) {
            $maxOrder = static::where('pinned', true)->max('pinned_order') ?? 0;
            $this->pinned_order = $maxOrder + 1;
        }
        $this->pinned = true;
        $this->save();
        
        return $this;
    }
    
    /**
     * Unpin the conversation.
     *
     * @return $this
     */
    public function unpin()
    {
        $this->pinned = false;
        $this->pinned_order = null;
        $this->save();
        
        return $this;
    }
    
    /**
     * Reorder pinned conversations.
     *
     * @param array $order
     * @return void
     */
    public static function reorderPinned(array $order): void
    {
        foreach ($order as $index => $conversationId) {
            static::where('conversation_id', $conversationId)
                ->where('pinned', true)
                ->update(['pinned_order' => $index + 1]);
        }
    }
    
    /**
     * Get status badge HTML.
     *
     * @return string
     */
    public function getStatusBadgeAttribute(): string
    {
        if ($this->isPublic()) {
            return '<span class="badge bg-success">Public</span>';
        } elseif ($this->isPrivate()) {
            return '<span class="badge bg-secondary">Private</span>';
        } elseif ($this->isHidden()) {
            return '<span class="badge bg-danger">Hidden</span>';
        }
        
        return '<span class="badge bg-light">Unknown</span>';
    }
    
    /**
     * Get content type badge HTML.
     *
     * @return string
     */
    public function getContentTypeBadgeAttribute(): string
    {
        switch ($this->content_type) {
            case self::CONTENT_TYPE_AI:
                return '<span class="badge bg-primary">AI</span>';
            case self::CONTENT_TYPE_COMMENT:
                return '<span class="badge bg-info">Comment</span>';
            case self::CONTENT_TYPE_UPLOAD:
                return '<span class="badge bg-warning text-dark">Upload</span>';
            case self::CONTENT_TYPE_SOCIAL:
            case self::CONTENT_TYPE_SOCIAL_MEDIA:
                return '<span class="badge bg-success">Social</span>';
            case self::CONTENT_TYPE_LANDING_PAGE:
                return '<span class="badge bg-purple">Landing Page</span>';
            case self::CONTENT_TYPE_EMBED:
                return '<span class="badge bg-indigo text-white">Embed</span>';
            default:
                return '<span class="badge bg-secondary">Message</span>';
        }
    }
    
    /**
     * Get pin badge HTML.
     *
     * @return string
     */
    public function getPinBadgeAttribute(): string
    {
        if ($this->isPinned()) {
            return '<span class="badge bg-warning text-dark">📌 Pinned</span>';
        }
        
        return '';
    }
    
    /**
     * Get message role badge.
     *
     * @return string
     */
    public function getRoleBadgeAttribute(): string
    {
        if ($this->message_role === self::ROLE_USER) {
            return '<span class="badge bg-primary">User</span>';
        } elseif ($this->message_role === self::ROLE_ASSISTANT) {
            return '<span class="badge bg-info">Assistant</span>';
        } else {
            return '<span class="badge bg-warning">System</span>';
        }
    }
    
    /**
     * Get model badge.
     *
     * @return string
     */
    public function getModelBadgeAttribute(): string
    {
        $models = [
            'kimi-k3' => 'badge bg-dark',
            'kimi-k2.5' => 'badge bg-dark',
            'kimi-k2-turbo-preview' => 'badge bg-dark',
            'kimi-k2-thinking' => 'badge bg-purple',
            'kimi-k2-vision' => 'badge bg-indigo',
            'kimi-k2-vision-preview' => 'badge bg-indigo',
            'kimi-k2-agent' => 'badge bg-info',
            'kimi-k2-agent-swarm' => 'badge bg-info',
            'kimi-k1.5' => 'badge bg-secondary',
            'kimi-k1.5-long-context' => 'badge bg-secondary',
            'moonshot-v1-8k' => 'badge bg-secondary',
            'moonshot-v1-32k' => 'badge bg-secondary',
            'moonshot-v1-128k' => 'badge bg-secondary',
        ];
        
        $class = $models[$this->model] ?? 'badge bg-secondary';
        
        return '<span class="' . $class . '">' . $this->model . '</span>';
    }
    
    /**
     * Delete the model and all its children.
     *
     * @return bool|null
     */
    public function delete()
    {
        // Delete all children first
        foreach ($this->children as $child) {
            $child->delete();
        }
        
        // Delete associated file if this is an upload
        if ($this->isUpload() && $this->file_data && isset($this->file_data['path'])) {
            try {
                $filePath = public_path($this->file_data['path']);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            } catch (\Exception $e) {
                // Log error but don't prevent deletion
                \Log::error('Failed to delete file: ' . $e->getMessage());
            }
        }
        
        return parent::delete();
    }
    
    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }
    
    /**
     * Get the EzFunnel associated with this AI search history.
     */
    public function ezFunnel()
    {
        return $this->hasOne(EzFunnel::class, 'aiid', 'id');
    }
    
    /**
     * Get reactions for this message
     */
    public function getReactionsAttribute()
    {
        return $this->reaction_counts ?? $this->getDefaultReactionCounts();
    }

    /**
     * Get default reaction counts
     */
    protected function getDefaultReactionCounts()
    {
        return [
            'like' => 0,
            'love' => 0,
            'care' => 0,
            'haha' => 0,
            'wow' => 0,
            'sad' => 0,
            'angry' => 0,
        ];
    }

    /**
     * Get reaction total
     */
    public function getReactionTotalAttribute()
    {
        return $this->attributes['reaction_total'] ?? 0;
    }

    /**
     * Get reactions with user's reaction
     */
    public function getReactionsWithUser($userId = null, $sessionId = null, $ipAddress = null)
    {
        return MessageReaction::getMessageReactions($this->id, $userId, $sessionId, $ipAddress);
    }

    /**
     * Toggle reaction on this message
     */
    public function toggleReaction($reactionType, $userId = null, $sessionId = null, $ipAddress = null)
    {
        return MessageReaction::toggleReaction($this->id, $this->slug, $reactionType, $userId, $sessionId, $ipAddress);
    }

    /**
     * Get reaction counts for this message
     */
    public function getReactionCountsAttribute(): array
    {
        if ($this->relationLoaded('reactions')) {
            return $this->reactions->groupBy('reaction_type')
                ->map(function ($group) {
                    return $group->count();
                })
                ->toArray();
        }
        
        // Return cached counts if available
        return $this->reaction_counts ?? [
            'like' => 0,
            'love' => 0,
            'care' => 0,
            'haha' => 0,
            'wow' => 0,
            'sad' => 0,
            'angry' => 0,
        ];
    }
}