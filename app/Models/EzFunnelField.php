<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EzFunnelField extends Model
{
    use HasFactory;

    protected $fillable = [
        'ez_funnel_id',
        'unique_id',
        'user_id',
        'emoji_marker',
        'font_size',
        'caption',
        'url',
        'image_url',
        'link_url',
        'orignal_url',
        'pinned',
        'position',
        'reference',
        'custom_width',
        'post_type',
        'approve',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->unique_id)) {
                // Get the next available ID
                $nextId = self::max('id') + 1;
                $model->unique_id = 'F' . str_pad($nextId, 7, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Get the funnel that owns this field.
     */
    public function funnel()
    {
        return $this->belongsTo(EzFunnel::class, 'ez_funnel_id');
    }
	
	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
	
	public function fields()
    {
        return $this->hasMany(EzFunnelField::class)->orderBy('position', 'asc');
    }
	
}