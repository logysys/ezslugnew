<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\IncentiveHistory;
use App\Models\Invoice;
use App\Models\Frontpage;
use App\Models\Template;
use Illuminate\Support\Facades\DB;

class IncentiveHistoryController extends Controller
{
    /**
     * Display the incentive history page.
     */
     public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get the frontpage template
        $template = Frontpage::where('frontpages.id', 1)
            ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
            ->select('templates.*')
            ->first();

        // Get paginated incentive history for the user with invoice numbers
        $perPage = 10;
        $incentives = IncentiveHistory::where('user_id', $user->id)
            ->with(['invoice' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->orderBy('distributed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*']);

        // Transform the data to include invoice number
        $incentives->getCollection()->transform(function ($incentive) {
            $incentive->invoice_number = $incentive->invoice->invoice_number ?? null;
            return $incentive;
        });

        return Inertia::render('incentivehistory', [
            'template' => $template,
            'auth' => [
                'user' => $user ?? null
            ],
            'incentives' => $incentives
        ]);
    }

    /**
     * API endpoint to get more incentive history (for load more functionality)
     */
    public function loadMore(Request $request)
    {
        $request->validate([
            'page' => 'required|integer|min:1'
        ]);

        $user = Auth::user();
        $perPage = 10;

        $incentives = IncentiveHistory::where('user_id', $user->id)
            ->with(['invoice' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            }])
            ->orderBy('distributed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $request->page);

        // Transform the data to include invoice number
        $incentives->getCollection()->transform(function ($incentive) {
            $incentive->invoice_number = $incentive->invoice->invoice_number ?? null;
            return $incentive;
        });

        return response()->json($incentives);
    }
	
	public function showInvoice($invoiceNumber)
{
    $user = Auth::user();
    
    // Get the frontpage template
    $template = Frontpage::where('frontpages.id', 1)
        ->join('templates', 'frontpages.theme_id', '=', 'templates.id')
        ->select('templates.*')
        ->first();

    // Find the invoice by invoice number and ensure it belongs to the user
    $invoice = Invoice::where('invoice_number', $invoiceNumber)
        ->where('user_id', $user->id)
        ->firstOrFail();

    // Find the related incentive history
    $incentiveHistory = IncentiveHistory::where('incentive_id', $invoice->incentive_id)
        ->where('user_id', $user->id)
        ->firstOrFail();

    // No need to decode items since it's already cast to array in the model
    // $invoice->items is already an array due to the model cast

    return Inertia::render('incentiveinvoice', [
        'template' => $template,
        'auth' => [
            'user' => $user ?? null
        ],
        'invoice' => $invoice,
        'incentive' => $incentiveHistory
    ]);
}
    
	
}