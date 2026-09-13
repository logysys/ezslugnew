<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\User;
use App\Models\Frontpage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CouponUsageController extends Controller
{
    /**
     * Display a listing of coupon usages (User Panel)
     */
    public function index(Request $request)
    {
        $template = Frontpage::where('frontpages.id', 1)
                ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
                ->select('templates.*')
                ->first();
                
        $query = CouponUsage::with(['coupon'])
            ->where('user_id', auth()->id());

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('coupon_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('coupon_code')) {
            $query->where('coupon_code', $request->coupon_code);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('used_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('used_at', '<=', $request->date_to);
        }

        $usages = $query->orderBy('used_at', 'desc')->paginate(15);

        // Get all coupons for filter dropdown
        $coupons = Coupon::where('status', 'Active')->get();

        // Calculate user savings
        $totalSaved = $this->calculateUserSavings(auth()->id());

        return Inertia::render('CouponUsageList', [
            'usages' => $usages->items(),
            'template' => $template,
            'pagination' => [
                'current_page' => $usages->currentPage(),
                'last_page' => $usages->lastPage(),
                'per_page' => $usages->perPage(),
                'total' => $usages->total(),
            ],
            'filters' => $request->only(['search', 'coupon_code', 'date_from', 'date_to']),
            'coupons' => $coupons,
            'totalSaved' => $totalSaved,
            'auth' => [
                'user' => auth()->user(),
            ]
        ]);
    }

    /**
     * API endpoint for loading more usages (AJAX)
     */
    public function loadMore(Request $request)
    {
        $query = CouponUsage::with(['coupon'])
            ->where('user_id', auth()->id());

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('coupon_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('coupon_code')) {
            $query->where('coupon_code', $request->coupon_code);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('used_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('used_at', '<=', $request->date_to);
        }

        $usages = $query->orderBy('used_at', 'desc')->paginate(15);

        return response()->json([
            'usages' => $usages->items(),
            'pagination' => [
                'current_page' => $usages->currentPage(),
                'last_page' => $usages->lastPage(),
                'per_page' => $usages->perPage(),
                'total' => $usages->total(),
            ],
        ]);
    }

    /**
     * Get user's coupon usage statistics
     */
    public function getStatistics(Request $request)
    {
        $userId = auth()->id();
        
        $stats = [
            'total_usages' => CouponUsage::where('user_id', $userId)->count(),
            'total_saved' => $this->calculateUserSavings($userId),
            'usages_by_month' => CouponUsage::where('user_id', $userId)
                ->select(
                    DB::raw('DATE_FORMAT(used_at, "%Y-%m") as month'),
                    DB::raw('count(*) as count')
                )
                ->groupBy('month')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get(),
            'most_used_coupons' => CouponUsage::where('user_id', $userId)
                ->select(
                    'coupon_code',
                    DB::raw('count(*) as usage_count')
                )
                ->groupBy('coupon_code')
                ->orderBy('usage_count', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Calculate total savings from coupon usage
     */
    private function calculateUserSavings($userId)
    {
        $usages = CouponUsage::with('coupon')
            ->where('user_id', $userId)
            ->get();
        
        $totalSaved = 0;
        foreach ($usages as $usage) {
            if ($usage->coupon && $usage->coupon->type === 'fixed') {
                $totalSaved += $usage->coupon->offer;
            }
        }
        
        return $totalSaved;
    }

    /**
     * Display a specific usage record
     */
    public function show($id)
    {
        $usage = CouponUsage::with(['coupon'])
            ->where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();
        
        return response()->json($usage);
    }
}