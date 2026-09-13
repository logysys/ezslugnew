<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Domain;
use App\Models\Customdomain;
use App\Models\PendingDomainTransfer;

class DomainTransferRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $domain;
    public $transfer;
    public $amount;

    public function __construct($domain, $transfer, $amount)
    {
        $this->domain = $domain;
        $this->transfer = $transfer;
        $this->amount = $amount;
    }

    public function build()
    {
        return $this->subject('Domain Transfer Rejected')
                    ->markdown('Email.domain_transfer_rejected');
    }
}