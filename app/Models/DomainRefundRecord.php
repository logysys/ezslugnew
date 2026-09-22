<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DomainRefundRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'seller_id',
        'domain_id',
        'custom_domain_id',
        'original_amount',
        'buyer_payment_hold',
		'sell_service_commission',
        'reject_service_commission',
        'reject_buyer_commission',
		'total_penalty',
		'refund_amount',
        'payment_method',
        'status',
        'refund_reference',
        'original_transaction_id',
        'notes'
    ];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'buyer_payment_hold' => 'decimal:2',
        'sell_service_commission' => 'decimal:2',
        'reject_service_commission' => 'decimal:2',
		'reject_buyer_commission' => 'decimal:2',
		'total_penalty' => 'decimal:2',
		'refund_amount' => 'decimal:2',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function customDomain()
    {
        return $this->belongsTo(Customdomain::class, 'custom_domain_id');
    }
	
	public function invoice()
    {
        return $this->hasMany(Invoice::class, 'domain_refund_id');
    }
	
}