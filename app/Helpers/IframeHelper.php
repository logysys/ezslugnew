<?php

namespace App\Helpers;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class IframeHelper
{
    /**
     * Robustly checks if a URL is iframe-friendly by mimicking a real browser request.
     *
     * @param string $url The URL to check.
     * @return bool Returns true if the URL can be iframed, false otherwise.
     */
    public static function isIframeable(string $url): bool
    {
        try {
            // First, check with a HEAD request which is faster and gets headers
            $response = Http::withOptions([
                'allow_redirects' => true, // Follow redirects to get final headers
                'verify' => true, // Verify SSL certificates
            ])
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            ])
            ->head($url);

            // If HEAD request fails, try with GET
            if ($response->failed()) {
                $response = Http::withOptions([
                    'allow_redirects' => true,
                    'verify' => true,
                ])
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                ])
                ->get($url);

                if ($response->failed()) {
                    return false;
                }
            }

            // Check for CSP header first (modern standard)
            if ($response->hasHeader('Content-Security-Policy')) {
                $cspHeaders = $response->header('Content-Security-Policy');
                // Handle case where header might be an array
                $cspHeaders = is_array($cspHeaders) ? implode('; ', $cspHeaders) : $cspHeaders;
                if (self::cspBlocksFraming($cspHeaders)) {
                    return false;
                }
            }

            // Check for X-Frame-Options (legacy header)
            if ($response->hasHeader('X-Frame-Options')) {
                $xfoHeaders = $response->header('X-Frame-Options');
                // Handle case where header might be an array
                $xfoHeaders = is_array($xfoHeaders) ? $xfoHeaders[0] : $xfoHeaders;
                if (self::xfoBlocksFraming($xfoHeaders)) {
                    return false;
                }
            }

            // Additional check for modern sites that might use meta tags
            // Only do this if we didn't find blocking headers and the request was GET
            if ($response->successful() && $response->body()) {
                $body = $response->body();
                if (strpos($body, '<meta') !== false) {
                    // Check for CSP meta tag
                    if (preg_match('/<meta[^>]+http-equiv=["\']Content-Security-Policy["\'][^>]*>/i', $body)) {
                        if (preg_match('/frame-ancestors\s+(?:none|self)/i', $body)) {
                            return false;
                        }
                    }
                    // Check for X-Frame-Options meta tag (rare but possible)
                    if (preg_match('/<meta[^>]+http-equiv=["\']X-Frame-Options["\'][^>]*>/i', $body)) {
                        if (preg_match('/content=["\'](deny|sameorigin)/i', $body)) {
                            return false;
                        }
                    }
                }
            }

        } catch (\Exception $e) {
            // Any exception means we cannot verify, so assume it's not iframeable
            return false;
        }

        // If we get here and the domain is from a known anti-iframe service, block it
        $host = parse_url($url, PHP_URL_HOST);
        if ($host && self::isKnownAntiIframeDomain($host)) {
            return true;
        }

        return false;
    }

    /**
     * Parses the Content-Security-Policy header to see if it blocks framing.
     */
    private static function cspBlocksFraming(string $cspHeader): bool
    {
        // Normalize the header by removing newlines and multiple spaces
        $cspHeader = preg_replace('/\s+/', ' ', $cspHeader);

        // Check for frame-ancestors directive
        if (preg_match('/frame-ancestors\s+([^;]+)/i', $cspHeader, $matches)) {
            $sources = trim($matches[1]);
            
            // If 'none' is specified, framing is blocked
            if (strcasecmp($sources, 'none') === 0) {
                return true;
            }
            
            // If wildcard is present, framing is allowed
            if (strpos($sources, '*') !== false) {
                return false;
            }
            
            // If specific sources are listed (not 'self' or our domain), we consider it blocked
            // since we can't guarantee our domain is in the list
            return true;
        }

        return false;
    }

    /**
     * Checks the legacy X-Frame-Options header.
     */
    private static function xfoBlocksFraming(string $xfoHeader): bool
    {
        $policy = strtolower(trim($xfoHeader));
        
        // 'deny' and 'sameorigin' block framing
        if (in_array($policy, ['deny', 'sameorigin'])) {
            return true;
        }
        
        // Some sites use ALLOW-FROM uri which is obsolete but if present, 
        // we consider it blocking unless our domain matches (which we can't check reliably)
        if (strpos($policy, 'allow-from') === 0) {
            return true;
        }
        
        return false;
    }

    /**
     * Checks if the domain is known to prevent iframing.
     */
    private static function isKnownAntiIframeDomain(string $host): bool
    {
        $antiIframeDomains = [
            'perplexity.ai',
            'twitter.com',
            'x.com',
            'linkedin.com',
            'instagram.com',
            'facebook.com',
            'ez3d.wiki',
			'bbcc.ai',
			'bbcc.ad',
			'big.wiki',
			'nug8.com',
			'xn--fiq228c.wiki',
			'xn--kpry57d.wiki',
			'7.wiki',
			'82.wiki',
			'81.wiki',
			'ez.wiki',
			'xn--rht090b.wiki',
			'b2c.wiki',
			'4u.wiki',
			'no1.wiki',
			'xn--ll0b110a.love',
			'xn--42c5bb7ah3d5byb6m.com',
			'xn--22c0cud.com',
			'xn--hny691d.com',
			'xn--b9wm4lxz0afud.com',
			'xn--h0t795as2et56a.com',
			'opensoothing.com',
			'0932.com',
			'0938.com',
			'set.net',
			'ez3d.ai',
        ];
        
        foreach ($antiIframeDomains as $domain) {
            if (strpos($host, $domain) !== false) {
                return true;
            }
        }
        
        return false;
    }
}