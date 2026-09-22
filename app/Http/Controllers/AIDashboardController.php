<?php
// app/Http/Controllers/AIDashboardController.php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AIDashboardController extends Controller
{
    /**
     * Display AI dashboard with user statistics
     */
    public function index()
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        // Get overall statistics
        $stats = $this->getUserStats($user);
        
        // Get recent conversations
        $recentConversations = $this->getRecentConversations($user);
        
        // Get usage trends (last 30 days)
        $usageTrends = $this->getUsageTrends($user);
        
        // Get model usage distribution
        $modelUsage = $this->getModelUsage($user);
        
        // Get language distribution
        $languageStats = $this->getLanguageStats($user);
        
        // Get top conversations by tokens/cost
        $topConversations = $this->getTopConversations($user);
        
        return Inertia::render('AIDashboard', [
            'stats' => $stats,
            'recentConversations' => $recentConversations,
            'usageTrends' => $usageTrends,
            'modelUsage' => $modelUsage,
            'languageStats' => $languageStats,
            'topConversations' => $topConversations,
            'auth' => [
                'user' => $user
            ]
        ]);
    }
    
    /**
     * Get user statistics
     */
    private function getUserStats($user)
    {
        $totalConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->count();
        
        $totalMessages = AISearchHistory::where('user_id', $user->id)->count();
        
        // Calculate total tokens and cost
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->get();
        
        $totalTokens = 0;
        $totalCost = 0;
        
        foreach ($conversations as $conversation) {
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
            
            $totalTokens += $conversationTokens;
            $totalCost += $conversationTokens > 0 ? ($conversationTokens / 1000) * 0.01 : 0;
        }
        
        // Get today's activity
        $today = Carbon::today();
        $todayConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->whereDate('created_at', $today)
            ->count();
        
        $todayMessages = AISearchHistory::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();
        
        // Get this week's activity
        $thisWeek = Carbon::now()->startOfWeek();
        $weekConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->whereDate('created_at', '>=', $thisWeek)
            ->count();
        
        // Get average conversation length
        $avgMessagesPerConversation = $totalConversations > 0 
            ? round($totalMessages / $totalConversations, 1) 
            : 0;
        
        // Get favorite model
        $favoriteModel = AISearchHistory::where('user_id', $user->id)
            ->whereNotNull('model')
            ->select('model', DB::raw('count(*) as count'))
            ->groupBy('model')
            ->orderBy('count', 'desc')
            ->first();
        
        // Get last active
        $lastActive = AISearchHistory::where('user_id', $user->id)
            ->latest('created_at')
            ->first();
        
        return [
            'totalConversations' => $totalConversations,
            'totalMessages' => $totalMessages,
            'totalTokens' => $totalTokens,
            'totalCost' => round($totalCost, 4),
            'todayConversations' => $todayConversations,
            'todayMessages' => $todayMessages,
            'weekConversations' => $weekConversations,
            'avgMessagesPerConversation' => $avgMessagesPerConversation,
            'favoriteModel' => $favoriteModel ? $favoriteModel->model : 'N/A',
            'lastActive' => $lastActive ? $lastActive->created_at->diffForHumans() : 'Never',
            'memberSince' => $user->created_at->format('M d, Y'),
        ];
    }
    
    /**
     * Get recent conversations
     */
    private function getRecentConversations($user, $limit = 10)
    {
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $conversations->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
            
            // Calculate conversation tokens
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
            
            return [
                'id' => $conversation->id,
                'slug' => $conversation->slug,
                'conversation_id' => $conversation->conversation_id,
                'conversation_title' => $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                'query' => $conversation->query,
                'created_at' => $conversation->created_at->toISOString(),
                'created_at_formatted' => $conversation->created_at->format('M d, Y \a\t h:i A'),
                'created_at_diff' => $conversation->created_at->diffForHumans(),
                'message_count' => $messageCount,
                'total_tokens' => $conversationTokens,
                'conversation_cost' => round($conversationCost, 4),
                'model' => $conversation->model,
            ];
        });
    }
    
    /**
     * Get usage trends for the last 30 days
     */
    private function getUsageTrends($user)
    {
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subDays(29);
        
        $trends = [];
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            
            $conversations = AISearchHistory::where('user_id', $user->id)
                ->whereNull('parent_id')
                ->whereDate('created_at', $currentDate)
                ->count();
            
            $messages = AISearchHistory::where('user_id', $user->id)
                ->whereDate('created_at', $currentDate)
                ->count();
            
            // Calculate tokens for the day
            $dayMessages = AISearchHistory::where('user_id', $user->id)
                ->whereDate('created_at', $currentDate)
                ->get();
            
            $tokens = 0;
            foreach ($dayMessages as $message) {
                if ($message->usage) {
                    $usage = is_string($message->usage) ? json_decode($message->usage, true) : $message->usage;
                    $tokens += $usage['total_tokens'] ?? 0;
                } else {
                    $tokens += $message->total_tokens ?? 0;
                }
            }
            
            $trends[] = [
                'date' => $currentDate->format('M d'),
                'date_iso' => $currentDate->toISOString(),
                'conversations' => $conversations,
                'messages' => $messages,
                'tokens' => $tokens,
                'cost' => round(($tokens / 1000) * 0.01, 4),
            ];
            
            $currentDate->addDay();
        }
        
        return $trends;
    }
    
    /**
     * Get model usage distribution
     */
    private function getModelUsage($user)
    {
        $models = AISearchHistory::where('user_id', $user->id)
            ->whereNotNull('model')
            ->select('model', DB::raw('count(*) as count'))
            ->groupBy('model')
            ->orderBy('count', 'desc')
            ->get();
        
        $total = $models->sum('count');
        
        return $models->map(function ($model) use ($total) {
            return [
                'model' => $model->model,
                'count' => $model->count,
                'percentage' => $total > 0 ? round(($model->count / $total) * 100, 1) : 0,
            ];
        });
    }
    
    /**
     * Get language statistics
     */
    private function getLanguageStats($user)
    {
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->get();
        
        $languages = [
            'en' => 0,
            'zh' => 0,
            'ja' => 0,
            'ko' => 0,
            'ar' => 0,
            'other' => 0,
        ];
        
        foreach ($conversations as $conversation) {
            $lang = $this->detectLanguage($conversation->query);
            if (isset($languages[$lang])) {
                $languages[$lang]++;
            } else {
                $languages['other']++;
            }
        }
        
        $total = $conversations->count();
        
        $result = [];
        foreach ($languages as $code => $count) {
            if ($count > 0) {
                $result[] = [
                    'code' => $code,
                    'name' => $this->getLanguageName($code),
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                ];
            }
        }
        
        return $result;
    }
    
    /**
     * Get top conversations by tokens/cost
     */
    private function getTopConversations($user, $limit = 5)
    {
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $conversationData = [];
        
        foreach ($conversations as $conversation) {
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
            
            $conversationData[] = [
                'id' => $conversation->id,
                'slug' => $conversation->slug,
                'conversation_title' => $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                'message_count' => $conversationMessages->count(),
                'total_tokens' => $conversationTokens,
                'conversation_cost' => round($conversationCost, 4),
                'created_at' => $conversation->created_at->toISOString(),
                'created_at_formatted' => $conversation->created_at->format('M d, Y'),
            ];
        }
        
        // Sort by tokens (most used first)
        usort($conversationData, function ($a, $b) {
            return $b['total_tokens'] <=> $a['total_tokens'];
        });
        
        return array_slice($conversationData, 0, $limit);
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
        
        if (preg_match('/[\x{4e00}-\x{9fff}]/u', $query)) {
            return mb_substr($query, 0, 30, 'UTF-8') . (mb_strlen($query) > 30 ? '...' : '');
        }
        
        return \Illuminate\Support\Str::limit($query, 50);
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
     * Get language name from code
     */
    private function getLanguageName($code)
    {
        $names = [
            'en' => 'English',
            'zh' => '中文',
            'ja' => '日本語',
            'ko' => '한국어',
            'ar' => 'العربية',
            'other' => 'Other',
        ];
        
        return $names[$code] ?? $code;
    }
    
    /**
     * Export user data as CSV
     */
    public function exportData()
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $filename = 'ai-conversations-' . date('Y-m-d') . '.csv';
        $handle = fopen('php://temp', 'w+');
        
        // Add CSV headers
        fputcsv($handle, [
            'Conversation ID',
            'Title',
            'Date',
            'Messages',
            'Model',
            'Total Tokens',
            'Cost ($)',
            'First Query',
        ]);
        
        foreach ($conversations as $conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
            
            // Calculate conversation tokens
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
            
            fputcsv($handle, [
                $conversation->conversation_id,
                $conversation->conversation_title ?? $this->generateTitleFromQuery($conversation->query),
                $conversation->created_at->format('Y-m-d H:i:s'),
                $messageCount,
                $conversation->model,
                $conversationTokens,
                round($conversationCost, 4),
                $conversation->query,
            ]);
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        
        return response($content)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}