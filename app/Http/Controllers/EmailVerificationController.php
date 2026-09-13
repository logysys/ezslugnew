<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use App\Models\Emaildesign;
use App\Models\EmailVerification;
use App\Mail\Eznew;

class EmailVerificationController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:code,subscribe',
            'funnel_id' => 'nullable|exists:ez_funnels,token'
        ]);

        // Generate 4-digit OTP
        $otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(10);

        // Store or update in database
        $emailVerification = EmailVerification::updateOrCreate(
            ['email' => $request->email],
            [
                'otp' => $otp,
                'attempts' => 0,
                'is_verified' => false,
                'is_subscribed' => $request->type === 'subscribe',
                'expires_at' => $expiresAt,
                'ez_funnel_id' => $request->funnel_id
            ]
        );

        // Store OTP in cache (expires in 10 minutes)
        Cache::put('otp_'.$request->email, [
            'code' => $otp,
            'attempts' => 0
        ], $expiresAt);
        
        try {
            // Send email
            $emaildesign = Emaildesign::where('id', 11)->first();
            $str = ['{pincode}'];
            $rplc = [$otp];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = [
                'design' => $div
            ];
            
            try {
                $subject = "Ez.wiki Your Pin Code.";
                Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Your Pin Code.";
                @mail(strtolower($request->email), $subject, $div, null, 'funnel@ez.wiki');
            }
            
            return response()->json([
                'success' => true,
                'message' => 'OTP sent successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP email'
            ], 500);
        }
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:4',
            'funnel_id' => 'nullable|exists:ez_funnels,token'
        ]);

        $cacheKey = 'otp_'.$request->email;
        $storedOtp = Cache::get($cacheKey);

        // Also check database
        $emailVerification = EmailVerification::where('email', $request->email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$storedOtp || !$emailVerification) {
            return response()->json([
                'verified' => false,
                'message' => 'OTP expired or not found'
            ], 400);
        }

        // Check attempts
        if ($storedOtp['attempts'] >= 3 || $emailVerification->attempts >= 3) {
            Cache::forget($cacheKey);
            $emailVerification->delete();
            return response()->json([
                'verified' => false,
                'message' => 'Too many attempts. Please request a new OTP.'
            ], 400);
        }

        // Verify OTP
        if ($storedOtp['code'] === $request->otp && $emailVerification->otp === $request->otp) {
            Cache::forget($cacheKey);
            $emailVerification->update([
                'is_verified' => true,
                'attempts' => 0,
                'ez_funnel_id' => $request->funnel_id
            ]);
            
            return response()->json([
                'verified' => true,
                'message' => 'OTP verified successfully'
            ]);
        }

        // Increment attempts
        $newAttempts = $storedOtp['attempts'] + 1;
        Cache::put($cacheKey, [
            'code' => $storedOtp['code'],
            'attempts' => $newAttempts
        ], now()->addMinutes(10));
        
        $emailVerification->increment('attempts');

        return response()->json([
            'verified' => false,
            'message' => 'Invalid OTP',
            'attempts_remaining' => 3 - $newAttempts
        ], 400);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'funnel_id' => 'nullable|exists:ez_funnels,token'
        ]);

        // Check if there's an existing OTP in database
        $emailVerification = EmailVerification::where('email', $request->email)
            ->where('expires_at', '>', now())
            ->first();

        if ($emailVerification) {
            // Generate new OTP
            $otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            $expiresAt = now()->addMinutes(10);
            
            // Update database record
            $emailVerification->update([
                'otp' => $otp,
                'attempts' => 0,
                'expires_at' => $expiresAt,
                'ez_funnel_id' => $request->funnel_id
            ]);
            
            // Update cache
            Cache::put('otp_'.$request->email, [
                'code' => $otp,
                'attempts' => 0
            ], $expiresAt);
        } else {
            // Create new record
            $otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            $expiresAt = now()->addMinutes(10);
            
            EmailVerification::create([
                'email' => $request->email,
                'otp' => $otp,
                'attempts' => 0,
                'is_verified' => false,
                'is_subscribed' => false,
                'expires_at' => $expiresAt,
                'ez_funnel_id' => $request->funnel_id
            ]);
            
            Cache::put('otp_'.$request->email, [
                'code' => $otp,
                'attempts' => 0
            ], $expiresAt);
        }

        try {
            $emaildesign = Emaildesign::where('id', 11)->first();
            $str = ['{pincode}'];
            $rplc = [$otp];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = [
                'design' => $div
            ];
            
            try {
                $subject = "Ez.wiki Your Pin Code.";
                Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Your Pin Code.";
                @mail(strtolower($request->email), $subject, $div, null, 'funnel@ez.wiki');
            }
            
            return response()->json([
                'success' => true,
                'message' => 'New OTP sent successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resend OTP'
            ], 500);
        }
    }

    /**
     * Get verification status for an email
     */
    public function checkVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $verification = EmailVerification::where('email', $request->email)
            ->where('is_verified', true)
            ->first();

        return response()->json([
            'verified' => $verification ? true : false,
            'funnel_id' => $verification ? $verification->ez_funnel_id : null
        ]);
    }

    /**
     * Get all verified emails for a specific funnel
     */
    public function getFunnelVerifications($funnelId)
    {
        $verifications = EmailVerification::where('ez_funnel_id', $funnelId)
            ->where('is_verified', true)
            ->get();

        return response()->json([
            'data' => $verifications,
            'count' => $verifications->count()
        ]);
    }
}