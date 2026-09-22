<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'image',
        'user_id',
        'description',
        'price',
        'status',
        'option',
		'unique_id',
		'leftwidth',
		'rightwidth',
		'bgcolour',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
	
	public function user()
    {
        return $this->belongsTo(User::class);
    }
	
}