<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bee_balance',
        'bee_points_balance',
        'last_updated'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}