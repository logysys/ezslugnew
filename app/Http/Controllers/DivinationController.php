<?php

namespace App\Http\Controllers;

use App\Services\AIProviderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DivinationController extends Controller
{
    protected AIProviderService $aiService;

    public function __construct(AIProviderService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function index()
    {
        return view('divination');
    }

    public function divinate(Request $request): JsonResponse
    {
        $request->validate([
            'character' => 'required|string|max:2|regex:/^[\x{4e00}-\x{9fff}]+$/u',
            'theme' => 'required|string',
            'agent' => 'required|string|in:openai,deepseek,gemini,perplexity'
        ]);

        try {
            $result = $this->aiService->callAgent(
                $request->input('agent'),
                $request->input('character'),
                $request->input('theme')
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}