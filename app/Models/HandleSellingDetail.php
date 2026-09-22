<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HandleSellingDetail extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'handle_selling_details';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'customdomain_id',
        'domain_id',
        'amount',
        'payment_method',
        'seller_amount',
        'commission',
        'status',
        'transaction_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'seller_amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user associated with this selling detail.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the custom domain associated with this selling detail.
     */
    public function customDomain()
    {
        return $this->belongsTo(CustomDomain::class, 'customdomain_id');
    }

    /**
     * Get the domain associated with this selling detail.
     */
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
	
	public function invoice()
	{
		return $this->hasOne(Invoice::class, 'handle_selling_detail_id');
	}
	
}