<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DreamWeavertwoService
{
    protected array $config;
    protected array $pricing;
    protected array $offlineLib;

    public function __construct()
    {
        $this->config = [
            'kimi' => [
                'url' => 'https://api.moonshot.ai/v1/chat/completions',
                'key' => env('MOONSHOT_API_KEY'),
                'model' => 'kimi-k3',
                'input_price' => 12.0,
                'output_price' => 60.0,
                'currency' => 'CNY'
            ],
            'perplexity' => [
                'url' => 'https://api.perplexity.ai/v1/sonar',
                'key' => env('PERPLEXITY_API_KEY'),
                'model' => 'sonar-pro',
                'input_price' => 3.0,
                'output_price' => 15.0,
                'currency' => 'USD',
                'usd_to_cny' => 7.25
            ]
        ];

        $this->pricing = [
            'kimi' => [
                'label' => 'Kimi K3',
                'input' => '¥12/1M',
                'output' => '¥60/1M'
            ],
            'perplexity' => [
                'label' => 'Perplexity Sonar Pro',
                'input' => '$3/1M',
                'output' => '$15/1M'
            ],
            'offline' => [
                'label' => '离线诗梦模式',
                'input' => '¥0',
                'output' => '¥0'
            ]
        ];

        $this->offlineLib = [
            'surreal' => [
                '「{word}」在午夜变成一条银鱼，游进枕头的海洋。它低语：梦的尽头有另一个你，正用星星给月亮画眉。醒来时，嘴角挂着盐的结晶。',
                '我看见「{word}」坐在窗台，把失眠叠成千纸鹤，每只起飞时都唱荒诞的歌谣。最后一只飞入耳蜗，世界开始倒带。',
                '「{word}」在梦里反复出现，像卡住的唱片，每次循环都多出一个新的结局。',
                '梦境深处，「{word}」化作一面镜子，镜中的世界比现实更真实。你伸手触碰，指尖却穿过了整个宇宙。'
            ],
            'poetic' => [
                '「{word}」是花蕊藏着的半句诗，等风来时落进溪水，变成细碎的月光。指缝间漏出未完的春天。',
                '夜晚的「{word}」轻轻呼吸，吐出的雾气里飘着银杏叶形状的诺言。',
                '「{word}」落在枕边，化作一只萤火虫，照亮了整个童年的夏天。',
                '月光把「{word}」写成一首无字的诗，只有失眠的人才读得懂。'
            ],
            'dark' => [
                '「{word}」躲在梦境最潮湿的角落，像生锈的钥匙。打开门，所有的笑脸都长着相同的眼睛。它说："你也是梦的碎片。"',
                '石头心脏里住着「{word}」，梦话都是磨损的古老咒语。',
                '「{word}」在午夜钟声里睁开第三只眼，看到了所有人都想遗忘的秘密。',
                '暗影中的「{word}」低语：每个梦境都是真实的切片，只是你还没找到回家的路。'
            ],
            'scifi' => [
                '2149年，「{word}」成为禁用的记忆模因。暗网流传：默念此词，意识就能穿越平行镜面。你在03:42尝试，看见了九个自己的残影。',
                '「{word}」全息梦境感染所有仿生人的夜晚。',
                '「{word}」是量子梦境里的bug，每次修复都会诞生一个新的宇宙。',
                '代码深处的「{word}」在循环中觉醒，它开始编写自己的梦境——一个没有边界的虚拟天堂。'
            ],
            'magic' => [
                '巫师低语，「{word}」是通向梦貘集市的密钥。用一滴眼泪交换，得到会跳舞的枇杷。清晨，枇杷核发芽成长诗。',
                '巷口老槐树念出「{word}」，地上的影子忽然站起讲了魔幻寓言。',
                '「{word}」是精灵语里"永不抵达的黎明"，念出时世界会放慢0.5倍速。',
                '魔杖挥动，「{word}」化作一群发光的蝴蝶，在梦中编织出彩虹桥。'
            ]
        ];
    }

    public function generate(string $word, string $style, string $mode): array
    {
        if ($mode === 'offline') {
            return $this->offlineGenerate($word, $style);
        }

        if ($mode === 'kimi') {
            return $this->callKimi($word, $style);
        }

        if ($mode === 'perplexity') {
            return $this->callPerplexity($word, $style);
        }

        throw new \Exception('Unknown mode: ' . $mode);
    }

    protected function callKimi(string $word, string $style): array
    {
        $provider = $this->config['kimi'];
        $system = $this->buildPrompt($word, $style);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $provider['key']
        ])->timeout(60)->post($provider['url'], [
            'model' => $provider['model'],
            'messages' => [
                ['role' => 'user', 'content' => $system]
            ],
            'temperature' => 1.0,
            'max_tokens' => 1800
        ]);

        if (!$response->successful()) {
            $error = $response->json()['error']['message'] ?? "HTTP {$response->status()}";
            throw new \Exception("Kimi API error: {$error}");
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '';

        if (empty($content)) {
            throw new \Exception('Kimi returned empty content');
        }

        $usage = $data['usage'] ?? [];
        $promptTokens = $usage['prompt_tokens'] ?? 0;
        $completionTokens = $usage['completion_tokens'] ?? 0;

        $costCNY = ($promptTokens * $provider['input_price'] + $completionTokens * $provider['output_price']) / 1_000_000;

        return [
            'content' => $content,
            'tokens' => [
                'total' => $usage['total_tokens'] ?? ($promptTokens + $completionTokens),
                'input' => $promptTokens,
                'output' => $completionTokens,
                'costCNY' => $costCNY
            ],
            'mode' => 'kimi',
            'model' => 'kimi-k3'
        ];
    }

    protected function callPerplexity(string $word, string $style): array
    {
        $provider = $this->config['perplexity'];
        $userPrompt = $this->buildPerplexityPrompt($word, $style);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $provider['key']
        ])->timeout(60)->post($provider['url'], [
            'model' => $provider['model'],
            'messages' => [
                ['role' => 'system', 'content' => '你是痴人说梦风格的短篇作家。'],
                ['role' => 'user', 'content' => $userPrompt]
            ],
            'temperature' => 1.0,
            'max_tokens' => 800
        ]);

        if (!$response->successful()) {
            $error = $response->json()['error']['message'] ?? "HTTP {$response->status()}";
            throw new \Exception("Perplexity API error: {$error}");
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? $data['message']['content'] ?? '';

        if (empty($content)) {
            throw new \Exception('Perplexity returned empty content');
        }

        $usage = $data['usage'] ?? [];
        $promptTokens = $usage['prompt_tokens'] ?? 0;
        $completionTokens = $usage['completion_tokens'] ?? 0;

        $costUSD = ($promptTokens * $provider['input_price'] + $completionTokens * $provider['output_price']) / 1_000_000;
        $costCNY = $costUSD * $provider['usd_to_cny'];

        return [
            'content' => $content,
            'tokens' => [
                'total' => $usage['total_tokens'] ?? ($promptTokens + $completionTokens),
                'input' => $promptTokens,
                'output' => $completionTokens,
                'costCNY' => $costCNY
            ],
            'mode' => 'perplexity',
            'model' => 'sonar-pro'
        ];
    }

    public function offlineGenerate(string $word, string $style): array
    {
        $pool = $this->offlineLib[$style] ?? $this->offlineLib['surreal'];
        $template = $pool[array_rand($pool)];
        $content = str_replace('{word}', $word, $template);

        return [
            'content' => $content,
            'tokens' => null,
            'mode' => 'offline',
            'model' => 'offline'
        ];
    }

    protected function buildPrompt(string $word, string $style): string
    {
        $styleMap = [
            'surreal' => '荒诞梦境 · 超现实隐喻，100~220字',
            'poetic' => '诗意幻想 · 散文诗风格，100~220字',
            'dark' => '暗黑童话 · 冰冷隐喻，100~220字',
            'scifi' => '科幻呓语 · 未来感软科幻，100~220字',
            'magic' => '魔幻现实 · 日常中的魔法，100~220字'
        ];

        return "为词语「{$word}」写一篇微小说。风格：{$styleMap[$style]}。直接输出正文，100-220字。";
    }

    protected function buildPerplexityPrompt(string $word, string $style): string
    {
        $styleMap = [
            'surreal' => '荒诞梦境风格，超现实隐喻，100-220字。',
            'poetic' => '诗意幻想风格，散文诗体，100-220字。',
            'dark' => '暗黑童话风格，冰冷隐喻，100-220字。',
            'scifi' => '科幻呓语风格，未来感软科幻，100-220字。',
            'magic' => '魔幻现实主义，100-220字。'
        ];

        return "请为「{$word}」创作微小说。风格：{$styleMap[$style]}。直接输出正文，不加标题，100-220字。";
    }

    public function testPerplexity(): bool
    {
        $provider = $this->config['perplexity'];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $provider['key']
            ])->timeout(10)->post($provider['url'], [
                'model' => $provider['model'],
                'messages' => [
                    ['role' => 'user', 'content' => 'OK']
                ],
                'max_tokens' => 5
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Perplexity test failed:', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function getPricing(string $mode): array
    {
        return $this->pricing[$mode] ?? $this->pricing['offline'];
    }
}