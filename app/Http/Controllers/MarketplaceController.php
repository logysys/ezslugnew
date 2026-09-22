<?php

namespace App\Http\Controllers;

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

class MarketplaceController extends Controller
{
    private $stripeSecretKey;

    public function __construct()
    {
        $this->stripeSecretKey = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecretKey);
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

        // Main query with pagination
			$sellsQuery = Sell::with([
			'handleDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'domains.id')
							->where('pending_domain_transfers.domain_type', 'DOMAIN')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'customDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'customdomains.id')
							->where('pending_domain_transfers.domain_type', 'CUSTOM')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'handleDomain.user',
			'customDomain.user'
			])
			->where('price', '>', 0) // Add this line to exclude free listings
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
                    $q->whereHas('handleDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    })
                    ->orWhereHas('customDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    });
                }
            })
            ->orderBy('created_at', 'desc');

        $sells = $sellsQuery->paginate(10);

        // Transform data for frontend
        $domains = [];
        foreach ($sells as $sell) {
            if ($sell->type === 'CUSTOM' && $sell->customDomain) {
                $domains[] = [
                    'id' => $sell->customDomain->id,
                    'domain' => $sell->customDomain->domain,
                    'domainselected' => $sell->customDomain->domainselected,
                    'hashtag' => $sell->customDomain->hashtag,
                    'email' => $sell->customDomain->email,
                    'type' => 'CUSTOM',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->customDomain->user
                        ? ['id' => $sell->customDomain->user->id, 'email' => $sell->customDomain->user->email]
                        : null
                ];
            } elseif ($sell->type === 'DOMAIN' && $sell->handleDomain) {
                $domains[] = [
                    'id' => $sell->handleDomain->id,
                    'domain' => $sell->handleDomain->domain,
                    'domainselected' => $sell->handleDomain->domainselected,
                    'hashtag' => $sell->handleDomain->hashtag,
                    'email' => $sell->handleDomain->email,
                    'type' => 'DOMAIN',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->handleDomain->user
                        ? ['id' => $sell->handleDomain->user->id, 'email' => $sell->handleDomain->user->email]
                        : null
                ];
            }
        }

        return Inertia::render('marketplace', [
            'domains' => $domains,
            'filters' => $query,
            'template' => $template,
            'pagination' => [
                'current_page' => $sells->currentPage(),
                'last_page' => $sells->lastPage(),
                'per_page' => $sells->perPage(),
                'total' => $sells->total(),
            ],
            'auth' => [
                'user' => auth()->user() ?? null,
                'balance' => auth()->user() ? UserBalance::where('user_id', auth()->id())->first()->bee_points_balance : null
            ]
        ]);
    }

    // Domain Marketplace Stripe Payment Methods
    public function initiateDomainPayment(Request $request)
    {
		
        $validated = $request->validate([
            'email' => 'required|email',
            'domain_id' => 'required|integer',
            'domain_type' => 'required|in:CUSTOM,DOMAIN',
            'price' => 'required|numeric|min:0',
            'promo_price' => 'required|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'payment_method' => 'required',
            'password' => 'nullable|string|min:8',
        ]);

        $domainId = $validated['domain_id'];
        $domainType = $validated['domain_type'];
        $email = $validated['email'];
        $paymentMethod = $validated['payment_method'];
        $password = $validated['password'] ?? null;
		
        // Find or create user
        $user = User::where('email', $email)->first();
        
        // Get domain details
        if ($domainType === 'CUSTOM') {
            $domain = Customdomain::find($domainId);
        } else {
            $domain = Domain::find($domainId);
        }
        
        if (!$domain) {
            return response()->json([
                'error' => 'Domain not found'
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
                    'domain_id' => $domainId,
                    'domain_type' => $domainType,
                    'email' => $email,
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_method' => $validated['payment_method'],
                    'promo_price' => $validated['promo_price'],
                    'domain_price' => $actualPrice,
                    'total_base_price' => $validated['price'],
                ],
                'receipt_email' => $email,
                'description' => "Purchase of Domain: " . ($domainType === 'CUSTOM' 
                    ? "{$domain->domainselected}/{$domain->domain}"
                    : "{$domain->domain}.{$domain->domainselected}"),
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
            Log::error('Domain Payment Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function domainPaymentSuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'domain_id' => 'required|integer',
            'domain_type' => 'required|in:CUSTOM,DOMAIN',
        ]);

        $paymentIntentId = $request->payment_intent_id;
        $domainId = $request->domain_id;
        $domainType = $request->domain_type;
        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            $user = User::where('id', $paymentIntent->metadata->user_id)->first();
            
            // Call the existing purchaseDomain method to handle the domain transfer
            // This will use the existing logic but with the Stripe payment
            $purchaseRequest = new Request([
                'domain_id' => $domainId,
                'type' => $domainType,
                'price' => $paymentIntent->metadata->domain_price,
				'user_id' => $paymentIntent->metadata->user_id
            ]);

            // Call the existing purchase logic
            return $this->purchaseDomain($purchaseRequest);

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

    public function purchaseDomain(Request $request)
    {
        $request->validate([
            'domain_id' => 'required|integer',
            'type' => 'required|in:CUSTOM,DOMAIN',
            'price' => 'required|numeric|min:0',
			'user_id' => 'required|integer',
        ]);

        $user = User::where('id', $request->user_id)->first();

        // Start database transaction
        DB::beginTransaction();

        
            // Get the domain being purchased
            if ($request->type === 'CUSTOM') {
                $domain = Customdomain::lockForUpdate()->find($request->domain_id);
            } else {
                $domain = Domain::lockForUpdate()->find($request->domain_id);
            }

            if (!$domain) {
                throw new \Exception('Domain not found');
            }

            // Get the seller's user ID
            $sellerId = $domain->user_id;
            if ($sellerId === $user->id) {
                throw new \Exception('Cannot purchase your own domain');
            }

            // Check if there's already a pending transfer for this domain
            $existingTransfer = PendingDomainTransfer::where('domain_id', $request->domain_id)
                ->where('domain_type', $request->type)
                ->where('status', 'pending')
                ->first();

            if ($existingTransfer) {
                throw new \Exception('This domain is already in the process of being transferred');
            }

            // Calculate commission (10%) and seller amount (90%)
            $commission = $request->price * 0.10;
            $sellerAmount = $request->price * 0.90;

            // Create pending transfer record to "hold" 100% of the funds
            $pendingTransfer = PendingDomainTransfer::create([
                'domain_id' => $request->domain_id,
                'domain_type' => $request->type,
                'buyer_id' => $user->id,
                'seller_id' => $sellerId,
                'amount' => $request->price,
                'seller_amount' => $sellerAmount,
                'commission' => $commission,
                'status' => 'pending',
                'expires_at' => now()->addHours(48),
            ]);

            // Record the purchase
            $handlePurchase = HandlePurchase::create([
                'user_id' => $user->id,
                ($request->type === 'DOMAIN' ? 'domain_id' : 'customdomain_id') => $request->domain_id,
                'amount' => $request->price,
                'currency' => 'USD',
                'bee_points_amount' => $request->price,
                'payment_method' => 'stripe',
                'status' => 'completed', // Payment is completed, transfer is pending
                'transaction_id' => 'HNDL-' . strtoupper(Str::random(8))
            ]);
            
            // Create invoice for buyer
            $description = $request->type === 'DOMAIN' 
                    ? "Domain Purchase: {$domain->domain}.{$domain->domainselected}"
                    : "Custom Handle Purchase: {$domain->domainselected}/{$domain->domain}";
            
            $invoice = $handlePurchase->invoice()->create([
                'invoice_number' => 'INV-HNDL-' . strtoupper(Str::random(8)),
                'user_id' => $user->id,
                'handle_purchase_id' => $handlePurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $request->price,
                'status' => 'paid',
                'items' => [[
                    'description' => $description,
                    'quantity' => 1,
                    'unit_price' => $request->price,
                    'amount' => $request->price,
                ]],
                'notes' => 'Thank you for your purchase! Awaiting seller acceptance.',
            ]);
            
            // Send email with the magic link
            $emaildesign = Emaildesign::where('id', 24)->first();
            $str = ['{domain}','{amount}','{status}','{confirmationdate}'];
            $rplc =[$domain,$request->price,$request->type,$pendingTransfer->expires_at];
            $div=str_replace($str,$rplc,$emaildesign['design']);
            $mailData = [
                                'design' => $div
                            ];
            
            try{
                   $subject = "Ez.wiki Your Domain Purchase is Pending";
                    Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
                    Mail::getSymfonyTransport()->stop();
                }catch (\Exception $e){
                        $subject = "Ez.wiki Your Domain Purchase is Pending";
                        
                        @mail($user->email, $subject, $div, null,'funnel@ez.wiki');
                }

            // Commit all changes
            DB::commit();

            return response()->json([
                'success' => true,
                'balance' => $user->balance ? $user->balance->bee_points_balance : 0,
                'invoice_number' => $invoice->invoice_number,
                'message' => 'Purchase successful! The seller has 48 hours to confirm the transfer.'
            ]);
    }

    public function confirmTransfer(Request $request)
    {
        $request->validate([
            'transfer_id' => 'required|integer|exists:pending_domain_transfers,id',
            'action' => 'required|in:accept,reject'
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
        }

        DB::beginTransaction();

        try {
            $transfer = PendingDomainTransfer::with(['buyer', 'seller'])->lockForUpdate()->findOrFail($request->transfer_id);

            if ($transfer->seller_id !== $user->id) {
                throw new \Exception('Unauthorized action. You are not the seller.');
            }

            if ($transfer->status !== 'pending') {
                throw new \Exception('This transfer has already been processed.');
            }
            
            $domain = $transfer->domain_type === 'CUSTOM' 
                ? Customdomain::findOrFail($transfer->domain_id)
                : Domain::findOrFail($transfer->domain_id);

            if (!$domain) {
                throw new \Exception('Associated domain not found.');
            }

            if ($request->action === 'accept') {
                /**********************************/
                /* LOGIC FOR SELLER ACCEPTS SALE  */
                /**********************************/
                $transfer->status = 'completed';
                $transfer->confirmed_at = now();
                $transfer->save();
                
                // Transfer domain ownership to the buyer
                $domain->user_id = $transfer->buyer_id;
                $domain->save();

                // Credit seller's balance with 90% of sale price
                $sellerBalance = UserBalance::where('user_id', $transfer->seller_id)->lockForUpdate()->first();
                $sellerBalanceBefore = $sellerBalance->bee_points_balance;
                $sellerBalance->bee_points_balance += $transfer->seller_amount;
                $sellerBalance->save();
                
                // Send 10% commission to admin
                $tokenInfo = TokenInfo::first();
                $tokenInfo->reserved_supply += $transfer->commission;
                $tokenInfo->last_updated = now();
                $tokenInfo->save();
                
                // Record transaction for admin commission
                $transaction = ReserveTransaction::create([
                    'transaction_type' => 'reserve',
                    'amount' => $transfer->commission,
                    'reason' => "Commission from domain sale: " . ($transfer->domain_type === 'DOMAIN' 
                        ? "{$domain->domain}.{$domain->domainselected}"
                        : "{$domain->domainselected}/{$domain->domain}"),
                    'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                    'user_id' => $transfer->seller_id,
                    'admin_id' => 2
                ]);
                
                // Create a record for the sale details
                $handleSellingDetail = HandleSellingDetail::create([
                    'user_id' => $transfer->seller_id,
                    ($transfer->domain_type === 'DOMAIN' ? 'domain_id' : 'customdomain_id') => $transfer->domain_id,
                    'amount' => $transfer->amount,
                    'seller_amount' => $transfer->seller_amount,
                    'commission' => $transfer->commission,
                    'payment_method' => 'bee',
                    'status' => 'completed',
                    'transaction_id' => 'SELL-' . strtoupper(Str::random(8))
                ]);
                // Create invoice for handle selling
                $description = $transfer->domain_type === 'DOMAIN' 
                    ? "Domain Purchase: {$domain->domain}.{$domain->domainselected}"
                    : "Custom Handle Purchase: {$domain->domainselected}/{$domain->domain}";
                $invoice = $handleSellingDetail->invoice()->create([
					'invoice_number' => 'INV-SELL-' . strtoupper(Str::random(8)),
					'user_id' => $user->id,
					'handle_selling_detail_id' => $handleSellingDetail->id,
					'issue_date' => now(),
					'due_date' => now()->addDays(30),
					'amount' => $handleSellingDetail->seller_amount,
					'status' => 'paid',
					'items' => [
						[
							'description' => $description,
							'quantity' => 1,
							'unit_price' => $handleSellingDetail->amount,
							'amount' => $handleSellingDetail->amount,
						],
						[
							'description' => "Service Commission (10%)",
							'quantity' => 1,
							'unit_price' => -$handleSellingDetail->commission, // Show as negative since it's deducted
							'amount' => -$handleSellingDetail->commission,
						]
					],
					'summary' => [
						'total_sale' => $handleSellingDetail->amount,
						'commission' => $handleSellingDetail->commission,
						'amount_received' => $handleSellingDetail->seller_amount
					],
					'notes' => 'Thank you for selling with us! Your payout of '.number_format($handleSellingDetail->seller_amount, 2).' has been processed (90% of total sale after 10% commission).',
				]);
                // Record the credit transaction for the seller
                TokenTransaction::create([
                    'user_id' => $transfer->seller_id,
                    'amount' => $transfer->seller_amount,
                    'transaction_type' => 'domain_sale',
                    'description' => 'Sale of domain ID: ' . $transfer->domain_id,
                    'balance_before' => $sellerBalanceBefore,
                    'balance_after' => $sellerBalance->bee_points_balance,
                    'domain_id' => $transfer->domain_type === 'DOMAIN' ? $transfer->domain_id : null,
                    'custom_id' => $transfer->domain_type === 'CUSTOM' ? $transfer->domain_id : null,
                ]);
                
                // Send emails
                $buyer = User::find($transfer->buyer_id);
                $seller = User::find($transfer->seller_id);
				
                if ($buyer) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 25)->first();
					$str = ['{domain}','{transfer}','{createdate}'];
					$rplc =[$domain,$transfer,now()];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					
					try{
						   $subject = "Ez.wiki Your Magic Login Link";
							Mail::to(strtolower($buyer->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Your Magic Login Link";
								
								@mail($buyer->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }
                if ($seller) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 25)->first();
					$str = ['{domain}','{transfer}','{createdate}'];
					$rplc =[$domain,$transfer,now()];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					
					try{
						   $subject = "Ez.wiki Your Magic Login Link";
							Mail::to(strtolower($seller->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Your Magic Login Link";
								
								@mail($seller->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }

            } else { // action === 'reject'
                /************************************************/
                /* CORRECTED LOGIC FOR SELLER REJECTS SALE      */
                /************************************************/
                $transfer->status = 'rejected';
                $transfer->confirmed_at = now();
                $transfer->save();

                // --- Calculate amounts based on rules ---
                $price = $transfer->amount;
                // Rule: "Refund 100% held amount to Buyer"
                $refundHeldAmount = $transfer->amount; // 100% refund
                // Rule: "Seller pays 10% penalty to Buyer"
                $sellerPenaltyForBuyer = $price * 0.10;
                // Rule: "Seller pays 10% commission to Admin"
                $sellerPenaltyForAdmin = $price * 0.10;

                // --- 1. Process Seller's Penalty ---
                $totalSellerPenalty = $sellerPenaltyForBuyer + $sellerPenaltyForAdmin; // Total 20% penalty
                $sellerBalance = UserBalance::where('user_id', $transfer->seller_id)->lockForUpdate()->first();
                
                if ($sellerBalance->bee_points_balance < $totalSellerPenalty) {
                    throw new \Exception('Insufficient balance to pay the rejection penalty. Please top up your account.');
                }
                
                $sellerBalanceBefore = $sellerBalance->bee_points_balance;
                $sellerBalance->bee_points_balance -= $totalSellerPenalty;
                $sellerBalance->save();

                TokenTransaction::create([
                    'user_id' => $transfer->seller_id,
                    'amount' => -$totalSellerPenalty,
                    'transaction_type' => 'domain_rejection_penalty',
                    'description' => 'Penalty for rejecting sale of domain ID: ' . $transfer->domain_id,
                    'balance_before' => $sellerBalanceBefore,
                    'balance_after' => $sellerBalance->bee_points_balance,
                ]);

                // --- 2. Process Buyer's Refund (110% total) ---
                $totalRefundToBuyer = $refundHeldAmount + $sellerPenaltyForBuyer; // 100% held + 10% penalty = 110%
                $buyerBalance = UserBalance::where('user_id', $transfer->buyer_id)->lockForUpdate()->first();
                $buyerBalanceBefore = $buyerBalance->bee_points_balance;
                $buyerBalance->bee_points_balance += $totalRefundToBuyer;
                $buyerBalance->save();

                TokenTransaction::create([
                    'user_id' => $transfer->buyer_id,
                    'amount' => $totalRefundToBuyer,
                    'transaction_type' => 'domain_purchase_refund',
                    'description' => 'Refund for rejected sale of domain ID: ' . $transfer->domain_id,
                    'balance_before' => $buyerBalanceBefore,
                    'balance_after' => $buyerBalance->bee_points_balance,
                ]);
                
                // --- 3. Process Admin's Penalty Commission ---
                // Admin gets 10% from the seller's penalty.
                $tokenInfo = TokenInfo::first();
                $tokenInfo->reserved_supply += $sellerPenaltyForAdmin;
                $tokenInfo->last_updated = now();
                $tokenInfo->save();
                
                $description = $transfer->domain_type === 'DOMAIN' 
                    ? "Domain Purchase: {$domain->domain}.{$domain->domainselected}"
                    : "Custom Handle Purchase: {$domain->domainselected}/{$domain->domain}";
                
                $transaction = ReserveTransaction::create([
                    'transaction_type' => 'reserve',
                    'amount' => $sellerPenaltyForAdmin,
                    'reason' => $description,
                    'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                    'user_id' => $transfer->seller_id,
                    'admin_id' => 2
                ]);

                // --- 4. Log the refund event for record keeping ---
                $total_penalty=$sellerPenaltyForBuyer+$sellerPenaltyForAdmin;
                $domainRefundRecord = DomainRefundRecord::create([
                    'user_id' => $transfer->buyer_id,
                    'seller_id' => $transfer->seller_id,
                    'domain_id' => $transfer->domain_type === 'DOMAIN' ? $transfer->domain_id : null,
                    'custom_domain_id' => $transfer->domain_type === 'CUSTOM' ? $transfer->domain_id : null,
                    'original_amount' => $price,
                    'buyer_payment_hold' => $transfer->amount, // 100% was held
                    'sell_service_commission' => 0, // No commission was taken yet
                    'reject_service_commission' => $sellerPenaltyForAdmin, // 10% from seller to admin
                    'reject_buyer_commission' => $sellerPenaltyForBuyer, // 10% from seller to buyer
                    'refund_amount' => $totalRefundToBuyer, // 110%
                    'total_penalty' => $total_penalty,
                    'status' => 'completed',
                    'payment_method' => 'bee',
                    'refund_reference' => 'RFND-' . strtoupper(Str::random(8)),
                    'original_transaction_id' => $transfer->id,
                    'notes' => 'Refund due to seller rejecting the transfer.'
                ]);

                // Create invoice for buyer's refund (110% of original amount)
                $buyerInvoice = $domainRefundRecord->invoice()->create([
									'invoice_number' => 'INV-RFND-' . strtoupper(Str::random(8)),
									'user_id' => $transfer->buyer_id,
									'domain_refund_id' => $domainRefundRecord->id,
									'issue_date' => now(),
									'due_date' => now()->addDays(30),
									'amount' => $totalRefundToBuyer,
									'status' => 'refunded',
									'items' => [
										[
											'description' => $transfer->domain_type === 'DOMAIN'
												? "Refund for Domain: {$domain->domain}.{$domain->domainselected}"
												: "Refund for Handle: {$domain->domainselected}/{$domain->domain}",
											'quantity' => 1,
											'unit_price' => $price,
											'amount' => $price,
											'type' => 'refund'
										],
										[
											'description' => "Compensation for Rejection (10% of original price)",
											'quantity' => 1,
											'unit_price' => $sellerPenaltyForBuyer,
											'amount' => $sellerPenaltyForBuyer,
											'type' => 'compensation'
										]
									],
									'summary' => [
										'original_amount' => $price,
										'compensation_added' => $sellerPenaltyForBuyer,
										'total_refund' => $totalRefundToBuyer,
										'currency' => 'USD' // Consider adding currency if applicable
									],
									'notes' => implode("\n", [
										"Your purchase has been refunded with additional compensation because the seller rejected the transfer.",
										"",
										"Details:",
										"- Original amount: {$price}",
										"- Compensation added: +{$sellerPenaltyForBuyer} (10%)",
										"",
										"Total refunded: {$totalRefundToBuyer}"
									]),
									'metadata' => [ // Additional useful data
										'original_transfer_id' => $transfer->id,
										'refund_reason' => 'seller_rejection'
									]
								]);
                // Create invoice for seller's penalty (20% of original amount)
                $sellerInvoice = $domainRefundRecord->invoice()->create([
									'invoice_number' => 'INV-PNLT-' . strtoupper(Str::random(8)),
									'user_id' => $transfer->seller_id,
									'domain_refund_id' => $domainRefundRecord->id,
									'issue_date' => now(),
									'due_date' => now()->addDays(30),
									'amount' => $totalSellerPenalty,
									'status' => 'penalty',
									'items' => [
										[
											'description' => "Buyer Compensation (10% of sale price)",
											'quantity' => 1,
											'unit_price' => $sellerPenaltyForBuyer,
											'amount' => $sellerPenaltyForBuyer,
											'type' => 'penalty'
										],
										[
											'description' => "Rejection Fee (10% of sale price)",
											'quantity' => 1,
											'unit_price' => $sellerPenaltyForAdmin,
											'amount' => $sellerPenaltyForAdmin,
											'type' => 'fee'
										]
									],
									'summary' => [
										'original_sale_price' => $price,
										'buyer_compensation' => -$sellerPenaltyForBuyer,
										'rejection_fee' => -$sellerPenaltyForAdmin,
										'total_penalty' => -$totalSellerPenalty,
										'net_effect' => -$totalSellerPenalty
									],
									'notes' => "Penalty invoice for rejecting the domain transfer.\n\n"
											  . "Transaction Details:\n"
											  . "- Original Amount: {$price}\n"
											  . "- Buyer Compensation (10%): {$sellerPenaltyForBuyer}\n"
											  . "- Rejection Fee (10%): {$sellerPenaltyForAdmin}\n"
											  . "Total Penalty (20%): {$totalSellerPenalty}"
								]);
                // Send notifications
                $buyer = User::find($transfer->buyer_id);
                $seller = User::find($transfer->seller_id);
				if($transfer->domain_type=='DOMAIN')
				{
					$domainname=$domain->domain.'.'.$domain->domainselected;
				}else
				{
					$domainname=$domain->domainselected.'/'.$domain->domain;
				}	
				
                if ($domain && $buyer) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 26)->first();
					$str = ['{domain}','{amount}','{reason}','{status}'];
					$rplc =[$domainname,$totalRefundToBuyer,'Seller rejected transfer','Completed to account balance'];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					try{
						   $subject = "Ez.wiki Domain Transfer Rejected";
							Mail::to(strtolower($buyer->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Domain Transfer Rejected";
								
								@mail($buyer->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }
                
                if ($domain && $seller) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 27)->first();
					$str = ['{domain}','{amount}','{status}'];
					$rplc =[$domainname,$totalSellerPenalty,'Rejected'];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					try{
						   $subject = "Ez.wiki Domain Transfer Rejected";
							Mail::to(strtolower($seller->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Domain Transfer Rejected";
								
								@mail($seller->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer ' . $request->action . 'ed successfully.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
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
			$sellsQuery = Sell::with([
			'handleDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'domains.id')
							->where('pending_domain_transfers.domain_type', 'DOMAIN')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'customDomain' => function($q) {
				$q->select(['id', 'user_id', 'domain', 'domainselected', 'hashtag', 'email'])
				  ->whereNotExists(function($query) {
					  $query->select(DB::raw(1))
							->from('pending_domain_transfers')
							->whereColumn('pending_domain_transfers.domain_id', 'customdomains.id')
							->where('pending_domain_transfers.domain_type', 'CUSTOM')
							->where('pending_domain_transfers.status', 'pending');
				  });
			},
			'handleDomain.user',
			'customDomain.user'
			])
			->where('price', '>', 0) // Add this line to exclude free listings
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
                    $q->whereHas('handleDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    })
                    ->orWhereHas('customDomain', function($q) use ($query) {
                        $q->where('domain', 'like', '%'.$query['search'].'%')
                          ->orWhere('domainselected', 'like', '%'.$query['search'].'%')
                          ->orWhere('hashtag', 'like', '%'.$query['search'].'%');
                    });
                }
            })
                        ->orderBy('created_at', 'desc');

        $sells = $sellsQuery->paginate(10);

        // Transform data for response
        $domains = [];
        foreach ($sells as $sell) {
            if ($sell->type === 'CUSTOM' && $sell->customDomain) {
                $domains[] = [
                    'id' => $sell->customDomain->id,
                    'domain' => $sell->customDomain->domain,
                    'domainselected' => $sell->customDomain->domainselected,
                    'hashtag' => $sell->customDomain->hashtag,
                    'email' => $sell->customDomain->email,
                    'type' => 'CUSTOM',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->customDomain->user
                        ? ['id' => $sell->customDomain->user->id, 'email' => $sell->customDomain->user->email]
                        : null
                ];
            } elseif ($sell->type === 'DOMAIN' && $sell->handleDomain) {
                $domains[] = [
                    'id' => $sell->handleDomain->id,
                    'domain' => $sell->handleDomain->domain,
                    'domainselected' => $sell->handleDomain->domainselected,
                    'hashtag' => $sell->handleDomain->hashtag,
                    'email' => $sell->handleDomain->email,
                    'type' => 'DOMAIN',
                    'sells' => [[
                        'price' => $sell->price,
                        'created_at' => $sell->created_at
                    ]],
                    'user' => $sell->handleDomain->user
                        ? ['id' => $sell->handleDomain->user->id, 'email' => $sell->handleDomain->user->email]
                        : null
                ];
            }
        }

        $responseData = [
            'domains' => $domains,
            'pagination' => [
                'current_page' => $sells->currentPage(),
                'last_page' => $sells->lastPage(),
                'per_page' => $sells->perPage(),
                'total' => $sells->total(),
            ]
        ];

        if ($isApiRequest) {
            return response()->json($responseData);
        }

        return Inertia::render('marketplace', array_merge($responseData, [
            'filters' => $query,
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null,
                'balance' => auth()->user() ? UserBalance::where('user_id', auth()->id())->first()->bee_points_balance : null
            ]
        ]));
    }
    
    public function pendingtransferlist(Request $request)
    {
        $user = auth()->user();
        
        // Get pending transfers where user is either buyer or seller
        $transfersQuery = PendingDomainTransfer::with(['buyer', 'seller', 'domain'])
            ->where(function($query) use ($user) {
                $query->where('buyer_id', $user->id)
                      ->orWhere('seller_id', $user->id);
            })
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc');

        $paginatedTransfers = $transfersQuery->paginate(10)->through(function ($transfer) use ($user) {
            $isSeller = $transfer->seller_id === $user->id;
            $otherParty = $isSeller ? $transfer->buyer : $transfer->seller;
            
            $domainUrl = $transfer->domain_type === 'CUSTOM'
                ? "https://{$transfer->domain->domainselected}/{$transfer->domain->domain}"
                : "https://{$transfer->domain->domain}.{$transfer->domain->domainselected}";

            return [
                'id' => $transfer->id,
                'domain' => [
                    'id' => $transfer->domain_id,
                    'name' => $transfer->domain->domain,
                    'selected' => $transfer->domain->domainselected,
                    'type' => strtolower($transfer->domain_type),
                    'url' => $domainUrl,
                ],
                'amount' => $transfer->amount,
                'seller_amount' => $transfer->seller_amount,
                'commission' => $transfer->commission,
                'status' => $transfer->status,
                'expires_at' => Carbon::parse($transfer->expires_at)->format('Y-m-d H:i:s'),
                'created_at' => Carbon::parse($transfer->created_at)->format('Y-m-d H:i:s'),
                'is_seller' => $isSeller,
                'other_party' => $otherParty ? [
                    'id' => $otherParty->id,
                    'email' => $otherParty->email,
                ] : null,
                'can_respond' => $isSeller && $transfer->status === 'pending',
            ];
        });

        if ($request->wantsJson()) {
            return response()->json($paginatedTransfers);
        }

        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        return Inertia::render('pendingtransferlist', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'transfers' => $paginatedTransfers
        ]);
    }
    
    public function refundtransferlist(Request $request)
    {
        $user = auth()->user();
        
        // Get refunded transfers where user is either buyer or seller
        $transfersQuery = DomainRefundRecord::with([
                'buyer', 
                'seller', 
                'domain', 
                'customDomain',
                'invoice' => function($query) {
                    $query->select('id', 'invoice_number', 'domain_refund_id', 'issue_date', 'amount');
                }
            ])
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id) // buyer
                      ->orWhere('seller_id', $user->id); // seller
            })
            ->orderBy('created_at', 'desc');

        $paginatedTransfers = $transfersQuery->paginate(10)->through(function ($transfer) use ($user) {
            $isSeller = $transfer->seller_id === $user->id;
            $otherParty = $isSeller ? $transfer->buyer : $transfer->seller;
            
            // Get the correct invoice based on user role
            $invoice = null;
            if ($transfer->invoice->isNotEmpty()) {
                if ($isSeller) {
                    // For seller, get the penalty invoice (starts with INV-PNLT)
                    $invoice = $transfer->invoice->first(function ($inv) {
                        return str_starts_with($inv->invoice_number, 'INV-PNLT');
                    });
                } else {
                    // For buyer, get the refund invoice (starts with INV-RFND)
                    $invoice = $transfer->invoice->first(function ($inv) {
                        return str_starts_with($inv->invoice_number, 'INV-RFND');
                    });
                }
            }

            $domainType = $transfer->domain_id ? 'DOMAIN' : 'CUSTOM';
            $domain = $transfer->domain ?? $transfer->customDomain;
            
            $domainUrl = $domainType === 'CUSTOM'
                ? "https://{$domain->domainselected}/{$domain->domain}"
                : "https://{$domain->domain}.{$domain->domainselected}";

            return [
                'id' => $transfer->id,
                'domain' => [
                    'id' => $domain->id,
                    'name' => $domain->domain,
                    'selected' => $domain->domainselected,
                    'type' => strtolower($domainType),
                    'url' => $domainUrl,
                ],
                'original_amount' => $transfer->original_amount,
                'buyer_payment_hold' => $transfer->buyer_payment_hold,
                'sell_service_commission' => $transfer->sell_service_commission,
                'reject_service_commission' => $transfer->reject_service_commission,
                'reject_buyer_commission' => $transfer->reject_buyer_commission,
                'total_penalty' => $transfer->total_penalty,
                'refund_amount' => $transfer->refund_amount,
                'status' => 'refunded',
                'processed_at' => Carbon::parse($transfer->created_at)->format('Y-m-d H:i:s'),
                'created_at' => Carbon::parse($transfer->created_at)->format('Y-m-d H:i:s'),
                'is_seller' => $isSeller,
                'other_party' => $otherParty ? [
                    'id' => $otherParty->id,
                    'email' => $otherParty->email,
                ] : null,
                'invoice_number' => $invoice ? $invoice->invoice_number : null,
                'invoice' => $invoice ? [
                    'number' => $invoice->invoice_number,
                    'date' => Carbon::parse($invoice->issue_date)->format('Y-m-d'),
                    'amount' => $invoice->amount
                ] : null
            ];
        });

        if ($request->wantsJson()) {
            return response()->json($paginatedTransfers);
        }

        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        return Inertia::render('refundtransferlist', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'transfers' => $paginatedTransfers
        ]);
    }

    public function loadMoreRefundTransfers(Request $request)
    {
        $user = auth()->user();
        
        $transfersQuery = DomainRefundRecord::with([
                'buyer', 
                'seller', 
                'domain', 
                'customDomain',
                'invoice:id,invoice_number,domain_refund_id'
            ])
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('seller_id', $user->id);
            })
            ->orderBy('created_at', 'desc');

        $paginatedTransfers = $transfersQuery->paginate(10)->through(function ($transfer) use ($user) {
            $isSeller = $transfer->seller_id === $user->id;
            $otherParty = $isSeller ? $transfer->buyer : $transfer->seller;
            
            $domainType = $transfer->domain_id ? 'DOMAIN' : 'CUSTOM';
            $domain = $transfer->domain ?? $transfer->customDomain;
            
            $domainUrl = $domainType === 'CUSTOM'
                ? "https://{$domain->domainselected}/{$domain->domain}"
                : "https://{$domain->domain}.{$domain->domainselected}";

            return [
                'id' => $transfer->id,
                'domain' => [
                    'id' => $domain->id,
                    'name' => $domain->domain,
                    'selected' => $domain->domainselected,
                    'type' => strtolower($domainType),
                    'url' => $domainUrl,
                ],
                'original_amount' => $transfer->original_amount,
                'buyer_payment_hold' => $transfer->buyer_payment_hold,
                'sell_service_commission' => $transfer->sell_service_commission,
                'reject_service_commission' => $transfer->reject_service_commission,
                'reject_buyer_commission' => $transfer->reject_buyer_commission,
                'total_penalty' => $transfer->total_penalty,
                'refund_amount' => $transfer->refund_amount,
                'status' => 'refunded',
                'processed_at' => Carbon::parse($transfer->created_at)->format('Y-m-d H:i:s'),
                'created_at' => Carbon::parse($transfer->created_at)->format('Y-m-d H:i:s'),
                'is_seller' => $isSeller,
                'other_party' => $otherParty ? [
                    'id' => $otherParty->id,
                    'email' => $otherParty->email,
                ] : null,
                'invoice_number' => $transfer->invoice->invoice_number ?? null,
                'invoice' => $transfer->invoice ? [
                    'number' => $transfer->invoice->invoice_number,
                    'date' => Carbon::parse($transfer->invoice->issue_date)->format('Y-m-d'),
                    'amount' => $transfer->invoice->amount
                ] : null
            ];
        });

        return response()->json($paginatedTransfers);
    }

    public function handlesellhistory(Request $request) 
    {
        $user = auth()->user();

        $salesQuery = HandleSellingDetail::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->with([
                'invoice:id,handle_selling_detail_id,invoice_number,issue_date,amount',
                'customDomain:id,domain,domainselected',
                'domain:id,domain,domainselected'
            ]);

        $paginatedSales = $salesQuery->paginate(10)->through(function ($sale) {
            $domain = $sale->customDomain ?? $sale->domain;
            $type = $sale->customDomain ? 'custom' : ($sale->domain ? 'standard' : 'unknown');
            
            return [
                'id' => $sale->id,
                'amount' => $sale->amount,
                'seller_amount' => $sale->seller_amount,
                'commission' => $sale->commission,
                'currency' => 'USD', // Assuming USD as default
                'payment_method' => $sale->payment_method,
                'status' => $sale->status,
                'processed_at' => Carbon::parse($sale->created_at)->format('Y-m-d H:i:s'),
                'transaction_id' => $sale->transaction_id,
                'invoice' => $sale->invoice ? [
                    'number' => $sale->invoice->invoice_number,
                    'date' => Carbon::parse($sale->invoice->issue_date)->format('Y-m-d'),
                    'amount' => $sale->invoice->amount
                ] : null,
                'domain' => $domain ? [
                    'name' => $domain->domain,
                    'selected' => $domain->domainselected,
                    'type' => $type,
                    'url' => $type === 'custom'
                        ? "https://{$domain->domainselected}/{$domain->domain}"
                        : "https://{$domain->domain}.{$domain->domainselected}"
                ] : null
            ];
        });
        
        if ($request->wantsJson()) {
            return response()->json($paginatedSales);
        }

        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        return Inertia::render('handlesellhistory', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'sales' => $paginatedSales
        ]);
    }
	
	public function showHandleSellInvoice($invoiceNumber)
	{
        $user = auth()->user();
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        $invoice = Invoice::where('invoice_number', $invoiceNumber)
            ->with(['handleSellingDetail.customDomain', 'handleSellingDetail.domain'])
            ->firstOrFail();
        
        // Verify the invoice belongs to the user
        if ($invoice->user_id !== $user->id) {
            abort(403);
        }

        // Get handle details
        $handle = null;
        if ($invoice->handleSellingDetail) {
            if ($invoice->handleSellingDetail->customDomain) {
                $handle = [
                    'type' => 'custom',
                    'name' => $invoice->handleSellingDetail->customDomain->domain,
                    'domain' => $invoice->handleSellingDetail->customDomain->domainselected,
                    'url' => "https://{$invoice->handleSellingDetail->customDomain->domainselected}/{$invoice->handleSellingDetail->customDomain->domain}"
                ];
            } elseif ($invoice->handleSellingDetail->domain) {
                $handle = [
                    'type' => 'standard',
                    'name' => $invoice->handleSellingDetail->domain->domain,
                    'domain' => $invoice->handleSellingDetail->domain->domainselected,
                    'url' => "https://{$invoice->handleSellingDetail->domain->domain}.{$invoice->handleSellingDetail->domain->domainselected}"
                ];
            }
        }

        // Prepare transaction details
        $transaction = [
            'id' => $invoice->handleSellingDetail->transaction_id ?? 'N/A',
            'amount' => $invoice->amount,
            'currency' => 'USD',
            'status' => $invoice->status,
            'payment_method' => 'Bee Points',
            'last4' => 'EZ$'
        ];

        return Inertia::render('handlesellinvoice', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'issue_date' => Carbon::parse($invoice->issue_date)->format('M d, Y'),
                'due_date' => Carbon::parse($invoice->due_date)->format('M d, Y'),
                'status' => $invoice->status,
                'amount' => number_format($invoice->amount, 2),
                'items' => $invoice->items,
                'notes' => $invoice->notes,
                'transaction' => $transaction,
                'handle' => $handle
            ]
        ]);
	}
	
	public function showRefundInvoiceseller($invoiceNumber)
    {
        $user = auth()->user();
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        $invoice = Invoice::where('invoice_number', $invoiceNumber)->firstOrFail();

        // Manually load relationships if they don't load automatically
        if ($invoice->domain_refund_id) {
            $refundRecord = DomainRefundRecord::with(['buyer', 'seller', 'domain', 'customDomain'])
                                ->find($invoice->domain_refund_id);
            
            // Manually set the relationship
            $invoice->setRelation('domainRefundRecord', $refundRecord);
        }

        // Verify the invoice belongs to the user (seller)
        if (!$invoice->domainRefundRecord || $invoice->domainRefundRecord->seller_id !== $user->id) {
            abort(403);
        }

        // Get domain details
        $domain = null;
        if ($invoice->domainRefundRecord->domain) {
            $domain = [
                'type' => 'standard',
                'name' => $invoice->domainRefundRecord->domain->domain,
                'domain' => $invoice->domainRefundRecord->domain->domainselected,
                'url' => "https://{$invoice->domainRefundRecord->domain->domain}.{$invoice->domainRefundRecord->domain->domainselected}"
            ];
        } elseif ($invoice->domainRefundRecord->customDomain) {
            $domain = [
                'type' => 'custom',
                'name' => $invoice->domainRefundRecord->customDomain->domain,
                'domain' => $invoice->domainRefundRecord->customDomain->domainselected,
                'url' => "https://{$invoice->domainRefundRecord->customDomain->domainselected}/{$invoice->domainRefundRecord->customDomain->domain}"
            ];
        }

        // Prepare transaction details
        $transaction = [
            'id' => $invoice->domainRefundRecord->original_transaction_id ?? 'N/A',
            'refund_reference' => $invoice->domainRefundRecord->refund_reference ?? null,
            'amount' => $invoice->domainRefundRecord->original_amount,
            'currency' => 'USD',
            'status' => $invoice->domainRefundRecord->status,
            'payment_method' => $invoice->domainRefundRecord->payment_method,
            'last4' => 'EZ$'
        ];

        // Prepare invoice items from the items array stored in the invoice
        $items = $invoice->items;
        // Prepare summary data
        $summary = [
            'original_sale_price' => $invoice->domainRefundRecord->original_amount,
            'buyer_payment_hold' => $invoice->domainRefundRecord->buyer_payment_hold,
            'sale_commission' => $invoice->domainRefundRecord->sell_service_commission,
            'buyer_compensation' => $invoice->domainRefundRecord->reject_buyer_commission,
            'rejection_fee' => $invoice->domainRefundRecord->reject_service_commission,
            'net_effect' => -$invoice->domainRefundRecord->total_penalty
        ];

        return Inertia::render('refundinvoice', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'issue_date' => Carbon::parse($invoice->issue_date)->format('M d, Y'),
                'due_date' => Carbon::parse($invoice->due_date)->format('M d, Y'),
                'status' => $invoice->status,
                'amount' => number_format($invoice->amount, 2),
                'items' => $items,
                'summary' => $summary,
                'notes' => $invoice->notes ?? null,
                'transaction' => $transaction,
                'handle' => $domain,
                'is_seller' => true
            ]
        ]);
    }

    public function showRefundInvoicebuyer($invoiceNumber)
    {
        $user = auth()->user();
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        $invoice = Invoice::where('invoice_number', $invoiceNumber)->firstOrFail();

        // Manually load relationships if they don't load automatically
        if ($invoice->domain_refund_id) {
            $refundRecord = DomainRefundRecord::with(['buyer', 'seller', 'domain', 'customDomain'])
                                ->find($invoice->domain_refund_id);
            
            // Manually set the relationship
            $invoice->setRelation('domainRefundRecord', $refundRecord);
        }

        // Verify the invoice belongs to the user (buyer)
        if (!$invoice->domainRefundRecord || $invoice->domainRefundRecord->user_id !== $user->id) {
            abort(403);
        }

        // Get domain details
        $domain = null;
        if ($invoice->domainRefundRecord->domain) {
            $domain = [
                'type' => 'standard',
                'name' => $invoice->domainRefundRecord->domain->domain,
                'domain' => $invoice->domainRefundRecord->domain->domainselected,
                'url' => "https://{$invoice->domainRefundRecord->domain->domain}.{$invoice->domainRefundRecord->domain->domainselected}"
            ];
        } elseif ($invoice->domainRefundRecord->customDomain) {
            $domain = [
                'type' => 'custom',
                'name' => $invoice->domainRefundRecord->customDomain->domain,
                'domain' => $invoice->domainRefundRecord->customDomain->domainselected,
                'url' => "https://{$invoice->domainRefundRecord->customDomain->domainselected}/{$invoice->domainRefundRecord->customDomain->domain}"
            ];
        }

        // Prepare transaction details
        $transaction = [
            'id' => $invoice->domainRefundRecord->original_transaction_id ?? 'N/A',
            'refund_reference' => $invoice->domainRefundRecord->refund_reference ?? null,
            'amount' => $invoice->domainRefundRecord->original_amount,
            'currency' => 'USD',
            'status' => $invoice->domainRefundRecord->status,
            'payment_method' => $invoice->domainRefundRecord->payment_method,
            'last4' => 'EZ$'
        ];

        // Prepare summary data specific to buyer's view
        $summary = [
            'subtotal' => $invoice->domainRefundRecord->original_amount,
            'Commission' => $invoice->domainRefundRecord->sell_service_commission,
            'compensation' => $invoice->domainRefundRecord->reject_buyer_commission,
            'total_refund' => $invoice->domainRefundRecord->refund_amount
        ];

        return Inertia::render('refundinvoice', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'issue_date' => Carbon::parse($invoice->issue_date)->format('M d, Y'),
                'due_date' => Carbon::parse($invoice->due_date)->format('M d, Y'),
                'status' => $invoice->status,
                'amount' => number_format($invoice->amount, 2),
                'items' => $invoice->items,
                'summary' => $summary,
                'notes' => $invoice->notes ?? null,
                'transaction' => $transaction,
                'handle' => $domain,
                'is_seller' => false // This is a buyer's invoice
            ]
        ]);
    }
	
	public function confirmTransfertwodaysafter()
    {
        DB::beginTransaction();

        try {
				$twoDaysAgo = now()->subDays(2);
				$transferdata = PendingDomainTransfer::with(['buyer', 'seller', 'domain'])
							->where('status', 'pending')
							->where('created_at', '<=', $twoDaysAgo)
							->get();
				foreach ($transferdata as $transfer) {
				$domain = $transfer->domain_type === 'CUSTOM' 
					? Customdomain::findOrFail($transfer->domain_id)
					: Domain::findOrFail($transfer->domain_id);

				if (!$domain) {
					throw new \Exception('Associated domain not found.');
				}

                $transfer->status = 'completed';
                $transfer->confirmed_at = now();
                $transfer->save();
                
                // Transfer domain ownership to the buyer
                $domain->user_id = $transfer->buyer_id;
                $domain->save();

                // Credit seller's balance with 90% of sale price
                $sellerBalance = UserBalance::where('user_id', $transfer->seller_id)->lockForUpdate()->first();
                $sellerBalanceBefore = $sellerBalance->bee_points_balance;
                $sellerBalance->bee_points_balance += $transfer->seller_amount;
                $sellerBalance->save();
                
                // Send 10% commission to admin
                $tokenInfo = TokenInfo::first();
                $tokenInfo->reserved_supply += $transfer->commission;
                $tokenInfo->last_updated = now();
                $tokenInfo->save();
                
                // Record transaction for admin commission
                $transaction = ReserveTransaction::create([
                    'transaction_type' => 'reserve',
                    'amount' => $transfer->commission,
                    'reason' => "Commission from domain sale: " . ($transfer->domain_type === 'DOMAIN' 
                        ? "{$domain->domain}.{$domain->domainselected}"
                        : "{$domain->domainselected}/{$domain->domain}"),
                    'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                    'user_id' => $transfer->seller_id,
                    'admin_id' => 2
                ]);
                
                // Create a record for the sale details
                $handleSellingDetail = HandleSellingDetail::create([
                    'user_id' => $transfer->seller_id,
                    ($transfer->domain_type === 'DOMAIN' ? 'domain_id' : 'customdomain_id') => $transfer->domain_id,
                    'amount' => $transfer->amount,
                    'seller_amount' => $transfer->seller_amount,
                    'commission' => $transfer->commission,
                    'payment_method' => 'bee',
                    'status' => 'completed',
                    'transaction_id' => 'SELL-' . strtoupper(Str::random(8))
                ]);
                // Create invoice for handle selling
                $description = $transfer->domain_type === 'DOMAIN' 
                    ? "Domain Purchase: {$domain->domain}.{$domain->domainselected}"
                    : "Custom Handle Purchase: {$domain->domainselected}/{$domain->domain}";
                $invoice = $handleSellingDetail->invoice()->create([
					'invoice_number' => 'INV-SELL-' . strtoupper(Str::random(8)),
					'user_id' => $transfer->seller_id,
					'handle_selling_detail_id' => $handleSellingDetail->id,
					'issue_date' => now(),
					'due_date' => now()->addDays(30),
					'amount' => $handleSellingDetail->seller_amount,
					'status' => 'paid',
					'items' => [
						[
							'description' => $description,
							'quantity' => 1,
							'unit_price' => $handleSellingDetail->amount,
							'amount' => $handleSellingDetail->amount,
						],
						[
							'description' => "Service Commission (10%)",
							'quantity' => 1,
							'unit_price' => -$handleSellingDetail->commission, // Show as negative since it's deducted
							'amount' => -$handleSellingDetail->commission,
						]
					],
					'summary' => [
						'total_sale' => $handleSellingDetail->amount,
						'commission' => $handleSellingDetail->commission,
						'amount_received' => $handleSellingDetail->seller_amount
					],
					'notes' => 'Thank you for selling with us! Your payout of '.number_format($handleSellingDetail->seller_amount, 2).' has been processed (90% of total sale after 10% commission).',
				]);
                // Record the credit transaction for the seller
                TokenTransaction::create([
                    'user_id' => $transfer->seller_id,
                    'amount' => $transfer->seller_amount,
                    'transaction_type' => 'domain_sale',
                    'description' => 'Sale of domain ID: ' . $transfer->domain_id,
                    'balance_before' => $sellerBalanceBefore,
                    'balance_after' => $sellerBalance->bee_points_balance,
                    'domain_id' => $transfer->domain_type === 'DOMAIN' ? $transfer->domain_id : null,
                    'custom_id' => $transfer->domain_type === 'CUSTOM' ? $transfer->domain_id : null,
                ]);
                
                // Send emails
                $buyer = User::find($transfer->buyer_id);
                $seller = User::find($transfer->seller_id);
				
                if ($buyer) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 25)->first();
					$str = ['{domain}','{transfer}','{createdate}'];
					$rplc =[$domain,$transfer,now()];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					
					try{
						   $subject = "Ez.wiki Your Magic Login Link";
							Mail::to(strtolower($buyer->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Your Magic Login Link";
								
								@mail($buyer->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }
                if ($seller) {
					// Send email with the magic link
					$emaildesign = Emaildesign::where('id', 25)->first();
					$str = ['{domain}','{transfer}','{createdate}'];
					$rplc =[$domain,$transfer,now()];
					$div=str_replace($str,$rplc,$emaildesign['design']);
					$mailData = [
										'design' => $div
									];
					
					try{
						   $subject = "Ez.wiki Your Magic Login Link";
							Mail::to(strtolower($seller->email))->send(new Eznew($mailData, $subject));
							Mail::getSymfonyTransport()->stop();
						}catch (\Exception $e){
								$subject = "Ez.wiki Your Magic Login Link";
								
								@mail($seller->email, $subject, $div, null,'funnel@ez.wiki');
						}
                }


            DB::commit();

			}

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
	
}