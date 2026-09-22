<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DomainTransferRule extends Model
{
    protected $fillable = [
        'provider_name',
        'keywords',
        'steps',
        'support_url'
    ];

    protected $casts = [
        'keywords' => 'array',
    ];
}