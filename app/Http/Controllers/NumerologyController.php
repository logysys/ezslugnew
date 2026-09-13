<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use App\Services\NumerologyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NumerologyController extends Controller
{
    protected NumerologyService $numerologyService;

    public function __construct(NumerologyService $numerologyService)
    {
        $this->numerologyService = $numerologyService;
    }

    public function index()
    {
        return view('numerology');
    }

    public function predict(Request $request): JsonResponse
    {
        $request->validate([
            'number' => 'required|integer|min:1|max:999999',
            'agent' => 'required|string|in:openai,kimi,perplexity,gemini,deepseek'
        ]);

        try {
            $number = (int) $request->input('number');
            $agent = $request->input('agent');

            $result = $this->numerologyService->getNumerology($number, $agent);
            $cost = $this->numerologyService->calculateCost(
                $agent,
                $result['input_tokens'],
                $result['output_tokens']
            );

            // Store in database
            $history = SearchHistory::create([
                'user_number' => $number,
                'agent_used' => $agent,
                'watch_out' => $result['watch'],
                'expect' => $result['expect'],
                'extra_nuance' => $result['extra'],
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'cost_usd' => $cost
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'watch' => $result['watch'],
                    'expect' => $result['expect'],
                    'extra' => $result['extra'],
                    'input_tokens' => $result['input_tokens'],
                    'output_tokens' => $result['output_tokens'],
                    'cost' => $cost,
                    'agent' => $result['agent'],
                    'history_id' => $history->id
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Numerology prediction error:', [
                'number' => $request->input('number'),
                'agent' => $request->input('agent'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getHistory(Request $request): JsonResponse
    {
        try {
            $history = SearchHistory::orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(Request $request): JsonResponse
    {
        try {
            $totalSearches = SearchHistory::count();
            $totalCost = SearchHistory::sum('cost_usd');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_searches' => $totalSearches,
                    'total_cost' => $totalCost
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function clearHistory(Request $request): JsonResponse
    {
        try {
            SearchHistory::truncate();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}