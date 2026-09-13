<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\Template;
use App\Models\EzFunnel;
use App\Models\Defaultpage;
use App\Models\Themecollection;
use App\Models\EzFunnelField;
use App\Models\FunnelLogoSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Emaildesign;
use App\Mail\Eznew;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Parsedown; // Add this for Markdown support

class SocialContentController extends Controller
{
    /**
     * Constants for content types
     */
    const CONTENT_TYPE_SOCIAL = 'social';
    const CONTENT_TYPE_SOCIAL_MEDIA = 'social_media';

    /**
     * Constants for content formats
     */
    const FORMAT_MARKDOWN = 'markdown';
    const FORMAT_HTML = 'html';

    /**
     * Save social media post to database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'nullable|string',
            'media' => 'nullable|array',
            'media.*' => 'string',
            'content_warning' => 'nullable|string|max:255',
            'conversation_id' => 'nullable|string',
            'parent_slug' => 'nullable|string',
            'custom_slug' => 'nullable|string|max:100', // Allow any characters, only spaces will be converted to hyphens
            'format' => 'nullable|in:markdown,html', // Content format
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $content = $request->input('content', '');
        $mediaFiles = $request->input('media', []);
        $contentWarning = $request->input('content_warning');
        $conversationId = $request->input('conversation_id');
        $parentSlug = $request->input('parent_slug');
        $customSlug = $request->input('custom_slug');
        $format = $request->input('format', self::FORMAT_MARKDOWN); // Default to markdown
        
        // Validate max 4 media files
        if (count($mediaFiles) > 4) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum 4 media files allowed',
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Find parent message if provided
            $parentMessage = null;
            if ($parentSlug) {
                $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();
                
                if ($parentMessage && !$conversationId) {
                    $conversationId = $parentMessage->conversation_id;
                }
            }

            // Determine conversation status from root message
            $conversationStatus = 'public';
            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();
                
                if ($firstMessage) {
                    $conversationStatus = $firstMessage->status;
                }
            } elseif ($parentMessage) {
                $firstMessage = $parentMessage->getFirstMessage();
                if ($firstMessage) {
                    $conversationStatus = $firstMessage->status;
                }
            }

            // Build the social media content with format parameter
            $socialContent = $this->buildSocialContent($content, $mediaFiles, $contentWarning, $format);
			$position = null;
			if ($conversationId) {
				AISearchHistory::ensureConversationPositions($conversationId);
				if ($parentMessage) {
					$parentMessage->refresh();
				}
			}
			if ($parentMessage) {
				$position = ($parentMessage->position ?? 0) + 1;
				
				AISearchHistory::where('conversation_id', $conversationId)
					->where('position', '>=', $position)
					->increment('position');
			} else {
				$maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position') ?? -1;
				$position = $maxPosition + 1;
			}

            // User requirement: "comments only store in comment table in the db not in conversation as a conversation"
            // If this is a reply/comment to an existing parent message, store strictly in comments table
            if ($parentMessage || $parentSlug) {
                $comment = \App\Models\Comment::create([
                    'message_id' => $parentMessage ? $parentMessage->id : null,
                    'message_slug' => $parentSlug ?: ($parentMessage ? $parentMessage->slug : null),
                    'conversation_id' => $conversationId,
                    'parent_id' => $parentMessage ? $parentMessage->id : null,
                    'user_id' => Auth::id(),
                    'user_name' => Auth::check() ? (Auth::user()->name ?? Auth::user()->email) : 'Guest',
                    'user_avatar' => Auth::check() ? Auth::user()->avatar : null,
                    'user_email' => Auth::check() ? Auth::user()->email : null,
                    'content' => $content,
                    'format' => $format ?: 'markdown',
                    'content_type' => 'comment',
                    'media' => $mediaFiles,
                    'content_warning' => $contentWarning,
                    'status' => 'approved',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ]);

                DB::commit();

                $commentsCount = \App\Models\Comment::where(function($q) use ($parentMessage, $parentSlug) {
                    if ($parentMessage) $q->where('message_id', $parentMessage->id);
                    if ($parentSlug) $q->orWhere('message_slug', $parentSlug);
                })->where('status', '!=', 'deleted')->count();

                return response()->json([
                    'success' => true,
                    'message' => 'Comment stored in comments table successfully',
                    'comment' => $comment,
                    'data' => $comment,
                    'is_comment' => true,
                    'comments_count' => $commentsCount,
                ]);
            }

            // Create the social media message
            $socialData = [
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'content_type' => self::CONTENT_TYPE_SOCIAL,
                'thread_id' => 'social_' . Str::random(16),
                'query' => $socialContent,
                'response' => null,
                'file_data' => $this->prepareFileData($mediaFiles),
                'sources' => ['social_media_post'],
                'status' => $conversationStatus,
                'media_count' => count($mediaFiles),
                'ip_address' => $request->ip(),
				'position' => $position,
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ];
            
            // Add format to social_media_metadata
            $socialData['social_media_metadata'] = [
                'format' => $format,
                'has_content_warning' => !empty($contentWarning),
            ];
            
            // If custom_slug is provided and available for a new conversation, set it
            // Allow ANY characters - only spaces will be converted to hyphens by cleanSlugForUrl
            if ($customSlug && !$conversationId && AISearchHistory::isSlugAvailable($customSlug)) {
                $socialData['slug'] = AISearchHistory::cleanSlugForUrl($customSlug);
            }
            
            $socialMessage = AISearchHistory::create($socialData);

            // Generate conversation title if this is a new conversation
            if (!$conversationId && !$parentMessage) {
                $title = $this->generateConversationTitle($content);
                AISearchHistory::where('conversation_id', $socialMessage->conversation_id)
                    ->update(['conversation_title' => $title]);
            }

            // Create funnel for this social media post if it's a new conversation
            if (!$conversationId) {
                $this->createFunnelForSocialPost($socialMessage, $content ?? '');
            }

            // Get updated conversation messages
            $conversationMessages = $this->getConversationMessages($socialMessage->conversation_id);

            DB::commit();

            // Log successful creation
            Log::info('Social media post created', [
                'slug' => $socialMessage->slug,
                'user_id' => Auth::id(),
                'has_media' => !empty($mediaFiles),
                'media_count' => count($mediaFiles),
                'has_cw' => !empty($contentWarning),
                'conversation_id' => $socialMessage->conversation_id,
                'format' => $format,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Social media post created successfully',
                'slug' => $socialMessage->slug,
                'conversation_id' => $socialMessage->conversation_id,
                'share_url' => $socialMessage->getShareableUrl(),
                'post' => [
                    'id' => $socialMessage->id,
                    'slug' => $socialMessage->slug,
                    'content' => $content,
                    'content_warning' => $contentWarning,
                    'media_count' => count($mediaFiles),
                    'format' => $format,
                    'created_at' => $socialMessage->created_at->toISOString(),
                    'formatted_created_at' => $socialMessage->formatted_created_at,
                ],
                'conversation_messages' => $conversationMessages,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to create social media post', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create social media post: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a social media post
     *
     * @param Request $request
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $slug)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'nullable|string',
            'media' => 'nullable|array',
            'media.*' => 'string',
            'content_warning' => 'nullable|string|max:255',
            'format' => 'nullable|in:markdown,html',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $post = AISearchHistory::where('id', $slug )
            ->whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA])
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Social media post not found',
            ], 404);
        }

        // Check ownership
        if (!$this->isOwner($post)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this post',
            ], 403);
        }

        $content = $request->input('content', '');
        $mediaFiles = $request->input('media', []);
        $contentWarning = $request->input('content_warning');
        $format = $request->input('format', $post->social_media_metadata['format'] ?? self::FORMAT_MARKDOWN);

        // Validate max 4 media files
        if (count($mediaFiles) > 4) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum 4 media files allowed',
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Build updated social content with optional content warning
            $socialContent = $this->buildSocialContent($content, $mediaFiles, $contentWarning, $format);

            // Update the post
            $post->query = $socialContent;
            $post->file_data = $this->prepareFileData($mediaFiles);
            $post->media_count = count($mediaFiles);
            
            // Update metadata
            $metadata = $post->social_media_metadata ?? [];
            $metadata['format'] = $format;
            $metadata['has_content_warning'] = !empty($contentWarning);
            $post->social_media_metadata = $metadata;
            
            $post->save();

            DB::commit();

            Log::info('Social media post updated', [
                'slug' => $post->slug,
                'user_id' => Auth::id(),
                'has_media' => !empty($mediaFiles),
                'media_count' => count($mediaFiles),
                'has_cw' => !empty($contentWarning),
                'format' => $format,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Social media post updated successfully',
                'post' => [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'content' => $content,
                    'content_warning' => $contentWarning,
                    'media_count' => count($mediaFiles),
                    'format' => $format,
                    'created_at' => $post->created_at->toISOString(),
                    'formatted_created_at' => $post->formatted_created_at,
                ],
                'share_url' => $post->getShareableUrl(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update social media post', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update social media post: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Build the social content HTML with media gallery
     * Supports both HTML and Markdown content
     *
     * @param string|null $content
     * @param array $mediaFiles
     * @param string|null $contentWarning
     * @param string $format 'markdown' or 'html'
     * @return string
     */
    private function buildSocialContent(?string $content, array $mediaFiles, ?string $contentWarning, string $format = 'markdown'): string
    {
        // Handle null content
        $content = $content ?? '';
        
        $html = '';
        
        // Add content warning if present
        if (!empty($contentWarning)) {
            $html .= $this->buildContentWarningHTML($contentWarning);
        }

        // Build media gallery
        if (!empty($mediaFiles)) {
            $html .= $this->buildMediaGallery($mediaFiles);
        }

        // Add main content - support both HTML and Markdown
        if (!empty($content)) {
            $html .= $this->buildContentHTML($content, $format, !empty($mediaFiles));
        }

        // If no content and no media, return a default message
        if (empty($content) && empty($mediaFiles)) {
            $html = '<div class="social-content-empty" style="color: #9ca3af; text-align: center; padding: 20px;">No content provided</div>';
        }

        // Close the content warning details tag if it exists
        if (!empty($contentWarning)) {
            $html .= $this->closeContentWarningHTML();
        }

        return $html;
    }

    /**
     * Build content warning HTML
     *
     * @param string $contentWarning
     * @return string
     */
    private function buildContentWarningHTML(string $contentWarning): string
    {
        $html = '<div class="social-content-warning" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 8px;">';
        $html .= '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">';
        $html .= '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M12 8v4M12 16h.01"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>';
        $html .= '<span style="font-weight: 600; color: #92400e;">Content Warning: ' . htmlspecialchars($contentWarning) . '</span>';
        $html .= '</div>';
        $html .= '<details style="cursor: pointer;">';
        $html .= '<summary style="color: #b45309; font-size: 14px;">Click to view content</summary>';
        $html .= '<div style="margin-top: 12px;">';
        return $html;
    }

    /**
     * Close content warning HTML
     *
     * @return string
     */
    private function closeContentWarningHTML(): string
    {
        return '</div></details></div>';
    }

    /**
     * Build content HTML with support for Markdown and HTML
     *
     * @param string $content
     * @param string $format
     * @param bool $hasMedia
     * @return string
     */
    private function buildContentHTML(string $content, string $format, bool $hasMedia = false): string
    {        
        return $content;
    }

    /**
     * Sanitize HTML content for security
     * Allows specific safe HTML tags and attributes
     *
     * @param string $html
     * @return string
     */
    private function sanitizeHtml(string $html): string
    {
        // Basic sanitization - allow common HTML tags
        // For production, consider using a library like HTMLPurifier for better security
        $allowedTags = [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
            'blockquote', 'code', 'pre', 'ul', 'ol', 'li',
            'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'div', 'span', 'hr', 'table', 'thead', 'tbody',
            'tr', 'th', 'td', 'iframe', 'video', 'audio', 'source',
            'figure', 'figcaption', 'mark', 'small', 'sub', 'sup',
            'details', 'summary', 'del', 'ins', 'q', 'cite'
        ];
        
        $allowedAttributes = [
            'a' => ['href', 'title', 'target', 'rel'],
            'img' => ['src', 'alt', 'title', 'width', 'height', 'loading'],
            'iframe' => ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading'],
            'video' => ['src', 'controls', 'width', 'height', 'poster', 'autoplay', 'loop', 'muted', 'playsinline'],
            'audio' => ['src', 'controls', 'autoplay', 'loop', 'muted'],
            'source' => ['src', 'type', 'media'],
            'a' => ['href', 'title', 'target', 'rel'],
            'td' => ['colspan', 'rowspan'],
            'th' => ['colspan', 'rowspan'],
            'div' => ['class', 'style', 'id'],
            'span' => ['class', 'style', 'id'],
            'p' => ['class', 'style'],
        ];
        
        // Use strip_tags with allowed tags
        $allowedTagsString = '<' . implode('><', $allowedTags) . '>';
        $sanitized = strip_tags($html, $allowedTagsString);
        
        // Additional security: remove javascript: and data: URIs
        $sanitized = preg_replace('/\s*href\s*=\s*["\']\s*(?:javascript|data|vbscript):/i', 'href="#"', $sanitized);
        $sanitized = preg_replace('/\s*src\s*=\s*["\']\s*(?:javascript|data|vbscript):/i', 'src="#"', $sanitized);
        
        return $sanitized;
    }

    /**
     * Build media gallery HTML
     *
     * @param array $mediaFiles
     * @return string
     */
    private function buildMediaGallery(array $mediaFiles): string
    {
        if (empty($mediaFiles)) {
            return '';
        }

        $count = count($mediaFiles);
        
        $html = '<div class="social-media-gallery" style="margin-bottom: 16px;">';
        $html .= '<div class="media-grid" style="display: grid; gap: 4px; border-radius: 16px; overflow: hidden;';
        
        if ($count === 1) {
            $html .= ' grid-template-columns: 1fr;';
        } elseif ($count === 2) {
            $html .= ' grid-template-columns: 1fr 1fr;';
        } elseif ($count === 3) {
            $html .= ' grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;';
        } else {
            $html .= ' grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;';
        }
        
        $html .= '">';
        
        foreach ($mediaFiles as $index => $mediaUrl) {
            $isFirstLarge = ($index === 0 && $count === 3);
            
            $html .= '<div class="media-item" style="position: relative; background-color: #f3f4f6; overflow: hidden;';
            
            if ($isFirstLarge) {
                $html .= ' grid-row: span 2;';
            }
            
            $html .= '">';
            $html .= '<img src="' . htmlspecialchars($mediaUrl) . '" alt="Media ' . ($index + 1) . '" style="width: 100%; height: 100%; object-fit: cover; aspect-ratio: 1/1;" loading="lazy">';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Prepare file data for database storage
     *
     * @param array $mediaFiles
     * @return array|null
     */
    private function prepareFileData(array $mediaFiles): ?array
    {
        if (empty($mediaFiles)) {
            return null;
        }

        $files = [];
        foreach ($mediaFiles as $index => $mediaUrl) {
            $files[] = [
                'url' => $mediaUrl,
                'type' => 'image',
                'order' => $index,
            ];
        }

        return [
            'type' => 'social_media_gallery',
            'count' => count($mediaFiles),
            'files' => $files,
        ];
    }

    /**
     * Create funnel for social media post
     *
     * @param AISearchHistory $socialMessage
     * @param string|null $content
     * @return void
     */
    private function createFunnelForSocialPost(AISearchHistory $socialMessage, ?string $content): void
    {
        // Ensure content is not null - use empty string as fallback
        $content = $content ?? '';
        
        $domainfull = idn_to_utf8('ez.wiki');
        $defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
            $query->where('domain', $domainfull);
        })->first();

        if (!$defaultpage) {
            Log::warning('Default page not found for funnel creation');
            return;
        }

        $userId = Auth::id() ?? 72;
        $title = $this->generateConversationTitle($content);

        $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
        
        // Create theme/template
        $themeData = [
            'user_id' => $userId,
            'title' => $title,
            'description' => $title,
            'price' => 0,
            'leftwidth' => 0,
            'rightwidth' => 0,
            'option' => 'autoplay',
            'bgcolour' => '#000000',
            'image' => 'https://ez.wiki/X/' . urlencode($socialMessage->slug),
            'status' => 'active'
        ];
        
        $theme = Template::create($themeData);
        $themetemplate = $theme->id;
        
        // Clone funnel
        $clonedFunnel = $originalFunnel->replicate();
        $clonedFunnel->displaymode = 'ai';
        $clonedFunnel->user_id = $userId;
        $clonedFunnel->theme = $themetemplate;
        $clonedFunnel->aiid = $socialMessage->id;
        $clonedFunnel->save();

        // Clone theme collections
        if (!empty($originalFunnel->theme)) {
            $themeIds = array_filter(explode(',', $originalFunnel->theme));
            $existingThemes = Themecollection::where('user_id', Auth::id())
                ->whereIn('theme_id', $themeIds)
                ->pluck('theme_id')
                ->toArray();
            
            $newThemes = array_diff($themeIds, $existingThemes);
            foreach ($newThemes as $themeId) {
                Themecollection::create([
                    'user_id' => $userId,
                    'theme_id' => $themeId
                ]);
            }
        }
        
        // Clone funnel fields
        $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
        foreach ($originalFields as $originalField) {
            $clonedField = $originalField->replicate();
            $clonedField->ez_funnel_id = $clonedFunnel->id;
            $clonedField->unique_id = null;
            $clonedField->save();
        }

        // Clone logo settings
        $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
        if ($originalLogo) {
            $clonedLogo = $originalLogo->replicate();
            $clonedLogo->funnel_id = $clonedFunnel->id;
            $clonedLogo->save();
        }

        // Clone SEO settings
        $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
        if ($originalSeo) {
            $clonedSeo = $originalSeo->replicate();
            $clonedSeo->funnel_id = $clonedFunnel->id;
            $clonedSeo->save();
        }

        // Send email notification to authenticated users
        if (Auth::check()) {
            $this->sendSocialPostNotification($clonedFunnel);
        }
    }

    /**
     * Send email notification for social post
     *
     * @param EzFunnel $funnel
     * @return void
     */
    private function sendSocialPostNotification(EzFunnel $funnel): void
    {
        try {
            $emaildesign = Emaildesign::where('id', 34)->first();
            if ($emaildesign) {
                $fullfunnel = "https://ez.wiki/" . $funnel->token;
                $str = ['{fullfunnel}', '{url}', '{createdate}'];
                $rplc = [$fullfunnel, $fullfunnel, now()];
                $div = str_replace($str, $rplc, $emaildesign['design']);
                $mailData = ['design' => $div];
                $email = Auth::user()->email;
                
                $subject = "Ez.wiki Your social media post is live!";
                Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send social post notification email', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);
        }
    }

    /**
     * Generate conversation title from content
     *
     * @param string|null $content
     * @return string
     */
    private function generateConversationTitle(?string $content): string
    {
        $content = trim($content ?? '');
        
        if (empty($content)) {
            return 'Social Media Post';
        }

        // Strip HTML tags for title generation
        $plainText = strip_tags($content);
        
        // Handle different languages
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $plainText)) {
            $title = '社交媒体帖子: ' . mb_substr($plainText, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}]/u', $plainText)) {
            $title = 'ソーシャルメディア投稿: ' . mb_substr($plainText, 0, 30, 'UTF-8');
        } elseif (preg_match('/[\x{AC00}-\x{D7AF}]/u', $plainText)) {
            $title = '소셜 미디어 게시물: ' . mb_substr($plainText, 0, 30, 'UTF-8');
        } else {
            $title = 'Social Post: ' . Str::limit($plainText, 50);
        }
        
        return $title;
    }

    /**
     * Get conversation messages with access filtering
     *
     * @param string $conversationId
     * @return array
     */
    private function getConversationMessages(string $conversationId): array
    {
        AISearchHistory::ensureConversationPositions($conversationId);
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->with('user')
            ->orderBy('position', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return $messages->map(function ($message) {
            return AISearchHistory::formatMessageForDisplay($message);
        })->toArray();
    }

    /**
     * Get social media post by slug
     *
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $slug)
    {
        $post = AISearchHistory::where('slug', $slug)
            ->whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA])
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Social media post not found',
            ], 404);
        }

        // Check access
        $hasAccess = $this->checkAccess($post);
        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view this post',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'content' => $post->query,
                'file_data' => $post->file_data,
                'created_at' => $post->created_at->toISOString(),
                'formatted_created_at' => $post->formatted_created_at,
                'share_url' => $post->getShareableUrl(),
                'format' => $post->social_media_metadata['format'] ?? 'markdown',
                'user' => $post->user ? [
                    'id' => $post->user->id,
                    'name' => $post->user->name,
                ] : null,
            ],
            'conversation_id' => $post->conversation_id,
            'conversation_messages' => $this->getConversationMessages($post->conversation_id),
        ]);
    }

    /**
     * Get all social media posts for the current user/session
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $sessionId = Session::getId();
        $perPage = $request->input('per_page', 20);

        $query = AISearchHistory::whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA])
            ->orderBy('created_at', 'desc');

        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('session_id', $sessionId);
        }

        $posts = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'posts' => $posts->map(function ($post) {
                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'content_preview' => Str::limit(strip_tags($post->query), 150),
                    'media_count' => $post->file_data['count'] ?? 0,
                    'format' => $post->social_media_metadata['format'] ?? 'markdown',
                    'created_at' => $post->created_at->toISOString(),
                    'formatted_created_at' => $post->formatted_created_at,
                    'share_url' => $post->getShareableUrl(),
                ];
            }),
            'pagination' => [
                'total' => $posts->total(),
                'per_page' => $posts->perPage(),
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
            ],
        ]);
    }

    /**
     * Delete a social media post
     *
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $slug)
    {
        $decodedSlug = urldecode($slug);
        $post = AISearchHistory::where('id', $slug)
            ->whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA])
            ->first()
            ?? AISearchHistory::where('slug', $decodedSlug)
            ->whereIn('content_type', [self::CONTENT_TYPE_SOCIAL, self::CONTENT_TYPE_SOCIAL_MEDIA])
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Social media post not found',
            ], 404);
        }

        // Check ownership (message owner or parent slug owner)
        if (!$this->isOwner($post)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this post',
            ], 403);
        }

        // Soft delete - mark as hidden instead of actually deleting
        $post->status = 'hidden';
        $post->save();

        Log::info('Social media post hidden', [
            'slug' => $post->slug,
            'user_id' => Auth::id(),
            'session_id' => Session::getId(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Social media post deleted successfully',
        ]);
    }

    /**
     * Check if user has access to a post
     *
     * @param AISearchHistory $post
     * @return bool
     */
    private function checkAccess(AISearchHistory $post): bool
    {
        if ($post->status === 'public') {
            return true;
        }

        if ($post->status === 'hidden') {
            return $this->isOwner($post);
        }

        return $this->isOwner($post);
    }

    /**
     * Check if current user/session owns the post
     *
     * @param AISearchHistory $post
     * @return bool
     */
    private function isOwner(AISearchHistory $post): bool
    {
        $user = Auth::user();
        $sessionId = Session::getId();

        return $post->isOwnedBy($user, $sessionId);
    }

    /**
     * Get supported formats
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSupportedFormats()
    {
        return response()->json([
            'success' => true,
            'formats' => [
                self::FORMAT_MARKDOWN => [
                    'label' => 'Markdown',
                    'description' => 'Write content using Markdown syntax',
                    'features' => [
                        'Headers (#, ##, ###)',
                        'Bold (**text**)',
                        'Italic (*text*)',
                        'Lists (ordered and unordered)',
                        'Links ([text](url))',
                        'Code blocks (```)',
                        'Blockquotes (>)',
                        'Tables',
                    ],
                ],
                self::FORMAT_HTML => [
                    'label' => 'HTML',
                    'description' => 'Write content using HTML tags',
                    'features' => [
                        'Rich text formatting',
                        'Custom styling',
                        'Embedded content',
                        'Tables',
                        'Media embedding',
                    ],
                ],
            ],
        ]);
    }
}