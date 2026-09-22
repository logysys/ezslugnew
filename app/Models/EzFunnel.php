<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EzFunnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
		'displaymode',
        'fly_sign',
        'eye_tracking',
		'visibility',
		'timer',
		'seo_tag',
        'theme',
		'color',
		'transparency',
		'mode',
		'aiid',
		'pageid',
		'displaymode',
		'designview'
    ];

	protected static function booted()
    {
        static::creating(function ($funnel) {
            // This is a fallback if the trigger doesn't work
            if (empty($funnel->token)) {
                $lastToken = self::orderBy('id', 'desc')->first()?->token;
                $nextId = $lastToken ? (int) substr($lastToken, 1) + 1 : 1;
                $funnel->token = 'X' . str_pad($nextId, 7, '0', STR_PAD_LEFT);
            }
        });
    }

    public function fields()
    {
        return $this->hasMany(EzFunnelField::class);
    }
	
	public function customDomains()
	{
    return $this->hasMany(Customdomain::class, 'funnelid');
	}
	
	public function handleDomains()
	{
    return $this->hasMany(Domain::class, 'funnelid');
	}
	
	public function effectSettings()
	{
	return $this->hasMany(EffectSetting::class);
	}

	public function seoSettings()
	{
		return $this->hasOne(FunnelSeoSetting::class, 'funnel_id');
	}
	
	public function logoSettings()
	{
		return $this->hasOne(FunnelLogoSetting::class, 'funnel_id');
	}
	
	public function user()
	{
		return $this->belongsTo(User::class);
	}
	
	public function aiSearchHistory()
	{
		return $this->belongsTo(AISearchHistory::class, 'aiid', 'id');
	}

}