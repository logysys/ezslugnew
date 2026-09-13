<?php
// app/Http/Controllers/UnifiedDashboardController.php

namespace App\Http\Controllers;

use App\Models\AISearchHistory;
use App\Models\Domain;
use App\Models\TokenTransaction;
use App\Models\UserBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class UnifiedDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }

        $userBalance = UserBalance::where('user_id', $user->id)->first();

        // AI Dashboard Data
        $aiStats = $this->getAIStats($user);
        $recentConversations = $this->getRecentConversations($user);
        $modelUsage = $this->getModelUsage($user);
        $languageStats = $this->getLanguageStats($user);
        $topConversations = $this->getTopConversations($user);

        // Business Dashboard Data (without funnel stats)
        $businessStats = $this->getBusinessStats($user);
        $recentActivity = $this->getRecentActivity($user);
        $domains = $this->getUserDomains($user);
        $transactions = $this->getRecentTransactions($user);

        return Inertia::render('UnifiedDashboard', [
            'auth' => ['user' => $user],
            'userBalance' => $userBalance,

            // AI Section
            'aiStats' => $aiStats,
            'recentConversations' => $recentConversations,
            'modelUsage' => $modelUsage,
            'languageStats' => $languageStats,
            'topConversations' => $topConversations,

            // Business Section
            'businessStats' => $businessStats,
            'recentActivity' => $recentActivity,
            'domains' => $domains,
            'transactions' => $transactions,
        ]);
    }

    // ============================================
    // AI STATS METHODS (unchanged)
    // ============================================

    private function getAIStats($user)
    {
        $totalConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->count();

        $totalMessages = AISearchHistory::where('user_id', $user->id)->count();

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

        $today = Carbon::today();
        $todayConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->whereDate('created_at', $today)
            ->count();

        $todayMessages = AISearchHistory::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();

        $thisWeek = Carbon::now()->startOfWeek();
        $weekConversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->whereDate('created_at', '>=', $thisWeek)
            ->count();

        $avgMessagesPerConversation = $totalConversations > 0
            ? round($totalMessages / $totalConversations, 1)
            : 0;

        $favoriteModel = AISearchHistory::where('user_id', $user->id)
            ->whereNotNull('model')
            ->select('model', DB::raw('count(*) as count'))
            ->groupBy('model')
            ->orderBy('count', 'desc')
            ->first();

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

    private function getRecentConversations($user, $limit = 10)
    {
        $conversations = AISearchHistory::where('user_id', $user->id)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $conversations->map(function ($conversation) {
            $messageCount = AISearchHistory::where('conversation_id', $conversation->conversation_id)->count();
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

        usort($conversationData, function ($a, $b) {
            return $b['total_tokens'] <=> $a['total_tokens'];
        });

        return array_slice($conversationData, 0, $limit);
    }

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

    // ============================================
    // BUSINESS STATS METHODS (without funnel stats)
    // ============================================

    private function getBusinessStats($user)
    {
        $transactionCount = TokenTransaction::where('user_id', $user->id)->count();
        $tokenBalance = UserBalance::where('user_id', $user->id)->value('bee_points_balance') ?? 0;
        $domainCount = Domain::where('user_id', $user->id)->count();

        return [
            'transactions' => [
                'value' => $transactionCount,
                'change' => 'N/A',
                'trend' => 'neutral'
            ],
            'token_balance' => [
                'value' => number_format($tokenBalance, 2),
                'change' => 'N/A',
                'trend' => 'neutral'
            ],
            'domains' => [
                'value' => $domainCount,
                'change' => 'N/A',
                'trend' => 'neutral'
            ]
        ];
    }

    private function getRecentActivity($user)
    {
        $activities = [];

        $recentPurchases = TokenTransaction::where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();

        foreach ($recentPurchases as $purchase) {
            $activities[] = [
                'icon' => 'faShoppingCart',
                'color' => 'text-emerald-500',
                'bgColor' => 'bg-emerald-100',
                'title' => 'Token purchase',
                'description' => number_format($purchase->amount, 2) . ' tokens purchased',
                'time' => $purchase->created_at->diffForHumans()
            ];
        }

        $recentDomains = Domain::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();

        foreach ($recentDomains as $domain) {
            $activities[] = [
                'icon' => 'faLink',
                'color' => 'text-purple-500',
                'bgColor' => 'bg-purple-100',
                'title' => 'Domain added',
                'description' => "New domain \"{$domain->domain}\" registered",
                'time' => $domain->created_at->diffForHumans()
            ];
        }

        if (empty($activities)) {
            $activities[] = [
                'icon' => 'faInfoCircle',
                'color' => 'text-gray-500',
                'bgColor' => 'bg-gray-100',
                'title' => 'No recent activity',
                'description' => 'Your recent activities will appear here',
                'time' => Carbon::now()->diffForHumans()
            ];
        }

        usort($activities, function($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });

        return array_slice($activities, 0, 4);
    }

    private function getUserDomains($user)
    {
        $domains = Domain::where('user_id', $user->id)
            ->select('domain as name', 'domainselected as domain', 'expire', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($domain) {
                return [
                    'name' => $domain->name . '.' . $domain->domain,
                    'status' => 'Active',
                    'expires' => $domain->created_at ? Carbon::parse($domain->created_at)->format('Y-m-d') : 'N/A'
                ];
            });

        if ($domains->isEmpty()) {
            $domains->push([
                'name' => 'No domains registered',
                'status' => 'Inactive',
                'expires' => 'N/A'
            ]);
        }

        return $domains->take(4);
    }

    private function getRecentTransactions($user)
    {
        $transactions = TokenTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function($transaction) {
                return [
                    'date' => $transaction->created_at->format('Y-m-d'),
                    'type' => $this->getTransactionType($transaction->transaction_type),
                    'amount' => $transaction->amount,
                    'status' => 'Completed'
                ];
            });

        if ($transactions->isEmpty()) {
            $transactions->push([
                'date' => Carbon::now()->format('Y-m-d'),
                'type' => 'No transactions yet',
                'amount' => 0,
                'status' => 'N/A'
            ]);
        }

        return $transactions;
    }

    private function getTransactionType($type)
    {
        $types = [
            'purchase' => 'Purchase',
            'invoice_paid' => 'Invoice Paid',
            'funnel_usage' => 'Funnel Usage',
            'domain_renewal' => 'Domain Renewal',
            'domain_purchase' => 'Domain Purchase',
            'token_transfer' => 'Token Transfer',
            'commission' => 'Commission'
        ];

        return $types[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }

    /**
     * Export AI conversation data as CSV
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

    /**
     * Refresh dashboard data (AJAX endpoint)
     */
    public function refresh(Request $request)
    {
        $user = Auth::user();

        $businessStats = $this->getBusinessStats($user);
        $recentActivity = $this->getRecentActivity($user);
        $transactions = $this->getRecentTransactions($user);
        $aiStats = $this->getAIStats($user);
        $recentConversations = $this->getRecentConversations($user);

        return response()->json([
            'businessStats' => $businessStats,
            'recentActivity' => $recentActivity,
            'transactions' => $transactions,
            'aiStats' => $aiStats,
            'recentConversations' => $recentConversations,
            'refreshed_at' => now()->toDateTimeString()
        ]);
    }
}