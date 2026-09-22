<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\AISearchHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ExtensionApiController extends Controller
{
    public function searchLinks(Request $request)
    {
        $query = $request->input('query', '');
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 10);
        
        if ($perPage > 20) {
            $perPage = 20;
        }
        
        if (empty($query)) {
            return response()->json([
                'success' => true,
                'results' => [],
                'total' => 0,
                'current_page' => $page,
                'total_pages' => 0,
                'per_page' => $perPage,
            ]);
        }
        
        $allResults = collect();
        
        $funnelResults = EzFunnel::where('token', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get()
            ->map(function ($funnel) use ($query) {
                return [
                    'type' => 'funnel',
                    'id' => $funnel->id,
                    'slug' => $funnel->token,
                    'url' => url('/' . ($funnel->token ?? '')),
                    'title' => $funnel->token ?? '',
                    'score' => $this->calculateScore($funnel->token ?? '', $query),
                ];
            });
        
        $allResults = $allResults->merge($funnelResults);
        
        $customDomainResults = Customdomain::where('domain', 'LIKE', "%{$query}%")
            ->orWhere('domainselected', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get()
            ->map(function ($domain) use ($query) {
                $url = 'http://' . $domain->domainselected . '/' . $domain->domain;
                return [
                    'type' => 'custom_domain',
                    'id' => $domain->id,
                    'slug' => $domain->domain,
                    'url' => $url,
                    'title' => $domain->domain,
                    'subtitle' => $domain->domainselected,
                    'score' => $this->calculateScore($domain->domain ?? '', $query),
                ];
            });
        
        $allResults = $allResults->merge($customDomainResults);
        
        $domainResults = Domain::where('domain', 'LIKE', "%{$query}%")
            ->orWhere('domainselected', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get()
            ->map(function ($domain) use ($query) {
                $url = 'http://' . $domain->domain . '.' . $domain->domainselected;
                return [
                    'type' => 'domain',
                    'id' => $domain->id,
                    'slug' => $domain->domain,
                    'url' => $url,
                    'title' => $domain->domain,
                    'subtitle' => $domain->domainselected,
                    'score' => $this->calculateScore($domain->domain ?? '', $query),
                ];
            });
        
        $allResults = $allResults->merge($domainResults);
        
        $themeResults = Template::where('unique_id', 'LIKE', "%{$query}%")
            ->orWhere('title', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get()
            ->map(function ($theme) use ($query) {
                return [
                    'type' => 'theme',
                    'id' => $theme->id,
                    'slug' => $theme->unique_id,
                    'url' => url('/' . ($theme->unique_id ?? '')),
                    'title' => $theme->title ?? $theme->unique_id ?? 'Untitled',
                    'subtitle' => $theme->description,
                    'score' => $this->calculateScore($theme->unique_id ?? '', $query),
                ];
            });
        
        $allResults = $allResults->merge($themeResults);
        
        $aiResults = AISearchHistory::where('slug', 'LIKE', "%{$query}%")
            ->orWhere('conversation_title', 'LIKE', "%{$query}%")
            ->orWhere('query', 'LIKE', "%{$query}%")
            ->whereNull('parent_id')
            ->where('status', 'public')
            ->limit(20)
            ->get()
            ->map(function ($history) use ($query) {
                return [
                    'type' => 'ai_conversation',
                    'id' => $history->id,
                    'slug' => $history->slug,
                    'url' => url('/X/' . urlencode($history->slug)),
                    'title' => $history->conversation_title ?? $history->query ?? 'Untitled',
                    'subtitle' => 'Query: ' . Str::limit($history->query ?? '', 100),
                    'query_preview' => Str::limit($history->query ?? '', 100),
                    'message_count' => $history->message_count,
                    'created_at' => $history->created_at?->diffForHumans(),
                    'score' => $this->calculateScore($history->slug ?? '', $query),
                ];
            });
        
        $allResults = $allResults->merge($aiResults);
        
        $sortedResults = $allResults->sortByDesc('score')->values();
        $totalResults = $sortedResults->count();
        $totalPages = ceil($totalResults / $perPage);
        
        $startIndex = ($page - 1) * $perPage;
        $paginatedResults = $sortedResults->slice($startIndex, $perPage)->values();
        
        return response()->json([
            'success' => true,
            'results' => $paginatedResults,
            'total' => $totalResults,
            'current_page' => $page,
            'total_pages' => $totalPages,
            'per_page' => $perPage,
            'has_more' => $page < $totalPages,
        ]);
    }
    
    public function searchAISlugs(Request $request)
    {
        $query = $request->input('query', '');
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 10);
        
        if ($perPage > 20) {
            $perPage = 20;
        }
        
        if (empty($query)) {
            return response()->json([
                'success' => true,
                'results' => [],
                'total' => 0,
                'current_page' => $page,
                'total_pages' => 0,
                'per_page' => $perPage,
            ]);
        }
        
        $results = AISearchHistory::where(function($q) use ($query) {
                $q->where('slug', 'LIKE', "%{$query}%")
                  ->orWhere('conversation_title', 'LIKE', "%{$query}%")
                  ->orWhere('query', 'LIKE', "%{$query}%");
            })
            ->whereNull('parent_id')
            ->where('status', 'public')
            ->orderByRaw("CASE 
                WHEN slug = ? THEN 1 
                WHEN slug LIKE ? THEN 2 
                WHEN conversation_title LIKE ? THEN 3 
                ELSE 4 
            END", [$query, $query . '%', '%' . $query . '%'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
        
        $formattedResults = $results->map(function ($history) use ($query) {
            return [
                'type' => 'ai_conversation',
                'id' => $history->id,
                'slug' => $history->slug,
                'url' => url('/X/' . urlencode($history->slug)),
                'title' => $history->conversation_title ?? $history->query ?? 'Untitled',
                'subtitle' => 'Slug: ' . $history->slug . ' • ' . $history->formatted_created_at,
                'query_preview' => Str::limit($history->query ?? '', 100),
                'message_count' => $history->message_count,
                'created_at' => $history->created_at?->diffForHumans(),
                'score' => $this->calculateScore($history->slug ?? '', $query),
            ];
        });
        
        return response()->json([
            'success' => true,
            'results' => $formattedResults,
            'total' => $results->total(),
            'current_page' => $results->currentPage(),
            'total_pages' => $results->lastPage(),
            'per_page' => $results->perPage(),
            'has_more' => $results->hasMorePages(),
        ]);
    }
    
    public function suggestions(Request $request)
    {
        $query = $request->input('query', '');
        
        if (strlen($query) < 2) {
            return response()->json(['suggestions' => []]);
        }
        
        $suggestions = collect();
        
        $aiSuggestions = AISearchHistory::where('slug', 'LIKE', "%{$query}%")
            ->whereNull('parent_id')
            ->where('status', 'public')
            ->limit(3)
            ->pluck('slug')
            ->map(fn($slug) => '/X/' . $slug);
        
        $suggestions = $suggestions->merge($aiSuggestions);
        
        $funnelSuggestions = EzFunnel::where('token', 'LIKE', "%{$query}%")
            ->limit(2)
            ->pluck('token')
            ->map(fn($token) => url('/' . $token));
        
        $suggestions = $suggestions->merge($funnelSuggestions);
        
        $themeSuggestions = Template::where('unique_id', 'LIKE', "%{$query}%")
            ->orWhere('title', 'LIKE', "%{$query}%")
            ->limit(2)
            ->pluck('unique_id')
            ->map(fn($id) => url('/' . $id));
        
        $suggestions = $suggestions->merge($themeSuggestions);
        
        $smartSuggestions = $this->getSmartSuggestions($query);
        $suggestions = $suggestions->merge($smartSuggestions);
        
        $result = array_slice($suggestions->unique()->values()->toArray(), 0, 8);
        
        return response()->json(['suggestions' => $result]);
    }
    
    public function popularSearches(Request $request)
    {
        $result = [
            ['query' => 'parenting', 'icon' => '👨‍👩‍👧'],
            ['query' => 'technology', 'icon' => '💻'],
            ['query' => 'travel', 'icon' => '✈️'],
            ['query' => 'health', 'icon' => '❤️'],
            ['query' => 'finance', 'icon' => '💰'],
            ['query' => 'education', 'icon' => '📚'],
            ['query' => 'entertainment', 'icon' => '🎬'],
            ['query' => 'sports', 'icon' => '⚽'],
        ];
        
        return response()->json(['searches' => $result]);
    }
    
    public function trackSearch(Request $request)
    {
        $request->validate([
            'query' => 'required|string|max:255',
            'mode' => 'required|in:ez,ai',
            'results_count' => 'nullable|integer',
        ]);
        
        Log::info('Extension search tracked', [
            'query' => $request->query,
            'mode' => $request->mode,
            'results_count' => $request->results_count,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        return response()->json(['success' => true]);
    }
    
    public function health()
    {
        return response()->json([
            'status' => 'healthy',
            'version' => '2.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
    
    private function calculateScore(string $text, string $query): int
    {
        if (empty($text) || empty($query)) {
            return 0;
        }
        
        $textLower = strtolower($text);
        $queryLower = strtolower($query);
        
        $score = 0;
        
        if ($textLower === $queryLower) {
            $score += 100;
        }
        
        if (str_starts_with($textLower, $queryLower)) {
            $score += 50;
        }
        
        if (str_contains($textLower, $queryLower)) {
            $score += 30;
        }
        
        $queryWords = explode(' ', $queryLower);
        foreach ($queryWords as $word) {
            if (strlen($word) > 2 && str_contains($textLower, $word)) {
                $score += 10;
            }
        }
        
        return min($score, 100);
    }
    
    private function getSmartSuggestions(string $query): array
    {
        $suggestions = [];
        
        $commonPrefixes = ['best ', 'top ', 'how to ', 'what is ', 'guide to '];
        $commonSuffixes = [' guide', ' tips', ' tutorial', ' examples', ' reviews'];
        
        foreach ($commonPrefixes as $prefix) {
            $suggestions[] = $prefix . $query;
        }
        
        foreach ($commonSuffixes as $suffix) {
            $suggestions[] = $query . $suffix;
        }
        
        if (preg_match('/^[a-z0-9-]+$/i', $query)) {
            $suggestions[] = url('/' . $query);
            $suggestions[] = '/X/' . $query;
        }
        
        return array_slice(array_unique($suggestions), 0, 5);
    }
}