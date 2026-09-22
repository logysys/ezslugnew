<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class HtmlParserService
{
    private array $secretPatterns = [
        ['regex' => '/(api[_-]?key|apikey)\s*[:=]\s*["\']([^"\']+)["\']/i', 'group' => 2, 'name' => 'api_key'],
        ['regex' => '/(auth[_-]?token|access[_-]?token)\s*[:=]\s*["\']([^"\']+)["\']/i', 'group' => 2, 'name' => 'auth_token'],
        ['regex' => '/(secret[_-]?key|secretkey)\s*[:=]\s*["\']([^"\']+)["\']/i', 'group' => 2, 'name' => 'secret_key'],
        ['regex' => '/(private[_-]?key)\s*[:=]\s*["\']([^"\']+)["\']/i', 'group' => 2, 'name' => 'private_key'],
        ['regex' => '/(password|passwd|pwd)\s*[:=]\s*["\']([^"\']+)["\']/i', 'group' => 2, 'name' => 'password'],
        ['regex' => '/(bearer)\s+([a-zA-Z0-9_\-\.]+)/i', 'group' => 2, 'name' => 'bearer_token'],
        ['regex' => '/(sk-[a-zA-Z0-9]{20,})/', 'group' => 1, 'name' => 'sk_key'],
        ['regex' => '/(pk-[a-zA-Z0-9]{20,})/', 'group' => 1, 'name' => 'pk_key'],
    ];

    /**
     * Maximum HTML size to process (100MB).
     * Larger files skip secret extraction to avoid memory issues.
     */
    private const MAX_PROCESS_SIZE = 100 * 1024 * 1024;

    /**
     * Process HTML: extract secrets, replace with placeholders.
     */
    public function processHtml(string $html): array
    {
        $htmlSize = strlen($html);

        // For very large HTML, skip regex processing to avoid memory issues
        if ($htmlSize > self::MAX_PROCESS_SIZE) {
            Log::warning('Large HTML file - skipping secret extraction', ['size' => $htmlSize]);
            return [
                'processedHtml' => $html,
                'secrets' => [],
                'title' => $this->extractTitle($html),
            ];
        }

        // Increase regex limits for moderate-sized HTML
        if ($htmlSize > 100000) {
            ini_set('pcre.backtrack_limit', '10000000');
            ini_set('pcre.recursion_limit', '10000000');
        }

        $secrets = $this->extractSecrets($html);
        $processedHtml = $this->replaceSecretsWithPlaceholders($html, $secrets);
        $title = $this->extractTitle($html);

        return [
            'processedHtml' => $processedHtml,
            'secrets' => $secrets,
            'title' => $title,
        ];
    }

    /**
     * Render page: restore secrets into HTML placeholders.
     */
    public function renderPage(?string $html, ?string $secretsJson): string
    {
        if (!$html || !$secretsJson) {
            return $html ?? '';
        }

        try {
            $secrets = json_decode($secretsJson, true) ?: [];
            return $this->restoreSecrets($html, $secrets);
        } catch (\Throwable $e) {
            Log::error('Failed to restore secrets', ['error' => $e->getMessage()]);
            return $html;
        }
    }

    /**
     * Extract secrets from HTML using regex patterns.
     */
    private function extractSecrets(string $html): array
    {
        $secrets = [];
        $seen = [];

        foreach ($this->secretPatterns as $pattern) {
            try {
                if (@preg_match_all($pattern['regex'], $html, $matches, PREG_SET_ORDER)) {
                    foreach ($matches as $match) {
                        $value = $match[$pattern['group']] ?? null;
                        if (!$value || in_array($value, $seen)) continue;
                        if (str_contains($value, 'YOUR_') || str_contains($value, '${')) continue;
                        if (strlen($value) < 4) continue;
                        $seen[] = $value;
                        $secrets[] = [
                            'key' => $pattern['name'] . '_' . (count($secrets) + 1),
                            'value' => $value,
                            'context' => substr($match[0], 0, 80),
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Secret pattern failed', ['pattern' => $pattern['name'], 'error' => $e->getMessage()]);
                continue;
            }
        }

        return $secrets;
    }

    /**
     * Replace secret values with placeholders.
     */
    private function replaceSecretsWithPlaceholders(string $html, array $secrets): string
    {
        foreach ($secrets as $secret) {
            $html = str_replace($secret['value'], '__SERVER_SECRET_' . $secret['key'] . '__', $html);
        }
        return $html;
    }

    /**
     * Restore secret values from placeholders.
     */
    private function restoreSecrets(string $html, array $secrets): string
    {
        foreach ($secrets as $secret) {
            $html = str_replace('__SERVER_SECRET_' . $secret['key'] . '__', $secret['value'], $html);
        }
        return $html;
    }

    /**
     * Extract title from HTML.
     */
    private function extractTitle(string $html): string
    {
        if (preg_match('/<title[^>]*>([^<]*)<\/title>/i', $html, $match)) {
            $title = trim($match[1]);
            return $title ?: 'Untitled';
        }
        return 'Untitled';
    }
}
