<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PointPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bee_points_amount',
        'fiat_amount',
        'price_per_point',
        'payment_method',
        'transaction_hash',
        'status',
        'processed_at'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
	
	public function invoice()
	{
		return $this->hasOne(Invoice::class, 'point_purchase_id');
	}
}