<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="referrer" content="no-referrer-when-downgrade">
		
		@isset($meta)
        <!-- Primary Meta Tags -->
        <title>{{ $meta['title'] }}</title>
        <meta name="description" content="{{ $meta['description'] }}">
        <meta name="keywords" content="{{ $meta['keywords']}}">

        <!-- Mobile Web App Capabilities -->
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="{{ $meta['sitename']}}">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ $meta['siteurl']}}">
        <meta property="og:title" content="{{ $meta['title']}}">
        <meta property="og:description" content="{{ $meta['description']}}">
        <meta property="og:image" content="{{ $meta['metalogo']}}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="{{ $meta['sitename']}}">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ $meta['siteurl']}}">
        <meta name="twitter:title" content="{{ $meta['title']}}">
        <meta name="twitter:description" content="{{ $meta['description']}}">
        <meta name="twitter:image" content="{{ $meta['metalogo']}}">
        <link rel="icon" href="{{ $favicon }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ $favicon }}" type="image/x-icon">
    @else
        <title inertia>{{ config('app.name', 'ez.wiki') }}</title>
		<meta name="description" content="Ez way to WiKi and CoWiKi">
        <meta name="keywords" content="funnel">

        <!-- Mobile Web App Capabilities -->
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="ez.wiki">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="Ez way to WiKi and CoWiKi">
        <meta property="og:description" content="Ez way to WiKi and CoWiKi">
        <meta property="og:image" content="https://ez.wiki/ezlogo.png">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="ez.wiki">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="Ez way to WiKi and CoWiKi">
        <meta name="twitter:description" content="Ez way to WiKi and CoWiKi">
        <meta name="twitter:image" content="https://ez.wiki/ezlogo.png">
		<link rel="icon" href="https://ez.wiki/ezlogo.png" type="image/x-icon">
        <link rel="shortcut icon" href="https://ez.wiki/ezlogo.png" type="image/x-icon">
    @endisset
        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
		
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>