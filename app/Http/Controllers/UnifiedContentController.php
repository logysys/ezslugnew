<?php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\User;
use App\Models\Setting;
use App\Models\Admindomain;
use App\Models\Page;
use App\Models\Defaultpage;
use App\Models\EzFunnel;
use App\Models\Template;
use App\Models\Themecollection;
use App\Models\EzFunnelField;
use App\Models\FunnelLogoSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Emaildesign;
use App\Models\Customdomain;
use App\Models\Sell;
use App\Helpers\IframeHelper;
use DOMDocument;
use DOMXPath;
use Spatie\ImageOptimizer\OptimizerChainFactory;
use Symfony\Component\DomCrawler\Crawler;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException; 
use Embed\Embed;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class UnifiedContentController extends Controller
{
    /**
     * Handle AI Search (integrate with existing aiSearch)
     */
    public function aiSearch(Request $request)
    {
        // This would typically call your existing SearchController's aiSearch method
        // For now, we'll implement a simplified version
        
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1|max:10000',
            'sources' => 'nullable|array',
            'sources.*' => 'string',
            'enable_thinking' => 'nullable|boolean',
            'temperature' => 'nullable|numeric|min:0.1|max:1.0',
            'max_tokens' => 'nullable|integer|min:100|max:4000',
            'stream' => 'nullable|boolean',
            'conversation_id' => 'nullable|string',
            'parent_slug' => 'nullable|string',
            'thread_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = $request->input('query');
        $sources = $request->input('sources', []);
        $enableThinking = $request->input('enable_thinking', false);
        $temperature = $request->input('temperature', 0.6);
        $maxTokens = $request->input('max_tokens', 2000);
        $stream = $request->input('stream', false);
        $conversationId = $request->input('conversation_id');
        $parentSlug = $request->input('parent_slug');
        $threadId = $request->input('thread_id');

        try {
            // Find parent message if provided
            $parentMessage = null;
            if ($parentSlug) {
                $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();
                
                // Check access for parent message
                if ($parentMessage) {
                    $hasAccess = $this->checkMessageAccess($parentMessage);
                    if (!$hasAccess) {
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
            }

            // Check if conversation exists and verify access
            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();
                    
                if ($firstMessage) {
                    $hasAccess = $this->checkMessageAccess($firstMessage);
                    if (!$hasAccess) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You do not have permission to continue this conversation.',
                        ], 403);
                    }
                }
            }

            // Simulate AI response (in production, call your actual AI service)
            $aiResponse = $this->simulateAIResponse($query);
            $usage = [
                'prompt_tokens' => strlen($query) / 4,
                'completion_tokens' => strlen($aiResponse) / 4,
                'total_tokens' => (strlen($query) + strlen($aiResponse)) / 4,
            ];
            $finishReason = 'stop';

            // Determine status for new messages based on conversation status
            $conversationStatus = 'public';
            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();
                $conversationStatus = $firstMessage ? $firstMessage->status : 'public';
            }

            // Save user message to database
            $userMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'content_type' => AISearchHistory::CONTENT_TYPE_AI,
                'thread_id' => $threadId,
                'query' => $query,
                'response' => null,
                'sources' => $sources,
                'usage' => null,
                'thinking_enabled' => $enableThinking,
                'model' => 'kimi-k3',
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => null,
                'status' => $conversationStatus,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);

            // Save AI response to database
            $aiMessage = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $userMessage->conversation_id,
                'parent_id' => $userMessage->id,
                'message_role' => 'assistant',
                'content_type' => AISearchHistory::CONTENT_TYPE_AI,
                'thread_id' => $userMessage->thread_id,
                'conversation_title' => $userMessage->conversation_title,
                'query' => $query,
                'response' => $aiResponse,
                'sources' => $sources,
                'usage' => $usage,
                'thinking_enabled' => $enableThinking,
                'model' => 'kimi-k3',
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => $finishReason,
                'status' => $conversationStatus,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);

            // Update conversation title if this is the first message
            if (!$parentMessage) {
                AISearchHistory::where('conversation_id', $userMessage->conversation_id)
                    ->update(['conversation_title' => $this->generateConversationTitle($query)]);
            }

            // Get conversation messages with access filtering
            $conversationMessages = $this->getFilteredConversationMessages($aiMessage->conversation_id);

            // Ensure it's a Collection for token calculation
            if (is_array($conversationMessages)) {
                $conversationMessages = collect($conversationMessages);
            }

            // Calculate conversation tokens and cost
            $conversationTokens = $conversationMessages->sum('total_tokens');
            $conversationCost = ($conversationTokens / 1000) * 0.01;

            // Format conversation messages for response
            $formattedConversationMessages = $conversationMessages->map(function ($message) {
                return AISearchHistory::formatMessageForDisplay($message);
            });

            return response()->json([
                'success' => true,
                'query' => $query,
                'answer' => $aiResponse,
                'usage' => $usage,
                'thinking_enabled' => $enableThinking,
                'sources' => $sources,
                'temperature' => $temperature,
                'max_tokens' => $maxTokens,
                'finish_reason' => $finishReason,
                'slug' => $userMessage->slug,
                'parent_slug' => $userMessage->slug,
                'conversation_id' => $userMessage->conversation_id,
                'thread_id' => $userMessage->thread_id,
                'conversation_title' => $aiMessage->conversation_title,
                'conversation_url' => $aiMessage->getConversationUrl(),
                'share_url' => $aiMessage->getShareableUrl(),
                'id' => $aiMessage->id,
                'content_type' => AISearchHistory::CONTENT_TYPE_AI,
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
                ] : null,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI service temporarily unavailable. Please try again.',
            ], 503);
        }
    }

    /**
     * Simulate AI response (replace with actual AI service call)
     */
    private function simulateAIResponse(string $query): string
    {
        $responses = [
            "I understand you're asking about: " . $query . "\n\nThis is a simulated AI response. In production, this would call your actual AI service like Kimi/Moonshot API.",
            "Great question about " . $query . "!\n\nHere's what I can tell you: This is a placeholder response. Please configure your AI service integration.",
            "Regarding your query '" . $query . "', I'd be happy to help. However, this is a development environment with simulated responses.",
        ];
        
        return $responses[array_rand($responses)];
    }

    /**
     * Handle Comment Submission
     *
     * UPDATED BEHAVIOR:
     * - content_type = 'comment'              → stored ONLY in `comments` table (early return)
     * - content_type = 'conversationcomment'  → stored in AISearchHistory DB, appended at bottom of conversation
     * - content_type = 'embed'                → stored in AISearchHistory DB, appended at bottom of conversation
     */
    public function submitComment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1',
            'parent_slug' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'content_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $customSlug = $request->input('custom_slug');
        $content = $request->input('content');
        $parentSlug = $request->input('parent_slug');
        $conversationId = $request->input('conversation_id');
        $requestedContentType = $request->input('content_type');

        // ============================================================
        // DETERMINE CONTENT TYPE — key distinction for our use-case
        // ============================================================
        $isEmbedType = ($requestedContentType === 'embed' || $requestedContentType === AISearchHistory::CONTENT_TYPE_EMBED);
        $isConversationCommentType = ($requestedContentType === 'conversationcomment');
        $isRegularCommentType = (!$isEmbedType && !$isConversationCommentType);

        // Map to a concrete content type string used for persistence
        if ($isEmbedType) {
            $contentType = 'embed'; // AISearchHistory::CONTENT_TYPE_EMBED equivalent
        } elseif ($isConversationCommentType) {
            $contentType = 'conversationcomment';
        } else {
            $contentType = 'comment';
        }

        // Find parent message if provided
        $parentMessage = null;
        if ($parentSlug) {
            $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();

            // Check access for parent message
            if ($parentMessage) {
                $hasAccess = $this->checkMessageAccess($parentMessage);
                if (!$hasAccess) {
                    $message = 'You do not have permission to comment on this message.';
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => $message,
                        ], 403);
                    }
                    return redirect()->back()->with('error', $message);
                }

                if ($parentMessage && !$conversationId) {
                    $conversationId = $parentMessage->conversation_id;
                }
            }
        }

        // Determine conversation status from the FIRST message (root) of the conversation
        $conversationStatus = 'public';
        if ($conversationId) {
            $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                ->whereNull('parent_id')
                ->first();

            if ($firstMessage) {
                // Inherit status from the root message of the conversation
                $conversationStatus = $firstMessage->status;
            }
        } elseif ($parentMessage) {
            // If this is a new conversation starting from a parent message
            $firstMessage = $parentMessage->getFirstMessage();
            if ($firstMessage) {
                $conversationStatus = $firstMessage->status;
            }
        }

        // Check if conversation exists and verify access
        if ($conversationId) {
            $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                ->whereNull('parent_id')
                ->first();

            if ($firstMessage) {
                $hasAccess = $this->checkMessageAccess($firstMessage);
                if (!$hasAccess) {
                    $message = 'You do not have permission to comment in this conversation.';
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => $message,
                        ], 403);
                    }
                    return redirect()->back()->with('error', $message);
                }
            }
        }

        $setting = Setting::where('id', 1)->first();

        // --- Helper closures (kept original for backward-compat with embed scraper) ---
        function get_domain($url)
        {
            if (empty($url)) {
                return false;
            }
            $host = parse_url($url, PHP_URL_HOST);
            if (!$host) {
                return false;
            }
            $domain = preg_replace('/^www\./', '', $host);
            if (filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                return $domain;
            }
            return false;
        }
        function printText(?string $text)
        {
            if ($text) {
                return htmlspecialchars($text, ENT_IGNORE);
            }
        }
        function isCSS($text)
        {
            $pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
            if (preg_match($pattern, $text)) {
                return false;
            }
            return true;
        }
        function printImage(?string $image)
        {
            if ($image) {
                return '<img src="' . $image . '" width="100%" >';
            } else {
                return '<img src="/bee.webp" width="100%" >';
            }
        }
        function printfav(?string $image)
        {
            if ($image) {
                return '<img src="' . $image . '" width="36px" >';
            }
            return null;
        }
        function random_color_part()
        {
            return str_pad(dechex(mt_rand(0, 255)), 2, '0', STR_PAD_LEFT);
        }
        function random_color()
        {
            return random_color_part() . random_color_part() . random_color_part();
        }

        $htmlnotsupport = false;
        $aladinurlredirectembed = '';
        $type = '';
        $done = '';
        $originalContent = '';

        // ============================================================
        // EMBED/CONTENT PROCESSING — only for embed or comment-URL types
        // ============================================================
        if ($isEmbedType) {
            $aladinurlredirectembed = $content;
        } elseif ($isConversationCommentType) {
            // Conversation comments store raw content as-is (markdown / html / plain text)
            $aladinurlredirectembed = $content;
        } elseif (!empty($content)) {
            $originalContent = $content;
            $parse = explode('/', $content);
            $fullDomain = idn_to_utf8(get_domain($content));
            $domains = Admindomain::where('domain', $fullDomain)->first();

            if (!empty($domains)) {
                if (filter_var($content, FILTER_VALIDATE_URL)) {
                    $aladinurlredirectembed .= '<iframe src="' . $content . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                    $done = 'done';
                }
            }

            if (isset($parse[3])) {
                $linkdomain = $parse[0] . '//' . $parse[2] . '/';
                $search = $parse[3];
                $urlnew = $content;

                if ('tiktok.com' == get_domain($content) || 'www.tiktok.com' == get_domain($content)) {
                    $aladinurlredirectembed .= '<blockquote class="tiktok-embed" cite="' . $content . '" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="' . $content . '?refer=creator_embed">' . $search . '</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
                    $done = 'done';
                } elseif ($linkdomain == 'https://kick.com/') {
                    $aladinurlredirectembed .= '<iframe src="https://player.kick.com/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                    $done = 'done';
                } elseif ($linkdomain == 'https://live.arrival.space/') {
                    $aladinurlredirectembed .= '<iframe src="https://live.arrival.space/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                    $done = 'done';
                } elseif ('reddit.com' == get_domain($content) || 'www.reddit.com' == get_domain($content)) {
                    $aladinurlredirectembed .= '<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="' . $content . '"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
                    $done = 'done';
                } elseif ($linkdomain == 'https://beacons.ai/') {
                    $aladinurlredirectembed .= '<iframe src="https://beacons.ai/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                    $done = 'done';
                } elseif ($linkdomain == 'https://twitter.com/') {
                    $aladinurlredirectembed .= '<a class="twitter-timeline" href="https://twitter.com/' . $search . '?ref_src=twsrc%5Etfw">Tweets by JaredFPS</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                    $done = 'done';
                } elseif ($linkdomain == 'https://pinterest.com/') {
                    $aladinurlredirectembed .= '<a data-pin-do="embedUser" data-pin-board-width="1024" data-pin-scale-height="888" data-pin-scale-width="80" href="https://www.pinterest.com/' . $search . '/">Follow ' . $search . ' on Pinterest</a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>';
                    $done = 'done';
                } else {
                    $checkurl = substr_count($urlnew, '/');
                    if ($checkurl <= 3) {
                        $curl = curl_init($urlnew);
                        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                        curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
                        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
                        curl_setopt($curl, CURLOPT_TIMEOUT, 15);
                        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);
                        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
                        $html = curl_exec($curl);
                        $htmlnotsupport = $html;

                        if ($html != false) {
                            $crawler = new Crawler($html);
                            $img = $crawler->filter('img')->each(function ($node) {
                                $src = $node->attr('src');
                                return compact('src');
                            });
                            $texth1 = $crawler->filter('h1')->each(function ($node) {
                                $text = $node->text();
                                return compact('text');
                            });
                            $textp = $crawler->filter('p')->each(function ($node) {
                                $text = $node->text();
                                return compact('text');
                            });
                            $textspan = $crawler->filter('span')->each(function ($node) {
                                $text = $node->text();
                                return compact('text');
                            });
                            $texth5 = $crawler->filter('h5')->each(function ($node) {
                                $text = $node->text();
                                return compact('text');
                            });
                            $links = $crawler->filter('a')->each(function ($node) {
                                $href = $node->attr('href');
                                $title = $node->attr('title');
                                $text = $node->text();
                                return compact('href', 'title', 'text');
                            });

                            if ($linkdomain == 'https://lnk.bio/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $aladinurlredirectembed .= '<div class="profile-pic"> <img src="' . $img[0]['src'] . '" alt="Profile Picture"></div>';
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">' . $links[10]['text'] . '</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    $done = '';
                                    foreach ($links as $link) {
                                        if ($link['title'] == 'Get Lnk.Bio') {
                                            $done = 'done';
                                        }
                                        if ($link['title'] != '' && $done == '' && $link['text'] != 'Lnk.Bio') {
                                            $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://campsite.bio/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $img[0]['src'] . '" alt="Profile Picture"></div>';
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">';
                                    if (!empty($texth1)) {
                                        $aladinurlredirectembed .= $texth1[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</h1>';
                                    $aladinurlredirectembed .= '<p class="real-name">';
                                    if (!empty($textp)) {
                                        $aladinurlredirectembed .= $textp[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    foreach ($links as $link) {
                                        if ($link['text'] != '') {
                                            if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://bio.site/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $image = '';
                                        foreach ($img as $imgs) {
                                            if (@getimagesize($imgs['src']) && $image != 'done') {
                                                $image = 'done';
                                                $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $imgs['src'] . '" alt="Profile Picture"></div>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">';
                                    if (!empty($texth1)) {
                                        $aladinurlredirectembed .= $texth1[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</h1>';
                                    $aladinurlredirectembed .= '<p class="real-name">';
                                    if (!empty($textp)) {
                                        $aladinurlredirectembed .= $textp[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    foreach ($links as $link) {
                                        if ($link['text'] != '' && $link['text'] != 'Create a free Bio Site') {
                                            if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://hoo.be/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $aladinurlredirectembed .= '<div class="profile-pic"><img src="https://hoo.be/' . $img[1]['src'] . '" alt="Profile Picture"></div>';
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">';
                                    if (!empty($textspan)) {
                                        $aladinurlredirectembed .= $textspan[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</h1>';
                                    $aladinurlredirectembed .= '<p class="real-name">';
                                    if (!empty($texth5)) {
                                        $aladinurlredirectembed .= $texth5[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    foreach ($links as $link) {
                                        if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                            if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://linktr.ee/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $image = '';
                                        foreach ($img as $imgs) {
                                            if (@getimagesize($imgs['src']) && $image != 'done') {
                                                $image = 'done';
                                                $aladinurlredirectembed .= '<div class="profile-pic"> <img src="' . $imgs['src'] . '" alt="Profile Picture"> </div>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">';
                                    if (!empty($texth1)) {
                                        $texth1done = '';
                                        foreach ($texth1 as $texth1s) {
                                            if (isCSS($texth1s['text']) && $texth1done != 'done') {
                                                $texth1done = 'done';
                                                $aladinurlredirectembed .= $texth1s['text'];
                                                session()->put('linkname', trim($texth1s['text']));
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    foreach ($links as $link) {
                                        if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                            if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://portaly.cc/') {
                                if (!empty($links)) {
                                    $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                    if (!empty($img)) {
                                        $image = '';
                                        foreach ($img as $imgs) {
                                            if (@getimagesize($imgs['src']) && $image != 'done') {
                                                $image = 'done';
                                                $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $imgs['src'] . '" alt="Profile Picture"></div>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '<h1 class="username">';
                                    if (!empty($texth1)) {
                                        $texth1done = '';
                                        foreach ($texth1 as $texth1s) {
                                            if (isCSS($texth1s['text']) && $texth1done != 'done') {
                                                $texth1done = 'done';
                                                $aladinurlredirectembed .= $texth1s['text'];
                                                session()->put('linkname', trim($texth1s['text']));
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</h1>';
                                    $aladinurlredirectembed .= '<p class="real-name">';
                                    if (!empty($textp)) {
                                        $aladinurlredirectembed .= $textp[0]['text'];
                                    }
                                    $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                    foreach ($links as $link) {
                                        if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                            if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                    }
                                    $aladinurlredirectembed .= '</div></div></div></body></html>';
                                    $done = 'done';
                                }
                            } elseif ($linkdomain == 'https://link3.cc/') {
                                $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="' . $linkdomain . $search . '" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                                $done = 'done';
                            }
                        }
                    }
                }
            }

            if ($done != 'done') {
                if (!filter_var($content, FILTER_VALIDATE_URL)) {
                    $aladinurlredirectembed .= $content;
                } else {
                    $urlparse = $content;
                    $parsed_url = parse_url($urlparse);
                    if (isset($parsed_url['host'])) {
                        $domain = $parsed_url['host'];
                    } else {
                        $domain = '';
                    }
                    $punycodeDomain = idn_to_ascii($domain);
                    $pndomain = str_replace($domain, $punycodeDomain, $content);

                    preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $pndomain, $match);
                    if (!empty($match)) {
                        $type = 'done';
                        $aladinurlredirectembed .= '<iframe loading="lazy" height="888px" src="https://www.youtube.com/embed/' . $match[1] . '?controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>';
                    }
                    preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $pndomain, $match);
                    if (!empty($match)) {
                        $type = 'done';
                        $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" src="https://player.vimeo.com/video/' . $match[3] . '?h=33160d1512&color=de0101" width="100%" height="888px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
                    }
                    preg_match('/^(https?:\/\/)?(www\.)?fb.watch\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                    if (!empty($match)) {
                        $type = 'done';
                        $aladinurlredirectembed .= '<div class="fb-video" data-href="' . $pndomain . '" data-width="500" data-show-text="true"></div>';
                    }
                    preg_match('/^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                    if (!empty($match)) {
                        if (strpos($pndomain, 'groups') == false) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<div class="fb-post" data-href="' . $pndomain . '" data-width="500" data-show-text="true"></div>';
                        } else {
                            $str = ['{backimage}', '{backcolor}', '{favicon}', '{providerName}', '{loadingurl}', '{image}', '{title}', '{description}'];
                            $type = 'done';
                            $curl = curl_init('https://api.microlink.io/?url=' . $pndomain);
                            curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                            curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                            $page = curl_exec($curl);
                            $arraypage = array_values(json_decode($page, true));
                            $publisher = '';
                            $logo = '';
                            $urlpage = '';
                            $image = '';
                            $title = '';
                            $description = '';
                            if ($arraypage[1]['publisher'] != null) {
                                $publisher = $arraypage[1]['publisher'];
                            }
                            if ($arraypage[1]['logo'] != null) {
                                $logo = $arraypage[1]['logo']['url'];
                            }
                            if ($arraypage[1]['url'] != null) {
                                $urlpage = $arraypage[1]['url'];
                            }
                            if ($arraypage[1]['image'] != null) {
                                $image = $arraypage[1]['image']['url'];
                            }
                            if ($arraypage[1]['title'] != null) {
                                $title = $arraypage[1]['title'];
                            }
                            if ($arraypage[1]['description'] != null) {
                                $description = $arraypage[1]['description'];
                            }
                            $fav = '<img src="' . $logo . '" width="20px;" >';
                            $rplc = ['', '', $fav, $publisher, $urlpage, printImage($image), printText($title), printText($description)];
                            $code = Page::where('id', 1)->value('code');
                            $divstr = str_replace($str, $rplc, $code);
                            $aladinurlredirectembed .= $divstr;
                        }
                    }
                    preg_match('/^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                    if (!empty($match)) {
                        $type = 'done';
                        $aladinurlredirectembed .= '<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="' . $pndomain . '">' . $pndomain . '</a></p>&mdash; News (@XNews) <a href="' . $pndomain . '?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                    }
                    preg_match('/^(https?:\/\/)?(www\.)?x.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                    if (!empty($match)) {
                        $type = 'done';
                        $aladinurlredirectembed .= '<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="' . $pndomain . '">' . $pndomain . '</a></p>&mdash; News (@XNews) <a href="' . $pndomain . '?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                    }
                    if ($type != 'done') {
                        if (filter_var($pndomain, FILTER_VALIDATE_URL)) {
                            $isFriendly = IframeHelper::isIframeable($pndomain);
                            if ($isFriendly) {
                                $type = 'iframe';
                            } else {
                                $type = 'div';
                            }
                        } else {
                            $type = 'text';
                        }
                        if ($type == 'text') {
                            $aladinurlredirectembed .= $pndomain;
                        }
                        if ($type == 'iframe') {
                            $pattern = '/<iframe/i';
                            preg_match($pattern, $pndomain, $match);
                            if (!empty($match)) {
                                $aladinurlredirectembed .= $pndomain;
                            } else {
                                $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="' . $pndomain . '" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                            }
                        } else {
                            if ($type != 'text') {
                                $scrapingurl = json_decode($setting['scrapingurl']);
                                $scrp = 'OFF';
                                for ($k = 0; $k < count($scrapingurl); $k++) {
                                    if (get_domain($pndomain) == get_domain($scrapingurl[$k])) {
                                        $scrp = 'ON';
                                    }
                                }

                                if ($scrp == 'ON') {
                                    $curl = curl_init($pndomain);
                                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                                    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                                    $page = curl_exec($curl);
                                    $page1 = str_replace('<button aria-label="Share" data-testid="ShareButton" style="transition:background-color 150ms ease" class="sc-pFZIQ sc-aemoO fRlsIx cBGtLF"><svg width="16" height="16" viewBox="0 0 16 16" enable-background="new 0 0 24 24" class="sc-gKsewC iPWGYb"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6464 3.85347L11 4.20702L11.7071 3.49992L11.3536 3.14636L8.35355 0.146362H7.64645L4.64645 3.14636L4.29289 3.49992L5 4.20702L5.35355 3.85347L7.5 1.70702V9.49992V9.99992H8.5V9.49992V1.70702L10.6464 3.85347ZM1 5.49994L1.5 4.99994H4V5.99994H2V14.9999H14V5.99994H12V4.99994H14.5L15 5.49994V15.4999L14.5 15.9999H1.5L1 15.4999V5.49994Z" fill="currentColor"></path></svg></button>', "", $page);
                                    $page2 = preg_replace('#<a href="/" class="sc-bdfBwQ Tmnro">(.*?)</a>#', '', $page1);
                                    $page3 = str_replace('<button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Preferences</button>', "", $page2);
                                    $page4 = str_replace('https://linktr.ee', "https://4x4.ai", $page3);
                                    if (parse_url($pndomain, PHP_URL_HOST) == 'lnk.bio') {
                                        $page4 = str_replace('href="/', 'href="https://lnk.bio/', $page4);
                                        $page4 = str_replace('src="/', 'src="https://lnk.bio/', $page4);
                                        $page4 = str_replace('https://lnk.bio//cdn.', "//cdn.", $page4);
                                    }
                                    $content = $page4 . '<style>.dTcluo{ height:auto;}</style><script>$("#pb_cookie_consent").hide(); </script>';
                                    $time = time();

                                    $fp = fopen($_SERVER['DOCUMENT_ROOT'] . "/temp/" . $time . "temp.html", "wb");
                                    fwrite($fp, $content);
                                    fclose($fp);
                                    $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="temp/' . $time . 'temp.html" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                                } else {
                                    $unknown = 0;
                                    if ($htmlnotsupport != 'false') {
                                        try {
                                            $embeded = new Embed();
                                            $info = $embeded->get($pndomain);
                                            $str = ['{backimage}', '{backcolor}', '{favicon}', '{providerName}', '{loadingurl}', '{image}', '{title}', '{description}'];

                                            if (file_exists(printfav($info->favicon))) {
                                                $fav = printfav($info->favicon);
                                                $rplc = ['', '', $fav, printText($info->providerName), $pndomain, printImage($info->image), printText($info->title), printText($info->description)];
                                            } else {
                                                $curl = curl_init('https://api.microlink.io/?url=' . $pndomain);
                                                curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                                                curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                                                $page = curl_exec($curl);
                                                $arraypage = array_values(json_decode($page, true));
                                                if ($arraypage[0] == 'fail') {
                                                    $aladinurlredirectembed .= 'Unsupported domain.' . $pndomain;
                                                    $unknown = 1;
                                                } else {
                                                    $publisher = '';
                                                    $logo = '';
                                                    $urlpage = '';
                                                    $image = '';
                                                    $title = '';
                                                    $description = '';
                                                    if ($arraypage[1]['publisher'] != null) {
                                                        $publisher = $arraypage[1]['publisher'];
                                                    }
                                                    if ($arraypage[1]['logo'] != null) {
                                                        $logo = $arraypage[1]['logo']['url'];
                                                    }
                                                    if ($arraypage[1]['url'] != null) {
                                                        $urlpage = $arraypage[1]['url'];
                                                    }
                                                    if ($arraypage[1]['image'] != null) {
                                                        $image = $arraypage[1]['image']['url'];
                                                    }
                                                    if ($arraypage[1]['title'] != null) {
                                                        $title = $arraypage[1]['title'];
                                                    }
                                                    if ($arraypage[1]['description'] != null) {
                                                        $description = $arraypage[1]['description'];
                                                    }
                                                    $fav = '<img src="' . $logo . '" width="20px;" >';
                                                    $rplc = ['', '', $fav, $publisher, $urlpage, printImage($image), printText($title), printText($description)];
                                                }
                                            }
                                            if ($unknown == 0) {
                                                $code = Page::where('id', 1)->value('code');
                                                $divstr = str_replace($str, $rplc, $code);
                                                $aladinurlredirectembed .= $divstr;
                                            }
                                        } catch (Exception $e) {
                                            $aladinurlredirectembed .= $e->getMessage();
                                        }
                                    } else {
                                        $aladinurlredirectembed .= 'Unsupported domain.' . $pndomain;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ============================================================
        // COMMENTS-ONLY TABLE STORAGE — only for plain 'comment' type
        // (do NOT run for embed OR conversationcomment)
        // ============================================================
        if (
            !$isConversationCommentType
            && !$isEmbedType
            && (
                $contentType === 'comment'
                || $contentType === AISearchHistory::CONTENT_TYPE_COMMENT
                || ($parentMessage && $contentType !== 'embed' && $contentType !== AISearchHistory::CONTENT_TYPE_EMBED)
                || $parentSlug
            )
        ) {
            try {
                $commentRecord = \App\Models\Comment::create([
                    'message_id' => $parentMessage ? $parentMessage->id : null,
                    'message_slug' => $parentSlug ?: ($parentMessage ? $parentMessage->slug : null),
                    'conversation_id' => $conversationId,
                    'parent_id' => $parentMessage ? $parentMessage->id : null,
                    'user_id' => Auth::id(),
                    'user_name' => Auth::check() ? (Auth::user()->name ?? Auth::user()->email) : 'Guest',
                    'user_avatar' => Auth::check() ? Auth::user()->avatar : null,
                    'user_email' => Auth::check() ? Auth::user()->email : null,
                    'content' => $content,
                    'format' => $request->input('format', 'markdown'),
                    'content_type' => 'comment',
                    'status' => 'approved',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ]);

                $commentsCount = \App\Models\Comment::where(function ($q) use ($parentMessage, $parentSlug) {
                    if ($parentMessage) $q->where('message_id', $parentMessage->id);
                    if ($parentSlug) $q->orWhere('message_slug', $parentSlug);
                })->where('status', '!=', 'deleted')->count();

                return response()->json([
                    'success' => true,
                    'message' => 'Comment stored in comments table successfully',
                    'comment' => $commentRecord,
                    'data' => $commentRecord,
                    'comments_count' => $commentsCount,
                    'is_comment' => true,
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Could not save comment in comments table: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to store comment: ' . $e->getMessage(),
                ], 500);
            }
        }

        // ============================================================
        // CONVERSATION MESSAGE STORAGE — for embed & conversationcomment
        // ============================================================
        $position = null;
        if ($conversationId) {
            AISearchHistory::ensureConversationPositions($conversationId);
            if ($parentMessage) {
                $parentMessage->refresh();
            }
        }

        // Embeds and conversation comments should always be positioned at the bottom of the conversation
        if (
            $contentType === AISearchHistory::CONTENT_TYPE_EMBED
            || $contentType === 'embed'
            || $contentType === 'conversationcomment'
        ) {
            $maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position') ?? -1;
            $position = $maxPosition + 1;
        } elseif ($parentMessage) {
            // Set position to parent's position + 1
            $position = ($parentMessage->position ?? 0) + 1;

            // Shift existing messages that have position >= parent_position + 1
            AISearchHistory::where('conversation_id', $conversationId)
                ->where('position', '>=', $position)
                ->increment('position');
        } else {
            // If no parent, get the max position and add 1
            $maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position') ?? -1;
            $position = $maxPosition + 1;
        }

        $commentData = [
            'user_id' => Auth::id(),
            'conversation_id' => $conversationId,
            'parent_id' => (
                $contentType === AISearchHistory::CONTENT_TYPE_EMBED
                || $contentType === 'embed'
                || $contentType === 'conversationcomment'
            ) ? null : ($parentMessage ? $parentMessage->id : null),
            'message_role' => 'user',
            'content_type' => $contentType,
            'thread_id' => 'thread_' . Str::random(16),
            'query' => $aladinurlredirectembed,
            'response' => null,
            'status' => $conversationStatus,
            'ip_address' => $request->ip(),
            'position' => $position,
            'user_agent' => $request->userAgent(),
            'session_id' => Session::getId(),
        ];

        if ($customSlug && !$conversationId && AISearchHistory::isSlugAvailable($customSlug)) {
            $commentData['slug'] = AISearchHistory::cleanSlugForUrl($customSlug);
        }

        $comment = AISearchHistory::create($commentData);

        // Generate conversation title if this is a new conversation
        if (!$conversationId && !$parentMessage) {
            $title = $contentType === AISearchHistory::CONTENT_TYPE_EMBED
                ? 'Embed Layout'
                : ($contentType === 'embed' ? 'Embed Layout' : ($contentType === 'conversationcomment' ? 'Conversation Comment' : $this->generateConversationTitle($content)));
            AISearchHistory::where('conversation_id', $comment->conversation_id)
                ->update(['conversation_title' => $title]);
        }

        // Get updated conversation
        $conversationMessages = $this->getFilteredConversationMessages($comment->conversation_id);

        // Clone default funnel scaffolding for brand-new conversations
        if (!$conversationId) {
            $domainfull = idn_to_utf8('ez.wiki');
            $defaultpage = Defaultpage::whereHas('domain', function ($query) use ($domainfull) {
                $query->where('domain', $domainfull);
            })->first();

            if (Auth::check()) {
                $user_id = Auth::id();
            } else {
                $user_id = 72;
            }

            if ($defaultpage) {
                $title = $contentType === AISearchHistory::CONTENT_TYPE_EMBED
                    ? 'Embed Layout'
                    : ($contentType === 'embed' ? 'Embed Layout' : ($contentType === 'conversationcomment' ? 'Conversation Comment' : $this->generateConversationTitle($content)));
                $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
                $themeData = [
                    'user_id' => $user_id,
                    'title' => $title,
                    'description' => $title,
                    'price' => 0,
                    'leftwidth' => 0,
                    'rightwidth' => 0,
                    'option' => 'autoplay',
                    'bgcolour' => '#000000',
                    'image' => 'https://ez.wiki/X/' . urldecode($comment->slug),
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
                $clonedFunnel->aiid = $comment->id;
                $clonedFunnel->save();

                if (!empty($originalFunnel->theme)) {
                    $themeIds = array_filter(explode(',', $originalFunnel->theme));
                    $existingThemes = Themecollection::where('user_id', Auth::id())
                        ->whereIn('theme_id', $themeIds)
                        ->pluck('theme_id')
                        ->toArray();

                    $newThemes = array_diff($themeIds, $existingThemes);
                    $userID = $user_id;
                    $themeData = array_map(function ($themeId) use ($userID) {
                        return [
                            'user_id' => $userID,
                            'theme_id' => $themeId
                        ];
                    }, $newThemes);

                    if (!empty($themeData)) {
                        Themecollection::insert($themeData);
                    }
                }

                // Clone funnel fields, logo settings, SEO settings
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

                if (Auth::check()) {
                    $ezFunnel = EzFunnel::findOrFail($clonedFunnel->id);
                    $emaildesign = Emaildesign::where('id', 34)->first();
                    $fullfunnel = "https://ez.wiki/" . $ezFunnel->token;
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
        }

        // Check if this is an API request (expects JSON) or a form submission
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => $contentType === 'conversationcomment'
                    ? 'Conversation comment posted successfully'
                    : 'Comment posted successfully',
                'slug' => $comment->slug,
                'conversation_id' => $comment->conversation_id,
                'comment' => $this->formatCommentForResponse($comment),
                'conversation_messages' => $conversationMessages,
                'is_comment' => false,
                'content_type' => $contentType,
            ]);
        }

        // For regular form submissions, redirect to the comment's slug page
        return redirect()->to('/X/' . $comment->slug)
            ->with('success', 'Comment posted successfully!');
    }

    /**
     * Handle File Upload - Modified to use public_path('aicontent')
     * Restricted to Images, PDF, Video, and Audio files only
     */
    public function uploadFile(Request $request)
    {
        $hasMultiple = $request->hasFile('files');
        $hasSingle = $request->hasFile('file');

        if (!$hasMultiple && !$hasSingle) {
            return response()->json([
                'success' => false,
                'message' => 'No file uploaded',
            ], 400);
        }

        $files = [];
        if ($hasMultiple) {
            $rawFiles = $request->file('files');
            $files = is_array($rawFiles) ? $rawFiles : [$rawFiles];
        } else {
            $files = [$request->file('file')];
        }

        // Filter out any null or invalid entries
        $files = array_values(array_filter($files));
        if (empty($files)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid files provided',
            ], 400);
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
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf', 'mp4', 'webm', 'ogg', 'mp3', 'wav', 'mov', 'avi', 'm4a', 'html', 'htm'];

        // Validate each file
        foreach ($files as $fileItem) {
            if (!$fileItem->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed for ' . $fileItem->getClientOriginalName() . ': ' . $fileItem->getErrorMessage(),
                ], 400);
            }

            if ($fileItem->getSize() > 100 * 1024 * 1024) {
                return response()->json([
                    'success' => false,
                    'message' => 'File ' . $fileItem->getClientOriginalName() . ' exceeds the 100MB size limit.',
                ], 400);
            }

            $mimeType = $fileItem->getMimeType();
            $extension = strtolower($fileItem->getClientOriginalExtension());
            if (empty($extension)) {
                $extension = $fileItem->guessExtension() ?? 'bin';
            }

            if (!in_array($mimeType, $allowedMimeTypes) && !in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File type not allowed for ' . $fileItem->getClientOriginalName() . '. Only images, PDF, video, audio, and HTML files are permitted.',
                ], 400);
            }
        }

        $description = $request->input('description', '');
        $parentSlug = $request->input('parent_slug');
        $conversationId = $request->input('conversation_id');
        $customSlug = $request->input('custom_slug');

        DB::beginTransaction();

        try {
            // Find parent message if provided
            $parentMessage = null;
            if ($parentSlug) {
                $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();

                // Check access for parent message
                if ($parentMessage) {
                    $hasAccess = $this->checkMessageAccess($parentMessage);
                    if (!$hasAccess) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You do not have permission to upload to this conversation.',
                        ], 403);
                    }

                    if ($parentMessage && !$conversationId) {
                        $conversationId = $parentMessage->conversation_id;
                    }
                }
            }

            // Determine conversation status from the FIRST message (root) of the conversation
            $conversationStatus = 'public';
            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();

                if ($firstMessage) {
                    // Inherit status from the root message of the conversation
                    $conversationStatus = $firstMessage->status;
                }
            } elseif ($parentMessage) {
                // If this is a new conversation starting from a parent message
                $firstMessage = $parentMessage->getFirstMessage();
                if ($firstMessage) {
                    $conversationStatus = $firstMessage->status;
                }
            }

            // Check if conversation exists and verify access
            if ($conversationId) {
                $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNull('parent_id')
                    ->first();

                if ($firstMessage) {
                    $hasAccess = $this->checkMessageAccess($firstMessage);
                    if (!$hasAccess) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You do not have permission to upload to this conversation.',
                        ], 403);
                    }
                }
            }

            // Destination directory
            $destinationPath = public_path('aicontent');
            if (!file_exists($destinationPath)) {
                if (!mkdir($destinationPath, 0755, true)) {
                    throw new \Exception('Failed to create directory: ' . $destinationPath);
                }
            }
            if (!is_writable($destinationPath)) {
                throw new \Exception('Directory is not writable: ' . $destinationPath);
            }

            $uploadedMessages = [];
            $formattedFiles = [];
            $isFirstNewConversation = false;
            $initialCustomSlug = $customSlug;

            foreach ($files as $index => $file) {
                // Get file information BEFORE moving the file
                $originalName = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                $mimeType = $file->getMimeType();
                $extension = strtolower($file->getClientOriginalExtension());

                if (empty($extension)) {
                    $extension = $file->guessExtension() ?? 'bin';
                }

                // Get real path for image dimensions (if needed)
                $realPath = $file->getRealPath();

                // Generate a unique filename with random string
                $imageName = time() . '_' . Str::random(6) . '_' . $index . '.' . $extension;

                // Move file to destination
                $file->move($destinationPath, $imageName);

                // Generate URL path
                $imageUrl = 'aicontent/' . $imageName;

                // Generate a unique access token for this file
                $accessToken = bin2hex(random_bytes(16));

                // Prepare file metadata with safe data retrieval
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

                // For images, get dimensions if possible
                if (strpos($mimeType, 'image/') === 0) {
                    try {
                        $movedPath = $destinationPath . '/' . $imageName;
                        if (file_exists($movedPath)) {
                            list($width, $height) = getimagesize($movedPath);
                            $fileMetadata['width'] = $width;
                            $fileMetadata['height'] = $height;
                        }
                    } catch (\Exception $e) {
                        // Silently continue without dimensions
                    }
                }

                // For HTML files, add security metadata
                if (in_array($mimeType, ['text/html', 'application/xhtml+xml']) || $extension === 'html' || $extension === 'htm') {
                    $fileMetadata['is_html'] = true;
                    $fileMetadata['sanitized'] = false;
                }

                $position = null;
                if ($conversationId) {
                    AISearchHistory::ensureConversationPositions($conversationId);
                    if ($parentMessage && $index === 0) {
                        $parentMessage->refresh();
                    }
                }

                if ($parentMessage && $index === 0) {
                    $position = ($parentMessage->position ?? 0) + 1;

                    AISearchHistory::where('conversation_id', $conversationId)
                        ->where('position', '>=', $position)
                        ->increment('position');
                } else {
                    $maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position') ?? -1;
                    $position = $maxPosition + 1;
                }

                // Determine query description
                $fileQuery = '';
                if ($description && $index === 0) {
                    $fileQuery = $description;
                } elseif ($description && count($files) > 1) {
                    $fileQuery = $description . ' (' . $originalName . ')';
                } else {
                    $fileQuery = "Uploaded file: " . $originalName;
                }

                // Create file upload message
                $uploadData = [
                    'user_id' => Auth::id(),
                    'conversation_id' => $conversationId,
                    'parent_id' => $parentMessage ? $parentMessage->id : null,
                    'message_role' => 'user',
                    'content_type' => AISearchHistory::CONTENT_TYPE_UPLOAD,
                    'thread_id' => 'thread_' . Str::random(16),
                    'query' => $fileQuery,
                    'response' => null,
                    'file_data' => $fileMetadata,
                    'position' => $position,
                    'status' => $conversationStatus,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ];

                // If custom_slug is provided and available for a new conversation, set it on the first message
                if ($initialCustomSlug && !$conversationId && $index === 0 && AISearchHistory::isSlugAvailable($initialCustomSlug)) {
                    $uploadData['slug'] = AISearchHistory::cleanSlugForUrl($initialCustomSlug);
                }

                $uploadMessage = AISearchHistory::create($uploadData);
                $uploadedMessages[] = $uploadMessage;
                $formattedFiles[] = $this->formatFileForResponse($uploadMessage);

                // If this was a new conversation, save the conversation_id for subsequent files
                if (!$conversationId) {
                    $conversationId = $uploadMessage->conversation_id;
                    $isFirstNewConversation = true;

                    // Generate conversation title
                    $titleText = count($files) > 1
                        ? "File upload: " . $originalName . " (+" . (count($files) - 1) . " more)"
                        : "File upload: " . $originalName;
                    $title = $this->generateConversationTitle($titleText);

                    AISearchHistory::where('conversation_id', $conversationId)
                        ->update(['conversation_title' => $title]);

                    // Funnel cloning and onboarding for new conversation
                    $domainfull = idn_to_utf8('ez.wiki');
                    $defaultpage = Defaultpage::whereHas('domain', function ($query) use ($domainfull) {
                        $query->where('domain', $domainfull);
                    })->first();

                    $user_id = Auth::check() ? Auth::id() : 72;

                    if ($defaultpage) {
                        $originalFunnel = EzFunnel::find($defaultpage->handle_id);
                        if ($originalFunnel) {
                            $themeData = [
                                'user_id' => $user_id,
                                'title' => $title,
                                'description' => $title,
                                'price' => 0,
                                'leftwidth' => 0,
                                'rightwidth' => 0,
                                'option' => 'autoplay',
                                'bgcolour' => '#000000',
                                'image' => 'https://ez.wiki/X/' . urldecode($uploadMessage->slug),
                                'status' => 'active'
                            ];

                            $theme = Template::create($themeData);
                            $themetemplate = $theme->id;

                            if (!empty($originalFunnel->theme)) {
                                $themeIds = array_filter(explode(',', $originalFunnel->theme));
                                if ($theme->id !== null) {
                                    $templateIds = [$theme->id];
                                    $themeIds = array_merge($templateIds, $themeIds);
                                }
                                $themetemplate = implode(',', $themeIds);
                            }

                            $clonedFunnel = $originalFunnel->replicate();
                            $clonedFunnel->displaymode = 'ai';
                            $clonedFunnel->user_id = $user_id;
                            $clonedFunnel->theme = $themetemplate;
                            $clonedFunnel->aiid = $uploadMessage->id;
                            $clonedFunnel->save();

                            if (!empty($originalFunnel->theme)) {
                                $themeIds = array_filter(explode(',', $originalFunnel->theme));
                                $existingThemes = Themecollection::where('user_id', Auth::id())
                                    ->whereIn('theme_id', $themeIds)
                                    ->pluck('theme_id')
                                    ->toArray();

                                $newThemes = array_diff($themeIds, $existingThemes);
                                $userID = $user_id;
                                $themeData = array_map(function ($themeId) use ($userID) {
                                    return [
                                        'user_id' => $userID,
                                        'theme_id' => $themeId
                                    ];
                                }, $newThemes);

                                if (!empty($themeData)) {
                                    Themecollection::insert($themeData);
                                }
                            }

                            // Clone funnel fields, logo settings, SEO settings
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

                            if (Auth::check()) {
                                $ezFunnel = EzFunnel::findOrFail($clonedFunnel->id);
                                $emaildesign = Emaildesign::where('id', 34)->first();
                                if ($emaildesign) {
                                    $fullfunnel = "https://ez.wiki/" . $ezFunnel->token;
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
                        }
                    }
                }
            }

            DB::commit();

            // Get updated conversation
            $firstUpload = $uploadedMessages[0];
            $conversationMessages = $this->getFilteredConversationMessages($conversationId);
            $primarySlug = $firstUpload->slug;

            return response()->json([
                'success' => true,
                'message' => count($files) > 1 ? count($files) . ' files uploaded successfully' : 'File uploaded successfully',
                'is_html' => in_array($firstUpload->file_data['mime_type'] ?? '', ['text/html', 'application/xhtml+xml']) || ($firstUpload->file_data['extension'] ?? '') === 'html',
                'slug' => $primarySlug,
                'conversation_id' => $conversationId,
                'file' => $formattedFiles[0] ?? null,
                'files' => $formattedFiles,
                'count' => count($formattedFiles),
                'conversation_messages' => $conversationMessages,
                'file_url' => asset($firstUpload->file_data['path'] ?? ''),
                'access_token' => $firstUpload->file_data['access_token'] ?? '',
                'download_url' => url('/content/file/' . $primarySlug),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file: ' . $e->getMessage(),
                'debug' => config('app.debug') ? [
                    'line' => $e->getLine(),
                    'file' => $e->getFile(),
                ] : null
            ], 500);
        }
    }

    /**
     * Get secure file access - Modified to work with public_path
     */
    public function getFile($slug, Request $request)
    {
        try {
            $message = AISearchHistory::where('slug', $slug)
                ->where('content_type', AISearchHistory::CONTENT_TYPE_UPLOAD)
                ->first();

            if (!$message || !$message->file_data) {
                abort(404, 'File not found');
            }

            // Check access permissions
            if (!$this->checkFileAccess($message)) {
                abort(403, 'Unauthorized access to file');
            }

            $fileData = $message->file_data;
            $filePath = public_path($fileData['path']);

            if (!file_exists($filePath)) {
                abort(404, 'File not found in storage');
            }

            return response()->download($filePath, $fileData['original_name']);

        } catch (\Exception $e) {
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                throw $e;
            }

            abort(500, 'Error accessing file');
        }
    }

    /**
     * Get file info without downloading
     */
    public function getFileInfo($slug, Request $request)
    {
        try {
            $message = AISearchHistory::where('slug', $slug)
                ->where('content_type', AISearchHistory::CONTENT_TYPE_UPLOAD)
                ->first();

            if (!$message || !$message->file_data) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found',
                ], 404);
            }

            // Check access permissions
            if (!$this->checkFileAccess($message)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to file',
                ], 403);
            }

            $fileData = $message->file_data;

            return response()->json([
                'success' => true,
                'file' => [
                    'name' => $fileData['original_name'],
                    'size' => $fileData['size'],
                    'type' => $fileData['mime_type'],
                    'url' => $fileData['url'],
                    'download_url' => url('/content/file/' . $message->slug),
                    'uploaded_at' => $fileData['uploaded_at'],
                    'description' => $message->query,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving file info',
            ], 500);
        }
    }

    /**
     * Check if user has access to file
     */
    private function checkFileAccess($message): bool
    {
        if ($message->status === 'public') {
            return true;
        }

        if ($message->status === 'private' || $message->status === 'hidden') {
            return $this->isMessageOwner($message);
        }

        return false;
    }

    /**
     * Check if current user/session owns a message
     */
    private function isMessageOwner($message): bool
    {
        $user = Auth::user();
        $sessionId = Session::getId();

        return $message->isOwnedBy($user, $sessionId);
    }

    /**
     * Check if user has access to a message
     */
    private function checkMessageAccess($message): bool
    {
        if ($message->status === 'public') {
            return true;
        }

        if ($message->status === 'hidden') {
            return $this->isMessageOwner($message);
        }

        if ($message->status === 'private') {
            return true;
        }

        return true;
    }

    /**
     * Get filtered conversation messages
     */
    private function getFilteredConversationMessages(string $conversationId)
    {
        AISearchHistory::ensureConversationPositions($conversationId);
        $messages = AISearchHistory::where('conversation_id', $conversationId)
            ->with('user')
            ->orderBy('position', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $user = Auth::user();
        $sessionId = Session::getId();

        $filtered = $messages->filter(function ($message) use ($user, $sessionId) {
            if ($message->status === 'public') {
                return true;
            }

            if ($message->status === 'hidden' || $message->status === 'private') {
                return $message->isOwnedBy($user, $sessionId);
            }

            return true;
        })->values();

        return $filtered->map(function ($message) {
            return AISearchHistory::formatMessageForDisplay($message);
        })->toArray();
    }

    /**
     * Format comment for response
     */
    private function formatCommentForResponse($comment)
    {
        return [
            'id' => $comment->id,
            'slug' => $comment->slug,
            'content_type' => $comment->content_type ?? AISearchHistory::CONTENT_TYPE_COMMENT,
            'message_role' => $comment->message_role ?? 'user',
            'parent_id' => $comment->parent_id ?? null,
            'position' => $comment->position ?? null,
            'content' => $comment->query,
            'query' => $comment->query,
            'created_at' => $comment->created_at->toISOString(),
            'formatted_created_at' => $comment->created_at->format('M d, Y \a\t h:i A'),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'email' => $comment->user->email,
            ] : null,
            'share_url' => $comment->getShareableUrl(),
        ];
    }

    /**
     * Format file for response
     */
    private function formatFileForResponse($message)
    {
        $fileData = $message->file_data;

        return [
            'id' => $message->id,
            'slug' => $message->slug,
            'content_type' => $message->content_type ?? AISearchHistory::CONTENT_TYPE_UPLOAD,
            'message_role' => $message->message_role ?? 'user',
            'parent_id' => $message->parent_id ?? null,
            'position' => $message->position ?? null,
            'name' => $fileData['original_name'],
            'size' => $fileData['size'],
            'size_formatted' => $this->formatBytes($fileData['size']),
            'type' => $fileData['mime_type'],
            'extension' => $fileData['extension'],
            'url' => $fileData['url'],
            'download_url' => url('/content/file/' . $message->slug),
            'created_at' => $message->created_at->toISOString(),
            'formatted_created_at' => $message->created_at->format('M d, Y \a\t h:i A'),
            'description' => $message->query,
            'width' => $fileData['width'] ?? null,
            'height' => $fileData['height'] ?? null,
            'is_image' => strpos($fileData['mime_type'], 'image/') === 0,
        ];
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Generate conversation title
     */
    private function generateConversationTitle(string $content): string
    {
        if (str_contains($content, 'embed-row') || str_contains($content, 'embed-carousel') || str_contains($content, 'embed-masonry') || str_contains($content, 'masonry-wrapper') || str_starts_with(trim($content), '<!DOCTYPE html>') || str_starts_with(trim($content), '<html')) {
            if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $content, $titleMatches)) {
                $extracted = trim($titleMatches[1]);
                if (!empty($extracted)) {
                    return substr($extracted, 0, 60);
                }
            }
            return 'Embed Layout';
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
        } else {
            // Other languages, use default
            $title = substr($content, 0, 60) . (strlen($content) > 60 ? '...' : '');
        }

        return $title;
    }

    /**
     * Get conversation by ID with all content types
     */
    public function getConversation($conversationId)
    {
        try {
            AISearchHistory::ensureConversationPositions($conversationId);
            $messages = AISearchHistory::where('conversation_id', $conversationId)
                ->orderBy('position', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            if ($messages->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation not found',
                    'messages' => [],
                ], 404);
            }

            $firstMessage = $messages->first();

            // Check access
            $hasAccess = $this->checkFileAccess($firstMessage);
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view this conversation.',
                ], 403);
            }

            // Filter messages based on access
            $filteredMessages = $messages->filter(function ($message) {
                return $this->checkFileAccess($message);
            })->values();

            return response()->json([
                'success' => true,
                'conversation_id' => $conversationId,
                'conversation_title' => $firstMessage->conversation_title,
                'created_at' => $firstMessage->created_at->toISOString(),
                'message_count' => $filteredMessages->count(),
                'messages' => $filteredMessages->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'slug' => $message->slug,
                        'content_type' => $message->content_type,
                        'message_role' => $message->message_role,
                        'parent_id' => $message->parent_id ?? null,
                        'position' => $message->position ?? null,
                        'query' => $message->query,
                        'response' => $message->response,
                        'file_data' => $message->file_data,
                        'created_at' => $message->created_at->toISOString(),
                        'formatted_created_at' => $message->created_at->format('M d, Y \a\t h:i A'),
                        'share_url' => $message->getShareableUrl(),
                        'status' => $message->status,
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving conversation',
            ], 500);
        }
    }

    /**
     * Get all content types in a conversation with filtering
     */
    public function getConversationByType($conversationId, $contentType)
    {
        try {
            AISearchHistory::ensureConversationPositions($conversationId);
            $messages = AISearchHistory::where('conversation_id', $conversationId)
                ->where('content_type', $contentType)
                ->orderBy('position', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            if ($messages->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No messages of this type found',
                ], 404);
            }

            $firstMessage = $messages->first();

            // Check access
            $hasAccess = $this->checkFileAccess($firstMessage);
            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view this content.',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'conversation_id' => $conversationId,
                'content_type' => $contentType,
                'message_count' => $messages->count(),
                'messages' => $messages->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'slug' => $message->slug,
                        'message_role' => $message->message_role,
                        'parent_id' => $message->parent_id ?? null,
                        'position' => $message->position ?? null,
                        'query' => $message->query,
                        'response' => $message->response,
                        'file_data' => $message->file_data,
                        'created_at' => $message->created_at->toISOString(),
                        'formatted_created_at' => $message->created_at->format('M d, Y \a\t h:i A'),
                        'share_url' => $message->getShareableUrl(),
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving conversation',
            ], 500);
        }
    }

    /**
     * Delete a specific message (if user owns it)
     */
    public function deleteMessage($slug, Request $request)
    {
        try {
            $message = AISearchHistory::where('slug', urldecode($slug))->first();

            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message not found',
                ], 404);
            }

            // Check if user owns the message
            if (!$this->isMessageOwner($message)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete this message',
                ], 403);
            }

            // Don't actually delete, just mark as hidden
            $message->status = 'hidden';
            $message->save();

            return response()->json([
                'success' => true,
                'message' => 'Message hidden successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting message',
            ], 500);
        }
    }

    /**
     * Get user's uploaded files
     */
    public function getUserFiles(Request $request)
    {
        try {
            $user = Auth::user();
            $sessionId = Session::getId();

            $query = AISearchHistory::where('content_type', AISearchHistory::CONTENT_TYPE_UPLOAD)
                ->orderBy('created_at', 'desc');

            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                $query->where('session_id', $sessionId);
            }

            $files = $query->paginate(20);

            return response()->json([
                'success' => true,
                'files' => $files->map(function ($message) {
                    return $this->formatFileForResponse($message);
                }),
                'pagination' => [
                    'total' => $files->total(),
                    'per_page' => $files->perPage(),
                    'current_page' => $files->currentPage(),
                    'last_page' => $files->lastPage(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving files',
            ], 500);
        }
    }

    /**
     * Get user's comments
     */
    public function getUserComments(Request $request)
    {
        try {
            $user = Auth::user();
            $sessionId = Session::getId();

            $query = AISearchHistory::where('content_type', AISearchHistory::CONTENT_TYPE_COMMENT)
                ->orderBy('created_at', 'desc');

            if ($user) {
                $query->where('user_id', $user->id);
            } else {
                $query->where('session_id', $sessionId);
            }

            $comments = $query->paginate(20);

            return response()->json([
                'success' => true,
                'comments' => $comments->map(function ($message) {
                    return $this->formatCommentForResponse($message);
                }),
                'pagination' => [
                    'total' => $comments->total(),
                    'per_page' => $comments->perPage(),
                    'current_page' => $comments->currentPage(),
                    'last_page' => $comments->lastPage(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving comments',
            ], 500);
        }
    }

    /**
     * Search across all content types
     */
    public function searchContent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2|max:100',
            'content_type' => 'nullable|string|in:ai,comment,upload,all',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $searchQuery = $request->input('query');
        $contentType = $request->input('content_type', 'all');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);

        try {
            $query = AISearchHistory::where(function ($q) use ($searchQuery) {
                $q->where('query', 'LIKE', "%{$searchQuery}%")
                    ->orWhere('response', 'LIKE', "%{$searchQuery}%");
            });

            if ($contentType !== 'all') {
                $query->where('content_type', $contentType);
            }

            // Filter by public status or ownership
            $user = Auth::user();
            $sessionId = Session::getId();

            $query->where(function ($q) use ($user, $sessionId) {
                $q->where('status', 'public')
                    ->orWhere(function ($subQ) use ($user, $sessionId) {
                        if ($user) {
                            $subQ->where('user_id', $user->id);
                        }
                        $subQ->orWhere('session_id', $sessionId);
                    });
            });

            $results = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'results' => $results->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'slug' => $message->slug,
                        'content_type' => $message->content_type,
                        'message_role' => $message->message_role,
                        'query' => $message->query,
                        'response_preview' => Str::limit(strip_tags($message->response ?? ''), 100),
                        'file_data' => $message->file_data,
                        'created_at' => $message->created_at->toISOString(),
                        'formatted_created_at' => $message->created_at->format('M d, Y \a\t h:i A'),
                        'share_url' => $message->getShareableUrl(),
                        'conversation_id' => $message->conversation_id,
                        'conversation_title' => $message->conversation_title,
                    ];
                }),
                'pagination' => [
                    'total' => $results->total(),
                    'per_page' => $results->perPage(),
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error searching content',
            ], 500);
        }
    }

    /**
     * Get conversation summary with stats
     */
    public function getConversationStats($conversationId)
    {
        try {
            $messages = AISearchHistory::where('conversation_id', $conversationId)->get();

            if ($messages->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation not found',
                ], 404);
            }

            $firstMessage = $messages->first();

            // Check access
            if (!$this->checkFileAccess($firstMessage)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view this conversation.',
                ], 403);
            }

            $stats = [
                'total_messages' => $messages->count(),
                'ai_messages' => $messages->where('content_type', AISearchHistory::CONTENT_TYPE_AI)->count(),
                'comments' => $messages->where('content_type', AISearchHistory::CONTENT_TYPE_COMMENT)->count(),
                'embeds' => $messages->where('content_type', AISearchHistory::CONTENT_TYPE_EMBED)->count(),
                'conversationcomments' => $messages->where('content_type', 'conversationcomment')->count(),
                'uploads' => $messages->where('content_type', AISearchHistory::CONTENT_TYPE_UPLOAD)->count(),
                'user_messages' => $messages->where('message_role', 'user')->count(),
                'assistant_messages' => $messages->where('message_role', 'assistant')->count(),
                'total_tokens' => $messages->sum('total_tokens'),
                'total_cost' => round(($messages->sum('total_tokens') / 1000) * 0.01, 4),
                'first_message_at' => $messages->min('created_at')->toISOString(),
                'last_message_at' => $messages->max('created_at')->toISOString(),
                'duration_hours' => round($messages->max('created_at')->diffInHours($messages->min('created_at')), 1),
            ];

            return response()->json([
                'success' => true,
                'conversation_id' => $conversationId,
                'conversation_title' => $firstMessage->conversation_title,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving conversation stats',
            ], 500);
        }
    }

    /**
     * Update an existing upload message
     */
    public function updateUpload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message_slug' => 'required|string',
            'description' => 'nullable|string|max:500',
            'file' => 'nullable|file|max:102400|mimes:jpg,jpeg,png,gif,pdf,mp4,webm,ogg,mp3,wav,html,htm' // Added HTML support
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Find the message
            $message = AISearchHistory::where('slug', $request->message_slug)
                ->where('content_type', AISearchHistory::CONTENT_TYPE_UPLOAD)
                ->first();

            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message not found',
                ], 404);
            }

            // Check ownership
            if (!$this->isMessageOwner($message)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            DB::beginTransaction();

            // Update description
            $message->query = $request->description ?: "Uploaded file: " . ($message->file_data['original_name'] ?? 'File');

            // Handle file replacement if new file is uploaded
            if ($request->hasFile('file')) {
                $file = $request->file('file');

                // Validate the new file
                if (!$file->isValid()) {
                    throw new \Exception('File upload failed: ' . $file->getErrorMessage());
                }

                // Check file type - UPDATED to include HTML
                $allowedMimeTypes = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
                    'application/pdf',
                    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
                    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm', 'audio/x-wav',
                    'text/html',
                    'application/xhtml+xml',
                ];

                $mimeType = $file->getMimeType();

                if (!in_array($mimeType, $allowedMimeTypes)) {
                    throw new \Exception('File type not allowed. Only images, PDF, video, audio, and HTML files are permitted.');
                }

                // Delete old file if it exists
                if ($message->file_data && isset($message->file_data['path'])) {
                    $oldPath = public_path($message->file_data['path']);
                    if (file_exists($oldPath)) {
                        if (!unlink($oldPath)) {
                            \Log::warning('Failed to delete old file: ' . $oldPath);
                        }
                    }
                }

                // Get file information
                $originalName = $file->getClientOriginalName();
                $fileSize = $file->getSize();
                $mimeType = $file->getMimeType();
                $extension = $file->getClientOriginalExtension();

                if (empty($extension)) {
                    $extension = $file->guessExtension() ?? 'bin';
                }

                // Get real path for image dimensions
                $realPath = $file->getRealPath();

                // Generate a unique filename
                $imageName = time() . '_' . Str::random(5) . '.' . $extension;

                // Set destination path
                $destinationPath = public_path('aicontent');

                // Create directory if it doesn't exist
                if (!file_exists($destinationPath)) {
                    if (!mkdir($destinationPath, 0755, true)) {
                        throw new \Exception('Failed to create directory: ' . $destinationPath);
                    }
                }

                // Check if directory is writable
                if (!is_writable($destinationPath)) {
                    throw new \Exception('Directory is not writable: ' . $destinationPath);
                }

                // Move new file
                $file->move($destinationPath, $imageName);

                // Generate URL path
                $imageUrl = 'aicontent/' . $imageName;

                // Generate access token
                $accessToken = bin2hex(random_bytes(16));

                // Prepare file metadata
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

                // For HTML files, add security metadata
                if (in_array($mimeType, ['text/html', 'application/xhtml+xml']) || $extension === 'html' || $extension === 'htm') {
                    $fileMetadata['is_html'] = true;
                    $fileMetadata['sanitized'] = false;
                }

                // Get dimensions for images
                if (strpos($mimeType, 'image/') === 0) {
                    try {
                        if (file_exists($realPath)) {
                            list($width, $height) = getimagesize($realPath);
                            $fileMetadata['width'] = $width;
                            $fileMetadata['height'] = $height;
                        }
                    } catch (\Exception $e) {
                        // Silently continue without dimensions
                    }
                }

                $message->file_data = $fileMetadata;
            }

            $message->save();

            // Refresh the message to get all attributes
            $message->refresh();

            DB::commit();

            // Return the full updated message object
            return response()->json([
                'success' => true,
                'message' => 'Upload updated successfully',
                'is_html' => isset($message->file_data['is_html']) ? $message->file_data['is_html'] : false,
                'data' => [
                    'id' => $message->id,
                    'slug' => $message->slug,
                    'query' => $message->query,
                    'file_data' => $message->file_data,
                    'content_type' => $message->content_type,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Update upload failed: ' . $e->getMessage(), [
                'slug' => $request->message_slug,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update upload: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateMessageContent(Request $request, $slug)
    {
        $request->validate([
            'content' => 'required|string',
            'content_type' => 'nullable|string|in:comment,embed,conversationcomment'
        ]);

        $user = Auth::user();
        $sessionId = Session::getId();

        $message = AISearchHistory::where('slug', urldecode($slug))->first();

        if (!$message) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        if (!$message->isOwnedBy($user, $sessionId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!in_array($message->content_type, [
            AISearchHistory::CONTENT_TYPE_COMMENT,
            AISearchHistory::CONTENT_TYPE_UPLOAD,
            AISearchHistory::CONTENT_TYPE_EMBED,
            'comment',
            'embed',
            'conversationcomment',
        ])) {
            return response()->json(['error' => 'Only comments, uploads, embeds, and conversation comments can be edited'], 403);
        }

        try {
            DB::beginTransaction();

            $oldContent = $message->query;
            $setting = Setting::where('id', 1)->first();

            function get_domain($url)
            {
                if (empty($url)) {
                    return false;
                }
                $host = parse_url($url, PHP_URL_HOST);
                if (!$host) {
                    return false;
                }
                $domain = preg_replace('/^www\./', '', $host);
                if (filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                    return $domain;
                }
                return false;
            }
            function printText(?string $text)
            {
                if ($text) {
                    return htmlspecialchars($text, ENT_IGNORE);
                }
            }
            function isCSS($text)
            {
                $pattern = '/\.[a-zA-Z0-9_-]+{[^}]*}/';
                if (preg_match($pattern, $text)) {
                    return false;
                }
                return true;
            }
            function printImage(?string $image)
            {
                if ($image) {
                    return '<img src="' . $image . '" width="100%" >';
                } else {
                    return '<img src="/bee.webp" width="100%" >';
                }
            }
            function printfav(?string $image)
            {
                if ($image) {
                    return '<img src="' . $image . '" width="36px" >';
                }
                return null;
            }
            function random_color_part()
            {
                return str_pad(dechex(mt_rand(0, 255)), 2, '0', STR_PAD_LEFT);
            }
            function random_color()
            {
                return random_color_part() . random_color_part() . random_color_part();
            }

            $htmlnotsupport = false;
            $aladinurlredirectembed = '';
            $type = '';
            $done = '';
            $originalContent = '';
            $requestedContentType = $request->input('content_type');

            // Determine if this is a raw embed or a conversationcomment (no scraping needed)
            $isEmbedOrConversationComment = in_array($requestedContentType, ['embed', 'conversationcomment'], true)
                || in_array($message->content_type, ['embed', 'conversationcomment'], true);

            if ($isEmbedOrConversationComment) {
                $aladinurlredirectembed = $request->content;
            } elseif (!empty($request->content)) {
                $originalContent = $request->content;
                $parse = explode('/', $request->content);
                $fullDomain = idn_to_utf8(get_domain($request->content));
                $domains = Admindomain::where('domain', $fullDomain)->first();
                if (!empty($domains)) {
                    if (filter_var($request->content, FILTER_VALIDATE_URL)) {
                        $aladinurlredirectembed .= '<iframe src="' . $request->content . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                        $done = 'done';
                    }
                }
                if (isset($parse[3])) {
                    $linkdomain = $parse[0] . '//' . $parse[2] . '/';
                    $search = $parse[3];
                    $urlnew = $request->content;
                    if ('tiktok.com' == get_domain($request->content) || 'www.tiktok.com' == get_domain($request->content)) {
                        $aladinurlredirectembed .= '<blockquote class="tiktok-embed" cite="' . $request->content . '" data-unique-id="melonnt" data-embed-type="creator" style="max-width: 780px; min-width: 288px;" > <section> <a target="_blank" href="' . $request->content . '?refer=creator_embed">' . $search . '</a> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>';
                        $done = 'done';
                    } elseif ($linkdomain == 'https://kick.com/') {
                        $aladinurlredirectembed .= '<iframe src="https://player.kick.com/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                        $done = 'done';
                    } elseif ($linkdomain == 'https://live.arrival.space/') {
                        $aladinurlredirectembed .= '<iframe src="https://live.arrival.space/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                        $done = 'done';
                    } elseif ('reddit.com' == get_domain($request->content) || 'www.reddit.com' == get_domain($request->content)) {
                        $aladinurlredirectembed .= '<blockquote class="reddit-embed-bq" style="height:500px" data-embed-height="740"><a href="' . $request->content . '"></a></blockquote><script async="" src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>';
                        $done = 'done';
                    } elseif ($linkdomain == 'https://beacons.ai/') {
                        $aladinurlredirectembed .= '<iframe src="https://beacons.ai/' . $search . '" height="888" width="100%" frameborder="0" scrolling="yes" allowfullscreen="true"></iframe>';
                        $done = 'done';
                    } elseif ($linkdomain == 'https://twitter.com/') {
                        $aladinurlredirectembed .= '<a class="twitter-timeline" href="https://twitter.com/' . $search . '?ref_src=twsrc%5Etfw">Tweets by JaredFPS</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                        $done = 'done';
                    } elseif ($linkdomain == 'https://pinterest.com/') {
                        $aladinurlredirectembed .= '<a data-pin-do="embedUser" data-pin-board-width="1024" data-pin-scale-height="888" data-pin-scale-width="80" href="https://www.pinterest.com/' . $search . '/">Follow ' . $search . ' on Pinterest</a><script async defer src="//assets.pinterest.com/js/pinit.js"></script>';
                        $done = 'done';
                    } else {
                        $checkurl = substr_count($urlnew, '/');
                        if ($checkurl <= 3) {
                            $curl = curl_init($urlnew);
                            curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                            curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
                            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
                            curl_setopt($curl, CURLOPT_TIMEOUT, 15);
                            curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);
                            curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
                            $html = curl_exec($curl);
                            $htmlnotsupport = $html;
                            if ($html != false) {
                                $crawler = new Crawler($html);
                                $img = $crawler->filter('img')->each(function ($node) {
                                    $src = $node->attr('src');
                                    return compact('src');
                                });
                                $texth1 = $crawler->filter('h1')->each(function ($node) {
                                    $text = $node->text();
                                    return compact('text');
                                });
                                $textp = $crawler->filter('p')->each(function ($node) {
                                    $text = $node->text();
                                    return compact('text');
                                });
                                $textspan = $crawler->filter('span')->each(function ($node) {
                                    $text = $node->text();
                                    return compact('text');
                                });
                                $texth5 = $crawler->filter('h5')->each(function ($node) {
                                    $text = $node->text();
                                    return compact('text');
                                });
                                $links = $crawler->filter('a')->each(function ($node) {
                                    $href = $node->attr('href');
                                    $title = $node->attr('title');
                                    $text = $node->text();
                                    return compact('href', 'title', 'text');
                                });

                                if ($linkdomain == 'https://lnk.bio/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $aladinurlredirectembed .= '<div class="profile-pic"> <img src="' . $img[0]['src'] . '" alt="Profile Picture"></div>';
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">' . $links[10]['text'] . '</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        $done = '';
                                        foreach ($links as $link) {
                                            if ($link['title'] == 'Get Lnk.Bio') {
                                                $done = 'done';
                                            }
                                            if ($link['title'] != '' && $done == '' && $link['text'] != 'Lnk.Bio') {
                                                $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://campsite.bio/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $img[0]['src'] . '" alt="Profile Picture"></div>';
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">';
                                        if (!empty($texth1)) {
                                            $aladinurlredirectembed .= $texth1[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</h1>';
                                        $aladinurlredirectembed .= '<p class="real-name">';
                                        if (!empty($textp)) {
                                            $aladinurlredirectembed .= $textp[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        foreach ($links as $link) {
                                            if ($link['text'] != '') {
                                                if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                    $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://bio.site/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $image = '';
                                            foreach ($img as $imgs) {
                                                if (@getimagesize($imgs['src']) && $image != 'done') {
                                                    $image = 'done';
                                                    $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $imgs['src'] . '" alt="Profile Picture"></div>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">';
                                        if (!empty($texth1)) {
                                            $aladinurlredirectembed .= $texth1[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</h1>';
                                        $aladinurlredirectembed .= '<p class="real-name">';
                                        if (!empty($textp)) {
                                            $aladinurlredirectembed .= $textp[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        foreach ($links as $link) {
                                            if ($link['text'] != '' && $link['text'] != 'Create a free Bio Site') {
                                                if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                    $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://hoo.be/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $aladinurlredirectembed .= '<div class="profile-pic"><img src="https://hoo.be/' . $img[1]['src'] . '" alt="Profile Picture"></div>';
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">';
                                        if (!empty($textspan)) {
                                            $aladinurlredirectembed .= $textspan[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</h1>';
                                        $aladinurlredirectembed .= '<p class="real-name">';
                                        if (!empty($texth5)) {
                                            $aladinurlredirectembed .= $texth5[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        foreach ($links as $link) {
                                            if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                                if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                    $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://linktr.ee/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $image = '';
                                            foreach ($img as $imgs) {
                                                if (@getimagesize($imgs['src']) && $image != 'done') {
                                                    $image = 'done';
                                                    $aladinurlredirectembed .= '<div class="profile-pic"> <img src="' . $imgs['src'] . '" alt="Profile Picture"> </div>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">';
                                        if (!empty($texth1)) {
                                            $texth1done = '';
                                            foreach ($texth1 as $texth1s) {
                                                if (isCSS($texth1s['text']) && $texth1done != 'done') {
                                                    $texth1done = 'done';
                                                    $aladinurlredirectembed .= $texth1s['text'];
                                                    session()->put('linkname', trim($texth1s['text']));
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</h1><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        foreach ($links as $link) {
                                            if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                                if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                    $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://portaly.cc/') {
                                    if (!empty($links)) {
                                        $aladinurlredirectembed .= '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile Page</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><style>.bodycontaner{font-family:Arial,sans-serif;background:linear-gradient(90deg,rgba(255,223,0,1) 0%,rgba(255,176,0,1) 100%);display:flex;justify-content:center;align-items:center;padding:10px;}.profile-container{background-color:#1a1a1a;border-radius:20px;text-align:center;width:400px;padding:20px;position:relative;box-shadow:0 6px 12px rgba(0,0,0,0.3);transition:all .3s ease}.profile-container:hover{transform:scale(1.02);box-shadow:0 8px 16px rgba(0,0,0,0.4)}.header-bg{width:100%;border-radius:20px 20px 0 0;height:150px;object-fit:cover}.profile-pic{position:absolute;top:80px;left:50%;transform:translateX(-50%);border-radius:50%;overflow:hidden;width:130px;height:130px;border:4px solid #fff;background-color:#000}.profile-pic img{width:100%;height:100%;object-fit:cover}.username{color:#fff;margin-top:50px;font-size:24px;font-weight:700}.real-name{color:#ddd;font-size:16px}.tagline,.description{color:#bbb;margin:5px 0}.social-icons{margin-top:15px}.social-icon{display:inline-block;margin:0 10px;padding:5px;transition:transform .3s ease;font-size:24px;color:#fff}.social-icon:hover{transform:scale(1.2);color:orange}.links{margin-top:20px;display:flex;flex-direction:column;align-items:center}.link-button{display:flex;align-items:center;justify-content:center;background-color:#444;color:#fff;width:90%;padding:12px 0;margin:10px 0;text-decoration:none;border-radius:30px;border:1px solid #555;font-size:16px;font-weight:700;transition:all .3s ease;position:relative}.link-button:hover{background-color:#555;box-shadow:0 4px 8px rgba(0,0,0,0.2)}.link-button::before{content:"";position:absolute;left:15px;width:24px;height:24px;background-image:url(link-icon.png);background-size:cover;background-repeat:no-repeat}@media (max-width: 600px){.profile-container{width:90%}.username{font-size:20px}.real-name{font-size:14px}.link-button{font-size:14px}} </style></head><body><div class="bodycontaner" ><div class="profile-container"> <div class="header"> <img src="' . url('/') . '/yellow.webp" alt="Background" class="header-bg"> </div>';
                                        if (!empty($img)) {
                                            $image = '';
                                            foreach ($img as $imgs) {
                                                if (@getimagesize($imgs['src']) && $image != 'done') {
                                                    $image = 'done';
                                                    $aladinurlredirectembed .= '<div class="profile-pic"><img src="' . $imgs['src'] . '" alt="Profile Picture"></div>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '<h1 class="username">';
                                        if (!empty($texth1)) {
                                            $texth1done = '';
                                            foreach ($texth1 as $texth1s) {
                                                if (isCSS($texth1s['text']) && $texth1done != 'done') {
                                                    $texth1done = 'done';
                                                    $aladinurlredirectembed .= $texth1s['text'];
                                                    session()->put('linkname', trim($texth1s['text']));
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</h1>';
                                        $aladinurlredirectembed .= '<p class="real-name">';
                                        if (!empty($textp)) {
                                            $aladinurlredirectembed .= $textp[0]['text'];
                                        }
                                        $aladinurlredirectembed .= '</p><div class="social-icons"> <a href="#" class="social-icon"><i class="fas fa-envelope"></i></a> <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a> <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a> <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a> </div><div class="links">';
                                        foreach ($links as $link) {
                                            if ($link['text'] != '' && strtolower($link['text']) != strtolower('FacebookFacebook') && strtolower($link['text']) != strtolower('InstagramInstagram') && strtolower($link['text']) != strtolower('YouTubeYouTube') && strtolower($link['text']) != strtolower('EmailEmail') && strtolower($link['text']) != strtolower('XX') && strtolower($link['text']) != strtolower('Share on Twitter') && strtolower($link['text']) != strtolower('Share on Facebook') && isCSS($link['text'])) {
                                                if (preg_match('/^(http|https):\\/\\/[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}' . '((:[0-9]{1,5})?\\/.*)?$/i', $link['href'] . PHP_EOL)) {
                                                    $aladinurlredirectembed .= '<a href="' . $link['href'] . '" class="link-button" target="_blank" >' . $link['text'] . '</a>';
                                                }
                                            }
                                        }
                                        $aladinurlredirectembed .= '</div></div></div></body></html>';
                                        $done = 'done';
                                    }
                                } elseif ($linkdomain == 'https://link3.cc/') {
                                    $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="' . $linkdomain . $search . '" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                                    $done = 'done';
                                }
                            }
                        }
                    }
                }
                if ($done != 'done') {
                    if (!filter_var($request->content, FILTER_VALIDATE_URL)) {
                        $aladinurlredirectembed .= $request->content;
                    } else {
                        $urlparse = $request->content;
                        $parsed_url = parse_url($urlparse);
                        if (isset($parsed_url['host'])) {
                            $domain = $parsed_url['host'];
                        } else {
                            $domain = '';
                        }
                        $punycodeDomain = idn_to_ascii($domain);
                        $pndomain = str_replace($domain, $punycodeDomain, $request->content);
                        preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $pndomain, $match);
                        if (!empty($match)) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<iframe loading="lazy" height="888px" src="https://www.youtube.com/embed/' . $match[1] . '?controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>';
                        }
                        preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $pndomain, $match);
                        if (!empty($match)) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" src="https://player.vimeo.com/video/' . $match[3] . '?h=33160d1512&color=de0101" width="100%" height="888px" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
                        }
                        preg_match('/^(https?:\/\/)?(www\.)?fb.watch\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                        if (!empty($match)) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<div class="fb-video" data-href="' . $pndomain . '" data-width="500" data-show-text="true"></div>';
                        }
                        preg_match('/^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                        if (!empty($match)) {
                            if (strpos($pndomain, 'groups') == false) {
                                $type = 'done';
                                $aladinurlredirectembed .= '<div class="fb-post" data-href="' . $pndomain . '" data-width="500" data-show-text="true"></div>';
                            } else {
                                $str = ['{backimage}', '{backcolor}', '{favicon}', '{providerName}', '{loadingurl}', '{image}', '{title}', '{description}'];
                                $type = 'done';
                                $curl = curl_init('https://api.microlink.io/?url=' . $pndomain);
                                curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                                curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                                $page = curl_exec($curl);
                                $arraypage = array_values(json_decode($page, true));
                                $publisher = '';
                                $logo = '';
                                $urlpage = '';
                                $image = '';
                                $title = '';
                                $description = '';
                                if ($arraypage[1]['publisher'] != null) {
                                    $publisher = $arraypage[1]['publisher'];
                                }
                                if ($arraypage[1]['logo'] != null) {
                                    $logo = $arraypage[1]['logo']['url'];
                                }
                                if ($arraypage[1]['url'] != null) {
                                    $urlpage = $arraypage[1]['url'];
                                }
                                if ($arraypage[1]['image'] != null) {
                                    $image = $arraypage[1]['image']['url'];
                                }
                                if ($arraypage[1]['title'] != null) {
                                    $title = $arraypage[1]['title'];
                                }
                                if ($arraypage[1]['description'] != null) {
                                    $description = $arraypage[1]['description'];
                                }
                                $fav = '<img src="' . $logo . '" width="20px;" >';
                                $rplc = ['', '', $fav, $publisher, $urlpage, printImage($image), printText($title), printText($description)];
                                $code = Page::where('id', 1)->value('code');
                                $divstr = str_replace($str, $rplc, $code);
                                $aladinurlredirectembed .= $divstr;
                            }
                        }
                        preg_match('/^(https?:\/\/)?(www\.)?twitter.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                        if (!empty($match)) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="' . $pndomain . '">' . $pndomain . '</a></p>&mdash; News (@XNews) <a href="' . $pndomain . '?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                        }
                        preg_match('/^(https?:\/\/)?(www\.)?x.com\/[a-zA-Z0-9(\.\?)?]/', $pndomain, $match);
                        if (!empty($match)) {
                            $type = 'done';
                            $aladinurlredirectembed .= '<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="' . $pndomain . '">' . $pndomain . '</a></p>&mdash; News (@XNews) <a href="' . $pndomain . '?ref_src=twsrc%5Etfw"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';
                        }
                        if ($type != 'done') {
                            if (filter_var($pndomain, FILTER_VALIDATE_URL)) {
                                $isFriendly = IframeHelper::isIframeable($pndomain);
                                if ($isFriendly) {
                                    $type = 'iframe';
                                } else {
                                    $type = 'div';
                                }
                            } else {
                                $type = 'text';
                            }
                            if ($type == 'text') {
                                $aladinurlredirectembed .= $pndomain;
                            }
                            if ($type == 'iframe') {
                                $pattern = '/<iframe/i';
                                preg_match($pattern, $pndomain, $match);
                                if (!empty($match)) {
                                    $aladinurlredirectembed .= $pndomain;
                                } else {
                                    $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="' . $pndomain . '" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                                }
                            } else {
                                if ($type != 'text') {
                                    $scrapingurl = json_decode($setting['scrapingurl']);
                                    $scrp = 'OFF';
                                    for ($k = 0; $k < count($scrapingurl); $k++) {
                                        if (get_domain($pndomain) == get_domain($scrapingurl[$k])) {
                                            $scrp = 'ON';
                                        }
                                    }

                                    if ($scrp == 'ON') {
                                        $curl = curl_init($pndomain);
                                        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                                        curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                                        $page = curl_exec($curl);
                                        $page1 = str_replace('<button aria-label="Share" data-testid="ShareButton" style="transition:background-color 150ms ease" class="sc-pFZIQ sc-aemoO fRlsIx cBGtLF"><svg width="16" height="16" viewBox="0 0 16 16" enable-background="new 0 0 24 24" class="sc-gKsewC iPWGYb"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6464 3.85347L11 4.20702L11.7071 3.49992L11.3536 3.14636L8.35355 0.146362H7.64645L4.64645 3.14636L4.29289 3.49992L5 4.20702L5.35355 3.85347L7.5 1.70702V9.49992V9.99992H8.5V9.49992V1.70702L10.6464 3.85347ZM1 5.49994L1.5 4.99994H4V5.99994H2V14.9999H14V5.99994H12V4.99994H14.5L15 5.49994V15.4999L14.5 15.9999H1.5L1 15.4999V5.49994Z" fill="currentColor"></path></svg></button>', "", $page);
                                        $page2 = preg_replace('#<a href="/" class="sc-bdfBwQ Tmnro">(.*?)</a>#', '', $page1);
                                        $page3 = str_replace('<button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Preferences</button>', "", $page2);
                                        $page4 = str_replace('https://linktr.ee', "https://4x4.ai", $page3);
                                        if (parse_url($pndomain, PHP_URL_HOST) == 'lnk.bio') {
                                            $page4 = str_replace('href="/', 'href="https://lnk.bio/', $page4);
                                            $page4 = str_replace('src="/', 'src="https://lnk.bio/', $page4);
                                            $page4 = str_replace('https://lnk.bio//cdn.', "//cdn.", $page4);
                                        }
                                        $request->content = $page4 . '<style>.dTcluo{ height:auto;}</style><script>$("#pb_cookie_consent").hide(); </script>';
                                        $time = time();

                                        $fp = fopen($_SERVER['DOCUMENT_ROOT'] . "/temp/" . $time . "temp.html", "wb");
                                        fwrite($fp, $request->content);
                                        fclose($fp);
                                        $aladinurlredirectembed .= '<iframe loading="lazy" allow="camera; microphone; fullscreen; display-capture; autoplay" style="border: 0;" src="temp/' . $time . 'temp.html" width="100%" height="888px" allowfullscreen="allowfullscreen" ></iframe>';
                                    } else {
                                        $unknown = 0;
                                        if ($htmlnotsupport != 'false') {
                                            try {
                                                $embeded = new Embed();
                                                $info = $embeded->get($pndomain);
                                                $str = ['{backimage}', '{backcolor}', '{favicon}', '{providerName}', '{loadingurl}', '{image}', '{title}', '{description}'];

                                                if (file_exists(printfav($info->favicon))) {
                                                    $fav = printfav($info->favicon);
                                                    $rplc = ['', '', $fav, printText($info->providerName), $pndomain, printImage($info->image), printText($info->title), printText($info->description)];
                                                } else {
                                                    $curl = curl_init('https://api.microlink.io/?url=' . $pndomain);
                                                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
                                                    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
                                                    $page = curl_exec($curl);
                                                    $arraypage = array_values(json_decode($page, true));
                                                    if ($arraypage[0] == 'fail') {
                                                        $aladinurlredirectembed .= 'Unsupported domain.' . $pndomain;
                                                        $unknown = 1;
                                                    } else {
                                                        $publisher = '';
                                                        $logo = '';
                                                        $urlpage = '';
                                                        $image = '';
                                                        $title = '';
                                                        $description = '';
                                                        if ($arraypage[1]['publisher'] != null) {
                                                            $publisher = $arraypage[1]['publisher'];
                                                        }
                                                        if ($arraypage[1]['logo'] != null) {
                                                            $logo = $arraypage[1]['logo']['url'];
                                                        }
                                                        if ($arraypage[1]['url'] != null) {
                                                            $urlpage = $arraypage[1]['url'];
                                                        }
                                                        if ($arraypage[1]['image'] != null) {
                                                            $image = $arraypage[1]['image']['url'];
                                                        }
                                                        if ($arraypage[1]['title'] != null) {
                                                            $title = $arraypage[1]['title'];
                                                        }
                                                        if ($arraypage[1]['description'] != null) {
                                                            $description = $arraypage[1]['description'];
                                                        }
                                                        $fav = '<img src="' . $logo . '" width="20px;" >';
                                                        $rplc = ['', '', $fav, $publisher, $urlpage, printImage($image), printText($title), printText($description)];
                                                    }
                                                }
                                                if ($unknown == 0) {
                                                    $code = Page::where('id', 1)->value('code');
                                                    $divstr = str_replace($str, $rplc, $code);
                                                    $aladinurlredirectembed .= $divstr;
                                                }
                                            } catch (Exception $e) {
                                                $aladinurlredirectembed .= $e->getMessage();
                                            }
                                        } else {
                                            $aladinurlredirectembed .= 'Unsupported domain.' . $pndomain;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            $message->query = $aladinurlredirectembed;

            // If explicit content_type was provided and matches, update it
            if ($requestedContentType && in_array($requestedContentType, ['comment', 'embed', 'conversationcomment'], true)) {
                $message->content_type = $requestedContentType;
            }

            $message->save();

            DB::commit();

            Log::info('Message content updated', [
                'message_id' => $message->id,
                'slug' => $slug,
                'content_type' => $message->content_type,
                'user_id' => $user ? $user->id : null,
                'session_id' => $sessionId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Content updated successfully',
                'content' => $message->query,
                'file_data' => $message->file_data,
                'content_type' => $message->content_type,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update message content', [
                'message_id' => $message->id,
                'slug' => $slug,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to update content',
                'message' => 'An error occurred while updating the content.'
            ], 500);
        }
    }

    /**
     * Create a landing page conversation
     */
    public function createLandingPage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'landing_page_url' => 'required|url',
            'slug_domain' => 'nullable|string',
            'short_slug' => 'nullable|string|max:50|regex:/^[a-z0-9-]+$/',
            'nyp_price' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $landingPageUrl = $request->input('landing_page_url');
        $slugDomain = $request->input('slug_domain');
        $shortSlug = $request->input('short_slug');
        $nyp_price = $request->input('nyp_price');
        $customSlug = $request->input('custom_slug');

        // Normalize the landing page URL
        if (!str_starts_with($landingPageUrl, 'http://') && !str_starts_with($landingPageUrl, 'https://')) {
            $landingPageUrl = 'https://' . $landingPageUrl;
        }

        try {
            // Determine conversation status (public by default)
            $conversationStatus = 'public';

            // Generate a unique conversation ID
            $conversationId = Str::uuid()->toString();

            // Create the landing page message
            $messageContent = "Landing Page: <a href=\"" . e($landingPageUrl) . "\" target=\"_blank\">" . e($landingPageUrl) . "</a>";

            // Prepare the landing page data
            $landingPageData = [
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => null,
                'message_role' => 'user',
                'content_type' => AISearchHistory::CONTENT_TYPE_LANDING_PAGE,
                'thread_id' => 'thread_' . Str::random(16),
                'query' => $messageContent,
                'response' => null,
                'status' => $conversationStatus,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
                'landing_page_url' => $landingPageUrl,
            ];

            // Add custom slug if provided and available
            if ($customSlug && AISearchHistory::isSlugAvailable($customSlug)) {
                $landingPageData['slug'] = AISearchHistory::cleanSlugForUrl($customSlug);
            }

            $landingPage = AISearchHistory::create($landingPageData);

            // Generate conversation title
            $title = "Landing Page: " . parse_url($landingPageUrl, PHP_URL_HOST);
            AISearchHistory::where('conversation_id', $conversationId)
                ->update(['conversation_title' => $title]);

            // If a short slug was provided and domain selected, create the redirect
            if (!empty($shortSlug) && !empty($slugDomain)) {
                // Check if the short slug is available
                $existingCustomDomain = Customdomain::where('domain', $shortSlug)
                    ->where('domainselected', $slugDomain)
                    ->exists();

                if (!$existingCustomDomain) {
                    if (Auth::check()) {
                        $user = User::where('id', Auth::id())->first();
                    } else {
                        $user = User::where('email', 'logysysweb@gmail.com')->first();
                    }
                    $domainfull = idn_to_utf8('ez.wiki');
                    $defaultpage = Defaultpage::whereHas('domain', function ($query) use ($domainfull) {
                        $query->where('domain', $domainfull);
                    })->first();
                    $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
                    $themeData = [
                        'user_id' => $user->id,
                        'title' => $shortSlug,
                        'description' => $shortSlug,
                        'price' => 0,
                        'leftwidth' => 0,
                        'rightwidth' => 0,
                        'option' => 'autoplay',
                        'bgcolour' => '#000000',
                        'image' => urldecode('https://ez.wiki/X/' . $landingPage->slug),
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
                    $clonedFunnel->user_id = $user->id;
                    $clonedFunnel->theme = $themetemplate;
                    $clonedFunnel->aiid = $landingPage->id;
                    $clonedFunnel->save();

                    if (!empty($originalFunnel->theme)) {
                        $themeIds = array_filter(explode(',', $originalFunnel->theme));
                        $existingThemes = Themecollection::where('user_id', $user->id)
                            ->whereIn('theme_id', $themeIds)
                            ->pluck('theme_id')
                            ->toArray();

                        $newThemes = array_diff($themeIds, $existingThemes);
                        $userID = $user->id;
                        $themeData = array_map(function ($themeId) use ($userID) {
                            return [
                                'user_id' => $userID,
                                'theme_id' => $themeId
                            ];
                        }, $newThemes);

                        if (!empty($themeData)) {
                            Themecollection::insert($themeData);
                        }
                    }

                    // Clone funnel fields, logo settings, SEO settings
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

                    $customDomain = Customdomain::create([
                        'domain' => $shortSlug,
                        'domainselected' => $slugDomain,
                        'user_id' => $user->id,
                        'funnelid' => $clonedFunnel->id,
                        'hashtag' => $clonedFunnel->seo_tag,
                        'expire' => now()->addYear()
                    ]);

                    if ($nyp_price != 0) {
                        Sell::create([
                            'sellid' => $customDomain->id,
                            'type' => 'CUSTOM',
                            'user_id' => $user->id,
                            'uniquesellid' => time(),
                            'price' => $nyp_price,
                            'expire' => now()->addYear()
                        ]);
                    }
                }
            }

            // Create a response message
            $responseMessage = "✅ Landing page created successfully!\n\n";
            $responseMessage .= "**Original URL:** {$landingPageUrl}\n\n";
            $responseMessage .= "**Conversation URL:** " . $landingPage->getShareableUrl() . "\n\n";

            if (!empty($shortSlug) && !empty($slugDomain)) {
                $shortUrl = "https://{$slugDomain}/{$shortSlug}";
                $responseMessage .= "**Short URL:** {$shortUrl}\n\n";
                $responseMessage .= "*The short URL will redirect to your landing page.*";
            }

            if (!empty($customSlug)) {
                $responseMessage .= "**Custom Slug:** ez.wiki/X/{$customSlug}\n\n";
                $responseMessage .= "*Your landing page conversation is also available at this custom URL.*";
            }

            if (empty($shortSlug) && empty($slugDomain) && empty($customSlug)) {
                $responseMessage .= "*No short URL was created. You can share the conversation URL above.*";
            }

            // Save AI response
            $aiResponse = AISearchHistory::create([
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $landingPage->id,
                'message_role' => 'assistant',
                'content_type' => AISearchHistory::CONTENT_TYPE_AI,
                'thread_id' => 'thread_' . Str::random(16),
                'query' => $messageContent,
                'response' => $responseMessage,
                'status' => $conversationStatus,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
            ]);

            // Get conversation messages
            $conversationMessages = $this->getFilteredConversationMessages($conversationId);

            return response()->json([
                'success' => true,
                'message' => 'Landing page created successfully',
                'slug' => $landingPage->slug,
                'conversation_id' => $conversationId,
                'conversation_url' => $landingPage->getShareableUrl(),
                'short_url' => (!empty($shortSlug) && !empty($slugDomain)) ? "https://{$slugDomain}/{$shortSlug}" : null,
                'custom_slug_url' => !empty($customSlug) ? "https://ez.wiki/X/{$customSlug}" : null,
                'conversation_messages' => $conversationMessages,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create landing page: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create landing page: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store Obsidian Wiki notes into DB and save .md files to public/uploads/Obsidian/
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeObsidianWiki(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|array|min:1',
            'notes.*.title' => 'required|string',
            'notes.*.content' => 'required|string',
            'notes.*.category' => 'nullable|string',
            'notes.*.tags' => 'nullable|array',
            'custom_slug' => 'nullable|string|max:100',
            'parent_slug' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'message_id' => 'nullable',
            'usage' => 'nullable|array',
            'usage.prompt_tokens' => 'nullable|integer',
            'usage.completion_tokens' => 'nullable|integer',
            'usage.total_tokens' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $notes = $request->input('notes', []);
        $customSlug = $request->input('custom_slug');
        $parentSlug = $request->input('parent_slug');
        $conversationId = $request->input('conversation_id');

        // Find parent message if provided
        $parentMessage = null;
        if ($parentSlug) {
            $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();

            if ($parentMessage && !$conversationId) {
                $conversationId = $parentMessage->conversation_id;
            }
        }

        DB::beginTransaction();

        try {
            // 1. Generate ID-based folder structure for uploads: public/uploads/Obsidian/{uploadFolderId}
            $userId = Auth::id() ?? 0;
            $uploadFolderId = 'vault_' . ($userId ? 'user_' . $userId . '_' : '') . time() . '_' . Str::random(6);

            $obsidianDir = public_path('uploads/Obsidian/' . $uploadFolderId);
            if (!file_exists($obsidianDir)) {
                @mkdir($obsidianDir, 0755, true);
            }

            // Also check storage public upload folder if exists
            $storageObsidianDir = storage_path('app/public/uploads/Obsidian/' . $uploadFolderId);
            if (!file_exists($storageObsidianDir)) {
                @mkdir($storageObsidianDir, 0755, true);
            }

            $savedFiles = [];
            $formattedMarkdown = "# Obsidian Wiki Vault (" . count($notes) . " Notes)\n\n";

            foreach ($notes as $index => $note) {
                $title = trim($note['title'] ?? 'Untitled Note ' . ($index + 1));
                $content = $note['content'] ?? '';
                $category = $note['category'] ?? 'GENERAL';
                $tags = isset($note['tags']) && is_array($note['tags']) ? implode(', ', $note['tags']) : '';

                // Generate safe filename for .md file
                $safeFilename = Str::slug($title, '_');
                if (empty($safeFilename)) {
                    $safeFilename = 'note_' . ($index + 1);
                }
                $filename = $safeFilename . '.md';
                $filePath = $obsidianDir . '/' . $filename;

                // Write .md file to public/uploads/Obsidian/{uploadFolderId}/
                @file_put_contents($filePath, $content);

                if (file_exists($storageObsidianDir)) {
                    @file_put_contents($storageObsidianDir . '/' . $filename, $content);
                }

                $fileUrl = '/uploads/Obsidian/' . $uploadFolderId . '/' . $filename;
                $parsedTags = isset($note['tags']) && is_array($note['tags'])
                    ? $note['tags']
                    : array_values(array_filter(array_map('trim', explode(',', $tags))));

                $savedFiles[] = [
                    'id' => 'note_' . ($index + 1),
                    'title' => $title,
                    'name' => $filename,
                    'url' => $fileUrl,
                    'vault_id' => $uploadFolderId,
                    'category' => $category,
                    'tags' => $parsedTags,
                    'content' => $content,
                    'size' => strlen($content),
                ];

                $formattedMarkdown .= "## " . $title . "\n";
                if (!empty($category)) {
                    $formattedMarkdown .= "**Category:** " . $category . "\n";
                }
                if (!empty($tags)) {
                    $formattedMarkdown .= "**Tags:** " . $tags . "\n";
                }
                $formattedMarkdown .= "\n" . $content . "\n\n---\n\n";
            }

            // 2. Prepare AISearchHistory database record
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

            $messageId = $request->input('message_id');
            $existingRecord = null;

            if ($messageId) {
                $existingRecord = AISearchHistory::find($messageId);
                if ($existingRecord && !$this->isMessageOwner($existingRecord)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized to edit this note',
                    ], 403);
                }
            }

            $usageData = $request->input('usage');
            if (empty($usageData) && $conversationId) {
                $lastAiMsg = AISearchHistory::where('conversation_id', $conversationId)
                    ->whereNotNull('usage')
                    ->orderBy('id', 'desc')
                    ->first();
                if ($lastAiMsg && !empty($lastAiMsg->usage)) {
                    $usageData = $lastAiMsg->usage;
                }
            }

            $totalTokens = 0;
            if (is_array($usageData)) {
                $totalTokens = $usageData['total_tokens'] ?? (($usageData['prompt_tokens'] ?? 0) + ($usageData['completion_tokens'] ?? 0));
            } elseif (is_string($usageData)) {
                $decoded = json_decode($usageData, true);
                if (is_array($decoded)) {
                    $totalTokens = $decoded['total_tokens'] ?? (($decoded['prompt_tokens'] ?? 0) + ($decoded['completion_tokens'] ?? 0));
                }
            }

            $position = null;
            if ($parentMessage) {
                $position = ($parentMessage->position ?? 0) + 1;
                AISearchHistory::where('conversation_id', $conversationId)
                    ->where('position', '>=', $position)
                    ->increment('position');
            } else {
                $maxPosition = AISearchHistory::where('conversation_id', $conversationId)->max('position');
                $position = ($maxPosition !== null) ? ($maxPosition + 1) : 0;
            }

            $wikiData = [
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'content_type' => 'social',
                'thread_id' => 'obsidian_' . Str::random(16),
                'query' => $formattedMarkdown,
                'response' => "Obsidian Vault saved with " . count($notes) . " notes. Files stored in `/uploads/Obsidian/{$uploadFolderId}/`.",
                'file_data' => $savedFiles,
                'sources' => ['obsidian_wiki'],
                'status' => $conversationStatus,
                'position' => $position,
                'media_count' => count($savedFiles),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
                'usage' => $usageData,
                'total_tokens' => $totalTokens,
                'social_media_metadata' => [
                    'format' => 'markdown',
                    'is_obsidian_vault' => true,
                    'vault_id' => $uploadFolderId,
                    'note_count' => count($notes),
                    'vault_title' => 'Obsidian Wiki Vault',
                ]
            ];

            if ($existingRecord) {
                $oldMeta = $existingRecord->social_media_metadata;
                if (is_string($oldMeta)) {
                    $oldMeta = json_decode($oldMeta, true) ?? [];
                }
                if (!is_array($oldMeta)) {
                    $oldMeta = [];
                }

                $updatedMeta = array_merge($oldMeta, [
                    'format' => 'markdown',
                    'is_obsidian_vault' => true,
                    'vault_id' => $uploadFolderId,
                    'note_count' => count($notes),
                    'vault_title' => 'Obsidian Wiki Vault',
                ]);

                $updateData = [
                    'query' => $formattedMarkdown,
                    'response' => "Obsidian Vault updated with " . count($notes) . " notes. Files stored in `/uploads/Obsidian/{$uploadFolderId}/`.",
                    'file_data' => $savedFiles,
                    'sources' => ['obsidian_wiki'],
                    'media_count' => count($savedFiles),
                    'social_media_metadata' => $updatedMeta,
                ];

                if ($usageData !== null) {
                    $updateData['usage'] = $usageData;
                    $updateData['total_tokens'] = $totalTokens;
                }

                $existingRecord->update($updateData);

                $wikiMessage = $existingRecord;
            } else {
                if ($customSlug && !$conversationId && AISearchHistory::isSlugAvailable($customSlug)) {
                    $wikiData['slug'] = AISearchHistory::cleanSlugForUrl($customSlug);
                }

                $wikiMessage = AISearchHistory::create($wikiData);

                if (!$conversationId) {
                    $title = "Obsidian Wiki Vault (" . count($notes) . " Notes)";
                    AISearchHistory::where('conversation_id', $wikiMessage->conversation_id)
                        ->update(['conversation_title' => $title]);
                }
            }

            // Get the updated conversation messages
            $conversationMessages = $this->getFilteredConversationMessages($wikiMessage->conversation_id);

            // Format messages for response
            $formattedMessages = collect($conversationMessages)->map(function ($message) {
                if (is_array($message)) {
                    $message = (object) $message;
                }

                return AISearchHistory::formatMessageForDisplay($message);
            })->values()->toArray();

            // Calculate conversation cost and tokens
            $conversationTokens = $this->calculateConversationTokens($wikiMessage->conversation_id);
            $conversationCost = $this->calculateConversationCost($wikiMessage->conversation_id);

            DB::commit();

            Log::info('Obsidian Wiki Vault saved successfully', [
                'slug' => $wikiMessage->slug,
                'note_count' => count($notes),
                'saved_files' => count($savedFiles),
                'conversation_id' => $wikiMessage->conversation_id,
            ]);

            // Return full conversation data for dynamic update
            return response()->json([
                'success' => true,
                'message' => 'Obsidian Wiki vault stored successfully',
                'slug' => $wikiMessage->slug,
                'conversation_id' => $wikiMessage->conversation_id,
                'conversation_title' => $wikiMessage->conversation_title,
                'file_urls' => array_column($savedFiles, 'url'),
                'conversation_messages' => $formattedMessages,
                'conversation_cost' => $conversationCost,
                'conversation_tokens' => $conversationTokens,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store Obsidian Wiki: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to store Obsidian Wiki: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store Wiki content in AISearchHistory with files in upload/wiki
     */
    public function storeWiki(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string',
            'content' => 'nullable|string',
            'notes' => 'nullable|array',
            'notes.*.title' => 'nullable|string',
            'notes.*.content' => 'nullable|string',
            'notes.*.category' => 'nullable|string',
            'notes.*.tags' => 'nullable|array',
            'custom_slug' => 'nullable|string|max:100',
            'parent_slug' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'message_id' => 'nullable',
            'usage' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $title = $request->input('title');
        $content = $request->input('content');
        $notes = $request->input('notes', []);
        $customSlug = $request->input('custom_slug');
        $parentSlug = $request->input('parent_slug');
        $conversationId = $request->input('conversation_id');

        if (empty($notes) && (!empty($content) || !empty($title))) {
            $notes = [
                [
                    'title' => $title ?: 'Wiki Page',
                    'content' => $content ?: '',
                    'category' => 'WIKI',
                    'tags' => ['wiki', 'documentation']
                ]
            ];
        }

        if (empty($notes)) {
            return response()->json([
                'success' => false,
                'message' => 'No Wiki content provided',
            ], 400);
        }

        $parentMessage = null;
        if ($parentSlug) {
            $parentMessage = AISearchHistory::where('slug', urldecode($parentSlug))->first();
            if ($parentMessage && !$conversationId) {
                $conversationId = $parentMessage->conversation_id;
            }
        }

        DB::beginTransaction();

        try {
            $userId = Auth::id() ?? 0;
            $uploadFolderId = 'wiki_' . ($userId ? 'user_' . $userId . '_' : '') . time() . '_' . Str::random(6);

            $wikiDir = public_path('upload/wiki/' . $uploadFolderId);
            if (!file_exists($wikiDir)) {
                @mkdir($wikiDir, 0755, true);
            }

            $uploadsWikiDir = public_path('uploads/wiki/' . $uploadFolderId);
            if (!file_exists($uploadsWikiDir)) {
                @mkdir($uploadsWikiDir, 0755, true);
            }

            $storageWikiDir = storage_path('app/public/upload/wiki/' . $uploadFolderId);
            if (!file_exists($storageWikiDir)) {
                @mkdir($storageWikiDir, 0755, true);
            }

            $savedFiles = [];
            $formattedMarkdown = "";

            foreach ($notes as $index => $note) {
                $noteTitle = trim($note['title'] ?? ($title ?: 'Wiki Note ' . ($index + 1)));
                $noteContent = $note['content'] ?? '';
                $category = $note['category'] ?? 'WIKI';
                $tags = isset($note['tags']) && is_array($note['tags']) ? implode(', ', $note['tags']) : '';

                $safeFilename = Str::slug($noteTitle, '_');
                if (empty($safeFilename)) {
                    $safeFilename = 'wiki_' . ($index + 1);
                }
                $filename = $safeFilename . '.md';
                $filePath = $wikiDir . '/' . $filename;

                @file_put_contents($filePath, $noteContent);
                @file_put_contents($uploadsWikiDir . '/' . $filename, $noteContent);

                if (file_exists($storageWikiDir)) {
                    @file_put_contents($storageWikiDir . '/' . $filename, $noteContent);
                }

                $fileUrl = '/upload/wiki/' . $uploadFolderId . '/' . $filename;
                $parsedTags = isset($note['tags']) && is_array($note['tags'])
                    ? $note['tags']
                    : array_values(array_filter(array_map('trim', explode(',', $tags))));

                $savedFiles[] = [
                    'id' => 'wiki_' . ($index + 1),
                    'title' => $noteTitle,
                    'name' => $filename,
                    'url' => $fileUrl,
                    'wiki_id' => $uploadFolderId,
                    'category' => $category,
                    'tags' => $parsedTags,
                    'content' => $noteContent,
                    'size' => strlen($noteContent),
                ];

                if (count($notes) > 1) {
                    $formattedMarkdown .= "## " . $noteTitle . "\n\n";
                }
                $formattedMarkdown .= $noteContent . "\n\n";
            }

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

            $messageId = $request->input('message_id');
            $existingRecord = null;
            if ($messageId) {
                $existingRecord = AISearchHistory::find($messageId);
                if ($existingRecord && !$this->isMessageOwner($existingRecord)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized to edit this wiki',
                    ], 403);
                }
            }

            $firstNoteTitle = $notes[0]['title'] ?? $title ?? 'Wiki Document';
            $wikiData = [
                'user_id' => Auth::id(),
                'conversation_id' => $conversationId,
                'parent_id' => $parentMessage ? $parentMessage->id : null,
                'message_role' => 'user',
                'content_type' => 'social',
                'thread_id' => 'wiki_' . Str::random(16),
                'query' => trim($formattedMarkdown),
                'response' => "Wiki saved with " . count($notes) . " note(s). Files stored in `/upload/wiki/{$uploadFolderId}/`.",
                'file_data' => $savedFiles,
                'sources' => ['wiki'],
                'status' => $conversationStatus,
                'media_count' => count($savedFiles),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => Session::getId(),
                'social_media_metadata' => [
                    'format' => 'markdown',
                    'is_wiki' => true,
                    'wiki_id' => $uploadFolderId,
                    'note_count' => count($notes),
                    'wiki_title' => $firstNoteTitle,
                ]
            ];

            if ($existingRecord) {
                $existingRecord->update([
                    'query' => trim($formattedMarkdown),
                    'response' => "Wiki updated with " . count($notes) . " note(s). Files stored in `/upload/wiki/{$uploadFolderId}/`.",
                    'file_data' => $savedFiles,
                    'sources' => ['wiki'],
                    'media_count' => count($savedFiles),
                ]);
                $wikiMessage = $existingRecord;
            } else {
                if ($customSlug && AISearchHistory::isSlugAvailable($customSlug)) {
                    $wikiData['slug'] = AISearchHistory::cleanSlugForUrl($customSlug);
                }
                $wikiMessage = AISearchHistory::create($wikiData);

                if (!$conversationId) {
                    AISearchHistory::where('conversation_id', $wikiMessage->conversation_id)
                        ->update(['conversation_title' => $firstNoteTitle]);
                }
            }

            // Retrieve updated conversation messages
            $conversationMessages = AISearchHistory::where('conversation_id', $wikiMessage->conversation_id)
                ->with('user')
                ->orderBy('created_at', 'asc')
                ->get();

            $formattedMessages = $conversationMessages->map(function ($message) {
                return AISearchHistory::formatMessageForDisplay($message);
            })->values()->toArray();

            // Calculate conversation cost and tokens
            $conversationTokens = $this->calculateConversationTokens($wikiMessage->conversation_id);
            $conversationCost = $this->calculateConversationCost($wikiMessage->conversation_id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Wiki saved successfully to AISearchHistory DB',
                'slug' => $wikiMessage->slug,
                'conversation_id' => $wikiMessage->conversation_id,
                'conversation_title' => $wikiMessage->conversation_title ?? $firstNoteTitle,
                'file_urls' => array_column($savedFiles, 'url'),
                'conversation_messages' => $formattedMessages,
                'conversation_cost' => $conversationCost,
                'conversation_tokens' => $conversationTokens,
                'data' => $wikiMessage,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store Wiki: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to store Wiki: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload media file (video, audio, pdf, html, md, image) for Wiki into upload/wiki
     */
    public function uploadWikiFile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:204800', // max 200MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            if (!$extension) {
                $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            }

            $userId = Auth::id() ?? 0;
            $safeName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME), '_');
            if (empty($safeName)) {
                $safeName = 'media';
            }
            $filename = 'wiki_' . ($userId ? 'user_' . $userId . '_' : '') . time() . '_' . Str::random(6) . '_' . $safeName . '.' . $extension;

            $targetDir = public_path('upload/wiki');
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0755, true);
            }

            $uploadsTargetDir = public_path('uploads/wiki');
            if (!file_exists($uploadsTargetDir)) {
                @mkdir($uploadsTargetDir, 0755, true);
            }

            $storageTargetDir = storage_path('app/public/upload/wiki');
            if (!file_exists($storageTargetDir)) {
                @mkdir($storageTargetDir, 0755, true);
            }

            $file->move($targetDir, $filename);

            @copy($targetDir . '/' . $filename, $uploadsTargetDir . '/' . $filename);
            if (file_exists($storageTargetDir)) {
                @copy($targetDir . '/' . $filename, $storageTargetDir . '/' . $filename);
            }

            $publicUrl = '/upload/wiki/' . $filename;

            return response()->json([
                'success' => true,
                'message' => 'File uploaded to upload/wiki successfully',
                'url' => $publicUrl,
                'filename' => $originalName,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);

        } catch (\Exception $e) {
            Log::error('Wiki file upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload Wiki file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate conversation cost
     *
     * @param string $conversationId
     * @return float
     */
    private function calculateConversationCost(string $conversationId): float
    {
        $tokens = AISearchHistory::where('conversation_id', $conversationId)
            ->where('status', '!=', 'hidden')
            ->sum('total_tokens');
        return ($tokens / 1000) * 0.01;
    }

    /**
     * Calculate conversation tokens
     *
     * @param string $conversationId
     * @return int
     */
    private function calculateConversationTokens(string $conversationId): int
    {
        return AISearchHistory::where('conversation_id', $conversationId)
            ->where('status', '!=', 'hidden')
            ->sum('total_tokens');
    }

    /**
     * AI Auto-Pilot: Enrich an Obsidian Wiki note automatically using Kimi AI (Moonshot) or Gemini AI
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function autoPilotObsidianNote(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'note' => 'required|array',
            'note.title' => 'required|string',
            'note.content' => 'nullable|string',
            'note.category' => 'nullable|string',
            'note.tags' => 'nullable|array',
            'vault_notes' => 'nullable|array',
            'mode' => 'nullable|string',
            'instructions' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'message_id' => 'nullable',
            'model' => 'nullable|string', // Added model parameter
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $note = $request->input('note');
        $vaultNotes = $request->input('vault_notes', []);
        $mode = $request->input('mode', 'auto_pilot');
        $instructions = $request->input('instructions', '');
        $selectedModel = $request->input('model', 'kimi-k3');

        // Get model configuration
        $modelConfig = $this->getModelConfig($selectedModel);

        $vaultTitles = array_map(function ($n) {
            return is_array($n) ? ($n['title'] ?? '') : (string)$n;
        }, $vaultNotes);
        $vaultTitlesStr = implode(', ', array_filter($vaultTitles));

        $rawNoteContent = $note['content'] ?? '';
        $mediaMap = [];
        $mediaCounter = 0;

        // Replace large media embeds with placeholders
        $sanitizedNoteContent = preg_replace_callback(
            '/(!\[[^\]]*\]\((?:data:[^\)]+|https?:\/\/[^\)]+|\/[^\)]+)\)|<iframe[^>]*>.*?<\/iframe>|<iframe[^>]*\/>|<video[^>]*>.*?<\/video>|<video[^>]*\/>|<audio[^>]*>.*?<\/audio>|<audio[^>]*\/>|<img[^>]*\/?>|data:(?:image|application|video|audio|text\/html)[^;\s,\)]+;base64,[a-zA-Z0-9+\/=\s]+)/is',
            function ($match) use (&$mediaMap, &$mediaCounter) {
                $token = "__MEDIA_FILE_EMBED_" . ($mediaCounter++) . "__";
                $mediaMap[$token] = $match[0];
                return $token;
            },
            $rawNoteContent
        );

        $systemPrompt = "You are the AI Auto-Pilot & Note Enrichment Engine for Obsidian Wiki in EZWiki powered by " .
            ucfirst($modelConfig['provider']) . " AI (" . $modelConfig['model_name'] . "). " .
            "Your goal is to analyze, expand, enrich, auto-link, and structure the written text content of an Obsidian markdown note into a connected knowledge base document.\n\n" .
            "CRITICAL MEDIA PRESERVATION DIRECTIVE:\n" .
            "- Upgrade and improve ONLY written note text content (markdown text, concepts, headings, callouts, wikilinks, explanations).\n" .
            "- Keep all `__MEDIA_FILE_EMBED_X__` placeholders EXACTLY AS THEY ARE in their respective positions in the text.\n" .
            "- DO NOT attempt to rewrite, modify, reformat, or strip any embedded media or file placeholders.\n" .
            "- You MUST return strictly a single valid JSON object.";

        $userPrompt = "Current Note Title: " . $note['title'] . "\n";
        $userPrompt .= "Current Category: " . ($note['category'] ?? 'GENERAL') . "\n";
        $userPrompt .= "Current Tags: " . (is_array($note['tags'] ?? null) ? implode(', ', $note['tags']) : ($note['tags'] ?? '#obsidian')) . "\n";
        $userPrompt .= "Current Note Content:\n" . $sanitizedNoteContent . "\n\n";

        if ($vaultTitlesStr) {
            $userPrompt .= "Other Notes Existing in Vault: [" . $vaultTitlesStr . "]\n\n";
        }

        if ($instructions) {
            $userPrompt .= "User Specific Instructions: " . $instructions . "\n\n";
        }

        $userPrompt .= "CRITICAL RULE FOR EMBEDDED FILES & MEDIA:\n";
        $userPrompt .= "Only upgrade and improve text notes. Do NOT alter or remove any embedded files, images, videos, audio clips, HTML embeds, or `data:text/html...` data URIs in the content. Retain every `![alt](url)` or `<iframe...>` intact.\n\n";

        $userPrompt .= "Auto-Pilot Directives (Mode: " . strtoupper($mode) . "):\n";
        switch (strtolower($mode)) {
            case 'autolink':
            case 'autolink_vault':
            case 'auto-link':
                $userPrompt .= "1. Intelligently scan the note content and identify all key concepts, technical terms, entity names, topics, and references to existing or prospective vault notes.\n";
                $userPrompt .= "2. Convert them into bidirectional Obsidian Wikilinks: `[[Note Title]]` or `[[Note Title|Display Name]]`.\n";
                $userPrompt .= "3. Actively connect words/phrases to existing vault notes where applicable: [" . $vaultTitlesStr . "]. Also create new Wikilinks for important concepts to expand the knowledge graph.\n";
                $userPrompt .= "4. Maintain the original text structure, paragraphs, and detail, but weave in extensive Wikilinks throughout the document.\n";
                $userPrompt .= "5. Return refined category (UPPERCASE) and relevant tags (prefixed with `#`).\n\n";
                break;

            case 'summarize':
            case 'summary':
                $userPrompt .= "1. Analyze the full note content and generate a concise, high-value AI Executive Summary.\n";
                $userPrompt .= "2. Place an Obsidian Callout block at the very top of the note content: `> [!SUMMARY] AI EXECUTIVE SUMMARY\\n> [Clear 2-3 sentence overview of the document]`.\n";
                $userPrompt .= "3. Follow the summary callout with a `### 📌 Key Takeaways` section with bullet points highlighting core insights.\n";
                $userPrompt .= "4. Retain and properly structure the full original document details below the summary.\n";
                $userPrompt .= "5. Convert main concepts into `[[Wikilinks]]` and suggest appropriate category and tags.\n\n";
                break;

            case 'callouts':
                $userPrompt .= "1. Transform key points, warnings, tips, takeaways, and notes in the document into rich Obsidian Callout blocks (`> [!NOTE]`, `> [!TIP]`, `> [!INFO]`, `> [!WARNING]`, `> [!SUMMARY]`, `> [!IMPORTANT]`, `> [!EXAMPLE]`).\n";
                $userPrompt .= "2. Improve visual organization and readability with callouts without deleting core information.\n";
                $userPrompt .= "3. Keep existing `[[Wikilinks]]` and add new relevant Wikilinks.\n\n";
                break;

            case 'subtopics':
                $userPrompt .= "1. Focus heavily on discovering and generating 3 to 5 related sub-topic or stub notes that connect to this document.\n";
                $userPrompt .= "2. Add `[[Sub-Topic Title]]` wikilinks into the main document where appropriate.\n";
                $userPrompt .= "3. Provide a complete JSON array for `suggested_new_notes` with title, category, tags, and initial draft content for each new note.\n\n";
                break;

            case 'create_from_topic':
            case 'create_note':
            case 'ask_ai':
                $userPrompt .= "1. Create a brand-new, highly detailed, well-structured Obsidian Wiki note from scratch based on the requested topic title: '" . $note['title'] . "'.\n";
                $userPrompt .= "2. Start with an H1 heading `# " . $note['title'] . "`, followed by an Obsidian Callout (`> [!NOTE] Key Concept\\n> ...` or `> [!SUMMARY] Overview\\n> ...`).\n";
                $userPrompt .= "3. Include rich structured sections with H2/H3 headings, clear explanations, bullet points, key takeaways, code blocks or tables if relevant.\n";
                $userPrompt .= "4. Convert key terms and concepts into bidirectional Wikilinks `[[Note Title]]` or `[[Note Title|Display Name]]` throughout the text.\n";
                $userPrompt .= "5. Provide 2 to 3 related sub-topic notes in `suggested_new_notes` (with title, category, tags, and full draft content) to build an instant knowledge base graph.\n";
                $userPrompt .= "6. Assign an appropriate UPPERCASE category (e.g. PROGRAMMING, SCIENCE, BUSINESS, HEALTH, STRATEGY, RESEARCH, DESIGN, GUIDES, NOTES) and relevant `#tags`.\n\n";
                break;

            case 'auto_pilot':
            default:
                $userPrompt .= "1. Deepen and enrich the content with thorough explanations, structured bullet points, key takeaways, and code/table blocks where appropriate.\n";
                $userPrompt .= "2. Incorporate rich Obsidian Callouts (`> [!NOTE]`, `> [!TIP]`, `> [!INFO]`, `> [!WARNING]`, `> [!SUMMARY]`, `> [!IMPORTANT]`) for critical takeaways.\n";
                $userPrompt .= "3. Convert key terms and concepts into bidirectional Wikilinks `[[Note Title]]` or `[[Note Title|Display Name]]`. Connect to existing vault notes if mentioned!\n";
                $userPrompt .= "4. Suggest 2 to 3 related sub-topic or stub notes (title, category, tags, short content draft) that should be added to the vault to grow the knowledge graph.\n";
                $userPrompt .= "5. Return refined category (UPPERCASE) and tags (prefixed with `#`).\n\n";
                break;
        }

        $userPrompt .= "IMPORTANT: Return strictly valid JSON object without any outer text or markdown wrapper outside the JSON:\n";
        $userPrompt .= "{\n";
        $userPrompt .= "  \"title\": \"Refined Title\",\n";
        $userPrompt .= "  \"category\": \"CATEGORY\",\n";
        $userPrompt .= "  \"tags\": [\"#tag1\", \"#tag2\"],\n";
        $userPrompt .= "  \"content\": \"Full enriched Obsidian Markdown content...\",\n";
        $userPrompt .= "  \"suggested_new_notes\": [\n";
        $userPrompt .= "    {\n";
        $userPrompt .= "      \"title\": \"Sub-Topic Title\",\n";
        $userPrompt .= "      \"category\": \"CATEGORY\",\n";
        $userPrompt .= "      \"tags\": [\"#tag\"],\n";
        $userPrompt .= "      \"content\": \"# Sub-Topic Title\\n\\nShort draft...\"\n";
        $userPrompt .= "    }\n";
        $userPrompt .= "  ],\n";
        $userPrompt .= "  \"enrichment_summary\": \"Summary of AI Auto-Pilot enrichments performed.\"\n";
        $userPrompt .= "}";

        // Check if API key is available
        if (empty($modelConfig['api_key'])) {
            Log::warning('API key missing for model: ' . $selectedModel);

            return response()->json([
                'success' => false,
                'message' => 'API key not configured for ' . ucfirst($modelConfig['provider']) . ' (' . $selectedModel . '). Please add the API key to your .env file.',
                'model' => $selectedModel,
                'provider' => $modelConfig['provider'],
            ], 500);
        }

        return $this->callModelApi($modelConfig, $systemPrompt, $userPrompt, $note, $mediaMap, $request);
    }

    /**
     * Attempts to parse JSON from AI response, automatically repairing truncated JSON structures
     */
    private function repairTruncatedJson(string $rawContent): ?array
    {
        $json = trim($rawContent);
        $json = preg_replace('/^```(?:json)?\s*/i', '', $json);
        $json = preg_replace('/\s*```$/i', '', $json);
        $json = trim($json);

        if (!str_starts_with($json, '{')) {
            $firstBrace = strpos($json, '{');
            if ($firstBrace !== false) {
                $json = substr($json, $firstBrace);
            }
        }

        // Direct json_decode
        $decoded = json_decode($json, true);
        if (is_array($decoded) && isset($decoded['content']) && !empty($decoded['content'])) {
            return $decoded;
        }

        // Fix unescaped literal line breaks
        $fixedControlChars = preg_replace_callback('/"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"/s', function ($m) {
            return '"' . str_replace(["\r\n", "\n", "\r", "\t"], ["\\n", "\\n", "\\n", "\\t"], $m[1]) . '"';
        }, $json);

        $decoded = json_decode($fixedControlChars, true);
        if (is_array($decoded) && isset($decoded['content']) && !empty($decoded['content'])) {
            return $decoded;
        }

        // Attempt JSON repair for truncated response
        $repaired = $fixedControlChars ?: $json;

        // Fix unclosed quotes
        $quoteCount = 0;
        $inEscape = false;
        $len = strlen($repaired);
        for ($i = 0; $i < $len; $i++) {
            $char = $repaired[$i];
            if ($inEscape) {
                $inEscape = false;
                continue;
            }
            if ($char === '\\') {
                $inEscape = true;
                continue;
            }
            if ($char === '"') {
                $quoteCount++;
            }
        }

        if ($quoteCount % 2 !== 0) {
            $repaired .= '"';
        }

        // Fix unclosed brackets
        $openCurly = 0;
        $openSquare = 0;
        $inString = false;
        $inEscape = false;
        $repairedLen = strlen($repaired);

        for ($i = 0; $i < $repairedLen; $i++) {
            $char = $repaired[$i];
            if ($inEscape) {
                $inEscape = false;
                continue;
            }
            if ($char === '\\') {
                $inEscape = true;
                continue;
            }
            if ($char === '"') {
                $inString = !$inString;
                continue;
            }
            if (!$inString) {
                if ($char === '{') $openCurly++;
                elseif ($char === '}') $openCurly = max(0, $openCurly - 1);
                elseif ($char === '[') $openSquare++;
                elseif ($char === ']') $openSquare = max(0, $openSquare - 1);
            }
        }

        for ($i = 0; $i < $openSquare; $i++) {
            $repaired .= ']';
        }
        for ($i = 0; $i < $openCurly; $i++) {
            $repaired .= '}';
        }

        $decodedRepaired = json_decode($repaired, true);
        if (is_array($decodedRepaired) && isset($decodedRepaired['content']) && !empty($decodedRepaired['content'])) {
            return $decodedRepaired;
        }

        // Fallback Regex Extraction
        $result = [];

        if (preg_match('/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/s', $rawContent, $m)) {
            $result['title'] = stripcslashes($m[1]);
        }

        if (preg_match('/"category"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/s', $rawContent, $m)) {
            $result['category'] = stripcslashes($m[1]);
        }

        if (preg_match('/"tags"\s*:\s*\[(.*?)\]/s', $rawContent, $m)) {
            preg_match_all('/"#?[a-zA-Z0-9_\-\/]+"/i', $m[1], $tagMatches);
            if (!empty($tagMatches[0])) {
                $result['tags'] = array_map(function ($t) {
                    return trim($t, '"');
                }, $tagMatches[0]);
            }
        }

        if (preg_match('/"content"\s*:\s*"(.*)/s', $rawContent, $m)) {
            $contentRaw = $m[1];
            if (preg_match('/^(.*?)(?<!\\\\)"\s*,\s*"(?:suggested_new_notes|enrichment_summary|tags|category|title)"/s', $contentRaw, $cm)) {
                $contentRaw = $cm[1];
            } else {
                $contentRaw = preg_replace('/(?<!\\\\)"\s*\}\s*$/s', '', $contentRaw);
            }
            $contentClean = str_replace(['\\"', '\\n', '\\r', '\\t', '\\\\'], ['"', "\n", "\r", "\t", '\\'], $contentRaw);
            $result['content'] = trim($contentClean);
        }

        if (isset($result['content']) && !empty($result['content'])) {
            Log::info('Successfully recovered truncated JSON via Regex Fallback Extractor!');
            return $result;
        }

        Log::warning('AI returned unparseable JSON raw content: ' . substr($rawContent, 0, 500));
        return null;
    }

    /**
     * Preserves and restores any embedded files/media
     */
    private function restoreOriginalMediaEmbeds(string $originalContent, string $enrichedContent, array $mediaMap = []): string
    {
        if (empty($originalContent)) {
            return $enrichedContent;
        }

        // Replace placeholder tokens
        if (!empty($mediaMap)) {
            foreach ($mediaMap as $token => $originalEmbed) {
                if (str_contains($enrichedContent, $token)) {
                    $enrichedContent = str_replace($token, $originalEmbed, $enrichedContent);
                } else {
                    $enrichedContent .= "\n\n" . $originalEmbed;
                }
            }
        }

        // Check for missing embeds
        preg_match_all('/(!\[[^\]]*\]\((?:data:[^\)]+|https?:\/\/[^\)]+|\/[^\)]+)\)|<iframe[^>]*>.*?<\/iframe>|<video[^>]*>.*?<\/video>|<audio[^>]*>.*?<\/audio>)/is', $originalContent, $matches);

        if (!empty($matches[0])) {
            $missingEmbeds = [];
            foreach ($matches[0] as $embedItem) {
                $embedTrimmed = trim($embedItem);
                if ($embedTrimmed !== '' && !str_contains($enrichedContent, $embedTrimmed)) {
                    $missingEmbeds[] = $embedTrimmed;
                }
            }

            if (!empty($missingEmbeds)) {
                $enrichedContent .= "\n\n" . implode("\n\n", $missingEmbeds);
            }
        }

        return $enrichedContent;
    }

    /**
     * Get AI model configuration based on selected model
     */
    private function getModelConfig(string $model): array
    {
        $configs = [
            // Kiwi K3 (Moonshot/Kimi)
            'kimi-k3' => [
                'provider' => 'moonshot',
                'api_key' => config('services.moonshot.api_key', env('MOONSHOT_API_KEY')),
                'base_url' => config('services.moonshot.base_url', 'https://api.moonshot.ai/v1'),
                'endpoint' => '/chat/completions',
                'model_name' => 'kimi-k3',
                'max_tokens' => 400096,
                'temperature' => 0.6,
                'supports_thinking' => true,
                'supports_json' => true,
            ],
            // GPT-4o (OpenAI)
            'gpt-4o' => [
                'provider' => 'openai',
                'api_key' => config('services.openai.api_key', env('OPENAI_API_KEY')),
                'base_url' => config('services.openai.base_url', 'https://api.openai.com/v1'),
                'endpoint' => '/chat/completions',
                'model_name' => 'gpt-4o',
                'max_tokens' => 16384,
                'temperature' => 0.6,
                'supports_thinking' => false,
                'supports_json' => true,
            ],
            // DeepSeek Chat
            'deepseek-chat' => [
                'provider' => 'deepseek',
                'api_key' => config('services.deepseek.api_key', env('DEEPSEEK_API_KEY')),
                'base_url' => config('services.deepseek.base_url', 'https://api.deepseek.com/v1'),
                'endpoint' => '/chat/completions',
                'model_name' => 'deepseek-chat',
                'max_tokens' => 393216,
                'temperature' => 0.6,
                'supports_thinking' => true,
                'supports_json' => false,
            ],
            // Sonar Pro (Perplexity)
            'sonar-pro' => [
                'provider' => 'perplexity',
                'api_key' => config('services.perplexity.api_key', env('PERPLEXITY_API_KEY')),
                'base_url' => config('services.perplexity.base_url', 'https://api.perplexity.ai'),
                'endpoint' => '/chat/completions',
                'model_name' => 'sonar-pro',
                'max_tokens' => 128000,
                'temperature' => 0.6,
                'supports_thinking' => false,
                'supports_json' => false,
            ],
            // Gemini 3 Flash Preview
            'gemini-3-flash-preview' => [
                'provider' => 'gemini',
                'api_key' => config('services.gemini.api_key', env('GEMINI_API_KEY')),
                'base_url' => config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'),
                'endpoint' => '/models/gemini-3-flash-preview:generateContent',
                'model_name' => 'gemini-3-flash-preview',
                'max_tokens' => 400096,
                'temperature' => 0.6,
                'supports_thinking' => false,
                'supports_json' => true,
            ],
        ];

        // Fallback to kimi-k3 if model not found
        return $configs[$model] ?? $configs['kimi-k3'];
    }

    /**
     * Call the appropriate model API based on configuration
     */
    private function callModelApi(array $modelConfig, string $systemPrompt, string $userPrompt, array $note, array $mediaMap, Request $request)
    {
        $provider = $modelConfig['provider'];
        $apiKey = $modelConfig['api_key'];
        $baseUrl = $modelConfig['base_url'];
        $endpoint = $modelConfig['endpoint'];
        $modelName = $modelConfig['model_name'];
        $maxTokens = $modelConfig['max_tokens'];
        $temperature = $modelConfig['temperature'];
        $supportsThinking = $modelConfig['supports_thinking'] ?? false;
        $supportsJson = $modelConfig['supports_json'] ?? false;

        try {
            $response = null;

            switch ($provider) {
                case 'moonshot':
                    $response = $this->callMoonshotApi($modelConfig, $systemPrompt, $userPrompt);
                    break;
                case 'openai':
                    $response = $this->callOpenAiApi($modelConfig, $systemPrompt, $userPrompt);
                    break;
                case 'deepseek':
                    $response = $this->callDeepSeekApi($modelConfig, $systemPrompt, $userPrompt);
                    break;
                case 'perplexity':
                    $response = $this->callPerplexityApi($modelConfig, $systemPrompt, $userPrompt);
                    break;
                case 'gemini':
                    $response = $this->callGeminiApi($modelConfig, $systemPrompt, $userPrompt);
                    break;
                default:
                    throw new \Exception('Unsupported AI provider: ' . $provider);
            }

            if (!$response || !$response->successful()) {
                $statusCode = $response ? $response->status() : 'unknown';
                $errorBody = $response ? $response->body() : 'No response';

                Log::error('API request failed for ' . $provider, [
                    'status' => $statusCode,
                    'body' => $errorBody,
                    'model' => $modelName,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => ucfirst($provider) . ' API request failed: ' . $errorBody,
                    'status_code' => $statusCode,
                    'model' => $modelName,
                    'provider' => $provider,
                ], 503);
            }

            $data = $response->json();
            $parsed = $this->parseModelResponse($provider, $data, $modelName);

            if (is_array($parsed) && isset($parsed['content'])) {
                // Restore media embeds
                $originalNoteContent = $note['content'] ?? '';
                $parsed['content'] = $this->restoreOriginalMediaEmbeds($originalNoteContent, $parsed['content'], $mediaMap);

                if (empty($parsed['enrichment_summary'])) {
                    $parsed['enrichment_summary'] = '✨ ' . ucfirst($provider) . ' AI (' . $modelName . ') Auto-Pilot enriched "' .
                        ($parsed['title'] ?? $note['title']) . '" with callouts, wikilinks & sub-topics!';
                }

                // Save usage data
                $usage = $this->extractUsageData($provider, $data);
                if ($usage) {
                    $messageId = $request->input('message_id');
                    $conversationId = $request->input('conversation_id');

                    if ($messageId) {
                        $historyRecord = AISearchHistory::find($messageId);
                        if ($historyRecord) {
                            $historyRecord->usage = $usage;
                            $historyRecord->total_tokens = $usage['total_tokens'] ?? 0;
                            $historyRecord->save();
                        }
                    } elseif ($conversationId) {
                        $historyRecord = AISearchHistory::where('conversation_id', $conversationId)
                            ->orderBy('id', 'desc')
                            ->first();
                        if ($historyRecord) {
                            $historyRecord->usage = $usage;
                            $historyRecord->total_tokens = $usage['total_tokens'] ?? 0;
                            $historyRecord->save();
                        }
                    }
                }

                return response()->json([
                    'success' => true,
                    'provider' => $provider,
                    'model' => $modelName,
                    'data' => $parsed,
                    'usage' => $usage,
                ]);
            }

            // If parsing failed, try to get content directly
            $content = $this->extractContentFromResponse($provider, $data);
            if ($content) {
                $parsed = $this->repairTruncatedJson($content);
                if (is_array($parsed) && isset($parsed['content'])) {
                    $parsed['content'] = $this->restoreOriginalMediaEmbeds(
                        $note['content'] ?? '',
                        $parsed['content'],
                        $mediaMap
                    );

                    return response()->json([
                        'success' => true,
                        'provider' => $provider,
                        'model' => $modelName,
                        'data' => $parsed,
                        'usage' => $this->extractUsageData($provider, $data),
                    ]);
                }
            }

            Log::error('Failed to parse response from ' . $provider, ['data' => $data]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse response from ' . ucfirst($provider) . '. Please try again.',
                'model' => $modelName,
                'provider' => $provider,
            ], 500);

        } catch (\Exception $e) {
            Log::error('API call error for ' . $provider . ': ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'model' => $modelName,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error calling ' . ucfirst($provider) . ' API: ' . $e->getMessage(),
                'model' => $modelName,
                'provider' => $provider,
            ], 500);
        }
    }

    /**
     * Call Moonshot (Kimi) API
     */
    private function callMoonshotApi(array $config, string $systemPrompt, string $userPrompt)
    {
        $endpoint = rtrim($config['base_url'], '/') . $config['endpoint'];
        $timeout = (int) config('services.moonshot.timeout', 60);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ];

        $requestData = [
            'model' => $config['model_name'],
            'messages' => $messages,
            'temperature' => $config['temperature'],
            'max_tokens' => $config['max_tokens'],
        ];

        // Try with response_format first (if supported)
        if ($config['supports_json']) {
            try {
                $response = Http::timeout($timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $config['api_key'],
                        'Content-Type' => 'application/json',
                    ])
                    ->post($endpoint, array_merge($requestData, [
                        'response_format' => ['type' => 'json_object'],
                    ]));

                if ($response->successful()) {
                    return $response;
                }
            } catch (\Exception $e) {
                Log::warning('Moonshot API with response_format failed: ' . $e->getMessage());
            }
        }

        // Try without response_format
        return Http::timeout($timeout)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $config['api_key'],
                'Content-Type' => 'application/json',
            ])
            ->post($endpoint, $requestData);
    }

    /**
     * Call OpenAI API
     */
    private function callOpenAiApi(array $config, string $systemPrompt, string $userPrompt)
    {
        $endpoint = rtrim($config['base_url'], '/') . $config['endpoint'];
        $timeout = 60;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ];

        $requestData = [
            'model' => $config['model_name'],
            'messages' => $messages,
            'temperature' => $config['temperature'],
            'max_tokens' => $config['max_tokens'],
            'response_format' => ['type' => 'json_object'],
        ];

        return Http::timeout($timeout)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $config['api_key'],
                'Content-Type' => 'application/json',
                'OpenAI-Beta' => 'assistants=v2',
            ])
            ->post($endpoint, $requestData);
    }

    /**
     * Call DeepSeek API
     */
    private function callDeepSeekApi(array $config, string $systemPrompt, string $userPrompt)
    {
        $endpoint = rtrim($config['base_url'], '/') . $config['endpoint'];
        $timeout = 60;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ];

        $requestData = [
            'model' => $config['model_name'],
            'messages' => $messages,
            'temperature' => $config['temperature'],
            'max_tokens' => $config['max_tokens'],
        ];

        return Http::timeout($timeout)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $config['api_key'],
                'Content-Type' => 'application/json',
            ])
            ->post($endpoint, $requestData);
    }

    /**
     * Call Perplexity API
     */
    private function callPerplexityApi(array $config, string $systemPrompt, string $userPrompt)
    {
        $endpoint = rtrim($config['base_url'], '/') . $config['endpoint'];
        $timeout = 60;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ];

        $requestData = [
            'model' => $config['model_name'],
            'messages' => $messages,
            'temperature' => $config['temperature'],
            'max_tokens' => $config['max_tokens'],
            'top_p' => 0.9,
        ];

        return Http::timeout($timeout)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $config['api_key'],
                'Content-Type' => 'application/json',
            ])
            ->post($endpoint, $requestData);
    }

    /**
     * Call Gemini API
     */
    private function callGeminiApi(array $config, string $systemPrompt, string $userPrompt)
    {
        $endpoint = rtrim($config['base_url'], '/') . $config['endpoint'] . '?key=' . $config['api_key'];
        $timeout = 60;

        $requestData = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $systemPrompt . "\n\n" . $userPrompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $config['temperature'],
                'maxOutputTokens' => $config['max_tokens'],
                'topP' => 0.95,
                'topK' => 40,
            ],
        ];

        return Http::timeout($timeout)
            ->withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->post($endpoint, $requestData);
    }

    /**
     * Parse response from different providers
     */
    private function parseModelResponse(string $provider, array $data, string $modelName): ?array
    {
        $content = $this->extractContentFromResponse($provider, $data);

        if (!$content) {
            return null;
        }

        // Try to parse JSON
        $parsed = $this->repairTruncatedJson($content);

        if (is_array($parsed) && isset($parsed['content'])) {
            return $parsed;
        }

        // Try to extract JSON from the content
        if (preg_match('/\{[^{}]*"content"\s*:\s*"[^"]*"\s*[^{}]*\}/s', $content, $match)) {
            $parsed = json_decode($match[0], true);
            if (is_array($parsed) && isset($parsed['content'])) {
                return $parsed;
            }
        }

        return null;
    }

    /**
     * Extract content from response based on provider
     */
    private function extractContentFromResponse(string $provider, array $data): ?string
    {
        switch ($provider) {
            case 'moonshot':
            case 'openai':
            case 'deepseek':
            case 'perplexity':
                return $data['choices'][0]['message']['content'] ?? null;

            case 'gemini':
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            default:
                return null;
        }
    }

    /**
     * Extract usage data from response based on provider
     */
    private function extractUsageData(string $provider, array $data): ?array
    {
        switch ($provider) {
            case 'moonshot':
            case 'openai':
            case 'deepseek':
            case 'perplexity':
                return $data['usage'] ?? null;

            case 'gemini':
                if (isset($data['usageMetadata'])) {
                    return [
                        'prompt_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                        'completion_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                        'total_tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                    ];
                }
                return null;

            default:
                return null;
        }
    }

    /**
     * Save GEO slug for a conversation
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function saveGeoslug(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'slug' => 'required|string|min:2|max:100',
            'conversation_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $slug = $request->input('slug');
        $conversationId = $request->input('conversation_id');

        // Clean the slug for URL use
        $cleanSlug = $request->input('slug');

        // Check if slug is available
        if (!AISearchHistory::isSlugAvailable($cleanSlug, $conversationId)) {
            return response()->json([
                'success' => false,
                'message' => 'This slug is already taken. Please choose another one.',
            ], 409);
        }

        try {
            DB::beginTransaction();

            if ($conversationId) {
                // Update existing conversation
                $updated = AISearchHistory::where('conversation_id', $conversationId)
                    ->update(['slug' => $cleanSlug]);

                if (!$updated) {
                    throw new \Exception('Failed to update conversation slug');
                }

                // Update the associated funnel if it exists
                $funnel = EzFunnel::where('aiid', function ($query) use ($conversationId) {
                    $query->select('id')
                        ->from('ai_search_histories')
                        ->where('conversation_id', $conversationId)
                        ->whereNull('parent_id')
                        ->limit(1);
                })->first();

                if ($funnel) {
                    // Update funnel's AI ID reference if needed
                    $firstMessage = AISearchHistory::where('conversation_id', $conversationId)
                        ->whereNull('parent_id')
                        ->first();

                    if ($firstMessage) {
                        $funnel->aiid = $firstMessage->id;
                        $funnel->save();
                    }
                }

                $message = 'GEO slug updated successfully!';
            } else {
                // Create a new conversation with the slug
                $conversationId = Str::uuid()->toString();

                $newConversation = AISearchHistory::create([
                    'user_id' => Auth::id(),
                    'conversation_id' => $conversationId,
                    'slug' => $cleanSlug,
                    'message_role' => 'user',
                    'content_type' => AISearchHistory::CONTENT_TYPE_AI,
                    'thread_id' => 'thread_' . Str::random(16),
                    'query' => "GEO Slug: " . $cleanSlug,
                    'response' => null,
                    'status' => 'public',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                    'conversation_title' => "GEO: " . $cleanSlug,
                ]);

                // Create a welcome/placeholder response
                AISearchHistory::create([
                    'user_id' => Auth::id(),
                    'conversation_id' => $conversationId,
                    'parent_id' => $newConversation->id,
                    'message_role' => 'assistant',
                    'content_type' => AISearchHistory::CONTENT_TYPE_AI,
                    'thread_id' => 'thread_' . Str::random(16),
                    'query' => $newConversation->query,
                    'response' => "✅ GEO slug **" . $cleanSlug . "** has been saved!\n\nStart adding content to your page by using the **Ask AI**, **Social & Upload**, or **Comments** sections above.",
                    'status' => 'public',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'session_id' => Session::getId(),
                ]);

                // Create funnel for this GEO slug
                $this->createFunnelForGeoslug($newConversation, $cleanSlug);

                $message = 'GEO slug saved successfully!';
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'slug' => $cleanSlug,
                'conversation_id' => $conversationId,
                'conversation_url' => url('/X/' . urlencode($cleanSlug)),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save GEO slug: ' . $e->getMessage(), [
                'slug' => $slug,
                'conversation_id' => $conversationId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save GEO slug: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create funnel for GEO slug
     *
     * @param AISearchHistory $conversation
     * @param string $slug
     * @return void
     */
    private function createFunnelForGeoslug(AISearchHistory $conversation, string $slug): void
    {
        $domainfull = idn_to_utf8('ez.wiki');
        $defaultpage = Defaultpage::whereHas('domain', function ($query) use ($domainfull) {
            $query->where('domain', $domainfull);
        })->first();

        if (!$defaultpage) {
            Log::warning('Default page not found for GEO slug funnel creation');
            return;
        }

        $userId = Auth::id() ?? 72;
        $title = "GEO: " . $slug;

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
            'image' => 'https://ez.wiki/X/' . urlencode($conversation->slug),
            'status' => 'active'
        ];

        $theme = Template::create($themeData);
        $themetemplate = $theme->id;

        // Clone funnel
        $clonedFunnel = $originalFunnel->replicate();
        $clonedFunnel->displaymode = 'ai';
        $clonedFunnel->user_id = $userId;
        $clonedFunnel->theme = $themetemplate;
        $clonedFunnel->aiid = $conversation->id;
        $clonedFunnel->save();

        // Clone theme collections
        if (!empty($originalFunnel->theme)) {
            $themeIds = array_filter(explode(',', $originalFunnel->theme));
            $existingThemes = Themecollection::where('user_id', $userId)
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

        Log::info('Funnel created for GEO slug', [
            'slug' => $slug,
            'conversation_id' => $conversation->conversation_id,
            'funnel_id' => $clonedFunnel->id,
            'user_id' => $userId,
        ]);
    }
}