<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emojimarker extends Model
{
    use HasFactory;
	
	protected $fillable = [
		'emoji',
		'add_emoji',
		'edit_emoji',
		'handle'
    ];
	
}
