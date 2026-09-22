<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThemePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'theme_id',
        'amount',
        'currency',
        'payment_method',
        'status',
        'transaction_id',
        'seller_id',
        'seller_amount',
        'commission'
    ];
	 public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function theme()
    {
        return $this->belongsTo(Template::class, 'theme_id');
    }

    // Add this relationship method for invoice
    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'theme_purchase_id');
    }
}