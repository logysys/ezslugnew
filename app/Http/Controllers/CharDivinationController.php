<?php

namespace App\Http\Controllers;

use App\Models\DivinationHistory;
use App\Services\DivinationTwoService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CharDivinationController extends Controller
{
    protected DivinationTwoService $DivinationTwoService;

    public function __construct(DivinationTwoService $DivinationTwoService)
    {
        $this->DivinationTwoService = $DivinationTwoService;
    }

    public function index()
    {
        $frequencies = $this->DivinationTwoService->getFrequencies();
        $brainwaves = $this->DivinationTwoService->getBrainwaves();
        return view('char-divination', compact('frequencies', 'brainwaves'));
    }

    public function divine(Request $request): JsonResponse
    {
        $request->validate([
            'character' => 'required|string|max:1|regex:/^[\x{4e00}-\x{9fff}]+$/u'
        ]);

        try {
            $character = $request->input('character');
            $result = $this->DivinationTwoService->getDivination($character);
            $cost = $this->DivinationTwoService->calculateCost(
                $result['input_tokens'],
                $result['output_tokens']
            );

            // Store in database
            $history = DivinationHistory::create([
                'character' => $character,
                'parts' => $result['parts'],
                'imagery' => $result['imagery'],
                'fortune' => $result['fortune'],
                'advice' => $result['advice'],
                'frequency_id' => $result['frequency_id'],
                'brainwave_id' => $result['brainwave_id'],
                'frequency_reason' => $result['frequency_reason'],
                'input_tokens' => $result['input_tokens'],
                'output_tokens' => $result['output_tokens'],
                'cost_usd' => $cost
            ]);

            // Get frequency and brainwave details
            $frequency = $this->DivinationTwoService->getFrequencyById($result['frequency_id']);
            $brainwave = $this->DivinationTwoService->getBrainwaveById($result['brainwave_id']);

            return response()->json([
                'success' => true,
                'data' => [
                    'parts' => $result['parts'],
                    'imagery' => $result['imagery'],
                    'fortune' => $result['fortune'],
                    'advice' => $result['advice'],
                    'frequency' => [
                        'id' => $result['frequency_id'],
                        'hz' => $frequency['hz'] ?? 432,
                        'label' => $frequency['label'] ?? '432 Hz',
                        'name' => $frequency['name'] ?? '自然和諧',
                        'query' => $frequency['query'] ?? '432Hz healing frequency',
                        'reason' => $result['frequency_reason']
                    ],
                    'brainwave' => [
                        'id' => $result['brainwave_id'],
                        'label' => $brainwave['label'] ?? '純音',
                        'beat' => $brainwave['beat'] ?? 0,
                        'desc' => $brainwave['desc'] ?? '單一純頻率'
                    ],
                    'input_tokens' => $result['input_tokens'],
                    'output_tokens' => $result['output_tokens'],
                    'cost' => $cost,
                    'history_id' => $history->id
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Divination error:', [
                'character' => $request->input('character'),
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
            $history = DivinationHistory::orderBy('created_at', 'desc')
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
            $total = DivinationHistory::count();
            $totalCost = DivinationHistory::sum('cost_usd');
            $totalInputTokens = DivinationHistory::sum('input_tokens');
            $totalOutputTokens = DivinationHistory::sum('output_tokens');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_divinations' => $total,
                    'total_cost' => $totalCost,
                    'total_input_tokens' => $totalInputTokens,
                    'total_output_tokens' => $totalOutputTokens
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
            DivinationHistory::truncate();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}