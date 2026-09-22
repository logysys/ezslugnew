@component('mail::message')
# Domain Transfer Rejected

The seller has rejected the transfer of domain **{{ $domain->domainselected }}/{{ $domain->domain }}**.

@if ($amount > 0)
You have been refunded **EZ${{ number_format($amount, 2) }}** (80% of the purchase price) to your account balance.
@endif

@component('mail::button', ['url' => route('marketplace')])
View Marketplace
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent