<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Eznew extends Mailable
{
    use Queueable, SerializesModels;
    
    public $mailData;
    public $subject;
    
    /**
     * Create a new message instance.
     *
     * @param array $mailData
     * @param string $subject
     * @return void
     */
    public function __construct(array $mailData, string $subject)
    {
        $this->mailData = $mailData;
        $this->subject = $subject;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject($this->subject)->html($this->mailData['design']);
    }
}