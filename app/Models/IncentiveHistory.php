<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncentiveHistory extends Model
{
    use HasFactory;

    protected $primaryKey = 'incentive_history_id';

    protected $fillable = [
        'incentive_id',
        'user_id',
        'amount',
        'incentive_type',
        'description',
        'status',
        'reference_type',
        'reference_id',
        'distributed_at',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'distributed_at' => 'datetime',
    ];

    public function incentive()
    {
        return $this->belongsTo(Incentive::class, 'incentive_id', 'incentive_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Scope for filtering by status
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Scope for filtering by incentive type
    public function scopeType($query, $type)
    {
        return $query->where('incentive_type', $type);
    }

    // Scope for filtering by user
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
	
	public function invoice()
	{
		return $this->hasOne(Invoice::class, 'incentive_id', 'incentive_id');
	}
}