<?php

namespace App\Http\Controllers;

use App\Services\DreamWeaverService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DreamController extends Controller
{
    protected DreamWeaverService $dreamService;

    public function __construct(DreamWeaverService $dreamService)
    {
        $this->dreamService = $dreamService;
    }

    public function index()
    {
        return view('dream');
    }

    public function weave(Request $request): JsonResponse
    {
        $request->validate([
            'word' => 'required|string|max:100',
            'style' => 'required|string|in:surreal,poetic,dark,scifi,magic',
            'mode' => 'required|string|in:kimi,perplexity,offline'
        ]);

        try {
            $result = $this->dreamService->generate(
                $request->input('word'),
                $request->input('style'),
                $request->input('mode')
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            \Log::error('Dream generation error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Fallback to offline mode
            $fallback = $this->dreamService->offlineGenerate(
                $request->input('word'),
                $request->input('style')
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'content' => $fallback['content'],
                    'tokens' => null,
                    'fallback' => true,
                    'mode' => 'offline'
                ]
            ]);
        }
    }

    public function testPerplexity(Request $request): JsonResponse
    {
        try {
            $status = $this->dreamService->testPerplexity();
            return response()->json([
                'success' => true,
                'online' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'online' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}