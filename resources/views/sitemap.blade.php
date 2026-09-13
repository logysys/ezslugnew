<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {{-- Static Routes --}}
	@foreach($admindomain as $maindomain)
    @foreach($staticUrls as $url)
    <url>
        <loc>https://{{$maindomain['domain']}}{{ $url }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
	@foreach($wiki as $wikis)
    <url>
        <loc>https://{{$maindomain['domain']}}/{{ $wikis['wiki_slug'] }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
	@foreach($template as $templates)
    <url>
        <loc>https://{{$maindomain['domain']}}/{{ $templates['unique_id'] }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
	@foreach($ezfunnelfield as $ezfunnelfields)
    <url>
        <loc>https://{{$maindomain['domain']}}/{{ $ezfunnelfields['unique_id'] }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach	
	@foreach($ezfunnel as $ezfunnels)
    <url>
        <loc>https://{{$maindomain['domain']}}/{{ $ezfunnels['token'] }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach	
	@endforeach
	@foreach($customdomain as $customdomains)
    <url>
        <loc>https://{{$customdomains['domainselected']}}/{{ $customdomains['domain'] }}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
	@foreach($domain as $domains)
    <url>
        <loc>https://{{ $domains['domain'] }}.{{$domains['domainselected']}}</loc>
        <lastmod>{{ now()->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    @endforeach
</urlset>