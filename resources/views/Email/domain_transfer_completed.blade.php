@component('mail::message')
# Domain Transfer Completed

@if ($transfer->confirmed_at)
The seller has confirmed the transfer of domain **{{ $domain->domainselected }}/{{ $domain->domain }}**.
@else
The domain **{{ $domain->domainselected }}/{{ $domain->domain }}** has been automatically transferred to your account as the seller didn't respond within 48 hours.
@endif

The domain is now available in your account.

@component('mail::button', ['url' => route('marketplace')])
View Marketplace
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent