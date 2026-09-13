<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Themecollection extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'theme_id',
        'user_id'
    ];

    public function template()
    {
        return $this->belongsTo(Template::class, 'theme_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}