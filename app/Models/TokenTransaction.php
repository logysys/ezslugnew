<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TokenTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'transaction_type',
        'reference_id',
		'custom_id',
		'domain_id',
        'balance_before',
        'balance_after'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
	
	public function domain()
	{
		return $this->belongsTo(Domain::class);
	}

	public function customDomain()
	{
		return $this->belongsTo(Customdomain::class, 'custom_id');
	}

}