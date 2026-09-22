<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiConversionService
{
    private string $apiKey;
    private string $baseUrl;
    private string $model;
    private int $timeout;

    /** Maximum HTML size to send to AI (4000 chars) */
    private const MAX_HTML_SIZE = 4000;

    /** Maximum size before we refuse AI conversion */
    private const ABSOLUTE_MAX_SIZE = 50000;

    /** HTTP timeout for API call (seconds) */
    private const API_TIMEOUT = 300;

    public function __construct()
    {
        $this->apiKey = config('services.moonshot.api_key', env('MOONSHOT_API_KEY', ''));
        $this->baseUrl = config('services.moonshot.base_url', env('MOONSHOT_BASE_URL', 'https://api.moonshot.ai/v1'));
        $this->model = config('services.moonshot.model', env('MOONSHOT_MODEL', 'kimi-k2.6'));
        $this->timeout = (int) config('services.moonshot.timeout', env('MOONSHOT_TIMEOUT', 120));
    }

    public function convertHtmlToReact(string $html, array $secrets): array
    {
        if (empty($this->apiKey)) {
            return ['success' => false, 'reactCode' => null, 'error' => 'MOONSHOT_API_KEY not configured'];
        }

        $htmlSize = strlen($html);

        // Refuse if HTML is way too large
        if ($htmlSize > self::ABSOLUTE_MAX_SIZE) {
            Log::warning('HTML too large for AI conversion', ['size' => $htmlSize]);
            return [
                'success' => false,
                'reactCode' => null,
                'error' => 'HTML too large (' . round($htmlSize / 1024, 1) . 'KB). Max for AI: ' . round(self::ABSOLUTE_MAX_SIZE / 1024, 1) . 'KB. Save as regular HTML without AI.',
            ];
        }

        // Truncate HTML for the API
        $truncatedHtml = $htmlSize > self::MAX_HTML_SIZE
            ? $this->smartTruncate($html, self::MAX_HTML_SIZE)
            : $html;

        $secretsInfo = empty($secrets)
            ? 'No secrets detected.'
            : 'EXTRACTED SECRETS (use secrets["' . ($secrets[0]['key'] ?? 'key') . '"]): ' . json_encode(array_slice($secrets, 0, 5));

        $userPrompt = "Convert this HTML to a React component using only React.createElement (no JSX).\n\n{$secretsInfo}\n\nHTML:\n{$truncatedHtml}";

        try {
            Log::info('Sending to Kimi API', ['htmlSize' => $htmlSize, 'truncatedSize' => strlen($truncatedHtml)]);

            $response = Http::timeout(self::API_TIMEOUT)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'system', 'content' => $this->getSystemPrompt()],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 1,
                    'max_tokens' => 4096,
                ]);

            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->body();
                Log::error('Moonshot API error', ['status' => $status, 'body' => $body]);
                return ['success' => false, 'reactCode' => null, 'error' => "Moonshot API error (HTTP {$status}). Try again or disable AI."];
            }

            $content = $response->json('choices.0.message.content');
            if (!$content) {
                return ['success' => false, 'reactCode' => null, 'error' => 'Empty response from AI'];
            }

            $reactCode = $this->cleanResponse($content);

            if (!$this->isValidCode($reactCode)) {
                Log::warning('AI generated invalid code', ['code_preview' => substr($reactCode, 0, 200)]);
                return ['success' => false, 'reactCode' => null, 'error' => 'AI generated invalid or incomplete code. Try again or disable AI.'];
            }

            Log::info('AI conversion successful', ['codeLength' => strlen($reactCode)]);
            return ['success' => true, 'reactCode' => $reactCode, 'error' => null];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Kimi API connection failed', ['error' => $e->getMessage(), 'timeout' => self::API_TIMEOUT]);
            return ['success' => false, 'reactCode' => null, 'error' => 'Kimi API timed out after ' . self::API_TIMEOUT . 's. The API may be slow. Try again without AI or retry.'];
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('Kimi API request failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'reactCode' => null, 'error' => 'Kimi API request failed: ' . $e->getMessage()];
        } catch (\Throwable $e) {
            Log::error('AI conversion exception', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return ['success' => false, 'reactCode' => null, 'error' => 'AI conversion failed: ' . $e->getMessage()];
        }
    }

    /**
     * Smart truncate: try to keep the body content, preserve essential tags.
     */
    private function smartTruncate(string $html, int $maxLength): string
    {
        if (strlen($html) <= $maxLength) return $html;

        // Extract head (styles, title)
        $head = '';
        if (preg_match('/<head[^>]*>(.*?)<\/head>/si', $html, $headMatch)) {
            $head = '<head>' . $headMatch[1] . '</head>';
        }

        // Extract body
        $body = '';
        if (preg_match('/<body[^>]*>(.*?)<\/body>/si', $html, $bodyMatch)) {
            $bodyContent = $bodyMatch[1];
            // Keep first portion of body, add ellipsis
            $truncatedBody = substr($bodyContent, 0, $maxLength - strlen($head) - 100);
            // Close any open tags
            $truncatedBody .= '\n<!-- ... truncated ... -->\n';
            $body = '<body>' . $truncatedBody . '</body>';
        } else {
            $body = '<body>' . substr($html, 0, $maxLength) . '\n<!-- ... truncated ... --></body>';
        }

        $result = "<!DOCTYPE html><html>{$head}{$body}</html>";

        return strlen($result) > $maxLength + 500
            ? substr($html, 0, $maxLength) . "\n<!-- ... truncated ... -->"
            : $result;
    }

    private function getSystemPrompt(): string
    {
        return 'You are an expert React developer. Convert HTML into a clean React component.

RULES:
1. Use ONLY React.createElement - NO JSX
2. Use useState and useEffect hooks
3. Use secrets["key_name"] for API keys
4. Handle onClick, onChange, onSubmit events
5. Make buttons interactive
6. Return ONLY JavaScript - no markdown
7. Code must be COMPLETE and valid
8. End with: export default Page;

EXAMPLE:
function Page(props) {
  const { useState, useEffect } = React;
  const { secrets } = props;
  const [count, setCount] = useState(0);
  function handleClick() { setCount(c => c + 1); }
  return React.createElement("div", { className: "card" },
    React.createElement("h1", null, "Title"),
    React.createElement("button", { onClick: handleClick }, "Count: " + count)
  );
}
export default Page;';
    }

    private function cleanResponse(string $raw): string
    {
        $code = trim($raw);
        // Remove markdown code fences
        $code = preg_replace('/^```[\w]*\n?/m', '', $code);
        $code = preg_replace('/\n?```\s*$/m', '', $code);
        return trim($code);
    }

    private function isValidCode(string $code): bool
    {
        if (strlen($code) < 50) return false;
        if (!str_contains($code, 'React.createElement')) return false;
        if (!str_contains($code, 'export default')) return false;

        // Check balanced braces
        $open = 0;
        foreach (str_split($code) as $char) {
            if ($char === '{') $open++;
            if ($char === '}') $open--;
            if ($open < 0) return false;
        }
        return $open === 0;
    }
}
