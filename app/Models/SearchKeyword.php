<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchKeyword extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * (Laravel would guess "search_keywords" from the class name,
     *  so we explicitly point it at your existing migration table.)
     */
    protected $table = 'search_settings';

    protected $fillable = [
        'language',
        'word',
    ];
}