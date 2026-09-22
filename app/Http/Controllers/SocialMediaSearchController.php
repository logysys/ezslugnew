<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SocialMediaSearchController extends Controller
{
    public function searchByHashtag(Request $request)
    {
        $request->validate([
            'searchhashtag' => 'required|string|max:255',
            'count' => 'nullable|integer|min:1|max:20'
        ]);

        $hashtag = $request->input('searchhashtag');
        $count = $request->input('count', 5);

        $response = [
            'tumblr' => [],
            'youtube' => [],
            'pinterest' => [],
            'reddit' => [],
            'success' => true,
            'message' => 'Search completed successfully',
            'tumblr_next' => null,
            'youtube_next' => null,
            'reddit_after' => null
        ];

        try {
            // Tumblr API call
            $tumblrResponse = Http::get('https://api.tumblr.com/v2/tagged', [
                'tag' => $hashtag,
                'api_key' => 'wQzF7sBwL4LNzDh2yYgA13ZajEPMLXoT8XE4cDkdV1aYfmXInZ',
                'limit' => $count
            ]);
            
            $tumblrData = $tumblrResponse->json();
            $response['tumblr'] = $tumblrData['response'] ?? [];
            
            // Extract Tumblr pagination - get timestamp from last post
            if (isset($tumblrData['response']) && count($tumblrData['response']) > 0) {
                $lastIndex = count($tumblrData['response']) - 1;
                $response['tumblr_next'] = $tumblrData['response'][$lastIndex]['timestamp'] ?? null;
            }

            // Add platform identifier to each result
            if (is_array($response['tumblr'])) {
                foreach ($response['tumblr'] as &$item) {
                    $item['platform'] = 'tumblr';
                }
            }

            // YouTube API call
            $youtubeResponse = Http::get('https://youtube.googleapis.com/youtube/v3/search', [
                'part' => 'snippet',
                'channelType' => 'any',
                'maxResults' => $count,
                'order' => 'date',
                'q' => '#' . $hashtag,
                'key' => 'AIzaSyBMbRl9GBBEJjUhi8LuKBT6IF8jfgnjwkU'
            ]);
            
            $youtubeData = $youtubeResponse->json();
            $response['youtube'] = $youtubeData['items'] ?? [];
            $response['youtube_next'] = $youtubeData['nextPageToken'] ?? null;
            
            // Add platform identifier to each result
            if (is_array($response['youtube'])) {
                foreach ($response['youtube'] as &$item) {
                    $item['platform'] = 'youtube';
                }
            }

            // Pinterest API call
            $pinterestResponse = Http::get("https://api.pinterest.com/v3/pidgets/users/{$hashtag}/pins/");
            $pinterestData = $pinterestResponse->json();
            
            $response['pinterest'] = isset($pinterestData['data']['pins']) && is_array($pinterestData['data']['pins']) 
                ? array_slice($pinterestData['data']['pins'], 0, $count) 
                : [];
            
            // Add platform identifier to each result
            if (is_array($response['pinterest'])) {
                foreach ($response['pinterest'] as &$item) {
                    $item['platform'] = 'pinterest';
                }
            }

            // Reddit API call with OAuth
            $redditResult = $this->getRedditData($hashtag, $count);
            $response['reddit'] = is_array($redditResult['data']) ? $redditResult['data'] : [];
            $response['reddit_after'] = $redditResult['after'] ?? null;
            
            // Add platform identifier to each result
            if (is_array($response['reddit'])) {
                foreach ($response['reddit'] as &$item) {
                    $item['platform'] = 'reddit';
                }
            }

        } catch (\Exception $e) {
            Log::error('Social media search error: ' . $e->getMessage());
            $response['success'] = false;
            $response['message'] = 'An error occurred while fetching social media data';
            
            // Ensure all platform arrays are arrays even on error
            $response['tumblr'] = [];
            $response['youtube'] = [];
            $response['pinterest'] = [];
            $response['reddit'] = [];
        }

        return response()->json($response);
    }

    private function getRedditData($hashtag, $count)
    {
        $client_id = 'RoAvp6nWw4gHUaArrHIZlw';
        $client_secret = 'gqD4TALLT2t2PmUxKepeZyUt9MlQeA';
        $reddit_username = 'logysysaimtag';
        $reddit_password = '7fQZG6GVv!!Zy2d';

        try {
            // Get access token
            $tokenResponse = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode("$client_id:$client_secret"),
                'User-Agent' => 'MyAPI/0.0.1'
            ])->asForm()->post('https://www.reddit.com/api/v1/access_token', [
                'grant_type' => 'password',
                'username' => $reddit_username,
                'password' => $reddit_password
            ]);

            $tokenData = $tokenResponse->json();

            if (!isset($tokenData['access_token'])) {
                return ['data' => [], 'after' => null];
            }

            $token = $tokenData['access_token'];

            // Search Reddit
            $searchResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'User-Agent' => 'MyAPI/0.0.1'
            ])->get('https://oauth.reddit.com/search', [
                'q' => '#' . $hashtag,
                'sort' => 'new',
                'limit' => $count
            ]);

            $searchData = $searchResponse->json();
            
            // Extract both data and pagination token
            return [
                'data' => $searchData['data']['children'] ?? [],
                'after' => $searchData['data']['after'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Reddit API error: ' . $e->getMessage());
            return ['data' => [], 'after' => null];
        }
    }

    public function loadMore(Request $request)
    {
        $request->validate([
            'hashtag' => 'required|string|max:255',
            'count' => 'nullable|integer|min:1|max:20',
            'tumblr_timestamp' => 'nullable|string',
            'youtubenext' => 'nullable|string',
            'reddit_after' => 'nullable|string',
            'total' => 'nullable|integer'
        ]);

        $hashtag = $request->input('hashtag');
        $count = $request->input('count', 5);
        $tumblrTimestamp = $request->input('tumblr_timestamp');
        $youtubeNext = $request->input('youtubenext');
        $redditAfter = $request->input('reddit_after');
        $total = $request->input('total', 0);

        $response = [
            'tumblr' => [],
            'youtube' => [],
            'pinterest' => [],
            'reddit' => [],
            'success' => true,
            'message' => 'Load more completed successfully',
            'tumblr_next' => null,
            'youtube_next' => null,
            'reddit_after' => null
        ];

        try {
            // Tumblr API call with pagination using timestamp
            $tumblrUrl = 'https://api.tumblr.com/v2/tagged?tag='.urlencode($hashtag).'&api_key=wQzF7sBwL4LNzDh2yYgA13ZajEPMLXoT8XE4cDkdV1aYfmXInZ&limit='.$count;
            if ($tumblrTimestamp) {
                $tumblrUrl .= '&before='.$tumblrTimestamp;
            }
            
            $tumblrResponse = Http::get($tumblrUrl);
            $tumblrData = $tumblrResponse->json();
            $response['tumblr'] = $tumblrData['response'] ?? [];
            
            // Extract Tumblr next timestamp
            if (isset($tumblrData['response']) && count($tumblrData['response']) > 0) {
                $lastIndex = count($tumblrData['response']) - 1;
                $response['tumblr_next'] = $tumblrData['response'][$lastIndex]['timestamp'] ?? null;
            }

            // Add platform identifier to each result
            if (is_array($response['tumblr'])) {
                foreach ($response['tumblr'] as &$item) {
                    $item['platform'] = 'tumblr';
                }
            }

            // YouTube API call with pagination
            $youtubeUrl = 'https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelType=any&maxResults='.$count.'&order=date&q=%23'.urlencode($hashtag).'&key=AIzaSyBMbRl9GBBEJjUhi8LuKBT6IF8jfgnjwkU';
            if ($youtubeNext) {
                $youtubeUrl .= '&pageToken='.$youtubeNext;
            }
            
            $youtubeResponse = Http::get($youtubeUrl);
            $youtubeData = $youtubeResponse->json();
            $response['youtube'] = $youtubeData['items'] ?? [];
            $response['youtube_next'] = $youtubeData['nextPageToken'] ?? null;

            // Add platform identifier to each result
            if (is_array($response['youtube'])) {
                foreach ($response['youtube'] as &$item) {
                    $item['platform'] = 'youtube';
                }
            }

            // Pinterest API call with offset
            $pinterestResponse = Http::get("https://api.pinterest.com/v3/pidgets/users/{$hashtag}/pins/");
            $pinterestData = $pinterestResponse->json();
            
            if (isset($pinterestData['data']['pins'])) {
                $response['pinterest'] = array_slice($pinterestData['data']['pins'], $total, $count);
            } else {
                $response['pinterest'] = [];
            }

            // Add platform identifier to each result
            if (is_array($response['pinterest'])) {
                foreach ($response['pinterest'] as &$item) {
                    $item['platform'] = 'pinterest';
                }
            }

            // Reddit API call with pagination
            $redditResult = $this->getRedditDataWithPagination($hashtag, $count, $redditAfter);
            $response['reddit'] = is_array($redditResult['data']) ? $redditResult['data'] : [];
            $response['reddit_after'] = $redditResult['after'] ?? null;

            // Add platform identifier to each result
            if (is_array($response['reddit'])) {
                foreach ($response['reddit'] as &$item) {
                    $item['platform'] = 'reddit';
                }
            }

        } catch (\Exception $e) {
            Log::error('Social media load more error: ' . $e->getMessage());
            $response['success'] = false;
            $response['message'] = 'An error occurred while loading more data';
        }

        return response()->json($response);
    }

    private function getRedditDataWithPagination($hashtag, $count, $after = null)
    {
        $client_id = 'RoAvp6nWw4gHUaArrHIZlw';
        $client_secret = 'gqD4TALLT2t2PmUxKepeZyUt9MlQeA';
        $reddit_username = 'logysysaimtag';
        $reddit_password = '7fQZG6GVv!!Zy2d';

        try {
            // Get access token
            $tokenResponse = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode("$client_id:$client_secret"),
                'User-Agent' => 'MyAPI/0.0.1'
            ])->asForm()->post('https://www.reddit.com/api/v1/access_token', [
                'grant_type' => 'password',
                'username' => $reddit_username,
                'password' => $reddit_password
            ]);

            $tokenData = $tokenResponse->json();

            if (!isset($tokenData['access_token'])) {
                return ['data' => [], 'after' => null];
            }

            $token = $tokenData['access_token'];

            // Build search URL with pagination
            $searchUrl = 'https://oauth.reddit.com/search?q=%23'.urlencode($hashtag).'&sort=new&limit='.$count;
            if ($after) {
                $searchUrl .= '&after='.$after;
            }

            $searchResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'User-Agent' => 'MyAPI/0.0.1'
            ])->get($searchUrl);

            $searchData = $searchResponse->json();
            
            return [
                'data' => $searchData['data']['children'] ?? [],
                'after' => $searchData['data']['after'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Reddit API pagination error: ' . $e->getMessage());
            return ['data' => [], 'after' => null];
        }
    }
}