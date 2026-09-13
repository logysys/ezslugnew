<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Domain;
use App\Models\Customdomain;
use App\Models\PendingDomainTransfer;

class DomainTransferCompleted extends Mailable
{
    use Queueable, SerializesModels;

    public $domain;
    public $transfer;

    public function __construct($domain, $transfer)
    {
        $this->domain = $domain;
        $this->transfer = $transfer;
    }

    public function build()
    {
        return $this->subject('Domain Transfer Completed')
                    ->markdown('Email.domain_transfer_completed');
    }
}