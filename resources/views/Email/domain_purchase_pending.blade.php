@component('mail::message')
# Your Domain Purchase is Pending

You have successfully purchased the domain **{{ $domain->domainselected }}/{{ $domain->domain }}** for **EZ${{ number_format($price, 2) }}**.

The seller has **48 hours** to confirm the transfer (until {{ $expiresAt->format('Y-m-d H:i:s') }}). 

If the seller confirms the transfer, the domain will be transferred to your account. If they don't respond within 48 hours, the transfer will be automatically completed.

@component('mail::button', ['url' => route('marketplace')])
View Marketplace
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent