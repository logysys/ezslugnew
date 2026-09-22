<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\VisitorAnalytic;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class TrackVisitor
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Process the request first
        $response = $next($request);

        // Get location data from IP
        $locationData = $this->getLocationFromIP($request->ip());

        try {
            // Create visitor analytics record
            VisitorAnalytic::create([
                'user_id'       => Auth::id(),
                'ip_address'    => $request->ip(),
                'method'        => $request->method(),
                'url'           => $request->fullUrl(),
                'referer'       => $request->header('referer'),
                'user_agent'    => $request->userAgent(),
                'location_data' => $locationData,
            ]);
        } catch (\Exception $e) {
            // Silently fail - don't interrupt the request flow
            // Log the error if you want to track failures
            // \Log::error('Failed to track visitor: ' . $e->getMessage());
        }

        return $response;
    }

    /**
     * Get location information from IP address.
     *
     * @param string $ip
     * @return array|null
     */
    private function getLocationFromIP(string $ip): ?array
    {
        // Skip local/private IPs
        if ($this->isPrivateIP($ip)) {
            return null;
        }

        $cacheKey = 'ip_location_' . md5($ip);
        
        return Cache::remember($cacheKey, 86400, function () use ($ip) {
            try {
                $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}");
                
                if ($response->successful()) {
                    $data = $response->json();
                    
                    if ($data['status'] === 'success') {
                        return [
                            'country'      => $data['country'] ?? null,
                            'country_code' => $data['countryCode'] ?? null,
                            'region'       => $data['regionName'] ?? null,
                            'city'         => $data['city'] ?? null,
                            'zip'          => $data['zip'] ?? null,
                            'latitude'     => $data['lat'] ?? null,
                            'longitude'    => $data['lon'] ?? null,
                            'timezone'     => $data['timezone'] ?? null,
                            'isp'          => $data['isp'] ?? null,
                            'source'       => 'ip-api.com'
                        ];
                    }
                }
            } catch (\Exception $e) {
                return null;
            }

            return null;
        });
    }

    /**
     * Check if an IP address is private/local.
     *
     * @param string $ip
     * @return bool
     */
    private function isPrivateIP(string $ip): bool
    {
        // Check for local/private IP addresses
        $privateRanges = [
            '10.0.0.0/8',      // Private network
            '172.16.0.0/12',   // Private network
            '192.168.0.0/16',  // Private network
            '127.0.0.0/8',     // Loopback
            '169.254.0.0/16',  // Link-local
            '::1/128',         // IPv6 loopback
            'fc00::/7',        // IPv6 private
            'fe80::/10',       // IPv6 link-local
        ];

        foreach ($privateRanges as $range) {
            if ($this->ipInRange($ip, $range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if an IP address is within a CIDR range.
     *
     * @param string $ip
     * @param string $range
     * @return bool
     */
    private function ipInRange(string $ip, string $range): bool
    {
        // If range doesn't have CIDR notation, do exact match
        if (strpos($range, '/') === false) {
            return $ip === $range;
        }

        // Split into subnet and bits
        list($subnet, $bits) = explode('/', $range);
        $bits = (int)$bits;
        
        // Validate IP version and process accordingly
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            // IPv4 processing
            
            // Validate bits for IPv4
            if ($bits < 0 || $bits > 32) {
                return false; // Invalid CIDR notation for IPv4
            }
            
            // /0 subnet matches all addresses
            if ($bits === 0) {
                return true;
            }
            
            // Convert IP and subnet to long integers
            $ipLong = ip2long($ip);
            $subnetLong = ip2long($subnet);
            
            // Validate conversion
            if ($ipLong === false || $subnetLong === false) {
                return false;
            }
            
            // Calculate mask using alternative method to avoid negative shift
            // Original: $mask = -1 << (32 - $bits); // This causes negative shift error
            // Fixed: Calculate mask without negative shift
            $mask = ~((1 << (32 - $bits)) - 1);
            
            // Apply mask to subnet
            $subnetMasked = $subnetLong & $mask;
            
            // Check if IP matches the masked subnet
            return ($ipLong & $mask) == $subnetMasked;
            
        } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            // IPv6 processing
            
            // Validate bits for IPv6
            if ($bits < 0 || $bits > 128) {
                return false; // Invalid CIDR notation for IPv6
            }
            
            // ::/0 subnet matches all IPv6 addresses
            if ($bits === 0) {
                return true;
            }
            
            // Convert IP and subnet to packed binary format
            $ipPacked = inet_pton($ip);
            $subnetPacked = inet_pton($subnet);
            
            // Validate conversion
            if ($ipPacked === false || $subnetPacked === false) {
                return false;
            }
            
            // Calculate IPv6 mask
            $bytes = (int)($bits / 8);
            $remainderBits = $bits % 8;
            
            // Create mask string
            $mask = '';
            for ($i = 0; $i < 16; $i++) {
                if ($i < $bytes) {
                    $mask .= "\xff";
                } elseif ($i == $bytes && $remainderBits > 0) {
                    $mask .= chr(0xff << (8 - $remainderBits));
                } else {
                    $mask .= "\x00";
                }
            }
            
            // Apply mask to both IP and subnet
            $ipMasked = $ipPacked & $mask;
            $subnetMasked = $subnetPacked & $mask;
            
            // Check if they match
            return $ipMasked === $subnetMasked;
            
        } else {
            // Not a valid IP address
            return false;
        }
    }
}