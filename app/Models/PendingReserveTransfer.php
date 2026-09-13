<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingReserveTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'amount',
        'reserve_transaction_id',
        'reference_id',
        'processed',
        'processed_at'
    ];

    public function reserveTransaction()
    {
        return $this->belongsTo(ReserveTransaction::class);
    }
}