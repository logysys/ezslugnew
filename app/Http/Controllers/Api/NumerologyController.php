<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NumerologySearch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NumerologyController extends Controller
{
    /**
     * Store a new numerology search
     */
    public function store(Request $request)
    {
        // Validate incoming data
        $validator = Validator::make($request->all(), [
            'user_number' => 'required|integer|min:1|max:999999',
            'agent_used' => 'required|string|in:openai,kimi,perplexity,gemini,deepseek',
            'watch_out' => 'nullable|string|max:2000',
            'expect' => 'nullable|string|max:2000',
            'extra_nuance' => 'nullable|string|max:1000',
            'input_tokens' => 'required|integer|min:0',
            'output_tokens' => 'required|integer|min:0',
            'cost_usd' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create new record
            $search = NumerologySearch::create([
                'user_number' => $request->user_number,
                'agent_used' => $request->agent_used,
                'watch_out' => $request->watch_out,
                'expect' => $request->expect,
                'extra_nuance' => $request->extra_nuance,
                'input_tokens' => $request->input_tokens,
                'output_tokens' => $request->output_tokens,
                'cost_usd' => $request->cost_usd,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Search stored successfully',
                'data' => [
                    'id' => $search->id,
                    'created_at' => $search->created_at
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to store search',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get search history with pagination
     */
    public function history(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 20);
            $agent = $request->get('agent');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');

            $query = NumerologySearch::query();

            // Apply filters
            if ($agent && in_array($agent, ['openai', 'kimi', 'perplexity', 'gemini', 'deepseek'])) {
                $query->byAgent($agent);
            }

            if ($fromDate) {
                $query->whereDate('created_at', '>=', $fromDate);
            }

            if ($toDate) {
                $query->whereDate('created_at', '<=', $toDate);
            }

            // Order by most recent first
            $history = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $history->items(),
                'pagination' => [
                    'current_page' => $history->currentPage(),
                    'last_page' => $history->lastPage(),
                    'per_page' => $history->perPage(),
                    'total' => $history->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics
     */
    public function stats(Request $request)
    {
        try {
            $agent = $request->get('agent');
            
            $query = NumerologySearch::query();
            
            if ($agent && in_array($agent, ['openai', 'kimi', 'perplexity', 'gemini', 'deepseek'])) {
                $query->byAgent($agent);
            }

            $stats = [
                'total_searches' => $query->count(),
                'total_cost' => $query->sum('cost_usd'),
                'total_input_tokens' => $query->sum('input_tokens'),
                'total_output_tokens' => $query->sum('output_tokens'),
                'avg_cost_per_search' => $query->avg('cost_usd') ?? 0,
                'searches_by_agent' => [],
                'most_active_hours' => [],
                'recent_activity' => []
            ];

            // Get searches by agent
            $agentStats = NumerologySearch::selectRaw('agent_used, COUNT(*) as count, SUM(cost_usd) as total_cost')
                ->groupBy('agent_used')
                ->get();
            
            foreach ($agentStats as $stat) {
                $stats['searches_by_agent'][$stat->agent_used] = [
                    'count' => $stat->count,
                    'total_cost' => $stat->total_cost
                ];
            }

            // Get recent activity (last 7 days)
            $stats['recent_activity'] = NumerologySearch::where('created_at', '>=', now()->subDays(7))
                ->selectRaw('DATE(created_at) as date, COUNT(*) as searches, SUM(cost_usd) as total_cost')
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single search record
     */
    public function show($id)
    {
        try {
            $search = NumerologySearch::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $search
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search record not found'
            ], 404);
        }
    }

    /**
     * Clear all history (with optional agent filter)
     */
    public function clear(Request $request)
    {
        try {
            $agent = $request->get('agent');
            
            $query = NumerologySearch::query();
            
            if ($agent && in_array($agent, ['openai', 'kimi', 'perplexity', 'gemini', 'deepseek'])) {
                $query->byAgent($agent);
                $deletedCount = $query->delete();
                $message = "Deleted {$deletedCount} records for agent: {$agent}";
            } else {
                $deletedCount = $query->delete();
                $message = "Deleted all {$deletedCount} records";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'deleted_count' => $deletedCount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single record
     */
    public function destroy($id)
    {
        try {
            $search = NumerologySearch::findOrFail($id);
            $search->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Record deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete record'
            ], 500);
        }
    }
}