<?php

namespace App\Http\Controllers;

use App\Models\AIUserSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\ImageOptimizer\OptimizerChainFactory;

class AIUserSettingsController extends Controller
{
    /**
     * Display the AI user settings page.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Get or create settings for the user
        $settings = AIUserSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['guest_ai_enabled' => true]
        );
        
        return Inertia::render('AIUserSettings', [
            'settings' => $settings,
            'user' => $user
        ]);
    }
    
    /**
     * Update user profile information.
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . auth()->id(),
            'avatar' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,webp,bmp'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();

        try {
            // Handle avatar upload if present
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                
                // Validate the file
                if (!$file->isValid()) {
                    throw new \Exception('File upload failed: ' . $file->getErrorMessage());
                }

                // Check file type (additional validation)
                $allowedMimeTypes = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
                ];
                
                $mimeType = $file->getMimeType();
                
                if (!in_array($mimeType, $allowedMimeTypes)) {
                    throw new \Exception('File type not allowed. Only JPEG, PNG, GIF, WEBP, and BMP images are permitted.');
                }

                // Delete old avatar if exists
                if ($user->avatar && file_exists(public_path($user->avatar))) {
                    if (!unlink(public_path($user->avatar))) {
                        \Log::warning('Failed to delete old avatar: ' . $user->avatar);
                    }
                }
                
                // Get file information
                $extension = $file->getClientOriginalExtension();
                
                if (empty($extension)) {
                    $extension = $file->guessExtension() ?? 'jpg';
                }
                
                // Generate a unique filename
                $avatarName = time() . '_' . Str::random(16) . '.' . $extension;
                
                // Set destination path
                $destinationPath = public_path('avatar');
                
                // Create directory if it doesn't exist
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }
                
                // Move the file to public/avatar directory
                $file->move($destinationPath, $avatarName);
                
                // Full path to the uploaded file
                $fullPath = $destinationPath . '/' . $avatarName;
                
                // Optimize the image
                try {
                    $optimizerChain = OptimizerChainFactory::create();
                    $optimizerChain->optimize($fullPath);
                    \Log::info('Image optimized successfully: ' . $avatarName);
                } catch (\Exception $e) {
                    \Log::warning('Image optimization failed: ' . $e->getMessage());
                    // Continue even if optimization fails
                }
                
                // Store the relative path in database
                $user->avatar = '/avatar/' . $avatarName;
            }
            
            $user->name = $request->name;
            $user->email = $request->email;
            $user->save();
            
            // Refresh the user to get all attributes
            $user->refresh();
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Profile update failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Remove user avatar.
     */
    public function removeAvatar(Request $request)
    {
        $user = auth()->user();
        
        if ($user->avatar && file_exists(public_path($user->avatar))) {
            if (unlink(public_path($user->avatar))) {
                $user->avatar = null;
                $user->save();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Avatar removed successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to remove avatar file'
                ], 500);
            }
        }
        
        $user->avatar = null;
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Avatar removed successfully'
        ]);
    }
    
    /**
     * Update user password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);
        
        $user = auth()->user();
        
        // Check if user has a password set (for social login users)
        if (is_null($user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'You logged in using social media. Please use "Forgot Password" to set a password first.'
            ], 422);
        }
        
        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }
        
        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }
    
    /**
     * Update the guest_ai_enabled setting.
     */
    public function update(Request $request)
    {
        $request->validate([
            'guest_ai_enabled' => 'required|boolean',
        ]);
        
        $user = auth()->user();
        
        $settings = AIUserSetting::updateOrCreate(
            ['user_id' => $user->id],
            ['guest_ai_enabled' => $request->guest_ai_enabled]
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }
}