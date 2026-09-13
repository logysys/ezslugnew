<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\Customdomain;
use App\Models\Domain;
use App\Models\Sell;
use App\Models\UserBalance;
use App\Models\HandlePurchase;
use App\Models\TokenTransaction;
use App\Models\HandleSellingDetail;
use App\Models\DomainRefundRecord;
use App\Models\Frontpage;
use App\Models\Invoice;
use App\Models\PendingDomainTransfer;
use App\Models\User;
use App\Models\Emaildesign;
use App\Models\TokenInfo;
use App\Models\ReserveTransaction;
use App\Models\Themecollection;
use App\Models\ThemePurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\URL;
use App\Services\InvoiceService;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class TemplateMarketplaceController extends Controller
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

    public function index(Request $request)
    {
        $query = [
            'min_price' => $request->input('min_price'),
            'max_price' => $request->input('max_price'),
            'search' => $request->input('search'),
        ];

        $template = Frontpage::where('frontpages.id', 1)
                ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
                ->select('templates.*')
                ->first();

        // Main query with pagination - only show templates with price > 0
        $templatesQuery = Template::where('price', '>', 0)
            ->where('status', 'Active')
            ->with('user') // Ensure user relationship is loaded
            ->where(function($q) use ($query) {
                // Price filters
                if ($query['min_price']) {
                    $q->where('price', '>=', $query['min_price']);
                }
                if ($query['max_price']) {
                    $q->where('price', '<=', $query['max_price']);
                }
            })
            ->where(function($q) use ($query) {
                // Search filters
                if ($query['search']) {
                    $q->where('title', 'like', '%'.$query['search'].'%')
                      ->orWhere('description', 'like', '%'.$query['search'].'%')
                      ->orWhere('unique_id', 'like', '%'.$query['search'].'%');
                }
            })
            ->orderBy('created_at', 'desc');

        $templates = $templatesQuery->paginate(10);

        // Transform data for frontend
        $templateData = [];
        foreach ($templates as $templateItem) {
            $templateData[] = [
                'id' => $templateItem->id,
                'title' => $templateItem->title,
                'image' => $templateItem->image,
                'unique_id' => $templateItem->unique_id,
                'description' => $templateItem->description,
                'price' => $templateItem->price,
                'status' => $templateItem->status,
                'option' => $templateItem->option,
                'user_id' => $templateItem->user_id, // Add user_id
                'created_at' => $templateItem->created_at,
                'updated_at' => $templateItem->updated_at,
                'user' => $templateItem->user ? ['id' => $templateItem->user->id, 'email' => $templateItem->user->email] : null
            ];
        }

        return Inertia::render('TemplateMarketplace', [
            'templates' => $templateData,
            'filters' => $query,
            'template' => $template,
            'pagination' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ],
            'auth' => [
                'user' => auth()->user() ?? null,
                'balance' => auth()->user() ? UserBalance::where('user_id', auth()->id())->first()->bee_points_balance : null
            ]
        ]);
    }

    public function loadmore(Request $request)
    {
        $query = [
            'min_price' => $request->input('min_price'),
            'max_price' => $request->input('max_price'),
            'search' => $request->input('search'),
        ];

        // Check if this is an API request (for load more)
        $isApiRequest = $request->expectsJson() || $request->is('api/*');

        $template = Frontpage::where('frontpages.id', 1)
                ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
                ->select('templates.*')
                ->first();

        // Main query with pagination
        $templatesQuery = Template::where('price', '>', 0)
            ->where('status', 'Active')
            ->with('user') // Ensure user relationship is loaded
            ->where(function($q) use ($query) {
                if ($query['min_price']) {
                    $q->where('price', '>=', $query['min_price']);
                }
                if ($query['max_price']) {
                    $q->where('price', '<=', $query['max_price']);
                }
            })
            ->where(function($q) use ($query) {
                if ($query['search']) {
                    $q->where('title', 'like', '%'.$query['search'].'%')
                      ->orWhere('description', 'like', '%'.$query['search'].'%')
                      ->orWhere('unique_id', 'like', '%'.$query['search'].'%');
                }
            })
            ->orderBy('created_at', 'desc');

        $templates = $templatesQuery->paginate(10);

        // Transform data for response
        $templateData = [];
        foreach ($templates as $templateItem) {
            $templateData[] = [
                'id' => $templateItem->id,
                'title' => $templateItem->title,
                'image' => $templateItem->image,
                'unique_id' => $templateItem->unique_id,
                'description' => $templateItem->description,
                'price' => $templateItem->price,
                'status' => $templateItem->status,
                'option' => $templateItem->option,
                'user_id' => $templateItem->user_id, // Add user_id
                'created_at' => $templateItem->created_at,
                'updated_at' => $templateItem->updated_at,
                'user' => $templateItem->user ? ['id' => $templateItem->user->id, 'email' => $templateItem->user->email] : null
            ];
        }

        $responseData = [
            'templates' => $templateData,
            'pagination' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ]
        ];

        if ($isApiRequest) {
            return response()->json($responseData);
        }

        return Inertia::render('templatemarketplace', array_merge($responseData, [
            'filters' => $query,
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null,
                'balance' => auth()->user() ? UserBalance::where('user_id', auth()->id())->first()->bee_points_balance : null
            ]
        ]));
    }

    // Template Marketplace Stripe Payment Methods
    public function initiateTemplatePayment(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'template_id' => 'required|integer',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'payment_method' => 'required',
            'password' => 'nullable|string|min:8',
        ]);

        $templateId = $validated['template_id'];
        $email = $validated['email'];
        $paymentMethod = $validated['payment_method'];
        $password = $validated['password'] ?? null;

        // Find or create user
        $user = User::where('email', $email)->first();
        
        // Check if user is theme owner
        $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
        
        // Check if theme is already in user's collection OR user is the owner
        $themePrice = $validated['price'];
        $themeInCollection = false;
        
        if ($user && $templateId) {
            $themeInCollection = Themecollection::where('user_id', $user->id)
                ->where('theme_id', $templateId)
                ->exists();
            
            // If user is owner OR theme is in collection, set price to 0
            if ($isThemeOwner || $themeInCollection) {
                $themePrice = 0;
            }
        }

        // Get template details
        $template = Template::find($templateId);
        if (!$template) {
            return response()->json([
                'error' => 'Theme not found'
            ], 404);
        }

        // Use the promo_price directly as it should be the final discounted total
        $actualPrice = $validated['promo_price'];
        
        // Apply minimum price rule
        if ($actualPrice > 0 && $actualPrice < 1) {
            $actualPrice = 1;
        }

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
                    'template_id' => $templateId,
                    'email' => $email,
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_method' => $validated['payment_method'],
                    'promo_price' => $validated['promo_price'],
                    'theme_price' => $themePrice,
                    'total_base_price' => $validated['price'],
                    'theme_in_collection' => $themeInCollection,
                    'is_theme_owner' => $isThemeOwner
                ],
                'receipt_email' => $email,
                'description' => "Rental of Theme: {$template->title} (ID: {$template->unique_id})",
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
            Log::error('Theme Payment Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function handleZeroDollarTemplatePurchase(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'template_id' => 'required|integer',
            'coupon_code' => 'nullable|string',
            'password' => 'nullable|string|min:8',
        ]);

        try {
            $email = $validated['email'];
            $templateId = $validated['template_id'];
            $password = $validated['password'] ?? null;

            // Find or create user
            $user = User::where('email', $email)->first();
            if (empty($user)) {
                $userData = ['email' => $email];
                if ($password) {
                    $userData['password'] = Hash::make($password);
                }
                $user = User::create($userData);
                
                // Send magic link email
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
            
            // Get template
            $template = Template::findOrFail($templateId);
            
            // Only add to collection if user is NOT the owner and theme is NOT already in collection
            if ($template && $user) {
                $existingTheme = Themecollection::where('user_id', $user->id)
                    ->where('theme_id', $templateId)
                    ->exists();
                
                if (!$existingTheme && !$isThemeOwner) {
                    // Add to collection
                    Themecollection::create([
                        'user_id' => $user->id,
                        'theme_id' => $templateId
                    ]);
                    
                    $sellerId = $template->user_id;
                    
                    // Create theme purchase record
                    $purchase = ThemePurchase::create([
                        'user_id' => $user->id,
                        'theme_id' => $template->id,
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
                                'description' => "Theme Rental: {$template->title} (ID: {$template->id})",
                                'quantity' => 1,
                                'unit_price' => 0,
                                'amount' => 0,
                            ]
                        ],
                        'notes' => 'Thank you for your theme rental!',
                    ]);
                }
            }

            // Send confirmation email
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
            $rplc = [
                "https://ez.wiki/{$template->unique_id}", 
                0, 
                $invoice->invoice_number ?? 'FREE-' . strtoupper(Str::random(8)), 
                now(), 
                'Congratulations on your new theme rental' . ($isThemeOwner ? ' (Theme Owner)' : '')
            ];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new theme rental";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new theme rental";
                @mail($email, $subject, $div, null, 'funnel@ez.wiki');
            }

            return response()->json([
                'success' => true,
                'message' => 'Theme rented successfully!',
                'is_theme_owner' => $isThemeOwner,
                'template_id' => $templateId
            ]);

        } catch (\Exception $e) {
            Log::error('Free theme rental error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred during free rental.'
            ], 500);
        }
    }

    public function templatePaymentSuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'template_id' => 'required|integer',
        ]);

        $paymentIntentId = $request->payment_intent_id;
        $templateId = $request->template_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            $template = Template::findOrFail($templateId);
            
            // Check if user is theme owner
            $isThemeOwner = $user ? $this->isThemeOwner($user->id, $templateId) : false;
            
            // Only process if user is NOT the owner and theme is NOT already in collection
            if (!$isThemeOwner) {
                $existingTheme = Themecollection::where('user_id', $user->id)
                    ->where('theme_id', $templateId)
                    ->exists();
                
                if (!$existingTheme) {
                    // Add to collection
                    Themecollection::create([
                        'user_id' => $user->id,
                        'theme_id' => $templateId
                    ]);
                    
                    $sellerId = $template->user_id;
                    
                    // Process payment distribution
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
                            'description' => 'Sold theme: ' . $template->title . ' to user ' . $user->id,
                            'balance_before' => $sellerBalanceBefore,
                            'balance_after' => $sellerBalance->bee_points_balance,
                            'custom_id' => $template->id,
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
                            'reason' => 'Theme sale commission - Theme: ' . $template->title . ' (ID: ' . $template->id . ')',
                            'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                            'user_id' => $user->id,
                            'admin_id' => 2
                        ]);

                        // Generate invoice for commission if service exists
                        if (class_exists(InvoiceService::class)) {
                            try {
                                InvoiceService::createForReserveTransaction($reserveTransaction);
                            } catch (\Exception $e) {
                                Log::error('Failed to create reserve invoice: ' . $e->getMessage());
                            }
                        }
                    }
                    
                    // Create theme purchase record
                    $purchase = ThemePurchase::create([
                        'user_id' => $user->id,
                        'theme_id' => $template->id,
                        'amount' => $paymentIntent->metadata->theme_price,
                        'currency' => 'BEE',
                        'payment_method' => 'stripe',
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
                                'description' => "Theme Rental: {$template->title} (ID: {$template->id})",
                                'quantity' => 1,
                                'unit_price' => $paymentIntent->metadata->theme_price,
                                'amount' => $paymentIntent->metadata->theme_price,
                            ]
                        ],
                        'notes' => $sellerId > 0 
                            ? 'Thank you for your theme rental! 90% has been sent to the theme creator.' 
                            : 'Thank you for your theme rental! This is a system theme.',
                    ]);
                }
            }

            // Send confirmation email
            $emaildesign = Emaildesign::where('id', 19)->first();
            $str = ['{fullDomain}', '{amount}', '{invoiceNumber}', '{purchaseDate}', '{type}'];
            $rplc = [
                "https://ez.wiki/{$template->unique_id}", 
                $paymentIntent->amount / 100, 
                $invoice->invoice_number ?? 'INV-THEME-' . strtoupper(Str::random(8)), 
                now(), 
                'Congratulations on your new theme rental' . ($isThemeOwner ? ' (Theme Owner)' : '')
            ];
            $div = str_replace($str, $rplc, $emaildesign['design']);
            $mailData = ['design' => $div];
            
            try {
                $subject = "Ez.wiki Congratulations on your new theme rental";
                Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                Mail::getSymfonyTransport()->stop();
            } catch (\Exception $e) {
                $subject = "Ez.wiki Congratulations on your new theme rental";
                @mail($user->email, $subject, $div, null, 'funnel@ez.wiki');
            }

            return response()->json([
                'success' => true,
                'message' => 'Theme rented successfully!',
                'is_theme_owner' => $isThemeOwner,
                'template_id' => $templateId
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
}