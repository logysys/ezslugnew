<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\EzFunnelField;
use App\Models\EzFunnel;
use App\Models\Customdomain;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Gemini\Laravel\Facades\Gemini;

class OmniboxController extends Controller
{
    /**
     * Display the omnibox interface
     */
    public function index()
    {
        return Inertia::render('omnibox');
    }
    
    /**
     * Search across all models
     */
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        $limit = $request->input('limit', 15);
        $wordCount = str_word_count(trim($query));
        
        $geminiResults = null;
        
        // Use Gemini AI for natural language queries or longer searches
        if ($wordCount > 2) {
            $geminiResults = $this->getGeminiAssistance($query);
        }

        if (str_starts_with($query, '#')) {
            $hashtag = ltrim($query, '#');
            return $this->searchByHashtag($hashtag, $limit);
        }
        
        if (empty($query)) {
            return response()->json([
                'results' => [],
                'suggestions' => $this->getSmartSuggestions($query),
                'query' => $query,
                'total' => 0,
                'gemini_assistance' => null
            ]);
        }
        
        $results = collect();
        
        // 1. Search in EzFunnel token
        $funnelResults = EzFunnel::query()
            ->where('token', 'LIKE', "%{$query}%")->limit($limit)
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
        
        $results = $results->merge($funnelResults);
        
        // 2. Search in EzFunnelField unique_id, caption, and url
        $fieldResults = EzFunnelField::query()
            ->where(function($q) use ($query) {
                $q->where('unique_id', 'LIKE', "%{$query}%")
                  ->orWhere('caption', 'LIKE', "%{$query}%")
                  ->orWhere('url', 'LIKE', "%{$query}%")
                  ->orWhere('link_url', 'LIKE', "%{$query}%");
            })->limit($limit)
            ->get()
            ->map(function ($field) use ($query) {
                $score = $this->calculateRelevanceScore($field->unique_id ?? '', $query, 'field');
                
                // Adjust score based on other matches
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
        
        $results = $results->merge($fieldResults);
        
        // 3. Search in Customdomain domain and domainselected
        $customDomainResults = Customdomain::query()
            ->where(function($q) use ($query) {
                $q->where('domain', 'LIKE', "%{$query}%")
                  ->orWhere('domainselected', 'LIKE', "%{$query}%");
            })
            ->limit($limit)
            ->get()
            ->map(function ($domain) use ($query) {
                $score = $this->calculateRelevanceScore($domain->domain ?? '', $query, 'domain');
                
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
        
        $results = $results->merge($customDomainResults);
        
        // 4. Search in Domain domain and domainselected
        $domainResults = Domain::query()
            ->where(function($q) use ($query) {
                $q->where('domain', 'LIKE', "{$query}%")
                  ->orWhere('domain', 'LIKE', "%{$query}%")
                  ->orWhere('domainselected', 'LIKE', "%{$query}%");
            })
            ->limit($limit)
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
        
        $results = $results->merge($domainResults);
        
        // 5. Search in Theme unique_id and title
        $themeResults = Template::query()
            ->where(function($q) use ($query) {
                $q->where('unique_id', 'LIKE', "%{$query}%")
                  ->orWhere('title', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            })
            ->limit($limit)
            ->get()
            ->map(function ($theme) use ($query) {
                $score = $this->calculateRelevanceScore($theme->unique_id ?? '', $query, 'theme');
                
                // Adjust score based on title and description matches
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
        
        $results = $results->merge($themeResults);
        
        // Add Gemini AI suggestions if available
        if ($geminiResults && is_array($geminiResults)) {
            $geminiResults = collect($geminiResults)->map(function ($geminiResult, $index) {
                return [
                    'type' => 'ai_suggestion',
                    'id' => 'gemini_' . $index . '_' . time(),
                    'title' => 'AI Suggestion: ' . $geminiResult['title'],
                    'subtitle' => $geminiResult['suggestion'],
                    'url' => $geminiResult['url'] ?? null,
                    'action' => $geminiResult['action'] ?? 'search',
                    'query' => $geminiResult['search_query'] ?? null,
                    'score' => 95,
                    'color' => 'purple',
                    'icon' => '🤖',
                    'created_at' => now()->diffForHumans(),
                ];
            });
            
            $results = $results->merge($geminiResults);
        }
        
        // Sort by score (relevance) and then limit
        $sortedResults = $results
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->toArray();
        
        // Get smart suggestions
        $smartSuggestions = $this->getSmartSuggestions($query);
        
        return response()->json([
            'results' => $sortedResults,
            'suggestions' => $smartSuggestions,
            'query' => $query,
            'total' => count($sortedResults),
            'gemini_assistance' => $geminiResults ? true : false,
            'categories' => [
                'funnel' => count($funnelResults),
                'field' => count($fieldResults),
                'custom_domain' => count($customDomainResults),
                'domain' => count($domainResults),
                'theme' => count($themeResults),
                'ai_suggestion' => $geminiResults ? count($geminiResults) : 0,
            ]
        ]);
    }
    
    /**
     * Get Gemini AI assistance for the query
     */
    private function getGeminiAssistance(string $query): ?array
    {
        try {
            Log::info('Calling Gemini API for query: ' . $query);
            
            $prompt = "You are a helpful assistant for an omnibox search system. The user searched for: \"{$query}\"
            
            System context:
            - This is an omnibox that searches across: funnels, fields (content), domains, custom domains, themes, and social media
            - Funnels have tokens like X000001
            - Fields have IDs like F0001
            - Domains are website addresses
            - Themes are design templates
            
            Based on the user's query, provide 1-3 helpful suggestions. Each suggestion should include:
            1. A title describing what to search for
            2. A specific suggestion text
            3. Optionally a URL or search query to use
            
            Format your response as a JSON array of objects with these fields: title, suggestion, url (optional), action (optional), search_query (optional)
            
            Query analysis: \"{$query}\"";
            $response = Gemini::geminiPro()->generateContent($query);
            $text = $response->text();
            
            Log::info('Gemini raw response: ' . $text);
            
            // Try to extract JSON from the response
            $jsonStart = strpos($text, '[');
            $jsonEnd = strrpos($text, ']');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonString = substr($text, $jsonStart, $jsonEnd - $jsonStart + 1);
                $suggestions = json_decode($jsonString, true);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($suggestions)) {
                    return $suggestions;
                }
            }
            
            // Fallback: If no valid JSON, create smart suggestions based on query
            return $this->generateFallbackSuggestions($query);
            
        } catch (\Exception $e) {
            Log::error('Gemini API error: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Generate fallback suggestions when Gemini fails
     */
    private function generateFallbackSuggestions(string $query): array
    {
        $suggestions = [];
        $lowerQuery = strtolower($query);
        
        // Check for common patterns
        if (str_contains($lowerQuery, 'funnel') || str_contains($lowerQuery, 'sales')) {
            $suggestions[] = [
                'title' => 'Search for Funnels',
                'suggestion' => 'Try searching for funnels with tokens starting with X',
                'action' => 'search',
                'search_query' => 'X'
            ];
        }
        
        if (str_contains($lowerQuery, 'field') || str_contains($lowerQuery, 'content') || str_contains($lowerQuery, 'page')) {
            $suggestions[] = [
                'title' => 'Search for Content Fields',
                'suggestion' => 'Try searching for fields with IDs starting with F',
                'action' => 'search',
                'search_query' => 'F'
            ];
        }
        
        if (str_contains($lowerQuery, 'domain') || str_contains($lowerQuery, 'website') || str_contains($lowerQuery, 'url')) {
            $suggestions[] = [
                'title' => 'Search for Domains',
                'suggestion' => 'Try searching for registered domains',
                'action' => 'search',
                'search_query' => '.com'
            ];
        }
        
        if (str_contains($lowerQuery, 'theme') || str_contains($lowerQuery, 'design') || str_contains($lowerQuery, 'template')) {
            $suggestions[] = [
                'title' => 'Search for Themes',
                'suggestion' => 'Try searching for design themes and templates',
                'action' => 'search',
                'search_query' => 'theme'
            ];
        }
        
        if (str_contains($lowerQuery, 'social') || str_contains($lowerQuery, 'twitter') || str_contains($lowerQuery, 'facebook') || str_contains($lowerQuery, 'instagram')) {
            $suggestions[] = [
                'title' => 'Search Social Media',
                'suggestion' => 'Use #hashtag to search social media platforms',
                'action' => 'search',
                'search_query' => '#' . explode(' ', $query)[0]
            ];
        }
        
        // Default suggestion
        if (empty($suggestions)) {
            $suggestions[] = [
                'title' => 'AI Search Suggestion',
                'suggestion' => 'Try searching for specific items: X for funnels, F for fields, # for social media',
                'action' => 'help'
            ];
        }
        
        return $suggestions;
    }
    
    /**
     * Search by hashtag using SocialMediaSearchController
     */
    private function searchByHashtag($hashtag, $limit = 10)
    {
        Log::info('Starting hashtag search for: #' . $hashtag);
        
        try {
            // 直接使用 SocialMediaSearchController
            $socialSearchController = new SocialMediaSearchController();
            $request = new Request([
                'searchhashtag' => $hashtag,
                'count' => min($limit, 5)
            ]);
            
            Log::info('Calling SocialMediaSearchController');
            
            $socialResponse = $socialSearchController->searchByHashtag($request);
            $socialData = $socialResponse->getData(true);
            
            Log::info('Social media search response received');
            Log::info('Success status: ' . ($socialData['success'] ? 'true' : 'false'));
            Log::info('Tumblr results: ' . (is_array($socialData['tumblr'] ?? null) ? count($socialData['tumblr']) : 'not array'));
            Log::info('Pinterest results: ' . (is_array($socialData['pinterest'] ?? null) ? count($socialData['pinterest']) : 'not array'));
            Log::info('YouTube results: ' . (is_array($socialData['youtube'] ?? null) ? count($socialData['youtube']) : 'not array'));
            Log::info('Reddit results: ' . (is_array($socialData['reddit'] ?? null) ? count($socialData['reddit']) : 'not array'));
            
            // 检查是否成功
            if (!isset($socialData['success']) || !$socialData['success']) {
                throw new \Exception($socialData['message'] ?? 'Social media search failed');
            }
            
            // Transform social media results into omnibox format
            $results = collect();
            
            // Process Tumblr results
            if (!empty($socialData['tumblr']) && is_array($socialData['tumblr'])) {
                Log::info('Processing ' . count($socialData['tumblr']) . ' Tumblr results');
                foreach ($socialData['tumblr'] as $index => $item) {
                    if (!is_array($item)) {
                        Log::warning('Tumblr item ' . $index . ' is not an array');
                        continue;
                    }
                    
                    $blogName = $item['blog_name'] ?? $item['blog'] ?? 'Unknown Tumblr';
                    $summary = $item['summary'] ?? $item['caption'] ?? $item['body'] ?? 'No content';
                    $postUrl = $item['post_url'] ?? $item['url'] ?? '#';
                    
                    // Clean up summary text
                    $cleanSummary = strip_tags($summary);
                    if (strlen($cleanSummary) > 100) {
                        $cleanSummary = mb_substr($cleanSummary, 0, 100) . '...';
                    }
                    
                    $results->push([
                        'type' => 'social_tumblr',
                        'id' => 'tumblr_' . ($item['id'] ?? uniqid()),
                        'platform' => 'tumblr',
                        'title' => 'Tumblr: ' . $blogName,
                        'subtitle' => $cleanSummary,
                        'url' => $postUrl,
                        'score' => 85,
                        'color' => 'blue',
                        'icon' => '🌼',
                        'created_at' => isset($item['timestamp']) ? 
                            date('Y-m-d H:i:s', $item['timestamp']) : 
                            ($item['date'] ?? date('Y-m-d H:i:s')),
                    ]);
                }
            } else {
                Log::info('No Tumblr results or results is not an array');
            }
            
            // Process YouTube results
            if (!empty($socialData['youtube']) && is_array($socialData['youtube'])) {
                Log::info('Processing ' . count($socialData['youtube']) . ' YouTube results');
                foreach ($socialData['youtube'] as $index => $item) {
                    if (!is_array($item)) {
                        Log::warning('YouTube item ' . $index . ' is not an array');
                        continue;
                    }
                    
                    $snippet = $item['snippet'] ?? [];
                    $videoId = $item['id']['videoId'] ?? $item['id'] ?? uniqid();
                    $title = $snippet['title'] ?? 'Unknown YouTube video';
                    $channelTitle = $snippet['channelTitle'] ?? 'Unknown channel';
                    
                    if (strlen($title) > 60) {
                        $title = mb_substr($title, 0, 60) . '...';
                    }
                    
                    $results->push([
                        'type' => 'social_youtube',
                        'id' => 'youtube_' . $videoId,
                        'platform' => 'youtube',
                        'title' => 'YouTube: ' . $title,
                        'subtitle' => 'Channel: ' . $channelTitle,
                        'url' => 'https://youtube.com/watch?v=' . $videoId,
                        'score' => 90,
                        'color' => 'red',
                        'icon' => '▶️',
                        'created_at' => $snippet['publishedAt'] ?? date('Y-m-d H:i:s'),
                    ]);
                }
            } else {
                Log::info('No YouTube results or results is not an array');
            }
            
            // Process Pinterest results
            if (!empty($socialData['pinterest']) && is_array($socialData['pinterest'])) {
                Log::info('Processing ' . count($socialData['pinterest']) . ' Pinterest results');
                foreach ($socialData['pinterest'] as $index => $item) {
                    if (!is_array($item)) {
                        Log::warning('Pinterest item ' . $index . ' is not an array');
                        continue;
                    }
                    
                    $description = $item['description'] ?? $item['note'] ?? 'Pinterest pin';
                    $url = $item['link'] ?? $item['url'] ?? '#';
                    
                    // Try to get image URL if link not available
                    if ($url === '#') {
                        if (isset($item['images']['original']['url'])) {
                            $url = $item['images']['original']['url'];
                        } elseif (isset($item['image']['original']['url'])) {
                            $url = $item['image']['original']['url'];
                        }
                    }
                    
                    if (strlen($description) > 50) {
                        $description = mb_substr($description, 0, 50) . '...';
                    }
                    
                    $results->push([
                        'type' => 'social_pinterest',
                        'id' => 'pinterest_' . ($item['id'] ?? uniqid()),
                        'platform' => 'pinterest',
                        'title' => 'Pinterest: ' . $description,
                        'subtitle' => 'Pinterest pin',
                        'url' => $url,
                        'score' => 80,
                        'color' => 'red',
                        'icon' => '📌',
                        'created_at' => date('Y-m-d H:i:s'),
                    ]);
                }
            } else {
                Log::info('No Pinterest results or results is not an array');
            }
            
            // Process Reddit results
            if (!empty($socialData['reddit']) && is_array($socialData['reddit'])) {
                Log::info('Processing ' . count($socialData['reddit']) . ' Reddit results');
                foreach ($socialData['reddit'] as $index => $item) {
                    $data = $item['data'] ?? $item;
                    if (!is_array($data)) {
                        Log::warning('Reddit item ' . $index . ' is not an array');
                        continue;
                    }
                    
                    $title = $data['title'] ?? 'Unknown Reddit post';
                    $subreddit = $data['subreddit'] ?? 'unknown';
                    $author = $data['author'] ?? 'Unknown';
                    $permalink = $data['permalink'] ?? '';
                    
                    if (strlen($title) > 60) {
                        $title = mb_substr($title, 0, 60) . '...';
                    }
                    
                    $fullUrl = $permalink ? 'https://reddit.com' . $permalink : '#';
                    
                    $results->push([
                        'type' => 'social_reddit',
                        'id' => 'reddit_' . ($data['id'] ?? uniqid()),
                        'platform' => 'reddit',
                        'title' => 'Reddit: ' . $title,
                        'subtitle' => 'r/' . $subreddit . ' • by ' . $author,
                        'url' => $fullUrl,
                        'score' => 85,
                        'color' => 'orange',
                        'icon' => '👁️',
                        'created_at' => isset($data['created_utc']) ? 
                            date('Y-m-d H:i:s', $data['created_utc']) : 
                            ($data['created'] ?? date('Y-m-d H:i:s')),
                    ]);
                }
            } else {
                Log::info('No Reddit results or results is not an array');
            }
            
            // If no results found from social APIs, add some mock data for testing
            if ($results->isEmpty()) {
                Log::info('No social media results found, adding mock data');
                $results = collect([
                    [
                        'type' => 'social_tumblr',
                        'id' => 'tumblr_mock_1',
                        'platform' => 'tumblr',
                        'title' => 'Tumblr: Love and Inspiration',
                        'subtitle' => 'Beautiful posts about love and relationships...',
                        'url' => 'https://tumblr.com/search/love',
                        'score' => 85,
                        'color' => 'blue',
                        'icon' => '🌼',
                        'created_at' => date('Y-m-d H:i:s'),
                    ],
                    [
                        'type' => 'social_pinterest',
                        'id' => 'pinterest_mock_1',
                        'platform' => 'pinterest',
                        'title' => 'Pinterest: Love Quotes',
                        'subtitle' => 'Collection of beautiful love quotes',
                        'url' => 'https://pinterest.com/search/love',
                        'score' => 80,
                        'color' => 'red',
                        'icon' => '📌',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
                    ],
                    [
                        'type' => 'social_youtube',
                        'id' => 'youtube_mock_1',
                        'platform' => 'youtube',
                        'title' => 'YouTube: Love Songs Playlist',
                        'subtitle' => 'Best love songs of all time',
                        'url' => 'https://youtube.com/results?search_query=love',
                        'score' => 90,
                        'color' => 'red',
                        'icon' => '▶️',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                    ],
                    [
                        'type' => 'social_reddit',
                        'id' => 'reddit_mock_1',
                        'platform' => 'reddit',
                        'title' => 'Reddit: Love Discussion',
                        'subtitle' => 'r/love • Community discussions',
                        'url' => 'https://reddit.com/r/love',
                        'score' => 85,
                        'color' => 'orange',
                        'icon' => '👁️',
                        'created_at' => date('Y-m-d H:i:s', strtotime('-3 hours')),
                    ],
                ]);
            }
            
            Log::info('Total results after processing: ' . $results->count());
            
            // Sort by score
            $sortedResults = $results
                ->sortByDesc('score')
                ->take($limit)
                ->values()
                ->toArray();
            
            Log::info('Final sorted results count: ' . count($sortedResults));
            
            // Create smart suggestions for hashtag
            $smartSuggestions = [
                [
                    'type' => 'hashtag_social',
                    'title' => "Search social media for #{$hashtag}",
                    'subtitle' => 'Find posts across all platforms',
                    'icon' => '📱',
                    'color' => 'purple',
                    'action' => 'social_search',
                    'query' => '#' . $hashtag,
                ],
                [
                    'type' => 'hashtag_web',
                    'title' => "Web search for #{$hashtag}",
                    'subtitle' => 'Search on Google',
                    'icon' => '🌍',
                    'color' => 'green',
                    'action' => 'web_search',
                    'url' => 'https://www.google.com/search?q=' . urlencode('#' . $hashtag)
                ]
            ];
            
            $response = [
                'results' => $sortedResults,
                'suggestions' => $smartSuggestions,
                'query' => '#' . $hashtag,
                'total' => count($sortedResults),
                'categories' => [
                    'social_tumblr' => count($socialData['tumblr'] ?? []),
                    'social_youtube' => count($socialData['youtube'] ?? []),
                    'social_pinterest' => count($socialData['pinterest'] ?? []),
                    'social_reddit' => count($socialData['reddit'] ?? []),
                ],
                'pagination' => [
                    'tumblr_next' => $socialData['tumblr_next'] ?? null,
                    'youtube_next' => $socialData['youtube_next'] ?? null,
                    'reddit_after' => $socialData['reddit_after'] ?? null,
                ]
            ];
            
            Log::info('Final response prepared, returning JSON');
            
            return response()->json($response);
            
        } catch (\Exception $e) {
            Log::error('Omnibox hashtag search error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Create fallback results when error occurs
            $fallbackResults = [
                [
                    'type' => 'social_tumblr',
                    'id' => 'tumblr_fallback_1',
                    'platform' => 'tumblr',
                    'title' => 'Tumblr: #' . $hashtag . ' posts',
                    'subtitle' => 'Search for #' . $hashtag . ' on Tumblr',
                    'url' => 'https://tumblr.com/tagged/' . urlencode($hashtag),
                    'score' => 85,
                    'color' => 'blue',
                    'icon' => '🌼',
                    'created_at' => date('Y-m-d H:i:s'),
                ],
                [
                    'type' => 'social_pinterest',
                    'id' => 'pinterest_fallback_1',
                    'platform' => 'pinterest',
                    'title' => 'Pinterest: #' . $hashtag . ' pins',
                    'subtitle' => 'Discover pins tagged with #' . $hashtag,
                    'url' => 'https://pinterest.com/search/pins/?q=' . urlencode('#' . $hashtag),
                    'score' => 80,
                    'color' => 'red',
                    'icon' => '📌',
                    'created_at' => date('Y-m-d H:i:s'),
                ],
                [
                    'type' => 'social_youtube',
                    'id' => 'youtube_fallback_1',
                    'platform' => 'youtube',
                    'title' => 'YouTube: #' . $hashtag . ' videos',
                    'subtitle' => 'Watch videos about #' . $hashtag,
                    'url' => 'https://youtube.com/results?search_query=' . urlencode('#' . $hashtag),
                    'score' => 90,
                    'color' => 'red',
                    'icon' => '▶️',
                    'created_at' => date('Y-m-d H:i:s'),
                ],
                [
                    'type' => 'social_reddit',
                    'id' => 'reddit_fallback_1',
                    'platform' => 'reddit',
                    'title' => 'Reddit: #' . $hashtag . ' discussions',
                    'subtitle' => 'Join discussions about #' . $hashtag,
                    'url' => 'https://reddit.com/search/?q=' . urlencode('#' . $hashtag),
                    'score' => 85,
                    'color' => 'orange',
                    'icon' => '👁️',
                    'created_at' => date('Y-m-d H:i:s'),
                ],
            ];
            
            return response()->json([
                'results' => $fallbackResults,
                'suggestions' => [
                    [
                        'type' => 'hashtag_social',
                        'title' => "Search social media for #{$hashtag}",
                        'subtitle' => 'Find posts across all platforms',
                        'icon' => '📱',
                        'color' => 'purple',
                        'action' => 'social_search',
                        'query' => '#' . $hashtag,
                    ],
                    [
                        'type' => 'error',
                        'title' => 'Search completed with fallback',
                        'subtitle' => 'API error: ' . substr($e->getMessage(), 0, 50),
                        'icon' => '⚠️',
                        'color' => 'orange',
                        'action' => 'web_search',
                        'url' => 'https://www.google.com/search?q=' . urlencode('#' . $hashtag)
                    ]
                ],
                'query' => '#' . $hashtag,
                'total' => count($fallbackResults),
                'categories' => [
                    'social_tumblr' => 1,
                    'social_youtube' => 1,
                    'social_pinterest' => 1,
                    'social_reddit' => 1,
                ],
            ]);
        }
    }
    
    /**
     * Get quick actions
     */
    public function quickActions(Request $request)
    {
        $actions = $this->getQuickActions();
        
        return response()->json($actions);
    }
    
    /**
     * Perform a direct action (URL navigation, etc.)
     */
    public function directAction(Request $request)
    {
        $query = trim($request->input('query', ''));
        
        if (empty($query)) {
            return response()->json(['error' => 'No query provided'], 400);
        }
        
        // Check if query is a hashtag
        if (str_starts_with($query, '#')) {
            $hashtag = ltrim($query, '#');
            return response()->json([
                'action' => 'social_search',
                'type' => 'hashtag',
                'query' => $query,
                'hashtag' => $hashtag,
                'url' => url('/search/hashtag?searchhashtag=' . urlencode($hashtag)),
                'title' => 'Search social media for ' . $query,
                'description' => 'Find posts with ' . $query . ' across all platforms'
            ]);
        }
        
        $result = [
            'action' => 'navigate',
            'query' => $query,
        ];
        
        // Determine what to do based on the query
        if (filter_var($query, FILTER_VALIDATE_URL)) {
            $result['type'] = 'url';
            $result['url'] = $query;
            $result['title'] = 'Visit URL';
            $result['description'] = 'Open ' . $query;
        } elseif (str_contains($query, '.') && !str_contains($query, ' ')) {
            $result['type'] = 'domain';
            $result['url'] = 'https://' . $query;
            $result['title'] = 'Visit Website';
            $result['description'] = 'Go to ' . $query;
        } else {
            $result['type'] = 'search';
            $result['url'] = 'https://www.google.com/search?q=' . urlencode($query);
            $result['title'] = 'Web Search';
            $result['description'] = 'Search for "' . $query . '"';
        }
        
        return response()->json($result);
    }
    
    /**
     * Calculate relevance score for search results
     */
    private function calculateRelevanceScore(?string $text, string $query, string $type = 'general'): int
    {
        $score = 0;
        
        // Handle null or empty text
        if (empty($text)) {
            return 0;
        }
        
        $text = strtolower($text);
        $query = strtolower($query);
        
        // Exact match at the beginning (highest priority)
        if (str_starts_with($text, $query)) {
            $score += 100;
        }
        
        // Exact match anywhere
        if (str_contains($text, $query)) {
            $score += 50;
        }
        
        // Type-specific bonuses
        $typeBonuses = [
            'funnel' => 10,
            'field' => 5,
            'domain' => 15,
            'custom_domain' => 20,
            'theme' => 8,
            'social_tumblr' => 7,
            'social_youtube' => 9,
            'social_pinterest' => 6,
            'social_reddit' => 8,
            'ai_suggestion' => 95, // AI suggestions get high score
        ];
        
        $score += $typeBonuses[$type] ?? 0;
        
        return max(0, min(100, $score));
    }
    
    /**
     * Get smart suggestions based on query
     */
    private function getSmartSuggestions(string $query): array
    {
        $suggestions = [];
        
        // If query looks like a hashtag
        if (str_starts_with($query, '#')) {
            $hashtag = ltrim($query, '#');
            $suggestions[] = [
                'type' => 'hashtag_social',
                'title' => "Search social media for {$query}",
                'subtitle' => 'Find posts across Tumblr, YouTube, Pinterest, Reddit',
                'icon' => '📱',
                'color' => 'purple',
                'action' => 'social_search',
                'query' => $query
            ];
            
            $suggestions[] = [
                'type' => 'hashtag_web',
                'title' => "Web search for {$query}",
                'subtitle' => 'Search on Google',
                'icon' => '🌍',
                'color' => 'green',
                'action' => 'web_search',
                'url' => 'https://www.google.com/search?q=' . urlencode($query)
            ];
        }
        
        // If query looks like a URL
        elseif (filter_var($query, FILTER_VALIDATE_URL) || 
                str_starts_with($query, 'http://') || 
                str_starts_with($query, 'https://')) {
            
            $suggestions[] = [
                'type' => 'url',
                'title' => "Visit {$query}",
                'subtitle' => 'Open URL in new tab',
                'icon' => '🌐',
                'color' => 'emerald',
                'action' => 'navigate',
                'url' => $query
            ];
        }
        
        // If query looks like a domain (without protocol)
        elseif (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $query)) {
            $suggestions[] = [
                'type' => 'domain',
                'title' => "Go to https://{$query}",
                'subtitle' => 'Visit website',
                'icon' => '🚀',
                'color' => 'blue',
                'action' => 'navigate',
                'url' => "https://{$query}"
            ];
        }
        
        // If query starts with "F" (likely funnel field)
        elseif (str_starts_with(strtoupper($query), 'F') && strlen($query) <= 8) {
            $suggestions[] = [
                'type' => 'field_search',
                'title' => "Find funnel field {$query}",
                'subtitle' => 'Search for specific field',
                'icon' => '🔍',
                'color' => 'indigo',
                'action' => 'search_field',
                'query' => $query
            ];
        }
        
        // If query starts with "X" (likely funnel token)
        elseif (str_starts_with(strtoupper($query), 'X') && strlen($query) <= 8) {
            $suggestions[] = [
                'type' => 'funnel_search',
                'title' => "Find funnel token {$query}",
                'subtitle' => 'Search for specific funnel',
                'icon' => '⚡',
                'color' => 'amber',
                'action' => 'search_funnel',
                'query' => $query
            ];
        }
        
        // If query is numeric (might be an ID)
        elseif (is_numeric($query) && strlen($query) <= 10) {
            $suggestions[] = [
                'type' => 'id_search',
                'title' => "Find by ID: {$query}",
                'subtitle' => 'Search for record by ID',
                'icon' => '#️⃣',
                'color' => 'orange',
                'action' => 'search_id',
                'query' => $query
            ];
        }
        
        // AI suggestion for longer queries
        elseif (str_word_count($query) > 2) {
            $suggestions[] = [
                'type' => 'ai_assistance',
                'title' => "AI-powered search",
                'subtitle' => 'Get smart suggestions from Gemini AI',
                'icon' => '🤖',
                'color' => 'purple',
                'action' => 'ai_search',
                'query' => $query
            ];
        }
        
        // Default search suggestion
        if (empty($suggestions) && !empty($query)) {
            $suggestions[] = [
                'type' => 'general_search',
                'title' => "Search for '{$query}'",
                'subtitle' => 'Find across all content',
                'icon' => '🔍',
                'color' => 'gray',
                'action' => 'search_all',
                'query' => $query
            ];
        }
        
        // Add web search as fallback
        if (!empty($query) && strlen($query) > 2) {
            $suggestions[] = [
                'type' => 'web_search',
                'title' => "Web search for '{$query}'",
                'subtitle' => 'Search on Google',
                'icon' => '🌍',
                'color' => 'green',
                'action' => 'web_search',
                'url' => 'https://www.google.com/search?q=' . urlencode($query)
            ];
        }
        
        return $suggestions;
    }
    
    /**
     * Get quick actions for user
     */
    private function getQuickActions(): array
    {
        return [
            [
                'id' => 'create_funnel',
                'title' => 'Create New Funnel',
                'subtitle' => 'Start a new funnel',
                'icon' => '⚡',
                'color' => 'indigo',
                'url' => route('funnels.create'),
                'shortcut' => '⌘ F'
            ],
            [
                'id' => 'create_theme',
                'title' => 'Create Theme',
                'subtitle' => 'Design a new theme',
                'icon' => '🎨',
                'color' => 'blue',
                'url' => route('themes.create'),
                'shortcut' => '⌘ T'
            ],
            [
                'id' => 'add_domain',
                'title' => 'Add Domain',
                'subtitle' => 'Register new domain',
                'icon' => '🔗',
                'color' => 'emerald',
                'url' => route('domains.create'),
                'shortcut' => '⌘ D'
            ],
            [
                'id' => 'add_custom_domain',
                'title' => 'Add Custom Domain',
                'subtitle' => 'Register custom domain',
                'icon' => '🌐',
                'color' => 'purple',
                'url' => route('customdomains.create'),
                'shortcut' => '⌘ ⇧ D'
            ],
            [
                'id' => 'view_dashboard',
                'title' => 'Go to Dashboard',
                'subtitle' => 'View analytics and stats',
                'icon' => '📊',
                'color' => 'purple',
                'url' => route('dashboard'),
                'shortcut' => '⌘ K'
            ],
            [
                'id' => 'search_hashtag',
                'title' => 'Search #Hashtag',
                'subtitle' => 'Find social media content',
                'icon' => '🏷️',
                'color' => 'orange',
                'action' => 'search_hashtag',
                'shortcut' => '#'
            ],
            [
                'id' => 'ai_search',
                'title' => 'AI-Powered Search',
                'subtitle' => 'Get smart suggestions',
                'icon' => '🤖',
                'color' => 'purple',
                'action' => 'ai_search',
                'shortcut' => '⌘ ⇧ A'
            ],
            [
                'id' => 'global_search',
                'title' => 'Global Search',
                'subtitle' => 'Search everything',
                'icon' => '🔍',
                'color' => 'gray',
                'action' => 'search_all',
                'shortcut' => '⌘ /'
            ],
            [
                'id' => 'view_profile',
                'title' => 'View Profile',
                'subtitle' => 'Your account settings',
                'icon' => '👤',
                'color' => 'teal',
                'url' => route('profile.show'),
                'shortcut' => '⌘ P'
            ],
            [
                'id' => 'view_settings',
                'title' => 'Settings',
                'subtitle' => 'Configure application',
                'icon' => '⚙️',
                'color' => 'gray',
                'url' => route('settings'),
                'shortcut' => '⌘ ,'
            ],
            [
                'id' => 'view_help',
                'title' => 'Help & Documentation',
                'subtitle' => 'Learn how to use',
                'icon' => '❓',
                'color' => 'blue',
                'url' => route('help'),
                'shortcut' => '⌘ ?'
            ]
        ];
    }
}