<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class EffectController extends Controller
{
    /**
     * Display the 3D effect based on the effect parameter
     */
    public function show(Request $request)
    {
        // Get all parameters from the request
        $effect = $request->query('effect', 'bee');
        $landingPage = $request->query('landing_page', '/');
        $brandMessage = $request->query('brand_message', '3D Effect');
        $avatarLink = $request->query('avatar_link', '');
        $movingPattern = $request->query('moving_pattern', 'topright');
        
        // List of valid effects
        $validEffects = [
            'bee', 'saucer', 'bird', 'plane', 'real', 'coffee', 
            'time', 'fire', 'burger', 'ball', 'superhero', 'none'
        ];
        
        // Validate the effect parameter
        if (!in_array($effect, $validEffects)) {
            $effect = 'bee';
        }
        
        // Validate moving pattern
        $validPatterns = [
            'topright', 'bottomleft', 'leftbottom', 'lefttop', 'none'
        ];
        
        if (!in_array($movingPattern, $validPatterns)) {
            $movingPattern = 'topright';
        }
        
        // Prepare the effect data for the EffectsDisplay component
        $effectData = [
            [
                'moving_effect' => $effect,
                'moving_pattern' => $movingPattern,
                'avatar_link' => $avatarLink,
                'landing_page' => $landingPage,
                'brand_message' => $brandMessage,
                'effect_type' => '3d'
            ]
        ];
        
        // Use Inertia to render the view
        return Inertia::render('EffectView', [
            'effect' => $effectData,
            'effectType' => $effect,
            'showEffectsDisplay' => true,
            'landingPage' => $landingPage,
            'brandMessage' => $brandMessage,
            'avatarLink' => $avatarLink,
            'movingPattern' => $movingPattern
        ]);
    }
    
    /**
     * API endpoint to get effect data
     */
    public function getEffectData(Request $request)
    {
        $effect = $request->query('effect', 'bee');
        $landingPage = $request->query('landing_page', '/');
        $brandMessage = $request->query('brand_message', '3D Effect');
        $avatarLink = $request->query('avatar_link', '');
        $movingPattern = $request->query('moving_pattern', 'topright');
        
        $validEffects = [
            'bee', 'saucer', 'bird', 'plane', 'real', 'coffee', 
            'time', 'fire', 'burger', 'ball', 'superhero', 'none'
        ];
        
        if (!in_array($effect, $validEffects)) {
            return response()->json(['error' => 'Invalid effect'], 400);
        }
        
        $validPatterns = [
            'topright', 'bottomleft', 'leftbottom', 'lefttop', 'none'
        ];
        
        if (!in_array($movingPattern, $validPatterns)) {
            $movingPattern = 'topright';
        }
        
        return response()->json([
            'effect' => $effect,
            'data' => [
                [
                    'moving_effect' => $effect,
                    'moving_pattern' => $movingPattern,
                    'avatar_link' => $avatarLink,
                    'landing_page' => $landingPage,
                    'brand_message' => $brandMessage,
                    'effect_type' => '3d'
                ]
            ]
        ]);
    }
}