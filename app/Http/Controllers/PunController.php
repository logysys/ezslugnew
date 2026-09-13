<?php

namespace App\Http\Controllers;

use App\Services\PunService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PunController extends Controller
{
    protected PunService $punService;

    public function __construct(PunService $punService)
    {
        $this->punService = $punService;
    }

    public function index()
    {
        return view('pun');
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'word' => 'required|string|max:100'
        ]);

        try {
            $word = $request->input('word');
            $puns = $this->punService->generatePuns($word);

            return response()->json([
                'success' => true,
                'puns' => $puns,
                'cached' => $this->punService->isCached($word)
            ]);
        } catch (\Exception $e) {
            \Log::error('Pun generation error:', [
                'word' => $request->input('word'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return fallback puns
            $fallback = $this->punService->generateFallbackPuns($request->input('word'));

            return response()->json([
                'success' => true,
                'puns' => $fallback,
                'cached' => false,
                'fallback' => true
            ]);
        }
    }
}