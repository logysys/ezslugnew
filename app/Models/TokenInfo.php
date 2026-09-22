<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TokenInfo extends Model
{
    use HasFactory;

    protected $fillable = [
        'token_name',
        'total_supply',
        'circulating_supply',
        'current_price',
        'last_updated'
    ];
}