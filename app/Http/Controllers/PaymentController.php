<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\PointPurchase;
use App\Models\StripeTransaction;
use App\Models\Invoice;
use App\Models\UserBalance;
use App\Models\Frontpage;
use App\Models\TokenTransaction;
use App\Models\TokenInfo;
use App\Models\Emaildesign;
use App\Models\ReserveTransaction;
use App\Models\BeeTransfer;
use App\Models\User;
use Stripe\Stripe;
use Carbon\Carbon;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;
use Illuminate\Support\Facades\URL;
use App\Services\InvoiceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private $stripeSecretKey;

    public function __construct()
    {
        $this->stripeSecretKey = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecretKey);
    }

    public function showPurchaseForm()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        $tokenInfo = TokenInfo::first();
        
        return Inertia::render('buybee', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'tokenInfo' => $tokenInfo,
            'stripeKey' => config('services.stripe.key')
        ]);
    }
	
	public function showsendForm()
    {
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
        $tokenInfo = TokenInfo::first();
        
        return Inertia::render('sendbee', [
            'template' => $template,
            'auth' => [
                'user' => auth()->user() ?? null
            ],
            'tokenInfo' => $tokenInfo,
            'stripeKey' => config('services.stripe.key')
        ]);
    }
	
	public function purchasehistory()
	{
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();
    
    $user = Auth::user();
    
    $purchases = PointPurchase::where('user_id', $user->id)
    ->where('status', 'completed')
    ->orderBy('processed_at', 'desc')
    ->with(['invoice' => function($query) {
        $query->select('id', 'point_purchase_id', 'invoice_number');
    }])
    ->paginate(10)
    ->through(function ($purchase) {
        return [
            'id' => $purchase->id,
            'bee_points_amount' => $purchase->bee_points_amount,
            'fiat_amount' => $purchase->fiat_amount,
            'price_per_point' => $purchase->price_per_point,
            'payment_method' => $purchase->payment_method,
            'status' => $purchase->status,
            'processed_at' => $purchase->processed_at,
            'transaction_hash' => $purchase->transaction_hash,
            'invoice_number' => $purchase->invoice->invoice_number ?? null,
        ];
    });
    return Inertia::render('purchasehistory', [
        'template' => $template,
        'auth' => [
            'user' => auth()->user() ?? null
        ],
        'purchases' => $purchases
    ]);
	}
    
    public function initiatePurchase(Request $request)
    {
        $request->validate([
            'points' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0.01',
            'email' => 'required|email',
        ]);

        $user = Auth::user();
        $points = $request->points;
        $price = $request->price;
        $email = $request->email;

        try {
            // Create payment intent
            $paymentIntent = PaymentIntent::create([
                'amount' => round($price * 100), // Convert to cents and round
                'currency' => 'usd',
                'metadata' => [
                    'user_id' => $user->id,
                    'points' => $points,
                    'email' => $email,
                ],
                'receipt_email' => $email,
                'description' => "Purchase of {$points} Bee Points",
            ]);

            // Create a temporary point purchase record
            $pointPurchase = PointPurchase::create([
                'user_id' => $user->id,
                'bee_points_amount' => $points,
                'fiat_amount' => $price,
                'price_per_point' => $price / $points,
                'payment_method' => 'stripe',
                'status' => 'pending',
            ]);

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
                'point_purchase_id' => $pointPurchase->id,
            ]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'error' => 'Payment processing error. Please try again.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    public function handlePaymentSuccess(Request $request)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
            'point_purchase_id' => 'required|integer|exists:point_purchases,id',
        ]);

        $user = Auth::user();
        $paymentIntentId = $request->payment_intent_id;
        $pointPurchaseId = $request->point_purchase_id;

        try {
            // Retrieve payment intent from Stripe
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);

            if ($paymentIntent->status !== 'succeeded') {
                throw new \Exception('Payment not completed');
            }

            // Verify the payment belongs to the user
            if ($paymentIntent->metadata->user_id != $user->id) {
                throw new \Exception('Invalid payment');
            }

            // Get the point purchase record
            $pointPurchase = PointPurchase::findOrFail($pointPurchaseId);
            
            // Verify the purchase belongs to the user
            if ($pointPurchase->user_id != $user->id) {
                throw new \Exception('Invalid purchase record');
            }

            // Update point purchase status
            $pointPurchase->update([
                'status' => 'completed',
                'transaction_hash' => Str::random(32),
                'processed_at' => now(),
            ]);

            // Create stripe transaction record
            $stripeTransaction = StripeTransaction::create([
                'stripe_payment_id' => $paymentIntent->id,
                'user_id' => $user->id,
                'point_purchase_id' => $pointPurchase->id,
                'amount' => $paymentIntent->amount / 100, // Convert back to dollars
                'currency' => $paymentIntent->currency,
                'status' => $paymentIntent->status,
                'payment_method_details' => $paymentIntent->payment_method ? 
                    PaymentMethod::retrieve($paymentIntent->payment_method)->toArray() : null,
                'customer_details' => [
                    'email' => $paymentIntent->receipt_email,
                ],
            ]);

            // Create invoice
            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'user_id' => $user->id,
                'stripe_transaction_id' => $stripeTransaction->id,
                'point_purchase_id' => $pointPurchase->id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $paymentIntent->amount / 100,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Bee Points Purchase",
                        'quantity' => $pointPurchase->bee_points_amount,
                        'unit_price' => $pointPurchase->price_per_point,
                        'amount' => $pointPurchase->fiat_amount,
                    ]
                ],
                'notes' => 'Thank you for your purchase!',
            ]);

            // Update user balance
            $userBalance = UserBalance::firstOrCreate(
                ['user_id' => $user->id],
                ['bee_points_balance' => 0]
            );

            $balanceBefore = $userBalance->bee_points_balance;
            $balanceAfter = $balanceBefore + $pointPurchase->bee_points_amount;

            $userBalance->update([
                'bee_points_balance' => $balanceAfter,
                'last_updated' => now(),
            ]);

            // Create token transaction record
            TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => $pointPurchase->bee_points_amount,
                'transaction_type' => 'purchase',
                'reference_id' => $pointPurchase->id,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);
			$tokenInfo = TokenInfo::first();
			if ($tokenInfo) {
				$tokenInfo->update([
					'total_supply' => $tokenInfo->total_supply + $pointPurchase->bee_points_amount,
					'circulating_supply' => $tokenInfo->circulating_supply + $pointPurchase->bee_points_amount,
					'reserved_supply' => $tokenInfo->reserved_supply + $pointPurchase->bee_points_amount,
				]);
			}
			$transaction = ReserveTransaction::create([
                'transaction_type' => 'reserve',
                'amount' => $pointPurchase->bee_points_amount,
                'reason' => 'New EZ$ Purchase',
                'reference_id' => 'RES-' . Str::upper(Str::random(8)),
                'admin_id' => 2,
				'user_id' => $user->id
            ]);

            // Generate invoice
            InvoiceService::createForReserveTransaction($transaction);
			
			// Send email with the magic link
			$emaildesign = Emaildesign::where('id', 20)->first();
			$str = ['{email}','{points_amount}','{fiat_amount}','{price_per_point}','{invoice_number}','{purchase_date}','{new_balance}','{dashboard_link}','{purchase_history_link}'];
			$rplc =[$user->email,$pointPurchase->bee_points_amount,$pointPurchase->fiat_amount,$tokenInfo->current_price,$invoice->invoice_number,now(),$balanceAfter,'https://ez.wiki/dashboard','https://ez.wiki/purchasehistory'];
			$div=str_replace($str,$rplc,$emaildesign['design']);
			$mailData = [
								'design' => $div
							];
			try{
				   $subject = "Ez.wiki EZ$ Purchase Confirmed!";
					Mail::to(strtolower($user->email))->send(new Eznew($mailData, $subject));
					Mail::getSymfonyTransport()->stop();
				}catch (\Exception $e){
						$subject = "Ez.wiki EZ$ Purchase Confirmed!";
						
						@mail($user->email, $subject, $div, null,'funnel@ez.wiki');
				}
            return response()->json([
                'success' => true,
                'points_added' => $pointPurchase->bee_points_amount,
                'new_balance' => $balanceAfter,
                'invoice_number' => $invoice->invoice_number,
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

    public function getBalance()
    {
        $user = Auth::user();

        $balance = UserBalance::where('user_id', $user->id)
            ->first();

        return response()->json([
            'balance' => $balance ? $balance->bee_points_balance : 0,
        ]);
    }

    public function getPointPrice()
    {
        return response()->json([
            'price_per_point' => 1.00, // $1 per point
        ]);
    }
	
	public function showInvoice($invoiceNumber)
	{
    $user = Auth::user();
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    $invoice = Invoice::where('invoice_number', $invoiceNumber)
        ->with(['pointPurchase', 'stripeTransaction'])
        ->firstOrFail();
	
    // Verify the invoice belongs to the user
    if ($invoice->user_id !== $user->id) {
        abort(403);
    }
    return Inertia::render('invoice', [
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
            'transaction' => [
                'id' => $invoice->stripeTransaction->stripe_payment_id,
                'amount' => number_format($invoice->stripeTransaction->amount, 2),
                'currency' => strtoupper($invoice->stripeTransaction->currency),
                'status' => $invoice->stripeTransaction->status,
                'payment_method' => $invoice->stripeTransaction->payment_method_details['card']['brand'] ?? 'N/A',
                'last4' => $invoice->stripeTransaction->payment_method_details['card']['last4'] ?? '****',
            ],
            'points' => [
                'amount' => $invoice->pointPurchase->bee_points_amount,
                'price_per_point' => number_format($invoice->pointPurchase->price_per_point, 2),
                'total' => number_format($invoice->pointPurchase->fiat_amount, 2),
            ],
        ]
    ]);
	}
	
	public function sendBeePoints(Request $request)
{
    $request->validate([
        'points' => 'required|integer|min:1',
        'recipient_email' => 'required|email|exists:users,email',
    ]);

    $user = Auth::user();
    $points = $request->points;
    $recipientEmail = $request->recipient_email;

    // Check if user is trying to send to themselves
    if ($user->email === $recipientEmail) {
        return response()->json([
            'error' => 'You cannot send EZ$ to yourself.'
        ], 400);
    }

    // Check user balance
    $userBalance = UserBalance::where('user_id', $user->id)->first();
    $currentBalance = $userBalance ? $userBalance->bee_points_balance : 0;

    if ($points > $currentBalance) {
        return response()->json([
            'error' => 'Insufficient EZ$ balance.'
        ], 400);
    }

    // Check if recipient exists
    $recipient = User::where('email', $recipientEmail)->first();
    if (!$recipient) {
        return response()->json([
            'error' => 'Recipient not found. Please check the email address.'
        ], 404);
    }

    try {
        DB::beginTransaction();

        // Calculate amounts
        $serviceCharge = 0; // round($points * 0.1); 10% service charge
        $recipientAmount = $points - $serviceCharge; // 90% to recipient

        // Create BeeTransfer record
        $beeTransfer = BeeTransfer::create([
            'sender_id' => $user->id,
            'receiver_id' => $recipient->id,
            'amount' => $points,
            'service_charge' => $serviceCharge,
            'recipient_amount' => $recipientAmount,
            'transaction_hash' => 'BEE-' . Str::upper(Str::random(12)),
            'status' => 'pending',
            'metadata' => [
                'transfer_type' => 'user_to_user_with_fee',
                'fee_applied' => $serviceCharge,
                'fee_percentage' => 0,
                'initiated_at' => now()->toISOString(),
            ]
        ]);

        // Deduct full amount from sender
        UserBalance::where('user_id', $user->id)->update([
            'bee_points_balance' => DB::raw('bee_points_balance - ' . $points),
            'last_updated' => now(),
        ]);

        // Add points to recipient (90% of original amount)
        $recipientBalance = UserBalance::firstOrCreate(
            ['user_id' => $recipient->id],
            ['bee_points_balance' => 0, 'last_updated' => now()]
        );

        $recipientBalanceBefore = $recipientBalance->bee_points_balance;
        $recipientBalanceAfter = $recipientBalanceBefore + $recipientAmount;

        UserBalance::where('user_id', $recipient->id)->update([
            'bee_points_balance' => $recipientBalanceAfter,
            'last_updated' => now(),
        ]);

        // Add service charge to reserve
        $tokenInfo = TokenInfo::first();
        if ($tokenInfo) {
            $tokenInfo->reserved_supply += $serviceCharge;
            $tokenInfo->save();
        }

        // Create reserve transaction for service charge
        $reserveTransaction = ReserveTransaction::create([
            'transaction_type' => 'service_charge',
            'amount' => $serviceCharge,
            'reason' => '0% service charge for EZ$ transfer from ' . $user->email . ' to ' . $recipient->email,
            'reference_id' => 'FEE-' . Str::upper(Str::random(8)),
            'admin_id' => 2, // System admin
            'user_id' => $user->id,
            'metadata' => [
                'original_transfer_id' => $beeTransfer->id,
                'original_transfer_hash' => $beeTransfer->transaction_hash,
                'sender_id' => $user->id,
                'recipient_id' => $recipient->id,
                'original_amount' => $points,
                'fee_percentage' => 0,
            ]
        ]);

        // Generate invoice for reserve transaction
        InvoiceService::createForReserveTransaction($reserveTransaction);

        // Create transaction records for sender
        $senderTransaction = TokenTransaction::create([
            'user_id' => $user->id,
            'amount' => -$points,
            'transaction_type' => 'send',
            'reference_id' => $beeTransfer->transaction_hash,
            'balance_before' => $currentBalance,
            'balance_after' => $currentBalance - $points,
            'metadata' => [
                'recipient_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'bee_transfer_id' => $beeTransfer->id,
                'transfer_type' => 'user_transfer_with_fee',
                'service_charge' => $serviceCharge,
                'recipient_received' => $recipientAmount,
            ],
        ]);

        // Create transaction record for recipient
        $receiverTransaction = TokenTransaction::create([
            'user_id' => $recipient->id,
            'amount' => $recipientAmount,
            'transaction_type' => 'receive',
            'reference_id' => $beeTransfer->transaction_hash,
            'balance_before' => $recipientBalanceBefore,
            'balance_after' => $recipientBalanceAfter,
            'metadata' => [
                'sender_id' => $user->id,
                'sender_email' => $user->email,
                'bee_transfer_id' => $beeTransfer->id,
                'transfer_type' => 'user_transfer',
                'original_amount' => $points,
                'service_charge' => $serviceCharge,
            ],
        ]);

        // Create transaction record for service charge (reserve)
        $feeTransaction = TokenTransaction::create([
            'user_id' => $recipient->id, // System transaction
            'amount' => $serviceCharge,
            'transaction_type' => 'service_charge',
            'reference_id' => $reserveTransaction->reference_id,
            'balance_before' => $tokenInfo ? $tokenInfo->reserved_supply - $serviceCharge : 0,
            'balance_after' => $tokenInfo ? $tokenInfo->reserved_supply : $serviceCharge,
            'metadata' => [
                'bee_transfer_id' => $beeTransfer->id,
                'sender_id' => $user->id,
                'recipient_id' => $recipient->id,
                'original_amount' => $points,
            ],
        ]);

        // Create invoice for sender (transfer out)
        $senderInvoice = Invoice::create([
            'invoice_number' => 'TRF-OUT-' . strtoupper(Str::random(8)),
            'user_id' => $user->id,
            'bee_transfer_id' => $beeTransfer->id,
            'token_transaction_id' => $senderTransaction->id,
            'reserve_transaction_id' => $reserveTransaction->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'amount' => $points,
            'status' => 'paid',
            'items' => [
                [
                    'description' => "EZ$ Transfer to {$recipient->email}",
                    'quantity' => $points,
                    'unit_price' => 1,
                    'amount' => $points,
                ],
                [
                    'description' => "Service Charge (0%)",
                    'quantity' => $serviceCharge,
                    'unit_price' => 1,
                    'amount' => -$serviceCharge,
                ]
            ],
            'notes' => 'EZ$ transfer to another user with 0% service charge',
            'metadata' => [
                'transfer_type' => 'outgoing',
                'recipient_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'service_charge' => $serviceCharge,
                'net_amount' => $points - $serviceCharge,
            ],
        ]);

        // Create invoice for recipient (transfer in)
        $receiverInvoice = Invoice::create([
            'invoice_number' => 'TRF-IN-' . strtoupper(Str::random(8)),
            'user_id' => $recipient->id,
            'bee_transfer_id' => $beeTransfer->id,
            'token_transaction_id' => $receiverTransaction->id,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'amount' => $recipientAmount,
            'status' => 'paid',
            'items' => [
                [
                    'description' => "EZ$ Transfer from {$user->email}",
                    'quantity' => $recipientAmount,
                    'unit_price' => 1,
                    'amount' => $recipientAmount,
                ]
            ],
            'notes' => 'EZ$ transfer received from another user (net amount after 0% service charge)',
            'metadata' => [
                'transfer_type' => 'incoming',
                'sender_id' => $user->id,
                'sender_email' => $user->email,
                'original_amount' => $points,
                'service_charge' => $serviceCharge,
            ],
        ]);

        // Update BeeTransfer with invoice references and mark as completed
        $beeTransfer->update([
            'status' => 'completed',
            'processed_at' => now(),
            'metadata' => array_merge($beeTransfer->metadata, [
                'sender_invoice_id' => $senderInvoice->id,
                'receiver_invoice_id' => $receiverInvoice->id,
                'reserve_transaction_id' => $reserveTransaction->id,
                'sender_invoice_number' => $senderInvoice->invoice_number,
                'receiver_invoice_number' => $receiverInvoice->invoice_number,
                'reserve_invoice_number' => $reserveTransaction->reference_id,
            ])
        ]);

        DB::commit();

        // Send notifications
        $this->sendTransferNotification($user, $recipient, $recipientAmount, $beeTransfer, $receiverInvoice);
        $this->sendSenderConfirmation($user, $recipient, $points, $beeTransfer, $senderInvoice);

        return response()->json([
            'success' => true,
            'message' => 'EZ$' . $points . ' sent to ' . $recipientEmail . '. ' . $serviceCharge . ' EZ$ service charge applied.',
            'transaction_hash' => $beeTransfer->transaction_hash,
            'net_amount_received' => $recipientAmount,
            'service_charge' => $serviceCharge,
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        
        // Mark transfer as failed if it was created
        if (isset($beeTransfer)) {
            $beeTransfer->update([
                'status' => 'failed',
                'notes' => $e->getMessage(),
            ]);
        }

        Log::error('Bee transfer failed: ' . $e->getMessage());
        
        return response()->json([
            'error' => 'Failed to send EZ$. Please try again.'
        ], 500);
    }
}

    public function transferHistory(Request $request)
{
    $user = Auth::user();
    
    $transfers = BeeTransfer::where('sender_id', $user->id)
        ->orWhere('receiver_id', $user->id)
        ->with(['sender:id,name,email', 'receiver:id,name,email'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($transfer) use ($user) {
            // Extract invoice numbers from metadata
            $metadata = $transfer->metadata ?? [];
            $senderInvoiceNumber = $metadata['sender_invoice_number'] ?? null;
            $receiverInvoiceNumber = $metadata['receiver_invoice_number'] ?? null;
            
            // Determine which invoice to show based on user role
            $invoiceNumber = null;
            if ($transfer->sender_id == $user->id) {
                $invoiceNumber = $senderInvoiceNumber;
            } else {
                $invoiceNumber = $receiverInvoiceNumber;
            }
            
            return [
                'id' => $transfer->id,
                'amount' => $transfer->amount,
                'status' => $transfer->status,
                'transaction_hash' => $transfer->transaction_hash,
                'created_at' => $transfer->created_at,
                'sender' => $transfer->sender,
                'receiver' => $transfer->receiver,
                'sender_id' => $transfer->sender_id,
                'receiver_id' => $transfer->receiver_id,
                'invoice_number' => $invoiceNumber, // Add this line
            ];
        });

    return response()->json(['transfers' => $transfers]);
}

    private function sendTransferNotification($sender, $recipient, $points, $beeTransfer, $invoice)
    {
        try {
            $emaildesign = Emaildesign::where('id', 30)->first();
            if ($emaildesign) {
                $recipientBalance = UserBalance::where('user_id', $recipient->id)->first();
                
                $str = [
                    '{sender_name}', 
                    '{recipient_name}', 
                    '{points_amount}', 
                    '{new_balance}', 
                    '{dashboard_link}',
                    '{transaction_hash}',
                    '{transfer_date}',
                    '{invoice_number}'
                ];
                $rplc = [
                    $sender->name,
                    $recipient->name,
                    $points,
                    $recipientBalance ? $recipientBalance->bee_points_balance : 0,
                    'https://ez.wiki/dashboard',
                    $beeTransfer->transaction_hash,
                    $beeTransfer->processed_at->format('M d, Y H:i:s'),
                    $invoice->invoice_number
                ];
                
                $div = str_replace($str, $rplc, $emaildesign['design']);
                
                $mailData = ['design' => $div];
                $subject = "You received EZ$" . $points . " from " . $sender->name;
                
                Mail::to(strtolower($recipient->email))->send(new Eznew($mailData, $subject));
				Mail::getSymfonyTransport()->stop();
            }
        } catch (\Exception $e) {
            Log::error('Failed to send transfer notification: ' . $e->getMessage());
        }
    }

    private function sendSenderConfirmation($sender, $recipient, $points, $beeTransfer, $invoice)
	{
    try {
        $emaildesign = Emaildesign::where('id', 31)->first();
        if ($emaildesign) {
            $senderBalance = UserBalance::where('user_id', $sender->id)->first();
            
            // Generate recipient initials
            $initials = '';
            $nameParts = explode(' ', $recipient->name);
            foreach ($nameParts as $part) {
                $initials .= strtoupper(substr($part, 0, 1));
            }
            $initials = substr($initials, 0, 2);
            
            $str = [
                '{customer_name}', 
                '{sender_name}', 
                '{recipient_name}', 
                '{recipient_email}', 
                '{points_amount}', 
                '{new_balance}', 
                '{dashboard_link}',
                '{transaction_hash}',
                '{transfer_date}',
                '{invoice_number}',
                '{recipient_initials}'
            ];
            $rplc = [
                $sender->name,
                $sender->name,
                $recipient->name,
                $recipient->email,
                $points,
                $senderBalance ? $senderBalance->bee_points_balance : 0,
                'https://ez.wiki/dashboard',
                $beeTransfer->transaction_hash,
                $beeTransfer->processed_at->format('M d, Y H:i:s'),
                $invoice->invoice_number,
                $initials
            ];
            
            $div = str_replace($str, $rplc, $emaildesign['design']);
            
            $mailData = ['design' => $div];
            $subject = "You sent EZ$" . $points . " to " . $recipient->email;
            
            Mail::to(strtolower($sender->email))->send(new Eznew($mailData, $subject));
			Mail::getSymfonyTransport()->stop();
        }
    } catch (\Exception $e) {
        Log::error('Failed to send sender confirmation: ' . $e->getMessage());
    }
	}
	
public function showSendBeeInvoice($invoiceNumber)
{
    $user = Auth::user();
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    $invoice = Invoice::where('invoice_number', $invoiceNumber)
        ->with(['beeTransfer' => function($query) {
            $query->with(['sender', 'receiver']);
        }])
        ->firstOrFail();
    
    // Verify the invoice belongs to the user
    if ($invoice->user_id !== $user->id) {
        abort(403);
    }

    // Determine transfer details
    $beeTransfer = $invoice->beeTransfer;
    $isOutgoing = strpos($invoice->invoice_number, 'TRF-OUT') === 0;
    
    $counterparty = $isOutgoing 
        ? ($beeTransfer->receiver ?? null)
        : ($beeTransfer->sender ?? null);

    return Inertia::render('invoicesendbee', [
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
            'transfer_type' => $isOutgoing ? 'outgoing' : 'incoming',
            'counterparty' => $counterparty ? [
                'email' => $counterparty->email,
                'name' => $counterparty->name,
            ] : null,
            'transaction_hash' => $beeTransfer->transaction_hash ?? 'N/A',
            'processed_at' => $beeTransfer->processed_at 
                ? Carbon::parse($beeTransfer->processed_at)->format('M d, Y H:i:s')
                : 'N/A',
        ]
    ]);
}
	
}