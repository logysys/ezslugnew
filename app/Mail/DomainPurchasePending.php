<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Domain;
use App\Models\Customdomain;
use App\Models\PendingDomainTransfer;
use Carbon\Carbon;

class DomainPurchasePending extends Mailable
{
    use Queueable, SerializesModels;

    public $domain;
    public $type;
    public $price;
    public $expiresAt;

    public function __construct($domain, $type, $price, $expiresAt)
    {
        $this->domain = $domain;
        $this->type = $type;
        $this->price = $price;
        $this->expiresAt = $expiresAt;
    }

    public function build()
    {
        return $this->subject('Your Domain Purchase is Pending')
                    ->markdown('Email.domain_purchase_pending');
    }
}