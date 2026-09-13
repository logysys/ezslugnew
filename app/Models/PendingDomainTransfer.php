<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingDomainTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'domain_type',
        'buyer_id',
        'seller_id',
        'amount',
        'seller_amount',
        'commission',
        'reference_id',
        'status',
        'expires_at',
        'confirmed_at'
    ];

    protected $dates = [
        'expires_at',
        'confirmed_at'
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function domain()
    {
        return $this->domain_type === 'CUSTOM' 
            ? $this->belongsTo(Customdomain::class, 'domain_id')
            : $this->belongsTo(Domain::class, 'domain_id');
    }
}