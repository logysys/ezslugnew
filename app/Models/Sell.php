<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sell extends Model
{
    use HasFactory;
    
    protected $table = 'sells';
    
    protected $fillable = [
        'uniquesellid',
        'user_id',
        'sellid',
        'type',
        'price',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function handleDomain()
	{
		return $this->belongsTo(Domain::class, 'sellid', 'id');
	}

	public function customDomain()
	{
		return $this->belongsTo(Customdomain::class, 'sellid', 'id');
	}
}