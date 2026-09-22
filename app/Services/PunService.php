<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PunService
{
    protected string $apiKey;
    protected string $apiUrl;
    protected int $cacheDuration;

    public function __construct()
    {
        $this->apiKey = env('DEEPSEEK_API_KEY');
        $this->apiUrl = env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1/chat/completions');
        $this->cacheDuration = (int) env('PUN_CACHE_DURATION', 86400 * 30); // 30 days default
    }

    public function generatePuns(string $word): array
    {
        // Check cache first
        $cacheKey = 'pun_' . md5($word);
        if (Cache::has($cacheKey)) {
            Log::info('Pun cache hit', ['word' => $word]);
            return Cache::get($cacheKey);
        }

        Log::info('Generating puns for word', ['word' => $word]);

        try {
            $puns = $this->callDeepSeek($word);
            Cache::put($cacheKey, $puns, $this->cacheDuration);
            return $puns;
        } catch (\Exception $e) {
            Log::error('DeepSeek API error:', ['error' => $e->getMessage()]);
            $fallback = $this->generateFallbackPuns($word);
            // Cache fallback for shorter time
            Cache::put($cacheKey, $fallback, 3600);
            return $fallback;
        }
    }

    protected function callDeepSeek(string $word): array
    {
        $prompt = $this->buildPrompt($word);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->timeout(30)->post($this->apiUrl, [
            'model' => 'deepseek-chat',
            'messages' => [
                ['role' => 'system', 'content' => '你是一位跨文化谐音创意专家，精通多种语言。'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.9,
            'max_tokens' => 1500,
            'response_format' => ['type' => 'json_object']
        ]);

        if (!$response->successful()) {
            $error = $response->json()['error']['message'] ?? "HTTP {$response->status()}";
            throw new \Exception("DeepSeek API error: {$error}");
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '';

        if (empty($content)) {
            throw new \Exception('Empty response from DeepSeek');
        }

        return $this->parsePuns($content);
    }

    protected function buildPrompt(string $word): string
    {
        return "请为词语「{$word}」创作8个跨文化谐音梗。要求：
1. 每个谐音梗要包含创意、趣味和文化内涵
2. 融合不同语言的谐音联想（中文、英文、韩文、日文等）
3. 每个谐音要附上简洁的释义
4. 标注风格标签（如：荒诞、诗意、趣味、机智等）

请以JSON格式返回，格式如下：
[
  {
    \"pun\": \"谐音梗内容\",
    \"meaning\": \"创意释义\",
    \"style\": \"风格标签\"
  }
]

确保返回纯JSON数组，不要包含其他文字。";
    }

    protected function parsePuns(string $content): array
    {
        // Try to parse as JSON
        try {
            $puns = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
            if (is_array($puns) && count($puns) >= 8) {
                return array_slice($puns, 0, 8);
            }
        } catch (\JsonException $e) {
            Log::warning('Failed to parse DeepSeek response as JSON', ['content' => substr($content, 0, 500)]);
        }

        // Try to extract JSON from markdown or text
        $jsonMatch = preg_match('/\[[\s\S]*\]/', $content, $matches);
        if ($jsonMatch) {
            try {
                $puns = json_decode($matches[0], true, 512, JSON_THROW_ON_ERROR);
                if (is_array($puns) && count($puns) >= 8) {
                    return array_slice($puns, 0, 8);
                }
            } catch (\JsonException $e) {
                // Continue to fallback
            }
        }

        // Fallback to parsing line by line
        $lines = array_filter(array_map('trim', explode("\n", $content)));
        $puns = [];
        foreach ($lines as $line) {
            if (strpos($line, '：') !== false || strpos($line, ':') !== false) {
                $parts = preg_split('/[：:]/', $line, 2);
                if (count($parts) === 2) {
                    $puns[] = [
                        'pun' => trim($parts[0]),
                        'meaning' => trim($parts[1]),
                        'style' => '创意'
                    ];
                }
            } elseif (!empty($line) && !str_starts_with($line, '[') && !str_starts_with($line, '{')) {
                $puns[] = [
                    'pun' => trim($line),
                    'meaning' => 'AI创意谐音',
                    'style' => '灵感'
                ];
            }
        }

        // If we still don't have enough, generate fallback
        if (count($puns) < 8) {
            return $this->generateFallbackPuns($word);
        }

        return array_slice($puns, 0, 8);
    }

    public function generateFallbackPuns(string $word): array
    {
        $templates = [
            ['pun' => "✨ {$word} · 灵境", 'meaning' => "从「{$word}」幻化的创意谐音", 'style' => '灵感'],
            ['pun' => "🌍 寰宇·{$word}", 'meaning' => "跨文化融合基础版", 'style' => '通用'],
            ['pun' => "🎭 谐·" . mb_substr($word, 0, 3) . "趣", 'meaning' => "谐音基础创作", 'style' => '智慧'],
            ['pun' => "💫 {$word}·变奏", 'meaning' => "创意变体", 'style' => '离线'],
            ['pun' => "🌟 星·{$word}", 'meaning' => "星辰大海的谐音", 'style' => '诗意'],
            ['pun' => "🔥 燃·{$word}", 'meaning' => "热情迸发的创意", 'style' => '活力'],
            ['pun' => "🍃 风·{$word}", 'meaning' => "随风而来的灵感", 'style' => '自然'],
            ['pun' => "💧 梦·{$word}", 'meaning' => "如水如梦的谐音", 'style' => '浪漫']
        ];

        return $templates;
    }

    public function isCached(string $word): bool
    {
        $cacheKey = 'pun_' . md5($word);
        return Cache::has($cacheKey);
    }

    public function clearCache(): void
    {
        // Clear all pun cache
        $keys = Cache::get('pun_cache_keys', []);
        foreach ($keys as $key) {
            Cache::forget($key);
        }
        Cache::forget('pun_cache_keys');
    }
}