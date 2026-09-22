<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HandlePurchase extends Model
{
    use HasFactory;
	protected $table = 'handle_purchases';
    protected $fillable = [
        'user_id',
        'customdomain_id',
		'domain_id',
        'amount',
        'currency',
        'bee_points_amount',
        'payment_method',
        'coupon_code',
        'discount_amount',
        'status',
        'transaction_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function Customdomain()
    {
        return $this->belongsTo(Customdomain::class);
    }
	
	public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function invoice()
	{
		return $this->hasOne(Invoice::class, 'handle_purchase_id');
	}
}