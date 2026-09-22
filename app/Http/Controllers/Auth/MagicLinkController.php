<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\MagicLink;
use App\Models\User;
use App\Models\Frontpage;
use App\Models\Emaildesign;
use App\Models\Incentive;
use App\Models\UserBalance;
use App\Models\TokenTransaction;
use App\Models\TokenInfo;
use App\Models\ReserveTransaction;
use App\Models\IncentiveHistory;
use App\Models\Tooltip;
use App\Services\InvoiceService;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;
use App\Mail\Eznew;

class MagicLinkController extends Controller
{
    public function show()
    {
		$template = Frontpage::where('frontpages.id', 2)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();
		$tooltips = Tooltip::all()->mapWithKeys(function ($tooltip) {
			// Decode the JSON tooltips array and convert to key-value pairs
			$tooltipArray = json_decode($tooltip->tooltips, true);
			return [$tooltip->reference => $tooltipArray];
		});
		return Inertia::render('auth/MagicLink', [
			'template' => $template,
			'tooltips' => $tooltips
        ]);
    }

    public function send(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            $user = User::where('email', $request->email)->firstOrFail();
			
			$redirectUrl = $request->input('redirect_url', route('marketplace') );

            $magicLink = $user->createMagicLink($redirectUrl);

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
						Mail::to(strtolower($request->email))->send(new Eznew($mailData, $subject));
						Mail::getSymfonyTransport()->stop();
				}catch (\Exception $e){
						$subject = "Ez.wiki Your Magic Login Link";						
						@mail($request->email, $subject, $div, null,'funnel@ez.wiki');
				}

            return response()->json([
                'message' => 'Magic link sent successfully',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors(),
            ], 422);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send magic link. Please try again later.',
            ], 500);
        }
    }

    public function verify(Request $request, $token)
    {
        $magicLink = MagicLink::where('token', $token)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        Auth::login($magicLink->user);
		$redirectUrl = $magicLink->redirect_url ?? route('marketplace');
        $magicLink->delete();
		$transaction = TokenTransaction::where('user_id', Auth::id())->where('transaction_type', 'signup_incentive')->first();
		if(empty($transaction))
		{
		$incentive = Incentive::where('incentive_id',1)->first();
		$userBalance = UserBalance::where('user_id', Auth::id())->first();	
        if ($userBalance) {
			$userBalance->bee_points_balance += $incentive->amount;
			$userBalance->save();
		} else {
			$userBalance = UserBalance::create([
				'user_id' => Auth::id(),
				'bee_points_balance' => $incentive->amount
			]);
		}
		TokenTransaction::create([
								'user_id' => Auth::id(),
								'amount' => $incentive->amount, // Negative for deduction
								'transaction_type' => 'signup_incentive',
								'balance_before' => $userBalance->bee_points_balance,
								'balance_after' => $userBalance->bee_points_balance + $incentive->amount,
							]);
		
		$incentiveHistory = IncentiveHistory::create([
                'incentive_id' => $incentive->incentive_id,
                'user_id' => Auth::id(),
                'amount' => $incentive->amount,
                'incentive_type' => $incentive->incentive_type,
                'description' => 'Signup incentive via magic link',
                'status' => 'distributed',
                'reference_type' => 'signup',
                'reference_id' => Auth::id(),
                'distributed_at' => now(),
                'notes' => 'Automatically distributed upon first magic link login'
            ]);	
		
		$invoice = Invoice::create([
                'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
                'user_id' => Auth::id(),
                'incentive_id' => $incentive->incentive_id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $incentive->amount,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Signup Incentive - Signup incentive via magic link",
                        'quantity' => 1,
                        'unit_price' => $incentive->amount,
                        'amount' => $incentive->amount,
                    ]
                ],
                'notes' => 'Thank you for signing up! Enjoy your incentive EZ$.',
            ]);
		
		$incentiveHistory->update([
                'reference_type' => 'invoice',
                'reference_id' => $invoice->id
            ]);
		
		$tokenInfo = TokenInfo::first();
		if ($tokenInfo->reserved_supply < $incentive->amount) {
            throw new \Exception('Insufficient reserved supply');
        }

        $tokenInfo->reserved_supply -= $incentive->amount;
        $tokenInfo->last_updated = now();
        $tokenInfo->save();

		$invoiceNumber = 'TRF-RES-' . Str::upper(Str::random(8)) . '-' . now()->format('YmdHis');

        $transaction = ReserveTransaction::create([
            'transaction_type' => 'transfer_to_user',
            'amount' => $incentive->amount,
            'reason' => 'Magic Signup Incentive',
            'reference_id' => $invoiceNumber,
            'admin_id' => 2,
            'user_id' => Auth::id(),
            'recipient_email' => Auth::user()->email // Store the email for future reference
        ]);

		// Generate invoice
		InvoiceService::createForReserveTransaction($transaction);
		
		}
		
        return redirect()->intended($redirectUrl);
    }
}