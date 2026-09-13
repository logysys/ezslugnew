<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Exception;

class GoogleController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     * @return \Illuminate\Http\RedirectResponse
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handleGoogleCallback()
    {
        try {
            // Get the user from Google
            $googleUser = Socialite::driver('google')->user();

            // Find user by Google ID or by email
            $user = User::where('google_id', $googleUser->id)->first();

            if (!$user) {
                // If user not found by Google ID, try to find by email
                $user = User::where('email', $googleUser->email)->first();

                if (!$user) {
                    // Create a new user if they don't exist
                    $user = User::create([
                        'name' => $googleUser->name,
                        'email' => $googleUser->email,
                        'google_id' => $googleUser->id,
                        'password' => Hash::make(rand(100000, 999999)), // Dummy password is often set
                        'email_verified_at' => now(),
                    ]);
                } else {
                    // If user exists by email, link the Google ID to their account
                    $user->google_id = $googleUser->id;
                    $user->email_verified_at = now();
                    $user->save();
                }
            }

            // Log in the user
            Auth::login($user);

            // Redirect to a dashboard or home page
            return redirect()->intended('/dashboard'); // Change /dashboard to your desired route

        } catch (Exception $e) {
            // Log the error and redirect back with an error message
            // Log::error($e->getMessage()); // Make sure to import Log facade if using this
            return redirect('/login')->withErrors('Google login failed: ' . $e->getMessage());
        }
    }
}