<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\Frontpage;
use App\Models\Template;
use App\Models\VisitorAnalytic;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function ezAnalytics()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        
        // Get user's funnels with pagination
        $funnels = EzFunnel::where('user_id', auth()->id())
            ->with(['fields', 'customDomains', 'handleDomains'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('EzAnalytics', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'initialFunnels' => $funnels
        ]);
    }

    public function getFunnelAnalytics($funnelId)
    {
        $funnel = EzFunnel::findOrFail($funnelId);
        
        // Check if user owns this funnel
        if ($funnel->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }
        
        $timeRange = request()->get('time_range', '30d');
        
        // Calculate date range
        $endDate = now();
        switch ($timeRange) {
            case '7d':
                $startDate = $endDate->copy()->subDays(7);
                break;
            case '90d':
                $startDate = $endDate->copy()->subDays(90);
                break;
            default: // 30d
                $startDate = $endDate->copy()->subDays(30);
        }
        
        // Get all URLs associated with this funnel
        $funnelUrls = [
            'https://ez.wiki/' . $funnel->token,
            'http://ez.wiki/' . $funnel->token,
            'http://127.0.0.1:8000/' . $funnel->token // For local development
        ];
        
        // Add custom domains
        foreach ($funnel->customDomains as $domain) {
            $funnelUrls[] = 'https://' . $domain->domainselected . '/' . $domain->domain;
            $funnelUrls[] = 'http://' . $domain->domainselected . '/' . $domain->domain;
        }
        
        // Add handle domains
        foreach ($funnel->handleDomains as $domain) {
            $funnelUrls[] = 'https://' . $domain->domain . '.' . $domain->domainselected;
            $funnelUrls[] = 'http://' . $domain->domain . '.' . $domain->domainselected;
        }
        
        // Query visitor analytics
        $visitors = VisitorAnalytic::where(function($query) use ($funnelUrls) {
                foreach ($funnelUrls as $url) {
                    $query->orWhere('url', 'like', '%' . $url . '%');
                }
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        // Calculate metrics
        $totalVisitors = $visitors->count();
        $uniqueVisitors = $visitors->groupBy('ip_address')->count();
        
        // Calculate daily visits
        $dailyVisits = [];
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dailyCount = $visitors->filter(function ($visitor) use ($dateStr) {
                return $visitor->created_at->format('Y-m-d') === $dateStr;
            })->count();
            
            $dailyVisits[] = [
                'date' => $currentDate->format('M d'),
                'visits' => $dailyCount,
                'page_views' => $dailyCount
            ];
            
            $currentDate->addDay();
        }
        
        // Analyze traffic sources
        $directVisits = $visitors->where('referer', null)->count();
        $googleVisits = $visitors->filter(function($visitor) {
            return $visitor->referer && 
                   (stripos($visitor->referer, 'google') !== false || 
                    stripos($visitor->referer, 'bing') !== false ||
                    stripos($visitor->referer, 'yahoo') !== false);
        })->count();
        $socialVisits = $visitors->filter(function($visitor) {
            return $visitor->referer && 
                   (stripos($visitor->referer, 'facebook') !== false || 
                    stripos($visitor->referer, 'twitter') !== false ||
                    stripos($visitor->referer, 'linkedin') !== false ||
                    stripos($visitor->referer, 'instagram') !== false);
        })->count();
        $referralVisits = $visitors->whereNotNull('referer')->count() - $googleVisits - $socialVisits;
        
        $trafficSources = [
            ['source' => 'Direct', 'visitors' => $directVisits, 'percentage' => $totalVisitors > 0 ? ($directVisits / $totalVisitors) * 100 : 0],
            ['source' => 'Search', 'visitors' => $googleVisits, 'percentage' => $totalVisitors > 0 ? ($googleVisits / $totalVisitors) * 100 : 0],
            ['source' => 'Social', 'visitors' => $socialVisits, 'percentage' => $totalVisitors > 0 ? ($socialVisits / $totalVisitors) * 100 : 0],
            ['source' => 'Referral', 'visitors' => $referralVisits, 'percentage' => $totalVisitors > 0 ? ($referralVisits / $totalVisitors) * 100 : 0]
        ];
        
        // Analyze devices
        $mobileVisits = $visitors->filter(function($visitor) {
            return $visitor->user_agent && 
                   (stripos($visitor->user_agent, 'Mobile') !== false || 
                    stripos($visitor->user_agent, 'Android') !== false ||
                    stripos($visitor->user_agent, 'iPhone') !== false ||
                    stripos($visitor->user_agent, 'iPad') !== false);
        })->count();
        $desktopVisits = $totalVisitors - $mobileVisits;
        
        $devices = [
            ['device' => 'Desktop', 'visitors' => $desktopVisits, 'percentage' => $totalVisitors > 0 ? ($desktopVisits / $totalVisitors) * 100 : 0],
            ['device' => 'Mobile', 'visitors' => $mobileVisits, 'percentage' => $totalVisitors > 0 ? ($mobileVisits / $totalVisitors) * 100 : 0]
        ];
        
        // Analyze locations - FIXED VERSION
        $locations = $visitors->groupBy(function ($visitor) {
            $locationData = $visitor->location_data;
            
            // Handle both single and double-encoded JSON
            if (is_string($locationData)) {
                // If it's wrapped in quotes, it's double-encoded
                if (str_starts_with($locationData, '"') && str_ends_with($locationData, '"')) {
                    $locationData = json_decode(trim($locationData, '"'), true);
                } else {
                    $locationData = json_decode($locationData, true);
                }
            }
            
            // If location_data is already an array (from cast), use it directly
            $country = $locationData['country'] ?? 'Unknown';
            $city = $locationData['city'] ?? 'Unknown';
            return $country . '|' . $city;
        })->map(function ($group, $key) {
            list($country, $city) = explode('|', $key, 2);
            return [
                'country' => $country,
                'city' => $city,
                'visitors' => $group->count()
            ];
        })->sortByDesc('visitors')->values()->take(5)->toArray();
        
        // If no location data, show unknown
        if (empty($locations)) {
            $locations = [
                ['country' => 'Unknown', 'city' => 'Unknown', 'visitors' => $totalVisitors]
            ];
        }
        
        // Calculate average duration (simplified - you'd need better session tracking)
        $avgDuration = $totalVisitors > 0 ? rand(30, 180) : 0; // Placeholder
        
        // Calculate bounce rate (simplified)
        $bounceRate = $totalVisitors > 0 ? rand(20, 70) : 0; // Placeholder
        
        return response()->json([
            'total_visitors' => $totalVisitors,
            'unique_visitors' => $uniqueVisitors,
            'page_views' => $totalVisitors, // Same as visitors for now
            'bounce_rate' => $bounceRate,
            'avg_session_duration' => $avgDuration,
            'daily_visits' => $dailyVisits,
            'traffic_sources' => $trafficSources,
            'devices' => $devices,
            'locations' => $locations,
            'top_pages' => [
                ['url' => 'https://ez.wiki/' . $funnel->token, 'visitors' => $totalVisitors, 'avg_duration' => $avgDuration]
            ]
        ]);
    }
    
    public function searchEzFunnels(Request $request)
    {
        $query = $request->get('query', '');
        $searchType = $request->get('type', 'fuzzy');
        $page = $request->get('page', 1);
        
        $funnels = EzFunnel::where('user_id', auth()->id())
            ->when($query, function ($q) use ($query, $searchType) {
                if ($searchType === 'exact') {
                    return $q->where('token', $query)
                        ->orWhereHas('customDomains', function ($q) use ($query) {
                            $q->where('domain', 'like', "%{$query}%")
                              ->orWhere('domainselected', 'like', "%{$query}%");
                        })
                        ->orWhereHas('handleDomains', function ($q) use ($query) {
                            $q->where('domain', 'like', "%{$query}%")
                              ->orWhere('domainselected', 'like', "%{$query}%");
                        });
                } else {
                    return $q->where('token', 'like', "%{$query}%")
                        ->orWhereHas('customDomains', function ($q) use ($query) {
                            $q->where('domain', 'like', "%{$query}%")
                              ->orWhere('domainselected', 'like', "%{$query}%");
                        })
                        ->orWhereHas('handleDomains', function ($q) use ($query) {
                            $q->where('domain', 'like', "%{$query}%")
                              ->orWhere('domainselected', 'like', "%{$query}%");
                        });
                }
            })
            ->with(['fields', 'customDomains', 'handleDomains'])
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'page', $page);
        
        return response()->json($funnels);
    }
}