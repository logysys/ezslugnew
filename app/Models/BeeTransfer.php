<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BeeTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'amount',
        'transaction_hash',
        'status',
        'notes',
        'metadata',
        'processed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * Get the sender user
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the receiver user
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Scope for completed transfers
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for pending transfers
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for failed transfers
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for transfers by sender
     */
    public function scopeBySender($query, $userId)
    {
        return $query->where('sender_id', $userId);
    }

    /**
     * Scope for transfers by receiver
     */
    public function scopeByReceiver($query, $userId)
    {
        return $query->where('receiver_id', $userId);
    }

    /**
     * Scope for recent transfers
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Mark transfer as completed
     */
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark transfer as failed
     */
    public function markAsFailed($reason = null)
    {
        $this->update([
            'status' => 'failed',
            'notes' => $reason ?: $this->notes,
        ]);
    }

    /**
     * Check if transfer is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if transfer is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if transfer is failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Get transfer fee (example: 1% fee)
     */
    public function getFeeAttribute(): float
    {
        return $this->amount * 0.01; // 1% fee
    }

    /**
     * Get net amount received (after fee)
     */
    public function getNetAmountAttribute(): float
    {
        return $this->amount - $this->getFeeAttribute();
    }

    /**
     * Get formatted amount
     */
    public function getFormattedAmountAttribute(): string
    {
        return 'EZ$' . number_format($this->amount, 2);
    }

    /**
     * Get human readable status
     */
    public function getStatusTextAttribute(): string
    {
        return ucfirst($this->status);
    }
	/**
	 * Get the sender invoice
	 */
	public function senderInvoice(): BelongsTo
	{
		return $this->belongsTo(Invoice::class, 'sender_invoice_id');
	}

	/**
	 * Get the receiver invoice
	 */
	public function receiverInvoice(): BelongsTo
	{
		return $this->belongsTo(Invoice::class, 'receiver_invoice_id');
	}

	// Also add these inverse relationships
	public function senderInvoiceDirect()
	{
		return $this->hasOne(Invoice::class, 'bee_transfer_id')
					->where('user_id', $this->sender_id)
					->where('metadata->transfer_type', 'outgoing');
	}

	public function receiverInvoiceDirect()
	{
		return $this->hasOne(Invoice::class, 'bee_transfer_id')
					->where('user_id', $this->receiver_id)
					->where('metadata->transfer_type', 'incoming');
	}
	
	public function invoices()
	{
		return $this->hasMany(Invoice::class, 'bee_transfer_id');
	}

}