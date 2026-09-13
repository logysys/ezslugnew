<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admindomain extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'domain',
        'days',
        'status'
    ];
	
	protected $attributes = [
    'days' => ''
	];

}