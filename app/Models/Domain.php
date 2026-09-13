<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    use HasFactory;
    
    protected $table = 'domains';
    
    protected $fillable = [
        'user_id',
        'funnelid',
        'expire',
        'email',
        'hashtag',
        'domain',
        'domainselected'
    ];

    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class, 'funnelid');
    }
	
	public function sells()
	{
		return $this->hasMany(Sell::class, 'sellid')->where('type', 'DOMAIN');
	}
	
	public function user()
    {
        return $this->belongsTo(User::class);
    }

}