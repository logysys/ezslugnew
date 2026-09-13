<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageGenerate extends Model
{
    use HasFactory;

    protected $table = 'page_generates';

    protected $fillable = [
        'slug',
        'title',
        'html_content',
        'processed_html',
        'secrets',
		'user_id',
    ];

    /**
     * Accessor: Get secrets as decoded array.
     */
    public function getSecretsAttribute($value): ?array
    {
        if (!$value) return null;
        return json_decode($value, true);
    }

    /**
     * Accessor: Get has_secrets boolean.
     */
    public function getHasSecretsAttribute(): bool
    {
        return !empty($this->attributes['secrets']);
    }

    protected $hidden = [
        'html_content',
        'processed_html',
        'secrets',
    ];

    protected $appends = ['has_secrets'];
	
	public function ezFunnel()
    {
        return $this->hasOne(EzFunnel::class, 'pageid', 'id');
    }
}