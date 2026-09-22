<?php

namespace App\Http\Controllers;

use App\Services\DreamWeavertwoService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DreamWeaverController extends Controller
{
    protected DreamWeavertwoService $dreamService;

    public function __construct(DreamWeavertwoService $dreamService)
    {
        $this->dreamService = $dreamService;
    }

    public function index()
    {
        return view('dream-weaver');
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
                'word' => $request->input('word'),
                'style' => $request->input('style'),
                'mode' => $request->input('mode'),
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
                    'mode' => 'offline',
                    'model' => 'offline'
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

    public function clearCache(Request $request): JsonResponse
    {
        try {
            $this->dreamService->clearCache();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function cacheStats(Request $request): JsonResponse
    {
        try {
            $stats = $this->dreamService->getCacheStats();
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}