<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FunnelLogoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'funnel_id',
        'logoimage',
		'fly_sign_logo',
        'favicon_logo',
        'meta_logo',
        'secondary_logo'
    ];

    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class);
    }
}