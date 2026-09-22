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
use App\Models\TempCustomdomain;
use App\Models\TempSell;
use App\Models\Invoice;
use App\Helpers\IframeHelper;
use App\Models\TokenTransaction;
use App\Models\FunnelLogoSetting;
use App\Models\Admindomain;
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
use App\Models\PromotionMessage;
use App\Models\Tooltip;
use Carbon\Carbon;
use App\Models\Sell;
use App\Models\Powerstring;
use App\Models\Defaultpage;
use App\Models\CouponUsage;
use App\Models\AISearchHistory;
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
use Illuminate\Support\Facades\Session;

class HomeController extends Controller
{
    private $stripeSecretKey;

    public function __construct()
    {
        $this->stripeSecretKey = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecretKey);
    }
    
	public function checkUserExists(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $userExists = User::where('email', $request->email)->exists();

        return response()->json([
            'exists' => $userExists,
        ]);
    }
	
    public function demodesign()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        
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
        return Inertia::render('home', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'tokenInfo' => $tokenInfo,
            'domains' => $domains,
            'promoprice' => $promoprice,
			'tooltips' => $tooltips,
            'checkDomainUrl' => url('/check-custom-domain'),
            'checkStandardDomainUrl' => url('/check-standard-domain')
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
			'password' => 'nullable|string|min:8',
        ]);
        
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $email = $validated['email'];
        $paymentMethod = $validated['payment_method'];
        $password = $validated['password'] ?? null;
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

        // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
        $coupon = Coupon::where('coupon', urldecode($couponCode))->first();
        if($coupon) {
            if($coupon['type'] == 'percentage') {
                $actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $actualPrice = $coupon['offer'];
            }
        }
        $actualPrice = max(1, $actualPrice);
        
        try {
            // Create payment intent
            $user = User::where('email', $email)->first();
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
			if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
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
                ],
                'receipt_email' => $email,
                'description' => "Purchase of custom handle {$domain}/{$customHandle}",
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
			'password' => 'nullable|string|min:8',
        ]);
        
        $customHandle = strtolower(trim($validated['custom_handle']));
        $domain = $validated['domain'];
        $email = $validated['email'];
        $paymentMethod = $validated['payment_method'];
        $password = $validated['password'] ?? null;
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

        // Determine the actual price to use based on promo_price
        $actualPrice = $validated['promo_price'] > 0 ? $validated['promo_price'] : $validated['price'];
        $couponCode = $validated['coupon_code'] ?? null;
        $coupon = Coupon::where('coupon', urldecode($couponCode))->first();
        if($coupon) {
            if($coupon['type'] == 'percentage') {
                $actualPrice = $actualPrice - ($actualPrice * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $actualPrice = $coupon['offer'];
            }
        }
        $actualPrice = max(1, $actualPrice);
        
        try {
            // Create payment intent
            $user = User::where('email', $email)->first();
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
			if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
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
                ],
                'receipt_email' => $email,
                'description' => "Purchase of Domain handle {$customHandle}.{$domain}",
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
			'type' => 'required|string'
        ]);

        $pricestring = Powerstring::get()->toArray();
        $value = iconv_strlen(str_replace(' ', '', urldecode($request->domainurl)),'UTF-8');
        $wordprice = 0;
        $price = 0;
        
        if($request->type=='domain')
		{
        // Calculate base price
        foreach ($pricestring as $priceTier) {
            if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
                $wordprice = $priceTier['dollar_price'] * 1;
                $price = $priceTier['dollar_price'];
                break;
            }
        }
		}else
		{
			// Calculate base price
        foreach ($pricestring as $priceTier) {
            if(($value >= $priceTier['min_word']) && ($value <= $priceTier['max_word'])) {
                $wordprice = $priceTier['custom_price'] * 1;
                $price = $priceTier['custom_price'];
                break;
            }
		}
		}

        $response = [
            'original_price' => $price,
            'offprice' => $price, // default to original price
            'title' => '',
            'valid' => false
        ];

        $coupon = Coupon::where('coupon', urldecode($request->couponcode))->first();
        
        if($coupon) {
            $response['valid'] = true;
            $response['title'] = $coupon['title'];
            
            if($coupon['type'] == 'percentage') {
                $response['title'] .= ' '.$coupon['offer'].'% off';
                $response['offprice'] = $price - ($price * ($coupon['offer'] / 100));
            }
            elseif($coupon['type'] == 'all') {
                $response['offprice'] = $coupon['offer'];
            }
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
			'password' => 'nullable|string|min:8',
        ]);

        try {
            $email = $validated['email'];
            $customHandle = strtolower(trim($validated['custom_handle']));
            $domain = $validated['domain'];
            $type = $validated['type'];
            $password = $validated['password'] ?? null;
            $coupon = null;
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
			$couponCode = $validated['coupon_code'];
        
         
			if ($couponCode) {
				$coupon = Coupon::where('coupon', $couponCode)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
			
				// Create a new conversation with the slug
				$conversationId = Str::uuid()->toString();
				$cleanSlug = AISearchHistory::generateUniqueSlug($customHandle);
				$newConversation = AISearchHistory::create([
					'user_id' => $user->id,
					'conversation_id' => $conversationId,
					'slug' => $cleanSlug,
					'message_role' => 'user',
					'content_type' => AISearchHistory::CONTENT_TYPE_AI,
					'thread_id' => 'thread_' . Str::random(16),
					'query' => "GEO Slug: " . $cleanSlug,
					'response' => null,
					'status' => 'public',
					'ip_address' => $request->ip(),
					'user_agent' => $request->userAgent(),
					'session_id' => Session::getId(),
					'conversation_title' => "GEO: " . $cleanSlug,
				]);

				// Create a welcome/placeholder response
				AISearchHistory::create([
					'user_id' => $user->id,
					'conversation_id' => $conversationId,
					'parent_id' => $newConversation->id,
					'message_role' => 'assistant',
					'content_type' => AISearchHistory::CONTENT_TYPE_AI,
					'thread_id' => 'thread_' . Str::random(16),
					'query' => $newConversation->query,
					'response' => "✅ GEO slug **" . $cleanSlug . "** has been saved!\n\nStart adding content to your page by using the **Ask AI**, **Social & Upload**, or **Comments** sections above.",
					'status' => 'public',
					'ip_address' => $request->ip(),
					'user_agent' => $request->userAgent(),
					'session_id' => Session::getId(),
				]);

            // Clone funnel ID 40 (same as in paymentsuccess method)
			$domainfull=idn_to_utf8('ez.wiki');
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->aiid = $newConversation->id;
            $clonedFunnel->save();
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $newThemes);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
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
                $customDomain = Customdomain::create([
					'domain' => $customHandle,
					'domainselected' => $domain,
					'user_id' => $user->id,
					'funnelid' => $clonedFunnel->id,
					'hashtag' => $clonedFunnel->seo_tag,
					'expire' => $expiryDate,
				]);
            } else {
                // Create domain record
                $customDomain = Domain::create([
					'domain' => $customHandle,
					'domainselected' => $domain,
					'user_id' => $user->id,
					'funnelid' => $clonedFunnel->id,
					'hashtag' => $clonedFunnel->seo_tag,
					'expire' => $expiryDate,
				]);
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
			if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}
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
                            ? "Free Custom Handle Purchase: {$domain}/{$customHandle}"
                            : "Free Domain Purchase: {$customHandle}.{$domain}",
                        'quantity' => 1,
                        'unit_price' => 0,
                        'amount' => 0,
                    ]
                ],
                'notes' => 'Thank you for your free purchase!',
            ]);

            // Send confirmation email
            $fulldomain = $type === 'handle' 
                ? "https://{$domain}/{$customHandle}"
                : "https://{$customHandle}.{$domain}";
                
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
            $rplc = [$fulldomain, 0, $invoicenumber, now(), 'Congratulations on your new ' . ($type === 'handle' ? 'custom domain' : 'domain')];
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
                'available' => true
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
        ]);

        $paymentIntentId = $request->payment_intent_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }
			$coupon = null;
            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            if ($paymentIntent->metadata->coupon_code) {
				$coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
			// Create a new conversation with the slug
			$conversationId = Str::uuid()->toString();
			$cleanSlug = AISearchHistory::generateUniqueSlug($paymentIntent->metadata->domain);
			$newConversation = AISearchHistory::create([
				'user_id' => $user->id,
				'conversation_id' => $conversationId,
				'slug' => $cleanSlug,
				'message_role' => 'user',
				'content_type' => AISearchHistory::CONTENT_TYPE_AI,
				'thread_id' => 'thread_' . Str::random(16),
				'query' => "GEO Slug: " . $cleanSlug,
				'response' => null,
				'status' => 'public',
				'ip_address' => $request->ip(),
				'user_agent' => $request->userAgent(),
				'session_id' => Session::getId(),
				'conversation_title' => "GEO: " . $cleanSlug,
			]);

			// Create a welcome/placeholder response
			AISearchHistory::create([
				'user_id' => $user->id,
				'conversation_id' => $conversationId,
				'parent_id' => $newConversation->id,
				'message_role' => 'assistant',
				'content_type' => AISearchHistory::CONTENT_TYPE_AI,
				'thread_id' => 'thread_' . Str::random(16),
				'query' => $newConversation->query,
				'response' => "✅ GEO slug **" . $cleanSlug . "** has been saved!\n\nStart adding content to your page by using the **Ask AI**, **Social & Upload**, or **Comments** sections above.",
				'status' => 'public',
				'ip_address' => $request->ip(),
				'user_agent' => $request->userAgent(),
				'session_id' => Session::getId(),
			]);
			$domainfull=idn_to_utf8('ez.wiki');
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
            
            // Create new funnel as clone
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->aiid = $newConversation->id;
            $clonedFunnel->save();
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $newThemes);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
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
            $customDomain = Customdomain::create([
				'domain' => $paymentIntent->metadata->domain,
				'domainselected' => $paymentIntent->metadata->domainselected,
				'user_id' => $user->id,
				'funnelid' => $clonedFunnel->id,
				'hashtag' => $clonedFunnel->seo_tag,
				'expire' => $expiryDate,
			]);

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
            if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}
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
                        'description' => "Custom Handle Purchase: {$domain}/{$customHandle}",
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!',
            ]);
            // Send email with the magic link
            $fulldomain= 'https://'.$domain.'/'.$customHandle;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new custom domain'];
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
                'available' => true
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
        ]);

        $user = Auth::user();
        $paymentIntentId = $request->payment_intent_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            // Verify the payment belongs to the user
            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            // Get the handle purchase record
            // Get the original funnel
            // Clone funnel ID 1
			$coupon = null;
			if ($paymentIntent->metadata->coupon_code) {
				$coupon = Coupon::where('coupon', $paymentIntent->metadata->coupon_code)->first();
				
				if (!$coupon) {
					return response()->json([
						'error' => 'Invalid coupon code.'
					], 400);
				}
				
				if (!$coupon->isValidForUser($user->id)) {
					if ($coupon->status !== 'Active') {
						return response()->json([
							'error' => 'This coupon is not active.'
						], 400);
					}
					if ($coupon->limit_type === 'limited' && $coupon->getUsageCountAttribute() >= $coupon->use_limit) {
						return response()->json([
							'error' => 'This coupon has reached its usage limit.'
						], 400);
					}
				}
				
			}
			// Create a new conversation with the slug
			$conversationId = Str::uuid()->toString();
			$cleanSlug = AISearchHistory::generateUniqueSlug($paymentIntent->metadata->domain);
			$newConversation = AISearchHistory::create([
				'user_id' => $user->id,
				'conversation_id' => $conversationId,
				'slug' => $cleanSlug,
				'message_role' => 'user',
				'content_type' => AISearchHistory::CONTENT_TYPE_AI,
				'thread_id' => 'thread_' . Str::random(16),
				'query' => "GEO Slug: " . $cleanSlug,
				'response' => null,
				'status' => 'public',
				'ip_address' => $request->ip(),
				'user_agent' => $request->userAgent(),
				'session_id' => Session::getId(),
				'conversation_title' => "GEO: " . $cleanSlug,
			]);

			// Create a welcome/placeholder response
			AISearchHistory::create([
				'user_id' => $user->id,
				'conversation_id' => $conversationId,
				'parent_id' => $newConversation->id,
				'message_role' => 'assistant',
				'content_type' => AISearchHistory::CONTENT_TYPE_AI,
				'thread_id' => 'thread_' . Str::random(16),
				'query' => $newConversation->query,
				'response' => "✅ GEO slug **" . $cleanSlug . "** has been saved!\n\nStart adding content to your page by using the **Ask AI**, **Social & Upload**, or **Comments** sections above.",
				'status' => 'public',
				'ip_address' => $request->ip(),
				'user_agent' => $request->userAgent(),
				'session_id' => Session::getId(),
			]);
			$domainfull=idn_to_utf8('ez.wiki');
			$defaultpage = Defaultpage::whereHas('domain', function($query) use ($domainfull) {
				$query->where('domain', $domainfull);
			})->first();
            $originalFunnel = EzFunnel::findOrFail($defaultpage->handle_id);
            
            // Create new funnel as clone
            $clonedFunnel = $originalFunnel->replicate();
            $clonedFunnel->user_id = $user->id;
			$clonedFunnel->aiid = $newConversation->id;
            $clonedFunnel->save();
			if (!empty($originalFunnel->theme)) {
				$themeIds = array_filter(explode(',', $originalFunnel->theme));
				$existingThemes = Themecollection::where('user_id', $user->id)
					->whereIn('theme_id', $themeIds)
					->pluck('theme_id')
					->toArray();
				
				$newThemes = array_diff($themeIds, $existingThemes);
				$userID=$user->id;
				$themeData = array_map(function($themeId) use ($userID) {
					return [
						'user_id' => $userID,
						'theme_id' => $themeId
					];
				}, $newThemes);
				
				if (!empty($themeData)) {
					Themecollection::insert($themeData);
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
            
            $customDomain = Domain::create([
				'domain' => $paymentIntent->metadata->domain,
				'domainselected' => $paymentIntent->metadata->domainselected,
				'user_id' => $user->id,
				'funnelid' => $clonedFunnel->id,
				'hashtag' => $clonedFunnel->seo_tag,
				'expire' => $expiryDate,
			]);

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
            if ($coupon) {
				  CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'coupon_code' => $coupon->coupon,
                    'used_at' => now(),
                ]);
			}
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
                        'description' => "Custom Handle Purchase: {$customHandle}.{$domain}",
                        'quantity' => 1,
                        'unit_price' => $paymentIntent->amount / 100,
                        'amount' => $paymentIntent->amount / 100,
                    ]
                ],
                'notes' => 'Thank you for your purchase!',
            ]);
            $fulldomain= 'https://'.$customHandle.'.'.$domain;
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}','{amount}','{invoiceNumber}','{purchaseDate}','{type}'];
            $rplc =[$fulldomain,$paymentIntent->amount / 100,$invoicenumber,now(),'Congratulations on your new domain'];
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
                'available' => true
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
	
	public function oki()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        
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
		$metaTitle = 'The Ez way to Oki.WiKi';
		$metaDescription = 'Ez.wiki';
		$metaKeywords = '';
		$metaSiteUrl = url()->current();
		$metaSiteName = 'Oki.WiKi';
		$metaLogo = '';
		$favicon = '';
		$qrcodelogo= '';
        return Inertia::render('oki', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
        ])->withViewData([
				'meta' => [
					'title' => $metaTitle,
					'description' => $metaDescription,
					'keywords' => $metaKeywords,
					'siteurl' => $metaSiteUrl,
					'sitename' => $metaSiteName,
					'metalogo' => $metaLogo
				],
				'favicon' => $favicon
			]);
    }
    
	public function offer($offer)
	{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
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
    // Get promotion message with coupon relationship
    $promotionmessage = PromotionMessage::with('coupon')->where('unique_id', $offer )->first();
     if (!$promotionmessage) {
		 return Inertia::render('invalidoffer', [
					'template' => $template,
					'auth' => [
						'user' => auth()->user() ?? null
					]
				]);
	 }
    // Extract coupon code if exists
    $defaultCouponCode = '';
    if ($promotionmessage && $promotionmessage->coupon) {
        $defaultCouponCode = $promotionmessage->coupon->coupon;
    }
    
    return Inertia::render('offer', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'tokenInfo' => $tokenInfo,
        'domains' => $domains,
        'promoprice' => $promoprice,
        'tooltips' => $tooltips,
        'promotionmessage' => $promotionmessage,
        'defaultCouponCode' => $defaultCouponCode, // Add this
        'checkDomainUrl' => url('/check-custom-domain'),
        'checkStandardDomainUrl' => url('/check-standard-domain')
    ]);
	}
	
	public function remixedslug()
    {
        return Inertia::render('remixedslug');
    }
	
	public function remixedpun()
    {
        return Inertia::render('remixedpun');
    }
	
	public function chardivination()
    {
        return Inertia::render('chardivination');
    }
	
}