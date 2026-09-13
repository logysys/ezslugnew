<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;
	
	protected $fillable = [
		'scraping',
        'scrapingurl',
		'set',
		'sitemapupdate',
		'sitemapcustom',
		'sitemapdomain',
		'mailuid',
		'mailuidjunk',
		'handlelimit',
    ];
	
}
