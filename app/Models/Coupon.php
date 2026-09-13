<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'title',
        'type',
        'coupon',
        'offer',
        'use_limit',
        'limit_type',
        'expire',
        'status'
    ];
    
    protected $casts = [
        'expire' => 'datetime',
        'use_limit' => 'integer',
    ];

    /**
     * Get the usage records for this coupon
     */
    public function usages()
    {
        return $this->hasMany(CouponUsage::class);
    }

    /**
     * Check if coupon is valid and not expired
     */
    public function isValid()
    {
        if ($this->status !== 'Active') {
            return false;
        }

        if ($this->expire && now()->gt($this->expire)) {
            return false;
        }

        return true;
    }

    /**
     * Check if coupon is valid for a specific user
     */
    public function isValidForUser($userId)
    {
        if (!$this->isValid()) {
            return false;
        }

        // Check if coupon is still available (not reached usage limit)
        if ($this->limit_type === 'limited' && $this->getUsageCountAttribute() >= $this->use_limit) {
            return false;
        }

        return true;
    }

    /**
     * Check if a user has already used this coupon
     */
    public function isUsedByUser($userId)
    {
        return CouponUsage::where('coupon_id', $this->id)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Check if coupon is available for use
     */
    public function isAvailable()
    {
        if (!$this->isValid()) {
            return false;
        }

        return CouponUsage::isCouponAvailable($this);
    }

    /**
     * Check if a specific user can use this coupon
     */
    public function canBeUsedByUser($userId)
    {
        return CouponUsage::canUserUseCoupon($this, $userId);
    }

    /**
     * Get remaining uses
     */
    public function getRemainingUsesAttribute()
    {
        if ($this->limit_type === 'unlimited') {
            return PHP_INT_MAX;
        }

        $usedCount = CouponUsage::getUsageCount($this->id);
        return max(0, $this->use_limit - $usedCount);
    }

    /**
     * Get usage count
     */
    public function getUsageCountAttribute()
    {
        return CouponUsage::getUsageCount($this->id);
    }
}