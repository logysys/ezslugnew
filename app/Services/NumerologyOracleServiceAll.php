<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NumerologyOracleServiceAll
{
    protected array $config;
    protected array $pricing;
    protected array $languages;

    public function __construct()
    {
        $this->config = [
            'openai' => [
                'url' => 'https://api.openai.com/v1/chat/completions',
                'key' => env('OPENAI_API_KEY'),
                'model' => 'gpt-4o-mini',
                'price_input' => 2.50,
                'price_output' => 10.00
            ],
            'kimi' => [
                'url' => 'https://api.moonshot.ai/v1/chat/completions',
                'key' => env('MOONSHOT_API_KEY'),
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
                'price_output' => 1.50,
                'is_gemini' => true
            ],
            'deepseek' => [
                'url' => 'https://api.deepseek.com/v1/chat/completions',
                'key' => env('DEEPSEEK_API_KEY'),
                'model' => 'deepseek-chat',
                'price_input' => 0.14,
                'price_output' => 0.28
            ]
        ];

        $this->pricing = [
            'openai' => ['input' => 2.50, 'output' => 10.00, 'label' => 'GPT-4o mini'],
            'kimi' => ['input' => 2.00, 'output' => 8.00, 'label' => 'Moonshot v1-8k'],
            'perplexity' => ['input' => 1.00, 'output' => 5.00, 'label' => 'Sonar Pro'],
            'gemini' => ['input' => 0.50, 'output' => 1.50, 'label' => 'Gemini 3 Flash'],
            'deepseek' => ['input' => 0.14, 'output' => 0.28, 'label' => 'DeepSeek Chat']
        ];

        $this->languages = [
            'en' => ['name' => 'English', 'flag' => '🇺🇸'],
            'es' => ['name' => 'Spanish', 'flag' => '🇪🇸'],
            'fr' => ['name' => 'French', 'flag' => '🇫🇷'],
            'de' => ['name' => 'German', 'flag' => '🇩🇪'],
            'zh' => ['name' => 'Chinese', 'flag' => '🇨🇳'],
            'ja' => ['name' => 'Japanese', 'flag' => '🇯🇵'],
            'ko' => ['name' => 'Korean', 'flag' => '🇰🇷'],
            'ar' => ['name' => 'Arabic', 'flag' => '🇸🇦'],
            'pt' => ['name' => 'Portuguese', 'flag' => '🇧🇷'],
            'hi' => ['name' => 'Hindi', 'flag' => '🇮🇳'],
            'it' => ['name' => 'Italian', 'flag' => '🇮🇹'],
            'ru' => ['name' => 'Russian', 'flag' => '🇷🇺'],
            'tl' => ['name' => 'Filipino', 'flag' => '🇵🇭']
        ];
    }

    public function getNumerology(int $number, string $agent, string $language = 'en'): array
    {
        $provider = $this->config[$agent];
        $systemPrompt = $this->buildPrompt($number, $language);

        $response = $this->makeRequest($agent, $provider, $systemPrompt, $number);
        return $this->parseResponse($agent, $response);
    }

    protected function buildPrompt(int $number, string $language): string
    {
        $today = now()->format('l, F j, Y');
        $langName = $this->languages[$language]['name'] ?? 'English';
        
        $langInstruction = $language === 'en'
            ? 'Respond in English.'
            : "You MUST respond entirely in {$langName}. All three values in the JSON must be written in {$langName} only — do not use English.";

        return "You are a mystical numerology oracle. {$langInstruction} Respond ONLY in valid JSON format: {\"watch_out\": \"...\", \"expect\": \"...\", \"extra_nuance\": \"...\"}. No extra text outside JSON. Today's date: {$today}. The user's spontaneous number is {$number}. \"watch_out\": detailed what to avoid or be mindful of today (2-3 sentences). \"expect\": positive opportunities, emotions, or synchronicities (2-3 sentences). \"extra_nuance\": one short intuitive tip. Be warm, poetic, and practical.";
    }

    protected function makeRequest(string $agent, array $provider, string $systemPrompt, int $number)
    {
        $headers = ['Content-Type' => 'application/json'];

        if ($agent === 'gemini') {
            $url = $provider['url'] . '?key=' . $provider['key'];
            $payload = [
                'contents' => [
                    ['parts' => [['text' => $systemPrompt]]]
                ]
            ];
        } else {
            $url = $provider['url'];
            $headers['Authorization'] = 'Bearer ' . $provider['key'];
            
            if ($agent === 'openai') {
                $payload = [
                    'model' => $provider['model'],
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => "The number {$number} appeared in my mind."]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 1,
                    'max_tokens' => 600
                ];
            } else {
                $payload = [
                    'model' => $provider['model'],
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => "Number {$number}"]
                    ],
                    'temperature' => 1,
                    'max_tokens' => 600
                ];
            }
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
            'input_tokens' => max(0, (int)($usage['promptTokenCount'] ?? 0)),
            'output_tokens' => max(0, (int)($usage['candidatesTokenCount'] ?? 0)),
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
            'input_tokens' => max(0, (int)($usage['prompt_tokens'] ?? 0)),
            'output_tokens' => max(0, (int)($usage['completion_tokens'] ?? 0)),
            'agent' => $agent
        ];
    }

    public function calculateCost(string $agent, int $inputTokens, int $outputTokens): array
    {
        // Ensure we have valid numbers
        $inputTokens = max(0, (int)$inputTokens);
        $outputTokens = max(0, (int)$outputTokens);
        
        $pricing = $this->pricing[$agent] ?? ['input' => 1.00, 'output' => 2.00];
        $inputCost = ($inputTokens / 1_000_000) * $pricing['input'];
        $outputCost = ($outputTokens / 1_000_000) * $pricing['output'];
        
        return [
            'input_cost' => max(0, (float)$inputCost),
            'output_cost' => max(0, (float)$outputCost),
            'total' => max(0, (float)($inputCost + $outputCost))
        ];
    }

    public function getPricing(string $agent): array
    {
        return $this->pricing[$agent] ?? ['input' => 1.00, 'output' => 2.00, 'label' => 'Unknown'];
    }

    public function getLanguages(): array
    {
        return $this->languages;
    }

    public function getSupportedAgents(): array
    {
        return array_keys($this->config);
    }
}