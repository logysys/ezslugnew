<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Template;
use App\Models\User;
use App\Models\Emaildesign;
use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use App\Models\FunnelLogoSetting;
use App\Models\FunnelSeoSetting;
use App\Models\Defaultpage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Mail\Eznew;

class EzController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'slug' => 'required|string',
            'url' => 'required|string',
            'title' => 'required|string',
            'email' => 'required|string|email'
        ]);
        
        $user = User::where('email', $request->email)->first();
        
        if (empty($user)) {
            $userData = ['email' => $request->email];
            // Removed password logic since $password is undefined
            $user = User::create($userData);
            
            // Send magic link email
            $magicLink = $user->createMagicLink();
            $signedUrl = URL::temporarySignedRoute(
                'magic-link.verify',
                now()->addMinutes(60),
                ['token' => $magicLink->token]
            );
            
            $emaildesign = Emaildesign::where('id', 16)->first();
            
            if ($emaildesign) {
                $str = ['{token}'];
                $rplc = [$signedUrl];
                $div = str_replace($str, $rplc, $emaildesign->design);
                $mailData = ['design' => $div];
                
                try {
                    $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                } catch (\Exception $e) {
                    $subject = "Ez.wiki Your Magic Login Link";
                    @mail($request->email, $subject, $div, null, 'funnel@ez.wiki');
                }
            }
        }
        
        $themeData = [
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->title,
            'price' => 0,
            'leftwidth' => 0,
            'rightwidth' => 0,
            'option' => 'autoplay',
            'bgcolour' => '#000000',
            'image' => $request->url,
            'status' => 'active'
        ];
        
        $theme = Template::create($themeData);
        $theme = Template::where('id', $theme->id)->first();
        
        return response()->json([
            'success' => true,
            'message' => 'Theme created successfully',
            'theme' => $theme
        ]);
    }
    
    public function ezfunnelstore(Request $request)
    {
        $request->validate([
            'slug' => 'required|string',
            'url' => 'required|string',
            'title' => 'required|string',
            'email' => 'required|string|email'
        ]);
        
        $user = User::where('email', $request->email)->first();
        
        if (empty($user)) {
            $userData = ['email' => $request->email];
            // Removed password logic since $password is undefined
            $user = User::create($userData);
            
            // Send magic link email
            $magicLink = $user->createMagicLink();
            $signedUrl = URL::temporarySignedRoute(
                'magic-link.verify',
                now()->addMinutes(60),
                ['token' => $magicLink->token]
            );
            
            $emaildesign = Emaildesign::where('id', 16)->first();
            
            if ($emaildesign) {
                $str = ['{token}'];
                $rplc = [$signedUrl];
                $div = str_replace($str, $rplc, $emaildesign->design);
                $mailData = ['design' => $div];
                
                try {
                    $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                } catch (\Exception $e) {
                    $subject = "Ez.wiki Your Magic Login Link";
                    @mail($request->email, $subject, $div, null, 'funnel@ez.wiki');
                }
            }
        }
        
        $themeData = [
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->title,
            'price' => 0,
            'leftwidth' => 0,
            'rightwidth' => 0,
            'option' => 'autoplay',
            'bgcolour' => '#000000',
            'image' => $request->url,
            'status' => 'active'
        ];
        
        $theme = Template::create($themeData);
        $domainfull = 'ez.wiki';
        
        $defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
            $query->where('domain', $domainfull);
        })->first();
        
        if (!$defaultpage) {
            return response()->json([
                'success' => false,
                'message' => 'Default page not found'
            ], 404);
        }
        
        $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
        $themetemplate = null;
        
        if (!empty($originalFunnel->theme)) {
            $themeIds = array_filter(explode(',', $originalFunnel->theme));
            if ($theme->id !== null) {
                $templateIds = [$theme->id];
                $themeIds = array_merge($templateIds, $themeIds);
            }
            $themetemplate = implode(',', $themeIds);
        }
        
        $clonedFunnel = $originalFunnel->replicate();
        $clonedFunnel->user_id = $user->id;
        $clonedFunnel->theme = $themetemplate;
        $clonedFunnel->save();
        
        // Clone funnel fields
        $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
        foreach ($originalFields as $originalField) {
            $clonedField = $originalField->replicate();
            $clonedField->ez_funnel_id = $clonedFunnel->id;
            $clonedField->unique_id = null;
            $clonedField->save();
        }
        
        // Clone logo settings
        $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
        if ($originalLogo) {
            $clonedLogo = $originalLogo->replicate();
            $clonedLogo->funnel_id = $clonedFunnel->id;
            $clonedLogo->save();
        }
        
        // Clone SEO settings
        $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
        if ($originalSeo) {
            $clonedSeo = $originalSeo->replicate();
            $clonedSeo->funnel_id = $clonedFunnel->id;
            $clonedSeo->save();
        }
        
        // Send confirmation email
        $emaildesign = Emaildesign::where('id', 21)->first();
        $funnel = EzFunnel::where('id', $clonedFunnel->id)->first();
        if ($emaildesign) {
            $fullfunnel = "https://ez.wiki/" . $funnel->token;
            $str = ['{fullfunnel}', '{incentive}', '{url}', '{createdate}'];
            $rplc = [$fullfunnel, '', $fullfunnel, now()->format('Y-m-d H:i:s')];
            $div = str_replace($str, $rplc, $emaildesign->design);
            $mailData = ['design' => $div];
            $email = $user->email; // Use the user we created/found
            
            try {
                $subject = "Ez.wiki Congratulations on your new funnel.";
                Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new funnel.";
                @mail($email, $subject, $div, null, 'funnel@ez.wiki');
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'EZ Funnel saved successfully',
            'token' => $funnel->token,
        ]);
    }
}