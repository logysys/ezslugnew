<?php

namespace App\Http\Controllers;

use App\Models\Loadframe;
use Illuminate\Http\Request;

class LoadframeController extends Controller
{
    public function demo()
    {
        $demoFrames = Loadframe::where('status', 1)->get();
        
        if ($demoFrames->isEmpty()) {
            return response()->json([
                'message' => 'No active demo frames found'
            ], 404);
        }

        return response()->json([
            'fields' => $demoFrames->map(function($frame) {
                return [
                    'emoji_marker' => '3️⃣',
                    'font_size' => '14px',
                    'caption' => '',
                    'url' => $frame->content,
                    'pinned' => false
                ];
            })->toArray()
        ]);
    }
}