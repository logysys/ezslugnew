<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIProviderService
{
    protected array $config;
    protected array $pricing;

    public function __construct()
    {
        $this->config = [
            'openai' => [
                'url' => 'https://api.openai.com/v1/chat/completions',
                'key' => env('OPENAI_API_KEY'),
                'model' => 'gpt-4o-mini',
                'price_input' => 0.15,
                'price_output' => 0.60
            ],
            'deepseek' => [
                'url' => 'https://api.deepseek.com/v1/chat/completions',
                'key' => env('DEEPSEEK_API_KEY'),
                'model' => 'deepseek-chat',
                'price_input' => 0.14,
                'price_output' => 0.28
            ],
            'gemini' => [
                'url' => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
                'key' => env('GEMINI_API_KEY'),
                'model' => 'gemini-3-flash-preview',
                'price_input' => 0.075,
                'price_output' => 0.30
            ],
            'perplexity' => [
                'url' => 'https://12tr.ee/api/v1/chat/completions',
                'key' => 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403',
                'model' => 'sonar-pro',
                'price_input' => 1.00,
                'price_output' => 5.00
            ]
        ];

        $this->pricing = [
            'openai' => [
                'label' => 'GPT-4o mini · $0.15/$0.60 per 1M',
                'input' => 0.15,
                'output' => 0.60
            ],
            'deepseek' => [
                'label' => 'DeepSeek Chat · $0.14/$0.28 per 1M',
                'input' => 0.14,
                'output' => 0.28
            ],
            'gemini' => [
                'label' => 'Gemini 3 Flash Preview · $0.075/$0.30 per 1M',
                'input' => 0.075,
                'output' => 0.30
            ],
            'perplexity' => [
                'label' => 'Sonar Pro via 12tr.ee · $1/$5 per 1M',
                'input' => 1.00,
                'output' => 5.00
            ]
        ];
    }

    public function callAgent(string $agent, string $character, string $theme): array
    {
        $provider = $this->config[$agent];
        $prompt = $this->buildPrompt($character, $theme);

        $response = $this->makeRequest($agent, $provider, $prompt);

        return $this->parseResponse($agent, $response, $character);
    }

    protected function buildPrompt(string $character, string $theme): string
    {
        $today = now()->locale('zh_TW')->isoFormat('YYYY年MMMMDo日dddd');

        return "你是一位精通中國漢字拆字占卜的智慧占卜師，融合傳統拆字術、字形學與五行哲學。
今日日期：{$today}
占問主題：{$theme}
用戶輸入的字：{$character}

請以繁體中文回答，只回傳以下JSON格式，不含任何JSON以外的文字或markdown：
{\"analysis\":\"對「{$character}」拆字解析，分析部首、筆畫、字形結構及字義，約100字\",\"luck\":\"針對「{$theme}」主題，給出正面指引與吉象，約80字\",\"caution\":\"針對「{$theme}」主題，給出需留意或避免的事項，約80字\",\"tip\":\"一句精簡有力的今日錦言，30字以內\"}";
    }

    protected function makeRequest(string $agent, array $provider, string $prompt): array
    {
        $payload = match ($agent) {
            'gemini' => [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1000,
                    'responseMimeType' => "application/json"
                ]
            ],
            'perplexity' => [
                'model' => $provider['model'],
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful assistant. Return only valid JSON.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'stream' => false,
                'temperature' => 0.7,
                'max_tokens' => 2000
            ],
            default => [
                'model' => $provider['model'],
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.8,
                'max_tokens' => 800
            ]
        };

        $headers = [
            'Content-Type' => 'application/json'
        ];

        if ($agent === 'gemini') {
            $url = $provider['url'] . '?key=' . $provider['key'];
        } else {
            $headers['Authorization'] = 'Bearer ' . $provider['key'];
            $url = $provider['url'];
        }

        Log::info("Calling AI provider: {$agent}", ['url' => $url]);

        $response = Http::withHeaders($headers)
            ->timeout(60)
            ->post($url, $payload);

        if (!$response->successful()) {
            $error = $response->json()['error']['message'] ?? "HTTP {$response->status()}";
            throw new \Exception("{$agent} 錯誤: {$error}");
        }

        return $response->json();
    }

    protected function parseResponse(string $agent, array $response, string $character): array
    {
        $parsed = $this->extractContent($agent, $response);
        $usage = $this->extractUsage($agent, $response);

        return [
            'analysis' => $parsed['analysis'] ?? "「{$character}」字形蘊含深厚底蘊，待你靜心感悟。",
            'luck' => $parsed['luck'] ?? '順勢而為，心誠則靈。',
            'caution' => $parsed['caution'] ?? '避免急躁，傾聽內在聲音。',
            'tip' => $parsed['tip'] ?? '一念之間，萬般自在。',
            'inp' => $usage['prompt_tokens'] ?? 150,
            'out' => $usage['completion_tokens'] ?? 280,
            'agent' => $agent,
            'pricing' => $this->pricing[$agent]
        ];
    }

    protected function extractContent(string $agent, array $response): array
    {
        $content = match ($agent) {
            'gemini' => $response['candidates'][0]['content']['parts'][0]['text'] ?? '',
            default => $response['choices'][0]['message']['content'] ?? ''
        };

        if (empty($content)) {
            throw new \Exception('未收到有效內容');
        }

        return $this->cleanAndParseJSON($content);
    }

    protected function extractUsage(string $agent, array $response): array
    {
        return match ($agent) {
            'gemini' => [
                'prompt_tokens' => $response['usageMetadata']['promptTokenCount'] ?? 150,
                'completion_tokens' => $response['usageMetadata']['candidatesTokenCount'] ?? 280
            ],
            default => [
                'prompt_tokens' => $response['usage']['prompt_tokens'] ?? 150,
                'completion_tokens' => $response['usage']['completion_tokens'] ?? 280
            ]
        };
    }

    protected function cleanAndParseJSON(string $rawText): array
    {
        $cleaned = preg_replace('/```json\s*/i', '', $rawText);
        $cleaned = preg_replace('/```\s*/', '', $cleaned);
        $cleaned = trim($cleaned);

        // Try to extract JSON object
        if (!str_starts_with($cleaned, '{')) {
            $firstBrace = strpos($cleaned, '{');
            if ($firstBrace !== false) {
                $cleaned = substr($cleaned, $firstBrace);
            }
        }

        if (!str_ends_with($cleaned, '}')) {
            $lastBrace = strrpos($cleaned, '}');
            if ($lastBrace !== false) {
                $cleaned = substr($cleaned, 0, $lastBrace + 1);
            }
        }

        try {
            return json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            // Fallback: extract fields with regex
            $result = [];
            $fields = ['analysis', 'luck', 'caution', 'tip'];
            foreach ($fields as $field) {
                if (preg_match('/"' . $field . '"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/s', $cleaned, $match)) {
                    $result[$field] = stripslashes($match[1]);
                }
            }
            return $result;
        }
    }

    public function getPricing(string $agent): array
    {
        return $this->pricing[$agent] ?? $this->pricing['openai'];
    }
}