<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Powerstring extends Model
{
    use HasFactory;
	
	protected $fillable = [
		'min_word',
		'max_word',
		'dollar_price',
		'custom_price'
    ];  
	
}
