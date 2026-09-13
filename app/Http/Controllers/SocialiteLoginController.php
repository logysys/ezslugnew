<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialiteLoginController extends Controller
{
    // --- AUTHENTICATION METHODS ---

    public function redirectToLinkedIn()
    {
        return Socialite::driver('linkedin-openid')
            ->scopes(['openid', 'profile', 'email', 'w_member_social'])
            ->redirect();
    }

    public function handleLinkedInCallback()
    {
        try {
            $linkedinUser = Socialite::driver('linkedin-openid')->user();
            $accessToken = $linkedinUser->token;
        } catch (\Exception $e) {
            return redirect('/login')->with('error', 'LinkedIn authentication failed: ' . $e->getMessage());
        }

        $user = User::where('linkedin_id', $linkedinUser->id)
                    ->orWhere('email', $linkedinUser->email)
                    ->first();

        if ($user) {
            $user->update([
                'linkedin_id' => $linkedinUser->id,
                'linkedin_access_token' => $accessToken,
            ]);
        } else {
            $user = User::create([
                'name' => $linkedinUser->name,
                'email' => $linkedinUser->email,
                'linkedin_id' => $linkedinUser->id,
                'linkedin_access_token' => $accessToken,
                'password' => null,
            ]);
        }

        Auth::login($user);
        return redirect()->route('dashboard')->with('success', 'Logged in with LinkedIn!');
    }

    // --- SHARING METHOD ---

    public function sharePost(Request $request)
    {
        if (!Auth::check() || !Auth::user()->linkedin_access_token) {
            return back()->with('error', 'You must be logged in via LinkedIn to share.');
        }

        $user = Auth::user();
        $accessToken = $user->linkedin_access_token;
        $commentary = urlencode('<iframe src="https://www.facebook.com/plugins/video.php?height=309&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F2060073324797009%2F&show_text=true&width=560&t=0" width="560" height="424" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>');

        
            // 1. Get the Author URN from the OPENID userinfo endpoint
            $responseMe = Http::withToken($accessToken)
                ->get('https://api.linkedin.com/v2/userinfo'); 

            if ($responseMe->failed()) {
                throw new \Exception('Failed to retrieve LinkedIn URN from userinfo: ' . ($responseMe->json()['message'] ?? 'Unknown error.'));
            }

            $linkedinMe = $responseMe->json();
            $subId = $linkedinMe['sub'];
            
            $authorUrn = 'urn:li:person:' . $linkedinMe['sub'];

        // 2. Prepare the payload
        $payload = [
            'author' => $authorUrn,
            'lifecycleState' => 'PUBLISHED',
            'specificContent' => [
                'com.linkedin.ugc.ShareContent' => [
                    'shareCommentary' => [
                        'text' => $commentary,
                    ],
                    'shareMediaCategory' => 'NONE',
                ],
            ],
            'visibility' => [
                'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
            ],
        ];

        // 3. Send the post request
        $response = Http::withToken($accessToken)
            ->withHeaders([
                'X-Restli-Protocol-Version' => '2.0.0',
                'Content-Type' => 'application/json',
                'Content-Language' => 'en-US',
            ])
            ->post('https://api.linkedin.com/v2/ugcPosts', $payload);
		dd($response);	
            if ($response->failed()) {
                $errorDetails = $response->json();
                Log::error('LinkedIn Share Failed:', ['status' => $response->status(), 'response' => $errorDetails, 'payload' => $payload]);
                
                if ($response->status() === 403) {
                    $errorMessage = "Permission Denied (403). Ensure 'Share on LinkedIn' product is active and 'w_member_social' scope was granted.";
                } else {
                    $errorMessage = $errorDetails['message'] ?? 'Unknown API Error (Check storage/logs for details).';
                }

                return back()->with('error', 'Failed to share: ' . $errorMessage);
            }
            
            // If successful (HTTP 201 Created)
            return back()->with('success', 'Successfully shared on LinkedIn!');
    }
	
	public function ezfunnelpostinlinkedin(Request $request)
	{
		if (!Auth::check() || !Auth::user()->linkedin_access_token) {
			return response()->json([
				'success' => false,
				'message' => 'You must be logged in via LinkedIn to post.'
			], 401);
		}

		try {
			$user = Auth::user();
			$accessToken = $user->linkedin_access_token;
			$commentary = $request->post_title;
			
			// 1. Get the Author URN from the OPENID userinfo endpoint
			$responseMe = Http::withToken($accessToken)
				->get('https://api.linkedin.com/v2/userinfo'); 

			if ($responseMe->failed()) {
				throw new \Exception('Failed to retrieve LinkedIn URN from userinfo: ' . ($responseMe->json()['message'] ?? 'Unknown error.'));
			}

			$linkedinMe = $responseMe->json();
			$authorUrn = 'urn:li:person:' . $linkedinMe['sub'];

			$payload = [
				'author' => $authorUrn,
				'lifecycleState' => 'PUBLISHED',
				'specificContent' => [
					'com.linkedin.ugc.ShareContent' => [
						'shareCommentary' => [
							'text' => $commentary,
						],
						'shareMediaCategory' => 'ARTICLE',
						'media' => [
							[
								'status' => 'READY',
								'originalUrl' => $request->funnel_url,
								'title' => ['text' => 'Ez.wiki Funnel url'],
							]
						]
					],
				],
				'visibility' => [
					'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
				],
			];

			// 3. Send the post request
			$response = Http::withToken($accessToken)
				->withHeaders([
					'X-Restli-Protocol-Version' => '2.0.0',
					'Content-Type' => 'application/json',
					'Content-Language' => 'en-US',
				])
				->post('https://api.linkedin.com/v2/ugcPosts', $payload);

			if ($response->successful()) {
				return response()->json([
					'success' => true,
					'message' => 'Funnel successfully posted to LinkedIn!',
					'linkedin_response' => $response->json()
				]);
			} else {
				$errorDetails = $response->json();
				Log::error('LinkedIn Share Failed:', [
					'status' => $response->status(), 
					'response' => $errorDetails, 
					'payload' => $payload
				]);
				
				return response()->json([
					'success' => false,
					'message' => 'Failed to post to LinkedIn: ' . ($errorDetails['message'] ?? 'Unknown API error'),
					'error_details' => $errorDetails
				], 400);
			}
				
		} catch (\Exception $e) {
			Log::error('LinkedIn Post Exception:', ['error' => $e->getMessage()]);
			
			return response()->json([
				'success' => false,
				'message' => 'Failed to post to LinkedIn: ' . $e->getMessage()
			], 500);
		}
	}
	
	public function ezframepostinlinkedin(Request $request)
	{
		if (!Auth::check() || !Auth::user()->linkedin_access_token) {
			return response()->json([
				'success' => false,
				'message' => 'You must be logged in via LinkedIn to post.'
			], 401);
		}

		try {
			$user = Auth::user();
			$accessToken = $user->linkedin_access_token;
			$commentary = "Ez frame ".$request->frame_url;
			
			// 1. Get the Author URN from the OPENID userinfo endpoint
			$responseMe = Http::withToken($accessToken)
				->get('https://api.linkedin.com/v2/userinfo'); 

			if ($responseMe->failed()) {
				throw new \Exception('Failed to retrieve LinkedIn URN from userinfo: ' . ($responseMe->json()['message'] ?? 'Unknown error.'));
			}

			$linkedinMe = $responseMe->json();
			$authorUrn = 'urn:li:person:' . $linkedinMe['sub'];

			$payload = [
				'author' => $authorUrn,
				'lifecycleState' => 'PUBLISHED',
				'specificContent' => [
					'com.linkedin.ugc.ShareContent' => [
						'shareCommentary' => [
							'text' => $commentary,
						],
						'shareMediaCategory' => 'ARTICLE',
						'media' => [
							[
								'status' => 'READY',
								'originalUrl' => $request->frame_url,
								'title' => ['text' => 'Ez.wiki Funnel url'],
							]
						]
					],
				],
				'visibility' => [
					'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
				],
			];

			// 3. Send the post request
			$response = Http::withToken($accessToken)
				->withHeaders([
					'X-Restli-Protocol-Version' => '2.0.0',
					'Content-Type' => 'application/json',
					'Content-Language' => 'en-US',
				])
				->post('https://api.linkedin.com/v2/ugcPosts', $payload);

			if ($response->successful()) {
				return response()->json([
					'success' => true,
					'message' => 'Frame successfully posted to LinkedIn!',
					'linkedin_response' => $response->json()
				]);
			} else {
				$errorDetails = $response->json();
				Log::error('LinkedIn post Failed:', [
					'status' => $response->status(), 
					'response' => $errorDetails, 
					'payload' => $payload
				]);
				
				return response()->json([
					'success' => false,
					'message' => 'Failed to post to LinkedIn: ' . ($errorDetails['message'] ?? 'Unknown API error'),
					'error_details' => $errorDetails
				], 400);
			}
				
		} catch (\Exception $e) {
			Log::error('LinkedIn Post Exception:', ['error' => $e->getMessage()]);
			
			return response()->json([
				'success' => false,
				'message' => 'Failed to post to LinkedIn: ' . $e->getMessage()
			], 500);
		}
	}
	
}
