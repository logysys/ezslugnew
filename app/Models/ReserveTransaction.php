<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReserveTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_type',
        'amount',
        'reason',
        'reference_id',
        'admin_id',
		'user_id',
		'recipient_email'
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function user()
    {
        return $this->belongsTo(Userlist::class, 'user_id');
    }
	
	public function invoice()
	{
		return $this->hasOne(Invoice::class);
	}

}