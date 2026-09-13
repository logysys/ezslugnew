<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FunnelSeoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'funnel_id',
        'meta_title',
        'meta_keywords',
        'meta_description',
        'meta_logo',
        'meta_site_name',
        'meta_site_url'
    ];

    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class);
    }
}