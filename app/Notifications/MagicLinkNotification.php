<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MagicLinkNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $url)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Magic Login Link')
            ->line('Click the button below to log in to your account.')
            ->action('Login', $this->url)
            ->line('This link will expire in 60 minutes.')
            ->line('If you did not request this link, please ignore this email.');
    }

    public function toArray($notifiable): array
    {
        return [];
    }
}