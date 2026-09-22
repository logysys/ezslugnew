<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouponUsage extends Model
{
    use HasFactory;

    protected $table = 'coupon_usages';

    protected $fillable = [
        'coupon_id',
        'user_id',
        'coupon_code',
        'used_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
    ];

    /**
     * Get the coupon that was used
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Get the user who used the coupon
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if a user has already used a specific coupon
     */
    public static function isCouponUsedByUser($couponId, $userId)
    {
        return self::where('coupon_id', $couponId)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get usage count for a coupon
     */
    public static function getUsageCount($couponId)
    {
        return self::where('coupon_id', $couponId)->count();
    }

    /**
     * Check if coupon is still available (respects use_limit)
     */
    public static function isCouponAvailable($coupon)
    {
        if (!$coupon || $coupon->status !== 'Active') {
            return false;
        }

        // If coupon has unlimited usage
        if ($coupon->limit_type === 'unlimited') {
            return true;
        }

        // Check if usage limit is reached
        $usageCount = self::getUsageCount($coupon->id);
        return $usageCount < $coupon->use_limit;
    }

    /**
     * Check if user can use a specific coupon
     */
    public static function canUserUseCoupon($coupon, $userId)
    {
        if (!$coupon || $coupon->status !== 'Active') {
            return false;
        }

        // Check if user already used this coupon
        if (self::isCouponUsedByUser($coupon->id, $userId)) {
            return false;
        }

        // Check overall availability
        return self::isCouponAvailable($coupon);
    }

    /**
     * Record a coupon usage
     */
    public static function recordUsage($coupon, $userId)
    {
        if (!self::canUserUseCoupon($coupon, $userId)) {
            throw new \Exception('Coupon cannot be used');
        }

        return self::create([
            'coupon_id' => $coupon->id,
            'user_id' => $userId,
            'coupon_code' => $coupon->coupon,
            'used_at' => now(),
        ]);
    }
}