<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Http;

class RedditAuthController extends Controller
{
    public function redirect()
    {
        // CHANGE 1: Add 'submit' scope. 
        // Without this, you can login, but you cannot post.
        return Socialite::driver('reddit')
            ->scopes(['identity', 'submit']) 
            ->redirect();
    }

    public function callback()
    {
        try {
            $redditUser = Socialite::driver('reddit')->user();

            // Match user
            $user = User::where('provider_id', $redditUser->getId())
                    ->orWhere('email', $redditUser->getEmail() ?? $redditUser->getNickname() . '@reddit.placeholder')
                    ->first();

            // CHANGE 2: Prepare the data, specifically saving the TOKENS
            $userData = [
                'name'                => $redditUser->getNickname(),
                'provider_id'         => $redditUser->getId(),
                'reddit_token'        => $redditUser->token,        // Needed to post now
                'reddit_refresh_token'=> $redditUser->refreshToken, // Needed when token expires (1 hour)
            ];

            if ($user) {
                $user->update($userData);
            } else {
                $userData['email'] = $redditUser->getEmail() ?? $redditUser->getNickname() . '@reddit.placeholder';
                $userData['password'] = null; // Ensure your User model allows this
                $user = User::create($userData);
            }

            Auth::login($user);

            return redirect('/dashboard');

        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'Login failed: ' . $e->getMessage());
        }
    }
	
	public function ezframepostinreddit(Request $request)
	{
		if (!Auth::check() || !Auth::user()->reddit_token) {
			return response()->json([
				'success' => false,
				'message' => 'You must be logged in via Reddit to post.'
			], 401);
		}

		try {
			
			$user = Auth::user();
			$userAgent = 'LaravelApp:v1.0 (by /u/' . $user->name . ')';

			$response = Http::withToken($user->reddit_token)
            ->withHeaders(['User-Agent' => $userAgent])
            ->asForm() // IMPORTANT: Reddit API expects Form Data, not JSON
            ->post('https://oauth.reddit.com/api/submit', [
                'sr'       => 'test',             // The Subreddit (e.g., 'test', 'laravel')
                'kind'     => 'self',             // 'self' for text, 'link' for URLs
                'title'    => 'Ez Frame '.$request->frame_url,
                'text'     => 'Ez.wiki Frame url '.$request->frame_url,
                'api_type' => 'json',
            ]);
			
			if ($response->successful()) {
				return response()->json([
					'success' => true,
					'message' => 'Frame successfully posted to Reddit!',
					'linkedin_response' => $response->json()
				]);
			} else {
				$errorDetails = $response->json();
				
				return response()->json([
					'success' => false,
					'message' => 'Failed to post to Reddit: ' . ($errorDetails['message'] ?? 'Unknown API error'),
					'error_details' => $errorDetails
				], 400);
			}
			
		} catch (\Exception $e) {
			Log::error('Reddit Post Exception:', ['error' => $e->getMessage()]);
			
			return response()->json([
				'success' => false,
				'message' => 'Failed to post to Reddit: ' . $e->getMessage()
			], 500);
		}
	}
	
	public function ezfunnelpostinreddit(Request $request)
	{
		if (!Auth::check() || !Auth::user()->reddit_token) {
			return response()->json([
				'success' => false,
				'message' => 'You must be logged in via Reddit to post.'
			], 401);
		}

		try {
			
			$user = Auth::user();
			$userAgent = 'LaravelApp:v1.0 (by /u/' . $user->name . ')';

			$response = Http::withToken($user->reddit_token)
            ->withHeaders(['User-Agent' => $userAgent])
            ->asForm() // IMPORTANT: Reddit API expects Form Data, not JSON
            ->post('https://oauth.reddit.com/api/submit', [
                'sr'       => 'test',             // The Subreddit (e.g., 'test', 'laravel')
                'kind'     => 'self',             // 'self' for text, 'link' for URLs
                'title'    => $request->post_title,
                'text'     => 'Ez.wiki Funnel url '.$request->funnel_url,
                'api_type' => 'json',
            ]);
			
			if ($response->successful()) {
				return response()->json([
					'success' => true,
					'message' => 'Funnel successfully posted to Reddit!',
					'linkedin_response' => $response->json()
				]);
			} else {
				$errorDetails = $response->json();
				
				return response()->json([
					'success' => false,
					'message' => 'Failed to post to Reddit: ' . ($errorDetails['message'] ?? 'Unknown API error'),
					'error_details' => $errorDetails
				], 400);
			}
			
		} catch (\Exception $e) {
			Log::error('Reddit Post Exception:', ['error' => $e->getMessage()]);
			
			return response()->json([
				'success' => false,
				'message' => 'Failed to post to Reddit: ' . $e->getMessage()
			], 500);
		}	
	}
	
}