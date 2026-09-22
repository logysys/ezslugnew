<?php

namespace App\Http\Controllers;

use App\Models\EzFunnel;
use App\Models\EzFunnelField;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Themecollection;
use App\Models\HandlePurchase;
use App\Models\Page;
use App\Models\Frontpage;
use App\Models\Emaildesign;
use App\Models\User;
use App\Models\UserBalance;
use App\Models\ThemePurchase;
use App\Models\Invoice;
use App\Helpers\IframeHelper;
use App\Models\TokenTransaction;
use App\Models\FunnelLogoSetting;
use App\Models\Admindomain;
use App\Models\ReserveTransaction;
use App\Models\Template;
use App\Models\TokenInfo;
use App\Models\FunnelSeoSetting;
use App\Models\Reserve;
use App\Models\Reaction;
use App\Models\EffectSetting;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\Coupon;
use App\Models\StripeTransaction;
use App\Models\Tooltip;
use App\Services\InvoiceService;
use Carbon\Carbon;
use App\Models\Sell;
use App\Models\Powerstring;
use App\Models\Defaultpage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\URL;

class ThemeController extends Controller
{
    private $stripeSecretKey;

    public function __construct()
    {
        $this->stripeSecretKey = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecretKey);
    }
    
    // Helper method to check if user is theme owner
    private function isThemeOwner($userId, $templateId)
    {
        if (!$templateId) return false;
        
        $template = Template::find($templateId);
        return $template && $template->user_id == $userId;
    }
    
    public function preview($themeId)
    {
        $template = Template::where('unique_id','T'.$themeId)->first();
        
        $dayOfWeek = strtolower(Carbon::now()->format('D'));
        $domains = Admindomain::where('status', 'Active')
            ->where(function ($query) use ($dayOfWeek) {
                $query->where('days', 'all')
                    ->orWhere('days', 'LIKE', "%$dayOfWeek%");
            })
            ->orderBy('domain', 'ASC')
            ->get(['domain']);
        
        $tokenInfo = TokenInfo::first();
        $promoprice = 0;
        $tooltips = Tooltip::all()->pluck('tooltips', 'reference');
        return Inertia::render('previewtheme', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
			'tooltips' => $tooltips,
            'checkDomainUrl' => url('/check-custom-domain'),
            'checkStandardDomainUrl' => url('/check-ezpressstandard-domain')
        ]);
    }
	
    public function checkCustomDomainAvailability(Request $request)
    {
         $request->validate([
                'handle' => 'required|string',
                'domain' => 'required|string',
            ]);

            $handle = strtolower(trim($request->input('handle')));
            $domain = $request->input('domain');

            // Check if custom domain handle is available
            $customDomainExists = Customdomain::whereRaw('BINARY `domain` = ?', [$handle])
                ->where('domainselected', $domain)
                ->exists();

            // Check if funnel token exists
            $funnelExists = EzFunnel::where('token', $handle)->exists();
            
            // Check if reserved
            $reserved = Reserve::where('reserve', $handle)->exists();

            $available = !$customDomainExists && !$funnelExists && !$reserved;
            
            $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
            
            // Calculate price based on character count
            $priceString = Powerstring::where('min_word', '<=', $charCount)
                ->where('max_word', '>=', $charCount)
                ->first();

            $price = $priceString ? $priceString->custom_price : 0;
            $promoPrice = 0; // Pre-launch promotion price

            return response()->json([
                'available' => $available,
                'message' => $available ? 'Domain is available' : 'Domain is not available',
                'charCount' => $charCount,
                'price' => $price,
                'promoPrice' => $promoPrice,
                'handle' => $handle,
                'domain' => $domain
            ]);
    }

    public function checkStandardDomainAvailability(Request $request)
    {
        $request->validate([
                'handle' => 'required|string',
                'domain' => 'required|string',
            ]);

            $handle = strtolower(trim($request->input('handle')));
            $domain = $request->input('domain');

            // Check if standard domain is available (handle.domain format)
            $domainExists = Domain::whereRaw('BINARY `domain` = ?', [$handle])
                ->where('domainselected', $domain)
                ->exists();
           
            // Check if reserved
            $reserved = Reserve::where('reserve', $handle)->exists();

            $available = !$domainExists && !$reserved;
            
            $charCount = iconv_strlen(str_replace(' ', '', urldecode($handle)),'UTF-8');
            
            // Calculate price based on character count
            $priceString = Powerstring::where('min_word', '<=', $charCount)
                ->where('max_word', '>=', $charCount)
                ->first();

            $price = $priceString ? $priceString->dollar_price : 0;
            $promoPrice = 0; // Pre-launch promotion price

            return response()->json([
                'available' => $available,
                'message' => $available ? 'Domain is available' : 'Domain is not available',
                'charCount' => $charCount,
                'price' => $price,
                'promoPrice' => $promoPrice,
                'handle' => $handle,
                'domain' => $domain
            ]);
    }

    public function initiateHandlePayment(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'custom_handle' => 'required|string',
        'domain' => 'required|string',
        'price' => 'required|numeric|min:0',
        'promo_price' => 'required|numeric|min:0',
        'coupon_code' => 'nullable|string',
        'selling_price' => 'nullable|numeric|min:0',
        'payment_method' => 'required',
        'theme_price' => 'nullable|numeric|min:0',
        'template_id' => 'nullable|integer',
		'password' => 'nullable|string|min:8',
    ]);
    
    $customHandle = strtolower(trim($validated['custom_handle']));
    $domain = $validated['domain'];
    $email = $validated['email'];
    $paymentMethod = $validated['payment_method'];
    $templateId = $validated['template_id'] ?? null;
    $password = $validated['password'] ?? null;
    // Find or create user
    $user = User::where('email', $email)->first();
    
    // Check if user is theme owner
    $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
    
    // Check if theme is already in user's collection OR user is the owner
    $themePrice = $validated['theme_price'] ?? 0;
    if ($user && $templateId) {
        $themeInCollection = Themecollection::where('user_id', $user->id)
            ->where('theme_id', $templateId)
            ->exists();
        
        // If user is owner OR theme is in collection, set price to 0
        if ($isThemeOwner || $themeInCollection) {
            $themePrice = 0;
        }
    } elseif ($templateId) {
        // For non-logged-in users, we rely on the frontend to pass the correct theme price
        // based on the collection check done via the checkCollectionByEmail endpoint
        // The themePrice should already be 0 if the theme is in collection
    }
    
    // Check if handle is available
    $existingLink = Customdomain::whereRaw('BINARY `domain` = ?', [$customHandle])
        ->where('domainselected', $domain)
        ->first();

    if ($existingLink) {
        return response()->json([
            'error' => 'This handle is already taken',
            'available' => false
        ], 409);
    }

    // DEBUG: Log the incoming prices
    Log::info('Handle Payment initiation received:', [
        'domain_price' => $validated['price'],
        'theme_price' => $themePrice,
        'promo_price' => $validated['promo_price'],
        'coupon_code' => $validated['coupon_code'] ?? null,
        'custom_handle' => $customHandle,
        'domain' => $domain,
        'template_id' => $templateId,
        'theme_in_collection' => $themeInCollection ?? false,
        'is_theme_owner' => $isThemeOwner
    ]);

    // Use the promo_price directly as it should be the final discounted total
    $actualPrice = $validated['promo_price'];
    $couponCode = $validated['coupon_code'] ?? null;
    
    // Apply minimum price rule
    if ($actualPrice > 0 && $actualPrice < 1) {
        $actualPrice = 1;
    }
    
    // DEBUG: Log the final price being charged
    Log::info('Final handle price calculation:', [
        'final_price' => $actualPrice,
        'domain_component' => $validated['price'],
        'theme_component' => $themePrice,
        'calculation' => 'Using promo_price directly as final total',
        'theme_in_collection' => $themeInCollection ?? false,
        'is_theme_owner' => $isThemeOwner
    ]);

    try {
        // Create payment intent
        if(empty($user)){                        
            $userData = ['email' => $email];
            if ($password) {
                $userData['password'] = Hash::make($password);
            }
            $user = User::create($userData);
            $magicLink = $user->createMagicLink();

            $signedUrl = URL::temporarySignedRoute(
                'magic-link.verify',
                now()->addMinutes(60),
                ['token' => $magicLink->token]
            );

            // Send email with the magic link
            $emaildesign = Emaildesign::where('id', 16)->first();
            $str = ['{token}'];
            $rplc =[$signedUrl];
            $div=str_replace($str,$rplc,$emaildesign['design']);
            $mailData = [
                                'design' => $div
                            ];
            
            try{
                   $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                        $subject = "Ez.wiki Your Magic Login Link";
                        
                        @mail($email, $subject, $div, null,'funnel@ez.wiki');
                }
            
        }
        $paymentIntent = PaymentIntent::create([
            'amount' => round($actualPrice * 100), // Convert to cents and round
            'currency' => 'usd',
            'metadata' => [
                'user_id' => $user->id,
                'domain' => $customHandle,
                'domainselected' => $domain,
                'email' => $email,
                'coupon_code' => $validated['coupon_code'],
                'selling_price' => $validated['selling_price'],
                'payment_method' => $validated['payment_method'],
                'promo_price' => $validated['promo_price'],
                'theme_price' => $themePrice,
                'domain_price' => $validated['price'],
                'total_base_price' => $validated['price'] + $themePrice,
                'template_id' => $templateId,
                'theme_in_collection' => $themeInCollection ?? false,
                'is_theme_owner' => $isThemeOwner
            ],
            'receipt_email' => $email,
            'description' => "Purchase of custom handle {$domain}/{$customHandle}" . ($themePrice > 0 ? " + Theme" : ""),
        ]);

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ]);

    } catch (ApiErrorException $e) {
        Log::error('Stripe API Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'Payment processing error. Please try again.'
        ], 500);
    } catch (\Exception $e) {
        Log::error('Handle Payment Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'An unexpected error occurred.'
        ], 500);
    }
}

    public function initiateDomainPayment(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'custom_handle' => 'required|string',
        'domain' => 'required|string',
        'price' => 'required|numeric|min:0',
        'promo_price' => 'required|numeric|min:0',
        'coupon_code' => 'nullable|string',
        'selling_price' => 'nullable|numeric|min:0',
        'payment_method' => 'required',
        'theme_price' => 'nullable|numeric|min:0',
        'template_id' => 'nullable|integer',
		'password' => 'nullable|string|min:8',
    ]);
    
    $customHandle = strtolower(trim($validated['custom_handle']));
    $domain = $validated['domain'];
    $email = $validated['email'];
    $paymentMethod = $validated['payment_method'];
    $templateId = $validated['template_id'] ?? null;
    $password = $validated['password'] ?? null;
    // Find or create user
    $user = User::where('email', $email)->first();
    
    // Check if user is theme owner
    $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
    
    // Check if theme is already in user's collection OR user is the owner
    $themePrice = $validated['theme_price'] ?? 0;
    if ($user && $templateId) {
        $themeInCollection = Themecollection::where('user_id', $user->id)
            ->where('theme_id', $templateId)
            ->exists();
        
        // If user is owner OR theme is in collection, set price to 0
        if ($isThemeOwner || $themeInCollection) {
            $themePrice = 0;
        }
    } elseif ($templateId) {
        // For non-logged-in users, we rely on the frontend to pass the correct theme price
        // based on the collection check done via the checkCollectionByEmail endpoint
        // The themePrice should already be 0 if the theme is in collection
    }
    
    // Check if handle is available
    $existingLink = Domain::whereRaw('BINARY `domain` = ?', [$customHandle])
        ->where('domainselected', $domain)
        ->first();

    if ($existingLink) {
        return response()->json([
            'error' => 'This handle is already taken',
            'available' => false
        ], 409);
    }

    // DEBUG: Log the incoming prices
    Log::info('Payment initiation received:', [
        'domain_price' => $validated['price'],
        'theme_price' => $themePrice,
        'promo_price' => $validated['promo_price'],
        'coupon_code' => $validated['coupon_code'] ?? null,
        'custom_handle' => $customHandle,
        'domain' => $domain,
        'template_id' => $templateId,
        'theme_in_collection' => $themeInCollection ?? false,
        'is_theme_owner' => $isThemeOwner
    ]);

    // Use the promo_price directly as it should be the final discounted total
    // The frontend already calculates the correct total: domainPrice + themePrice with coupon applied
    $actualPrice = $validated['promo_price'];
    
    // Apply minimum price rule
    if ($actualPrice > 0 && $actualPrice < 1) {
        $actualPrice = 1;
    }
    
    // DEBUG: Log the final price being charged
    Log::info('Final price calculation:', [
        'final_price' => $actualPrice,
        'domain_component' => $validated['price'],
        'theme_component' => $themePrice,
        'calculation' => 'Using promo_price directly as final total',
        'theme_in_collection' => $themeInCollection ?? false,
        'is_theme_owner' => $isThemeOwner
    ]);

    try {
        // Create payment intent
        if(empty($user)){                        
            $userData = ['email' => $email];
            if ($password) {
                $userData['password'] = Hash::make($password);
            }
            $user = User::create($userData);
            $magicLink = $user->createMagicLink();

            $signedUrl = URL::temporarySignedRoute(
                'magic-link.verify',
                now()->addMinutes(60),
                ['token' => $magicLink->token]
            );

            // Send email with the magic link
            $emaildesign = Emaildesign::where('id', 16)->first();
            $str = ['{token}'];
            $rplc =[$signedUrl];
            $div=str_replace($str,$rplc,$emaildesign['design']);
            $mailData = [
                                'design' => $div
                            ];
            
            try{
                   $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                        $subject = "Ez.wiki Your Magic Login Link";
                        
                        @mail($email, $subject, $div, null,'funnel@ez.wiki');
                }
            
        }
        
        $paymentIntent = PaymentIntent::create([
            'amount' => round($actualPrice * 100), // Convert to cents and round
            'currency' => 'usd',
            'metadata' => [
                'user_id' => $user->id,
                'domain' => $customHandle,
                'domainselected' => $domain,
                'email' => $email,
                'coupon_code' => $validated['coupon_code'],
                'selling_price' => $validated['selling_price'],
                'payment_method' => $validated['payment_method'],
                'promo_price' => $validated['promo_price'],
                'theme_price' => $themePrice,
                'domain_price' => $validated['price'],
                'total_base_price' => $validated['price'] + $themePrice,
                'template_id' => $templateId,
                'theme_in_collection' => $themeInCollection ?? false,
                'is_theme_owner' => $isThemeOwner
            ],
            'receipt_email' => $email,
            'description' => "Purchase of Domain handle {$customHandle}.{$domain}" . ($themePrice > 0 ? " + Theme" : ""),
        ]);

        // DEBUG: Log the created payment intent
        Log::info('Payment intent created:', [
            'payment_intent_id' => $paymentIntent->id,
            'amount_charged' => $actualPrice,
            'amount_in_cents' => round($actualPrice * 100)
        ]);

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
            'payment_intent_id' => $paymentIntent->id,
        ]);

    } catch (ApiErrorException $e) {
        Log::error('Stripe API Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'Payment processing error. Please try again.'
        ], 500);
    } catch (\Exception $e) {
        Log::error('Handle Payment Error: ' . $e->getMessage());
        return response()->json([
            'error' => 'An unexpected error occurred.'
        ], 500);
    }
}
    
   public function couponcodecustomdomain(Request $request)
{
    $request->validate([
        'couponcode' => 'required|string',
        'domainurl' => 'required|string',
        'theme_price' => 'nullable|numeric|min:0',
        'theme_id' => 'nullable|integer',
        'email' => 'nullable|email',
		'type' => 'required|string'
    ]);

    $pricestring = Powerstring::get()->toArray();
    $value = iconv_strlen(str_replace(' ', '', urldecode($request->domainurl)),'UTF-8');
    $wordprice = 0;
    $price = 0;
    
    if($request->type=='domain')
	{
    // Calculate base price for domain/handle
    foreach ($pricestring as $priceTier) {
        if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
            $wordprice = $priceTier['dollar_price'] * 1;
            $price = $priceTier['dollar_price'];
            break;
        }
    }
	}else
	{
	foreach ($pricestring as $priceTier) {
        if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
            $wordprice = $priceTier['custom_price'] * 1;
            $price = $priceTier['custom_price'];
            break;
        }
    }	
	}

    // Check if user exists and theme ownership
    $user = User::where('email', $request->email)->first();
    $isThemeOwner = $user ? $this->isThemeOwner($user->id, $request->theme_id) : false;
    
    // Check if theme is already in user's collection OR user is the owner
    $themePrice = $request->theme_price ?? 0;
    $themeInCollection = false;
    
    if ($request->theme_id) {
        if ($user) {
            $themeInCollection = Themecollection::where('user_id', $user->id)
                ->where('theme_id', $request->theme_id)
                ->exists();
        }
        
        // If user is owner OR theme is in collection, set price to 0
        if ($isThemeOwner || $themeInCollection) {
            $themePrice = 0;
        }
    }
    
    // Calculate total base price (domain + theme)
    $totalBasePrice = $price + $themePrice;

    $response = [
        'original_price' => $price,
        'original_total_price' => $totalBasePrice,
        'offprice' => $totalBasePrice,
        'theme_price' => $themePrice,
        'domain_discount' => $price,
        'theme_discount' => $themePrice,
        'title' => '',
        'valid' => false,
        'theme_in_collection' => $themeInCollection,
        'is_theme_owner' => $isThemeOwner
    ];

    $coupon = Coupon::where('coupon', urldecode($request->couponcode))->first();
    
    if($coupon) {
        $response['valid'] = true;
        $response['title'] = $coupon['title'];
        
        if($coupon['type'] == 'percentage') {
            $response['title'] .= ' '.$coupon['offer'].'% off';
            
            // Calculate total discount
            $totalDiscount = $totalBasePrice * ($coupon['offer'] / 100);
            $response['offprice'] = $totalBasePrice - $totalDiscount;
            
            // Calculate proportional discount for domain and theme
            if ($totalBasePrice > 0) {
                $domainDiscountRatio = $price / $totalBasePrice;
                $themeDiscountRatio = $themePrice / $totalBasePrice;
                
                $response['domain_discount'] = $price - ($totalDiscount * $domainDiscountRatio);
                $response['theme_discount'] = $themePrice - ($totalDiscount * $themeDiscountRatio);
            } else {
                // If total is 0, set both to 0
                $response['domain_discount'] = 0;
                $response['theme_discount'] = 0;
            }
        }
        elseif($coupon['type'] == 'all') {
            $response['offprice'] = $coupon['offer'];
            
            // For fixed price coupons, calculate proportional distribution
            if ($totalBasePrice > 0) {
                $domainRatio = $price / $totalBasePrice;
                $themeRatio = $themePrice / $totalBasePrice;
                
                $response['domain_discount'] = $coupon['offer'] * $domainRatio;
                $response['theme_discount'] = $coupon['offer'] * $themeRatio;
            } else {
                // If total is 0, set both to 0
                $response['domain_discount'] = 0;
                $response['theme_discount'] = 0;
            }
        }
        
        // Ensure prices don't go below 0
        $response['domain_discount'] = max(0, $response['domain_discount']);
        $response['theme_discount'] = max(0, $response['theme_discount']);
        $response['offprice'] = max(0, $response['offprice']);
    }

    return response()->json($response);
}

    public function handleZeroDollarPurchase(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'custom_handle' => 'required|string',
            'domain' => 'required|string',
            'type' => 'required|in:handle,domain',
            'coupon_code' => 'nullable|string',
			'template_id' => 'nullable|integer',
			'password' => 'nullable|string|min:8',
        ]);
        try {
            $email = $validated['email'];
            $customHandle = strtolower(trim($validated['custom_handle']));
            $domain = $validated['domain'];
            $type = $validated['type'];
            $templateId = $validated['template_id'] ?? null;
			$password = $validated['password'] ?? null;
            // Find or create user
            $user = User::where('email', $email)->first();
            if (empty($user)) {
                $userData = ['email' => $email];
				if ($password) {
					$userData['password'] = Hash::make($password);
				}
				$user = User::create($userData);
                // Send magic link email (same as in your existing code)
                $magicLink = $user->createMagicLink();
                $signedUrl = URL::temporarySignedRoute(
                    'magic-link.verify',
                    now()->addMinutes(60),
                    ['token' => $magicLink->token]
                );
                
                $emaildesign = Emaildesign::where('id', 16)->first();
                $str = ['{token}'];
                $rplc = [$signedUrl];
                $div = str_replace($str,$rplc,$emaildesign['design']);
                $mailData = ['design' => $div];
                
                try {
                    $subject = "Ez.wiki Your Magic Login Link";
                    Mail::to(strtolower($email))->send(new Eznew($mailData, $subject));
					Mail::getSymfonyTransport()->stop();
                } catch (\Exception $e) {
                    $subject = "Ez.wiki Your Magic Login Link";
                    @mail($email, $subject, $div, null, 'funnel@ez.wiki');
                }
            }
            
            // Check if user is theme owner
            $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
            
            // Clone funnel ID 40 (same as in paymentsuccess method)
			$domainfull=idn_to_utf8($domain);
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
			$themetemplate = null;
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$templateIds = (array)$templateId;
					$themeIds = array_merge($templateIds, $themeIds);
				}
				$themetemplate=implode(',',$themeIds);
			}
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->theme = $themetemplate;
            $clonedFunnel->save();
			
			// Only add to collection if user is NOT the owner and theme is NOT already in collection
			if (!empty($originalFunnel->theme) && $templateId && $user) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$themeIds[] = $templateId;
					$themeIds = array_values(array_unique($themeIds));
				}
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				
				// Don't add if user is the owner of any theme
				$themesToAdd = [];
				foreach ($newThemes as $themeId) {
					if (!$this->isThemeOwner($user->id, $themeId)) {
						$themesToAdd[] = $themeId;
					}
				}
				
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $themesToAdd);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
					$theme = Template::lockForUpdate()->find($templateId);
					$sellerId = $theme->user_id;
					
					// Only create purchase record if user is NOT the owner
					if (!$isThemeOwner) {
						// Create theme purchase record
						$purchase = ThemePurchase::create([
							'user_id' => $user->id,
							'theme_id' => $theme->id,
							'amount' => 0,
							'currency' => 'BEE',
							'payment_method' => 'free',
							'status' => 'completed',
							'transaction_id' => 'THM-' . strtoupper(Str::random(8)),
							'seller_id' => $sellerId > 0 ? $sellerId : null,
							'seller_amount' => 0,
							'commission' => 0
						]);

						// Create invoice for the theme purchase
						$invoice = $purchase->invoice()->create([
							'invoice_number' => 'INV-THEME-' . strtoupper(Str::random(8)),
							'user_id' => $user->id,
							'theme_purchase_id' => $purchase->id,
							'issue_date' => now(),
							'due_date' => now()->addDays(30),
							'amount' => 0,
							'status' => 'paid',
							'items' => [
								[
									'description' => "Theme Purchase: {$theme->title} (ID: {$theme->id})",
									'quantity' => 1,
									'unit_price' => 0,
									'amount' => 0,
								]
							],
							'notes' => 'Thank you for your theme purchase!',
						]);
					}
				}
			}
            // Clone funnel fields, logo settings, SEO settings (same as in paymentsuccess)
            $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
            foreach ($originalFields as $originalField) {
                $clonedField = $originalField->replicate();
                $clonedField->ez_funnel_id = $clonedFunnel->id;
				$clonedField->unique_id = null;
                $clonedField->save();
            }

            $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalLogo) {
                $clonedLogo = $originalLogo->replicate();
                $clonedLogo->funnel_id = $clonedFunnel->id;
                $clonedLogo->save();
            }

            $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalSeo) {
                $clonedSeo = $originalSeo->replicate();
                $clonedSeo->funnel_id = $clonedFunnel->id;
                $clonedSeo->save();
            }

            $expiryDate = now()->addYear();
            
            if ($type === 'handle') {
                // Create custom domain record
                $customDomain = Customdomain::updateOrCreate(
                    [
                        'domain' => $customHandle,
                        'domainselected' => $domain,
                        'user_id' => $user->id
                    ],
                    [
                        'funnelid' => $clonedFunnel->id,
                        'hashtag' => $clonedFunnel->seo_tag,
                        'expire' => $expiryDate,
                    ]
                );
            } else {
                // Create domain record
                $customDomain = Domain::updateOrCreate(
                    [
                        'domain' => $customHandle,
                        'domainselected' => $domain,
                        'user_id' => $user->id
                    ],
                    [
                        'funnelid' => $clonedFunnel->id,
                        'hashtag' => $clonedFunnel->seo_tag,
                        'expire' => $expiryDate,
                    ]
                );
            }

            // Record the purchase with $0 amount
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                ($type === 'handle' ? 'customdomain_id' : 'domain_id') => $customDomain->id,
                'amount' => 0,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'free',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'discount_amount' => 0,
                'status' => 'completed',
                'transaction_id' => 'FREE-' . strtoupper(Str::random(8))
            ]);

            // Create invoice for $0 purchase
            $invoicenumber = 'INV-FREE-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => null,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => 0,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => $type === 'handle' 
                            ? "Free Custom Handle Purchase: {$domain}/{$customHandle}" . ($isThemeOwner ? " (Theme Owner)" : "")
                            : "Free Domain Purchase: {$customHandle}.{$domain}" . ($isThemeOwner ? " (Theme Owner)" : ""),
                        'quantity' => 1,
                        'unit_price' => 0,
                        'amount' => 0,
                    ]
                ],
                'notes' => 'Thank you for your free purchase!' . ($isThemeOwner ? ' Theme included free - you are the owner.' : ''),
            ]);

            // Send confirmation email
            $fulldomain = $type === 'handle' 
                ? "https://{$domain}/{$customHandle}"
                : "https://{$customHandle}.{$domain}";
                
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
            $rplc = [$fulldomain, 0, $invoicenumber, now(), 'Congratulations on your new ' . ($type === 'handle' ? 'custom domain' : 'domain') . ($isThemeOwner ? ' (Theme Owner)' : '')];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new " . ($type === 'handle' ? 'custom domain' : 'domain');
                @mail($email, $subject, $div, null, 'funnel@ez.wiki');
            }

            return response()->json([
                'success' => true,
                'url' => $fulldomain,
                'html' => '<a href="' . $fulldomain . '" target="_blank" class="btn btn-warning reloadcreatenew">' . $fulldomain . '</a>',
                'available' => true,
                'is_theme_owner' => $isThemeOwner
            ]);

        } catch (\Exception $e) {
            Log::error('Free purchase error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred during free purchase.'
            ], 500);
        }
    }

    public function paymentsuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
			'template_id' => 'nullable|integer',
        ]);

        $paymentIntentId = $request->payment_intent_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }
			$templateId = $request->template_id ?? null;
            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            
            // Check if user is theme owner
            $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
            
            // Get the handle purchase record
            // Get the original funnel
            // Clone funnel ID 1
			$domainfull=idn_to_utf8($paymentIntent->metadata->domainselected);
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
            $themetemplate = null;
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$templateIds = (array)$templateId;
					$themeIds = array_merge($templateIds, $themeIds);
				}
				$themetemplate=implode(',',$themeIds);
			}
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->theme = $themetemplate;
            $clonedFunnel->save();
			
			// Only add to collection if user is NOT the owner and theme is NOT already in collection
			if (!empty($originalFunnel->theme) && $templateId && $user) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$themeIds[] = $templateId;
					$themeIds = array_values(array_unique($themeIds));
				}
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				
				// Don't add if user is the owner of any theme
				$themesToAdd = [];
				foreach ($newThemes as $themeId) {
					if (!$this->isThemeOwner($user->id, $themeId)) {
						$themesToAdd[] = $themeId;
					}
				}
				
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $themesToAdd);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
					$theme = Template::lockForUpdate()->find($templateId);
					$sellerId = $theme->user_id;
					
					// Only process payment if user is NOT the owner
					if (!$isThemeOwner) {
						$commission = $paymentIntent->metadata->theme_price * 0.10;
						$sellerAmount = $paymentIntent->metadata->theme_price * 0.90;
						if ($sellerId > 0) {
							$sellerBalance = UserBalance::where('user_id', $sellerId)->lockForUpdate()->first();
							
							if (!$sellerBalance) {
								// Create balance record for seller if doesn't exist
								$sellerBalance = UserBalance::create([
									'user_id' => $sellerId,
									'bee_points_balance' => 0,
									'balance' => 0
								]);
							}

							$sellerBalanceBefore = $sellerBalance->bee_points_balance;
							$sellerBalance->bee_points_balance += $sellerAmount;
							$sellerBalance->save();

							// Record transaction for seller
							TokenTransaction::create([
								'user_id' => $sellerId,
								'amount' => $sellerAmount,
								'transaction_type' => 'theme_sale',
								'description' => 'Sold theme: ' . $theme->title . ' to user ' . $user->id,
								'balance_before' => $sellerBalanceBefore,
								'balance_after' => $sellerBalance->bee_points_balance,
								'custom_id' => $theme->id,
							]);
						}
						$tokenInfo = TokenInfo::first();
						if ($tokenInfo) {
							$reserveBefore = $tokenInfo->reserved_supply;
							$tokenInfo->reserved_supply += $commission;
							$tokenInfo->last_updated = now();
							$tokenInfo->save();

							// Record reserve transaction
							$reserveTransaction = ReserveTransaction::create([
								'transaction_type' => 'reserve',
								'amount' => $commission,
								'reason' => 'Theme sale commission - Theme: ' . $theme->title . ' (ID: ' . $theme->id . ')',
								'reference_id' => 'RES-' . Str::upper(Str::random(8)),
								'user_id' => $user->id,
								'admin_id' => 2 // Assuming admin user ID is 1
							]);

							// Generate invoice for commission if service exists
							if (class_exists(InvoiceService::class)) {
								try {
									InvoiceService::createForReserveTransaction($reserveTransaction);
								} catch (\Exception $e) {
									// Log but don't fail the transaction if invoice creation fails
									\Log::error('Failed to create reserve invoice: ' . $e->getMessage());
								}
							}
						}
						// Create theme purchase record
						$purchase = ThemePurchase::create([
							'user_id' => $user->id,
							'theme_id' => $theme->id,
							'amount' => $paymentIntent->metadata->theme_price,
							'currency' => 'BEE',
							'payment_method' => 'bee_points',
							'status' => 'completed',
							'transaction_id' => 'THM-' . strtoupper(Str::random(8)),
							'seller_id' => $sellerId > 0 ? $sellerId : null,
							'seller_amount' => $sellerAmount,
							'commission' => $commission
						]);

						// Create invoice for the theme purchase
						$invoice = $purchase->invoice()->create([
							'invoice_number' => 'INV-THEME-' . strtoupper(Str::random(8)),
							'user_id' => $user->id,
							'theme_purchase_id' => $purchase->id,
							'issue_date' => now(),
							'due_date' => now()->addDays(30),
							'amount' => $paymentIntent->metadata->theme_price,
							'status' => 'paid',
							'items' => [
								[
									'description' => "Theme Purchase: {$theme->title} (ID: {$theme->id})",
									'quantity' => 1,
									'unit_price' => $paymentIntent->metadata->theme_price,
									'amount' => $paymentIntent->metadata->theme_price,
								]
							],
							'notes' => $sellerId > 0 
								? 'Thank you for your theme purchase! 90% has been sent to the theme creator.' 
								: 'Thank you for your theme purchase! This is a system theme.',
						]);
					}
				}
			}
            // Clone funnel fields if they exist
            $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
            foreach ($originalFields as $originalField) {
                $clonedField = $originalField->replicate();
                $clonedField->ez_funnel_id = $clonedFunnel->id;
				$clonedField->unique_id = null;
                $clonedField->save();
            }

            // Clone funnel logo settings if they exist
            $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalLogo) {
                $clonedLogo = $originalLogo->replicate();
                $clonedLogo->funnel_id = $clonedFunnel->id;
                $clonedLogo->save();
            }

            // Clone funnel SEO settings if they exist
            $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalSeo) {
                $clonedSeo = $originalSeo->replicate();
                $clonedSeo->funnel_id = $clonedFunnel->id;
                $clonedSeo->save();
            }

            // Create custom domain record
            $expiryDate = now()->addYear();
            $customDomain = Customdomain::updateOrCreate(
                [
                    'domain' => $paymentIntent->metadata->domain,
                    'domainselected' => $paymentIntent->metadata->domainselected,
                    'user_id' => $user->id
                ],
                [
                    'funnelid' => $clonedFunnel->id,
                    'hashtag' => $clonedFunnel->seo_tag,
                    'expire' => $expiryDate,
                ]
            );

            // Create sales record if selling price provided
            if (!empty($validated['selling_price'])) {
                Sell::updateOrCreate(
                    [
                        'sellid' => $customDomain->id,
                        'type' => 'CUSTOM',
                        'user_id' => $user->id
                    ],
                    [
                        'uniquesellid' => time(),
                        'price' => $paymentIntent->metadata->selling_price,
                        'expire' => $expiryDate
                    ]
                );
            }
            
            // Record the purchase
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                'customdomain_id' => $customDomain->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'stripe',
                'coupon_code' => $paymentIntent->metadata->coupon_code,
                'discount_amount' => $paymentIntent->metadata->promo_price,
                'status' => 'completed',
                'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
            ]);
            
            // Create stripe transaction record
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100, // Convert back to dollars
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
            $customHandle=$paymentIntent->metadata->domain;
            $domain=$paymentIntent->metadata->domainselected;
            // Create invoice
            $invoicenumber='INV-HNDL-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => $stripeTransaction->id,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $paymentIntent->amount / 100,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Custom Handle Purchase: {$domain}/{$customHandle}" . ($isThemeOwner ? " (Theme Owner)" : ""),
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!' . ($isThemeOwner ? ' Theme included free - you are the owner.' : ''),
            ]);
            // Send email with the magic link
            $fulldomain= 'https://'.$domain.'/'.$customHandle;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new custom domain' . ($isThemeOwner ? ' (Theme Owner)' : '')];
            $div=str_replace($str,$rplc,$emaildesign['design']);
            $mailData = [
                                'design' => $div
                            ];
            
            try{
                   $subject = "Ez.wiki Congratulations on your new custom domain";
                    Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
					Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                        $subject = "Ez.wiki Congratulations on your new custom domain";
                        
                        @mail($email, $subject, $div, null,'funnel@ez.wiki');
                }       
            return response()->json([
                'success' => true,
                'url' => "https://{$domain}/{$customHandle}",
                'html' => '<a href="https://'.$domain.'/'.$customHandle.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$domain.'/'.$customHandle.'</a>',
                'available' => true,
                'is_theme_owner' => $isThemeOwner
            ]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function domainpaymentsuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
			'template_id' => 'nullable|integer',
        ]);

        $user = Auth::user();
        $paymentIntentId = $request->payment_intent_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
			$templateId = $request->template_id ?? null;
            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            // Verify the payment belongs to the user
            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            
            // Check if user is theme owner
            $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
            
            // Get the handle purchase record
            // Get the original funnel
            // Clone funnel ID 1
			$domainfull=idn_to_utf8($paymentIntent->metadata->domainselected);
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
            $themetemplate = null;
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$templateIds = (array)$templateId;
					$themeIds = array_merge($templateIds, $themeIds);
				}
				$themetemplate=implode(',',$themeIds);
			}
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->theme = $themetemplate;
            $clonedFunnel->save();
			
			// Only add to collection if user is NOT the owner and theme is NOT already in collection
			if (!empty($originalFunnel->theme) && $templateId && $user) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				if ($templateId !== null) {
					$themeIds[] = $templateId;
					$themeIds = array_values(array_unique($themeIds));
				}
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				
				// Don't add if user is the owner of any theme
				$themesToAdd = [];
				foreach ($newThemes as $themeId) {
					if (!$this->isThemeOwner($user->id, $themeId)) {
						$themesToAdd[] = $themeId;
					}
				}
				
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $themesToAdd);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
					$theme = Template::lockForUpdate()->find($templateId);
					$sellerId = $theme->user_id;
					
					// Only process payment if user is NOT the owner
					if (!$isThemeOwner) {
						$commission = $paymentIntent->metadata->theme_price * 0.10;
						$sellerAmount = $paymentIntent->metadata->theme_price * 0.90;
						if ($sellerId > 0) {
							$sellerBalance = UserBalance::where('user_id', $sellerId)->lockForUpdate()->first();
							
							if (!$sellerBalance) {
								// Create balance record for seller if doesn't exist
								$sellerBalance = UserBalance::create([
									'user_id' => $sellerId,
									'bee_points_balance' => 0,
									'balance' => 0
								]);
							}

							$sellerBalanceBefore = $sellerBalance->bee_points_balance;
							$sellerBalance->bee_points_balance += $sellerAmount;
							$sellerBalance->save();

							// Record transaction for seller
							TokenTransaction::create([
								'user_id' => $sellerId,
								'amount' => $sellerAmount,
								'transaction_type' => 'theme_sale',
								'description' => 'Sold theme: ' . $theme->title . ' to user ' . $user->id,
								'balance_before' => $sellerBalanceBefore,
								'balance_after' => $sellerBalance->bee_points_balance,
								'custom_id' => $theme->id,
							]);
						}
						$tokenInfo = TokenInfo::first();
						if ($tokenInfo) {
							$reserveBefore = $tokenInfo->reserved_supply;
							$tokenInfo->reserved_supply += $commission;
							$tokenInfo->last_updated = now();
							$tokenInfo->save();

							// Record reserve transaction
							$reserveTransaction = ReserveTransaction::create([
								'transaction_type' => 'reserve',
								'amount' => $commission,
								'reason' => 'Theme sale commission - Theme: ' . $theme->title . ' (ID: ' . $theme->id . ')',
								'reference_id' => 'RES-' . Str::upper(Str::random(8)),
								'user_id' => $user->id,
								'admin_id' => 2 // Assuming admin user ID is 1
							]);

							// Generate invoice for commission if service exists
							if (class_exists(InvoiceService::class)) {
								try {
									InvoiceService::createForReserveTransaction($reserveTransaction);
								} catch (\Exception $e) {
									// Log but don't fail the transaction if invoice creation fails
									\Log::error('Failed to create reserve invoice: ' . $e->getMessage());
								}
							}
						}
						// Create theme purchase record
						$purchase = ThemePurchase::create([
							'user_id' => $user->id,
							'theme_id' => $theme->id,
							'amount' => $paymentIntent->metadata->theme_price,
							'currency' => 'BEE',
							'payment_method' => 'bee_points',
							'status' => 'completed',
							'transaction_id' => 'THM-' . strtoupper(Str::random(8)),
							'seller_id' => $sellerId > 0 ? $sellerId : null,
							'seller_amount' => $sellerAmount,
							'commission' => $commission
						]);

						// Create invoice for the theme purchase
						$invoice = $purchase->invoice()->create([
							'invoice_number' => 'INV-THEME-' . strtoupper(Str::random(8)),
							'user_id' => $user->id,
							'theme_purchase_id' => $purchase->id,
							'issue_date' => now(),
							'due_date' => now()->addDays(30),
							'amount' => $paymentIntent->metadata->theme_price,
							'status' => 'paid',
							'items' => [
								[
									'description' => "Theme Purchase: {$theme->title} (ID: {$theme->id})",
									'quantity' => 1,
									'unit_price' => $paymentIntent->metadata->theme_price,
									'amount' => $paymentIntent->metadata->theme_price,
								]
							],
							'notes' => $sellerId > 0 
								? 'Thank you for your theme purchase! 90% has been sent to the theme creator.' 
								: 'Thank you for your theme purchase! This is a system theme.',
						]);
					}
				}
			}
            // Clone funnel fields if they exist
            $originalFields = EzFunnelField::where('ez_funnel_id', $defaultpage->handle_id)->get();
            foreach ($originalFields as $originalField) {
                $clonedField = $originalField->replicate();
                $clonedField->ez_funnel_id = $clonedFunnel->id;
				$clonedField->unique_id = null;
                $clonedField->save();
            }

            // Clone funnel logo settings if they exist
            $originalLogo = FunnelLogoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalLogo) {
                $clonedLogo = $originalLogo->replicate();
                $clonedLogo->funnel_id = $clonedFunnel->id;
                $clonedLogo->save();
            }

            // Clone funnel SEO settings if they exist
            $originalSeo = FunnelSeoSetting::where('funnel_id', $defaultpage->handle_id)->first();
            if ($originalSeo) {
                $clonedSeo = $originalSeo->replicate();
                $clonedSeo->funnel_id = $clonedFunnel->id;
                $clonedSeo->save();
            }

            // Create custom domain record
            $expiryDate = now()->addYear();
            
            $customDomain = Domain::updateOrCreate(
                [
                    'domain' => $paymentIntent->metadata->domain,
                    'domainselected' => $paymentIntent->metadata->domainselected,
                    'user_id' => $user->id
                ],
                [
                    'funnelid' => $clonedFunnel->id,
                    'hashtag' => $clonedFunnel->seo_tag,
                    'expire' => $expiryDate,
                ]
            );

            // Create sales record if selling price provided
            if (!empty($validated['selling_price'])) {
                Sell::updateOrCreate(
                    [
                        'sellid' => $customDomain->id,
                        'type' => 'DOMAIN',
                        'user_id' => $user->id
                    ],
                    [
                        'uniquesellid' => time(),
                        'price' => $paymentIntent->metadata->selling_price,
                        'expire' => $expiryDate
                    ]
                );
            }
            
            // Record the purchase
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                'domain_id' => $customDomain->id,
                'amount' => $paymentIntent->amount / 100,
                'currency' => 'USD',
                'bee_points_amount' => null,
                'payment_method' => 'stripe',
                'coupon_code' => $paymentIntent->metadata->coupon_code,
                'discount_amount' => $paymentIntent->metadata->promo_price,
                'status' => 'completed',
                'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
            ]);
            
            // Create stripe transaction record
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'amount' => $paymentIntent->amount / 100, // Convert back to dollars
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);
            $customHandle=$paymentIntent->metadata->domain;
            $domain=$paymentIntent->metadata->domainselected;
            // Create invoice
            $invoicenumber='INV-HNDL-' . strtoupper(Str::random(8));
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => $invoicenumber,
                'user_id' => $user->id,
                'stripe_transaction_id' => $stripeTransaction->id,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $paymentIntent->amount / 100,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Custom Handle Purchase: {$customHandle}.{$domain}" . ($isThemeOwner ? " (Theme Owner)" : ""),
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!' . ($isThemeOwner ? ' Theme included free - you are the owner.' : ''),
            ]);
            $fulldomain= 'https://'.$customHandle.'.'.$domain;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new domain' . ($isThemeOwner ? ' (Theme Owner)' : '')];
            $div=str_replace($str,$rplc,$emaildesign['design']);
            $mailData = [
                                'design' => $div
                            ];
            
            try{
                   $subject = "Ez.wiki Congratulations on your new domain";
                    Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
					Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                        $subject = "Ez.wiki Congratulations on your new domain";
                        
                        @mail($email, $subject, $div, null,'funnel@ez.wiki');
                }
            return response()->json([
                'success' => true,
                'url' => "https://{$customHandle}.{$domain}",
                'html' => '<a href="https://'.$customHandle.'.'.$domain.'" target="_blank" class="btn btn-warning reloadcreatenew">https://'.$customHandle.'.'.$domain.'</a>',
                'available' => true,
                'is_theme_owner' => $isThemeOwner
            ]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment verification failed. Please contact support.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
	public function checkCollectionByEmail(Request $request)
	{
    $request->validate([
        'email' => 'required|email',
        'theme_id' => 'required|integer'
    ]);

    try {
        $user = User::where('email', $request->email)->first();
        $isInCollection = false;
        $isThemeOwner = false;

        if ($user) {
            $isInCollection = Themecollection::where('user_id', $user->id)
                ->where('theme_id', $request->theme_id)
                ->exists();
                
            $isThemeOwner = $this->isThemeOwner($user->id, $request->theme_id);
        }

        return response()->json([
            'isInCollection' => $isInCollection,
            'is_theme_owner' => $isThemeOwner,
            'user_exists' => !is_null($user)
        ]);
    } catch (\Exception $e) {
        Log::error('Error checking theme collection by email: ' . $e->getMessage());
        return response()->json([
            'isInCollection' => false,
            'is_theme_owner' => false,
            'error' => 'Error checking theme collection'
        ], 500);
    }
	}

}