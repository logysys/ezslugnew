<?php

namespace App\Http\Controllers;

use App\Models\NumerologySearchAll;
use App\Services\NumerologyOracleServiceAll;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NumerologyOracleAllController extends Controller
{
    protected NumerologyOracleServiceAll $oracleService;

    public function __construct(NumerologyOracleServiceAll $oracleService)
    {
        $this->oracleService = $oracleService;
    }

    public function index()
    {
        $languages = $this->oracleService->getLanguages();
        return view('numerologyoracle', compact('languages'));
    }

    public function predict(Request $request): JsonResponse
    {
        $request->validate([
            'number' => 'required|integer|min:1|max:999999',
            'agent' => 'required|string|in:openai,kimi,perplexity,gemini,deepseek',
            'language' => 'sometimes|string|in:en,es,fr,de,zh,ja,ko,ar,pt,hi,it,ru,tl'
        ]);

        try {
            $number = (int) $request->input('number');
            $agent = $request->input('agent');
            $language = $request->input('language', 'en');

            $result = $this->oracleService->getNumerology($number, $agent, $language);
            $cost = $this->oracleService->calculateCost(
                $agent,
                $result['input_tokens'],
                $result['output_tokens']
            );

            // Store in database
            $history = NumerologySearchAll::create([
                'user_number' => $number,
                'agent_used' => $agent,
                'language' => $language,
                'watch_out' => $result['watch'],
                'expect' => $result['expect'],
                'extra_nuance' => $result['extra'],
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'cost_usd' => $cost['total']
            ]);

            $pricing = $this->oracleService->getPricing($agent);
            $languages = $this->oracleService->getLanguages();

            return response()->json([
                'success' => true,
                'data' => [
                    'watch' => $result['watch'],
                    'expect' => $result['expect'],
                    'extra' => $result['extra'],
                    'input_tokens' => $result['input_tokens'],
                    'output_tokens' => $result['output_tokens'],
                    'input_cost' => $cost['input_cost'],
                    'output_cost' => $cost['output_cost'],
                    'total_cost' => $cost['total'],
                    'agent' => $result['agent'],
                    'language' => $language,
                    'language_name' => $languages[$language]['name'] ?? 'English',
                    'pricing' => $pricing,
                    'history_id' => $history->id
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Numerology prediction error:', [
                'number' => $request->input('number'),
                'agent' => $request->input('agent'),
                'language' => $request->input('language', 'en'),
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
            $history = NumerologySearchAll::orderBy('created_at', 'desc')
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
            $totalSearches = NumerologySearchAll::count();
            $totalCost = NumerologySearchAll::sum('cost_usd');

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
            NumerologySearchAll::truncate();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}