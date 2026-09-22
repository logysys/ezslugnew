<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PromotionMessage extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'unique_id',
        'domain',
        'coupon_id',
        'message',
        'display_order',
        'status',
        'start_date',
        'end_date'
    ];
    
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->unique_id)) {
                $model->unique_id = self::generateUniqueId();
            }
        });
    }

    /**
     * Generate a unique ID for the promotion message.
     *
     * @return string
     */
    protected static function generateUniqueId(): string
    {
        $prefix = 'PROMO';
        $latest = self::where('unique_id', 'like', "{$prefix}%")
            ->orderBy('unique_id', 'desc')
            ->first();

        if ($latest) {
            $number = (int) substr($latest->unique_id, strlen($prefix));
            $number++;
        } else {
            $number = 1;
        }

        $uniqueId = $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);

        // Ensure uniqueness (in case of collisions)
        while (self::where('unique_id', $uniqueId)->exists()) {
            $number++;
            $uniqueId = $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
        }

        return $uniqueId;
    }
    
    /**
     * Get the coupon associated with the promotion message.
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class, 'coupon_id');
    }
    
    /**
     * Scope a query to only include active messages.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Active')
                     ->where(function($q) {
                         $q->whereNull('start_date')
                           ->orWhere('start_date', '<=', now());
                     })
                     ->where(function($q) {
                         $q->whereNull('end_date')
                           ->orWhere('end_date', '>=', now());
                     });
    }
    
    /**
     * Scope a query to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('created_at');
    }

    /**
     * Get the route key for the model.
     * COMMENTED OUT to use default id for route binding
     */
    // public function getRouteKeyName()
    // {
    //     return 'unique_id';
    // }
}