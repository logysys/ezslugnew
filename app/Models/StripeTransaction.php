<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StripeTransaction extends Model
{
    use HasFactory;
	
    protected $fillable = [
        'stripe_payment_id',
        'user_id',
        'point_purchase_id',
		'handle_purchase_id',
        'amount',
        'currency',
        'status',
        'payment_method_details',
        'customer_details',
        'seller_details',
        'invoice_details'
    ];

    protected $casts = [
        'payment_method_details' => 'array',
        'customer_details' => 'array',
        'seller_details' => 'array',
        'invoice_details' => 'array',
    ];

    public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function pointPurchase()
	{
		return $this->belongsTo(PointPurchase::class);
	}

	public function handlePurchase()
	{
		return $this->belongsTo(HandlePurchase::class);
	}

	public function invoice()
	{
		return $this->hasOne(Invoice::class);
	}
}