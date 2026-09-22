<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NumerologyService
{
    protected array $config;
    protected array $pricing;

    public function __construct()
    {
        $this->config = [
            'openai' => [
                'url' => 'https://12tr.ee/api/v1/chat/completions',
                'key' => 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403',
                'model' => 'gpt-4o-mini',
                'price_input' => 2.50,
                'price_output' => 10.00
            ],
            'kimi' => [
                'url' => 'https://12tr.ee/api/v1/chat/completions',
                'key' => 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403',
                'model' => 'kimi-k3',
                'price_input' => 2.00,
                'price_output' => 8.00
            ],
            'perplexity' => [
                'url' => 'https://12tr.ee/api/v1/chat/completions',
                'key' => 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403',
                'model' => 'sonar-pro',
                'price_input' => 1.00,
                'price_output' => 5.00
            ],
            'gemini' => [
                'url' => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
                'key' => env('GEMINI_API_KEY'),
                'model' => 'gemini-3-flash-preview',
                'price_input' => 0.50,
                'price_output' => 1.50
            ],
            'deepseek' => [
                'url' => 'https://12tr.ee/api/v1/chat/completions',
                'key' => 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403',
                'model' => 'deepseek-chat',
                'price_input' => 0.14,
                'price_output' => 0.28
            ]
        ];

        $this->pricing = [
            'openai' => ['input' => 2.50, 'output' => 10.00],
            'kimi' => ['input' => 2.00, 'output' => 8.00],
            'perplexity' => ['input' => 1.00, 'output' => 5.00],
            'gemini' => ['input' => 0.50, 'output' => 1.50],
            'deepseek' => ['input' => 0.14, 'output' => 0.28]
        ];
    }

    public function getNumerology(int $number, string $agent): array
    {
        $provider = $this->config[$agent];
        $systemPrompt = $this->buildPrompt($number);

        $response = $this->makeRequest($agent, $provider, $systemPrompt, $number);
        return $this->parseResponse($agent, $response);
    }

    protected function buildPrompt(int $number): string
    {
        $today = now()->format('l, F j, Y');
        return "You are a mystical numerology oracle. Respond ONLY in valid JSON format: {\"watch_out\": \"...\", \"expect\": \"...\", \"extra_nuance\": \"...\"}. No extra text outside JSON. Today's date: {$today}. The user's spontaneous number is {$number}. \"watch_out\": detailed what to avoid or be mindful of today (2-3 sentences). \"expect\": positive opportunities, emotions, or synchronicities (2-3 sentences). \"extra_nuance\": one short intuitive tip. Be warm, poetic, and practical.";
    }

    protected function makeRequest(string $agent, array $provider, string $systemPrompt, int $number)
    {
        $payload = $this->buildPayload($agent, $provider, $systemPrompt, $number);
        $headers = ['Content-Type' => 'application/json'];

        if ($agent === 'gemini') {
            $url = $provider['url'] . '?key=' . $provider['key'];
            $headers['x-goog-api-key'] = $provider['key'];
        } else {
            $url = $provider['url'];
            $headers['Authorization'] = 'Bearer ' . $provider['key'];
        }

        Log::info("Calling numerology API", ['agent' => $agent, 'number' => $number]);

        $response = Http::withHeaders($headers)
            ->timeout(60)
            ->post($url, $payload);

        if (!$response->successful()) {
            $errorData = $response->json();
            $error = $errorData['error']['message'] ?? $errorData['error'] ?? "HTTP {$response->status()}";
            throw new \Exception("{$agent} API error: {$error}");
        }

        return $response->json();
    }

    protected function buildPayload(string $agent, array $provider, string $systemPrompt, int $number): array
    {
        if ($agent === 'gemini') {
            return [
                'contents' => [
                    ['parts' => [['text' => $systemPrompt]]]
                ]
            ];
        }

        return [
            'model' => $provider['model'],
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => "The spontaneous number is {$number}."]
            ],
            'temperature' => 1,
            'max_tokens' => 600
        ];
    }

    protected function parseResponse(string $agent, array $response): array
    {
        if ($agent === 'gemini') {
            return $this->parseGeminiResponse($response);
        }

        return $this->parseOpenAICompatibleResponse($agent, $response);
    }

    protected function parseGeminiResponse(array $response): array
    {
        $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
        if (empty($text)) {
            throw new \Exception('Gemini returned empty response');
        }

        $text = preg_replace('/```json|```/', '', $text);
        $parsed = json_decode(trim($text), true);

        if (!$parsed) {
            throw new \Exception('Failed to parse Gemini response');
        }

        $usage = $response['usageMetadata'] ?? [];

        return [
            'watch' => $parsed['watch_out'] ?? $parsed['watch'] ?? 'Stay mindful',
            'expect' => $parsed['expect'] ?? 'Trust the journey',
            'extra' => $parsed['extra_nuance'] ?? 'Listen to your intuition',
            'input_tokens' => $usage['promptTokenCount'] ?? 0,
            'output_tokens' => $usage['candidatesTokenCount'] ?? 0,
            'agent' => 'gemini'
        ];
    }

    protected function parseOpenAICompatibleResponse(string $agent, array $response): array
    {
        $content = $response['choices'][0]['message']['content'] ?? '';
        if (empty($content)) {
            throw new \Exception("{$agent} returned empty response");
        }

        // Try to parse JSON
        $parsed = null;
        try {
            $parsed = json_decode($content, true);
        } catch (\Exception $e) {
            // Try to extract JSON from text
            preg_match('/\{[\s\S]*\}/', $content, $matches);
            if (!empty($matches)) {
                $parsed = json_decode($matches[0], true);
            }
        }

        if (!$parsed) {
            throw new \Exception("Failed to parse {$agent} response");
        }

        $usage = $response['usage'] ?? [];

        return [
            'watch' => $parsed['watch_out'] ?? $parsed['watch'] ?? 'Stay mindful',
            'expect' => $parsed['expect'] ?? 'Trust the journey',
            'extra' => $parsed['extra_nuance'] ?? 'Listen to your intuition',
            'input_tokens' => $usage['prompt_tokens'] ?? 0,
            'output_tokens' => $usage['completion_tokens'] ?? 0,
            'agent' => $agent
        ];
    }

    public function calculateCost(string $agent, int $inputTokens, int $outputTokens): float
    {
        $pricing = $this->pricing[$agent] ?? ['input' => 1, 'output' => 2];
        return ($inputTokens / 1_000_000) * $pricing['input'] + 
               ($outputTokens / 1_000_000) * $pricing['output'];
    }

    public function getPricing(string $agent): array
    {
        return $this->pricing[$agent] ?? ['input' => 1, 'output' => 2];
    }
}