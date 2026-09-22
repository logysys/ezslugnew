<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\Domain;
use App\Models\Frontpage;
use App\Models\Customdomain;
use App\Models\Sell;
use App\Models\TokenTransaction;
use App\Models\UserBalance;
use App\Models\Template;
use App\Models\PendingDomainTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with comprehensive analytics
     */
    public function index()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        
        $user = Auth::user();
        
        // Get user's balance
        $userBalance = UserBalance::where('user_id', $user->id)->first();
        
        // Get dashboard statistics
        $stats = $this->getDashboardStats($user);
        
        // Get recent activity
        $recentActivity = $this->getRecentActivity($user);
        
        // Get domains
        $domains = $this->getUserDomains($user);
        
        // Get funnel performance
        $funnelStats = $this->getFunnelStats($user);
        
        // Get token transactions
        $transactions = $this->getRecentTransactions($user);
        
        // Get active template if any
        $theme = Template::where('user_id', $user->id)
            ->orWhere('user_id', 0) // System templates
            ->where('status', 'active')
            ->orderBy('user_id', 'desc') // Prefer user's templates over system ones
            ->first();

        return Inertia::render('dashboard', [
            'template' => $template,
            'auth' => [
                'user' => $user
            ],
            'theme' => $theme,
            'userBalance' => $userBalance,
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'domains' => $domains,
            'funnelStats' => $funnelStats,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats($user)
    {
        // Count user's funnels
        $funnelCount = EzFunnel::where('user_id', $user->id)->count();
        
        // Count user's templates (if they have any custom templates)
        $templateCount = Template::where('user_id', $user->id)->count();
        
        // Count total transactions
        $transactionCount = TokenTransaction::where('user_id', $user->id)->count();
        
        // Get token balance - preserve 2 decimal places
        $tokenBalance = UserBalance::where('user_id', $user->id)
            ->value('bee_points_balance') ?? 0;

        // Calculate percentage changes only if we have previous data to compare
        // For now, we'll show N/A if there's no meaningful data
        $changes = [
            'funnels' => $funnelCount > 0 ? 'N/A' : null,
            'templates' => $templateCount > 0 ? 'N/A' : null,
            'transactions' => $transactionCount > 0 ? 'N/A' : null,
            'token_balance' => $tokenBalance > 0 ? 'N/A' : null
        ];

        return [
            'funnels' => [
                'value' => $funnelCount,
                'change' => $changes['funnels'],
                'trend' => $changes['funnels'] === 'N/A' ? 'neutral' : ($changes['funnels'] >= 0 ? 'up' : 'down')
            ],
            'templates' => [
                'value' => $templateCount,
                'change' => $changes['templates'],
                'trend' => $changes['templates'] === 'N/A' ? 'neutral' : ($changes['templates'] >= 0 ? 'up' : 'down')
            ],
            'transactions' => [
                'value' => $transactionCount,
                'change' => $changes['transactions'],
                'trend' => $changes['transactions'] === 'N/A' ? 'neutral' : ($changes['transactions'] >= 0 ? 'up' : 'down')
            ],
            'token_balance' => [
                'value' => number_format($tokenBalance, 2), // Keep 2 decimal places
                'change' => $changes['token_balance'],
                'trend' => $changes['token_balance'] === 'N/A' ? 'neutral' : ($changes['token_balance'] >= 0 ? 'up' : 'down')
            ]
        ];
    }

    /**
     * Get recent activity data
     */
    private function getRecentActivity($user)
    {
        $activities = [];
        
        // Get recent funnels created
        $recentFunnels = EzFunnel::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();
        
        foreach ($recentFunnels as $funnel) {
            $activities[] = [
                'icon' => 'faProjectDiagram',
                'color' => 'text-blue-500',
                'bgColor' => 'bg-blue-100',
                'title' => 'New funnel created',
                'description' => "Funnel #{$funnel->token} was created",
                'time' => $funnel->created_at->diffForHumans()
            ];
        }
        
        // Get recent token purchases
        $recentPurchases = TokenTransaction::where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->orderBy('created_at', 'desc')
            ->take(2)
            ->get();
        
        foreach ($recentPurchases as $purchase) {
            $activities[] = [
                'icon' => 'faShoppingCart',
                'color' => 'text-emerald-500',
                'bgColor' => 'bg-emerald-100',
                'title' => 'Token purchase',
                'description' => number_format($purchase->amount, 2) . ' tokens purchased', // Keep 2 decimal places
                'time' => $purchase->created_at->diffForHumans()
            ];
        }
        
        // Get recent domain additions
        $recentDomains = Domain::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(2)
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
        
        // Get recent custom domain additions
        $recentCustomDomains = Customdomain::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(1)
            ->get();
        
        foreach ($recentCustomDomains as $domain) {
            $activities[] = [
                'icon' => 'faLink',
                'color' => 'text-purple-500',
                'bgColor' => 'bg-purple-100',
                'title' => 'Custom domain added',
                'description' => "Custom domain \"{$domain->domain}\" configured",
                'time' => $domain->created_at->diffForHumans()
            ];
        }
        
        // If no activities found, add a placeholder
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
        
        // Sort activities by time (newest first) and return top 4
        usort($activities, function($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });
        
        return array_slice($activities, 0, 4);
    }

    /**
     * Get user's domains
     */
    private function getUserDomains($user)
    {
        $domains = Domain::where('user_id', $user->id)
            ->select('domain as name','domainselected as domain', 'expire', 'created_at')
			->orderBy('created_at', 'desc')
            ->get()
            ->map(function($domain) {
                return [
                    'name' => $domain->name.'.'.$domain->domain,
                    'status' => 'Active',
                    'expires' => $domain->created_at ? Carbon::parse($domain->created_at)->format('Y-m-d') : 'N/A'
                ];
            });
        
        $customDomains = Customdomain::where('user_id', $user->id)
            ->select('domain as name','domainselected as domain', 'expire', 'created_at')
            ->get()
            ->map(function($domain) {
                return [
                    'name' => $domain->domain.'/'.$domain->name,
                    'status' => 'Active',
                    'expires' => $domain->created_at ? Carbon::parse($domain->created_at)->format('Y-m-d') : 'N/A'
                ];
            });
        
        $allDomains = $domains->merge($customDomains);
        
        // If no domains found, add a placeholder
        if ($allDomains->isEmpty()) {
            $allDomains->push([
                'name' => 'No domains registered',
                'status' => 'Inactive',
                'expires' => 'N/A'
            ]);
        }
        
        return $allDomains->take(4);
    }

    /**
     * Get funnel performance statistics
     */
    private function getFunnelStats($user)
    {
        // Count total domains
        $domainCount = Domain::where('user_id', $user->id)->count();
        
        // Count custom domains
        $customDomainCount = Customdomain::where('user_id', $user->id)->count();
        
        // Calculate total sales from domains - preserve 2 decimal places
        $totalSales = Sell::where('user_id', $user->id)->where('status', 'SELLED')->sum('price');
        
        // Calculate pending sales (transfers in progress) - preserve 2 decimal places
        $pendingSales = PendingDomainTransfer::where('seller_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Calculate percentage changes only if we have data
        $changes = [
            'domains' => $domainCount > 0 ? 'N/A' : null,
            'custom_domains' => $customDomainCount > 0 ? 'N/A' : null,
            'total_sales' => $totalSales > 0 ? 'N/A' : null,
            'pending_sales' => $pendingSales > 0 ? 'N/A' : null
        ];

        return [
            'domains' => [
                'value' => $domainCount,
                'change' => $changes['domains'],
                'trend' => $changes['domains'] === 'N/A' ? 'neutral' : 'up'
            ],
            'custom_domains' => [
                'value' => $customDomainCount,
                'change' => $changes['custom_domains'],
                'trend' => $changes['custom_domains'] === 'N/A' ? 'neutral' : 'up'
            ],
            'total_sales' => [
                'value' => number_format($totalSales, 2), // Keep 2 decimal places
                'change' => $changes['total_sales'],
                'trend' => $changes['total_sales'] === 'N/A' ? 'neutral' : 'up'
            ],
            'pending_sales' => [
                'value' => number_format($pendingSales, 2), // Keep 2 decimal places
                'change' => $changes['pending_sales'],
                'trend' => $changes['pending_sales'] === 'N/A' ? 'neutral' : 'up'
            ]
        ];
    }

    /**
     * Get recent token transactions
     */
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
            
        // If no transactions found, add a placeholder
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

    /**
     * Map transaction type to readable format
     */
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
     * Refresh dashboard data (AJAX endpoint)
     */
    public function refresh(Request $request)
    {
        $user = Auth::user();
        
        $stats = $this->getDashboardStats($user);
        $recentActivity = $this->getRecentActivity($user);
        $transactions = $this->getRecentTransactions($user);
        
        return response()->json([
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'transactions' => $transactions,
            'refreshed_at' => now()->toDateTimeString()
        ]);
    }
}