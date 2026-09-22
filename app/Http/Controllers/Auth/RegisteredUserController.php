<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use App\Models\Frontpage;
use App\Models\Incentive;
use App\Models\IncentiveHistory;
use App\Models\UserBalance;
use App\Models\TokenTransaction;
use App\Models\TokenInfo;
use App\Models\Invoice;
use App\Models\ReserveTransaction;
use App\Models\PendingReserveTransfer;
use App\Models\Tooltip;
use App\Services\InvoiceService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
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
		
		return Inertia::render('auth/register', [
			'template' => $template,
			'tooltips' => $tooltips,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
				
        event(new Registered($user));
		
		$incentive = Incentive::where('incentive_id',1)->first();
			
        if ($incentive) {
            UserBalance::firstOrCreate(
                ['user_id' => $user->id],
                ['bee_points_balance' => $incentive->amount]
            );
        }
		
		$incentiveHistory = IncentiveHistory::create([
                'incentive_id' => $incentive->incentive_id,
                'user_id' => $user->id,
                'amount' => $incentive->amount,
                'incentive_type' => $incentive->incentive_type,
                'description' => 'Signup incentive',
                'status' => 'distributed',
                'reference_type' => 'signup',
                'reference_id' => $user->id,
                'distributed_at' => now(),
                'notes' => 'Automatically distributed upon Signup incentive'
            ]);	
		
		$invoice = Invoice::create([
                'invoice_number' => 'INC-' . strtoupper(Str::random(8)),
                'user_id' => $user->id,
                'incentive_id' => $incentive->incentive_id,
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'amount' => $incentive->amount,
                'status' => 'paid',
                'items' => [
                    [
                        'description' => "Signup Incentive",
                        'quantity' => 1,
                        'unit_price' => $incentive->amount,
                        'amount' => $incentive->amount,
                    ]
                ],
                'notes' => 'Thank you for signing up! Enjoy your incentive EZ$.',
            ]);
		TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => $incentive->amount, // Negative for deduction
                'transaction_type' => 'signup_incentive',
                'balance_before' => 0,
                'balance_after' => $incentive->amount,
            ]);
		$pendingTransfers = PendingReserveTransfer::where('email', $user->email)
            ->where('processed', false)
            ->get();
            
        foreach ($pendingTransfers as $pending) {
            // Credit the user's balance
            $userBalance = UserBalance::firstOrNew(['user_id' => $user->id]);
            $balanceBefore = $userBalance->bee_points_balance ?? 0;
            $userBalance->bee_points_balance += $pending->amount;
            $userBalance->last_updated = now();
            $userBalance->save();
            
            // Create token transaction record
            TokenTransaction::create([
                'user_id' => $user->id,
                'amount' => $pending->amount,
                'transaction_type' => 'reserve_transfer',
                'reference_id' => $pending->reference_id,
                'balance_before' => $balanceBefore,
                'balance_after' => $userBalance->bee_points_balance
            ]);
            
            // Update the reserve transaction with the user ID
            $pending->reserveTransaction->update(['user_id' => $user->id]);
			
            // Mark as processed
            $pending->update([
                'processed' => true,
                'processed_at' => now()
            ]);
		}
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
            'reason' => 'Signup Incentive',
            'reference_id' => $invoiceNumber,
            'admin_id' => 2,
            'user_id' => $user->id,
            'recipient_email' => $user->email // Store the email for future reference
        ]);

		// Generate invoice
		InvoiceService::createForReserveTransaction($transaction);
			
        Auth::login($user);
		
        return to_route('dashboard');
    }
}
