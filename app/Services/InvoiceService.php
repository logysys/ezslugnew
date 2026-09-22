<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\ReserveTransaction;
use Illuminate\Support\Str;

class InvoiceService
{
    public static function createForReserveTransaction(ReserveTransaction $transaction)
    {
        $invoiceNumber = 'INV-RES-' . Str::upper(Str::random(8)) . '-' . now()->format('YmdHis');
        
        $invoiceData = [
            'invoice_number' => $invoiceNumber,
            'amount' => $transaction->amount,
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => 'paid',
            'items' => [
                [
                    'description' => self::getTransactionDescription($transaction),
                    'quantity' => 1,
                    'unit_price' => $transaction->amount,
                    'total' => $transaction->amount
                ]
            ],
            'notes' => $transaction->reason,
            'reserve_transaction_id' => $transaction->id
        ];

        // Add user_id if it's a transfer transaction
        if ($transaction->user_id) {
            $invoiceData['user_id'] = $transaction->user_id;
        }

        return Invoice::create($invoiceData);
    }

    private static function getTransactionDescription(ReserveTransaction $transaction)
    {
        $descriptions = [
            'reserve' => 'BeeY Points Reservation',
            'release' => 'BeeY Points Release from Reserve',
            'transfer_to_user' => 'BeeY Points Transfer from Reserve to User'
        ];

        return $descriptions[$transaction->transaction_type] ?? 'Reserve Management Transaction';
    }
}