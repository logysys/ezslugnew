<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EffectSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'ez_funnel_id',
        'moving_effect',
        'moving_pattern',
        'brand_message',
        'avatar_link',
        'landing_page'
    ];

    public function ezFunnel()
    {
        return $this->belongsTo(EzFunnel::class);
    }
}