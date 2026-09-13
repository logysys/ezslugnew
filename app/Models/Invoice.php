<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'stripe_transaction_id',
        'point_purchase_id',
        'handle_purchase_id',
        'pending_transfer_id',
        'handle_selling_detail_id',
        'domain_refund_id',
        'bee_transfer_id',
        'incentive_id',
        'theme_purchase_id', 
        'issue_date',
        'due_date',
        'amount',
        'status',
        'items',
        'notes'
    ];
    
    protected $dates = [
        'issue_date',
        'due_date',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function stripeTransaction()
    {
        return $this->belongsTo(StripeTransaction::class);
    }

    public function pointPurchase()
    {
        return $this->belongsTo(PointPurchase::class);
    }
    
    public function handlePurchase()
    {
        return $this->belongsTo(HandlePurchase::class);
    }
    
    public function tokenTransaction()
    {
        return $this->belongsTo(TokenTransaction::class);
    }
    
    public function pendingTransfer()
    {
        return $this->belongsTo(PendingDomainTransfer::class);
    }
    
    public function handleSellingDetail()
    {
        return $this->belongsTo(HandleSellingDetail::class);
    }
    
    public function domainRefundRecord()
    {
        return $this->belongsTo(DomainRefundRecord::class);
    }
    
    public function beeTransfer()
    {
        return $this->belongsTo(BeeTransfer::class, 'bee_transfer_id');
    }

    public function incentive()
    {
        return $this->belongsTo(Incentive::class, 'incentive_id', 'incentive_id');
    }

    public function incentiveHistory()
    {
        return $this->belongsTo(IncentiveHistory::class, 'incentive_id', 'incentive_id');
    }
    
    // Add this relationship method for theme purchases
    public function themePurchase()
    {
        return $this->belongsTo(ThemePurchase::class, 'theme_purchase_id');
    }
}