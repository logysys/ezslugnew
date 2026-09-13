<?php

namespace App\Http\Controllers;

use App\Services\DivinationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DivinationtwoController extends Controller
{
    protected DivinationService $divinationService;

    public function __construct(DivinationService $divinationService)
    {
        $this->divinationService = $divinationService;
    }

    public function index()
    {
        return view('divinationtwo');
    }

    public function divinate(Request $request): JsonResponse
    {
        $request->validate([
            'character' => 'required|string|max:2|regex:/^[\x{4e00}-\x{9fff}]+$/u',
            'theme' => 'required|string|max:100',
            'agent' => 'required|string|in:openai,deepseek,gemini,perplexity'
        ]);

        try {
            $result = $this->divinationService->divinate(
                $request->input('character'),
                $request->input('theme'),
                $request->input('agent')
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            \Log::error('Divination error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}