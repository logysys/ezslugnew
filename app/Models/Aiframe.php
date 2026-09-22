<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Aiframe extends Model
{
    use HasFactory;

    protected $fillable = ['domain_id', 'type', 'content', 'status'];

    protected $casts = [
        'status' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the domain that owns the aiframe.
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Admindomain::class, 'domain_id');
    }
}