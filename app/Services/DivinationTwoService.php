<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DivinationTwoService
{
    protected array $frequencies;
    protected array $brainwaves;
    protected string $apiKey;
    protected string $apiUrl;

    public function __construct()
    {
        $this->apiKey = 'tr_4d3cab44_24b8f7e10f535f0ca796245dbbe59a9b03d56da786aea403';
        $this->apiUrl = 'https://12tr.ee/api/v1/chat/completions';

        $this->frequencies = [
            ['id' => '396', 'hz' => 396, 'label' => '396 Hz', 'name' => '釋放恐懼', 'query' => '396Hz solfeggio frequency healing release fear'],
            ['id' => '417', 'hz' => 417, 'label' => '417 Hz', 'name' => '轉化負能量', 'query' => '417Hz solfeggio frequency remove negative energy'],
            ['id' => '432', 'hz' => 432, 'label' => '432 Hz', 'name' => '自然和諧', 'query' => '432Hz healing frequency music deep relaxation'],
            ['id' => '528', 'hz' => 528, 'label' => '528 Hz', 'name' => '愛與修復', 'query' => '528Hz miracle tone healing frequency meditation'],
            ['id' => '639', 'hz' => 639, 'label' => '639 Hz', 'name' => '人際和諧', 'query' => '639Hz solfeggio frequency harmony relationships'],
            ['id' => '741', 'hz' => 741, 'label' => '741 Hz', 'name' => '淨化直覺', 'query' => '741Hz solfeggio frequency cleanse intuition'],
            ['id' => '852', 'hz' => 852, 'label' => '852 Hz', 'name' => '靈性覺醒', 'query' => '852Hz solfeggio frequency spiritual awakening'],
            ['id' => '963', 'hz' => 963, 'label' => '963 Hz', 'name' => '合一意識', 'query' => '963Hz frequency meditation'],
            ['id' => 'rife', 'hz' => 727, 'label' => 'Rife 727', 'name' => '身心調理', 'query' => 'Rife frequency healing mind body wellness'],
        ];

        $this->brainwaves = [
            ['id' => 'none', 'label' => '純音', 'beat' => 0, 'desc' => '單一純頻率'],
            ['id' => 'delta', 'label' => 'Delta 2Hz', 'beat' => 2, 'desc' => '深眠・修復'],
            ['id' => 'theta', 'label' => 'Theta 6Hz', 'beat' => 6, 'desc' => '冥想・直覺'],
            ['id' => 'alpha', 'label' => 'Alpha 10Hz', 'beat' => 10, 'desc' => '放鬆・專注'],
        ];
    }

    public function getDivination(string $character): array
    {
        $prompt = $this->buildPrompt($character);
        
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->timeout(60)->post($this->apiUrl, [
            'model' => 'claude-haiku-4-5',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'stream' => false,
            'temperature' => 0.7,
            'max_tokens' => 1024
        ]);

        if (!$response->successful()) {
            $errorData = $response->json();
            $error = $errorData['error']['message'] ?? "HTTP {$response->status()}";
            throw new \Exception("API error: {$error}");
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '';
        $usage = $data['usage'] ?? ['prompt_tokens' => 0, 'completion_tokens' => 0];

        // Parse JSON response
        $cleaned = preg_replace('/```json|```/', '', $content);
        $parsed = json_decode(trim($cleaned), true);

        if (!$parsed) {
            throw new \Exception('Failed to parse API response');
        }

        // Validate frequency
        $frequencyId = $parsed['frequency']['id'] ?? '432';
        $validFreq = array_column($this->frequencies, 'id');
        if (!in_array($frequencyId, $validFreq)) {
            $frequencyId = '432';
        }

        // Validate brainwave
        $brainwaveId = $parsed['frequency']['brainwave'] ?? 'theta';
        $validBw = array_column($this->brainwaves, 'id');
        if (!in_array($brainwaveId, $validBw)) {
            $brainwaveId = 'theta';
        }

        return [
            'parts' => $parsed['parts'] ?? '無法解析字形結構',
            'imagery' => $parsed['imagery'] ?? '意象解讀中...',
            'fortune' => $parsed['fortune'] ?? '占卜結果...',
            'advice' => $parsed['advice'] ?? '靜心感受',
            'frequency_id' => $frequencyId,
            'brainwave_id' => $brainwaveId,
            'frequency_reason' => $parsed['frequency']['reason'] ?? '此頻率有助於平衡身心',
            'input_tokens' => $usage['prompt_tokens'] ?? 0,
            'output_tokens' => $usage['completion_tokens'] ?? 0
        ];
    }

    protected function buildPrompt(string $character): string
    {
        $freqOptions = implode(', ', array_map(function($f) {
            return "{$f['id']}({$f['name']})";
        }, $this->frequencies));
        
        $bwOptions = implode(', ', array_map(function($b) {
            return "{$b['id']}({$b['desc']})";
        }, $this->brainwaves));

        return "你是拆字占卜命理師兼身心頻率調理顧問。對「{$character}」進行拆字占卜。只回JSON，無其他文字：

{
  \"parts\": \"拆字分析（部件結構，1-2句）\",
  \"imagery\": \"意象解讀（2-3句）\",
  \"fortune\": \"占卜結果（2-3句）\",
  \"advice\": \"行動建議（1-2句）\",
  \"frequency\": {
    \"id\": \"根據此字的心情能量，從以下選一: {$freqOptions}\",
    \"brainwave\": \"從以下選一: {$bwOptions}\",
    \"reason\": \"為什麼這個頻率適合此字的能量（1-2句）\"
  }
}

frequency的id/brainwave只能填英文/數字代碼。";
    }

    public function calculateCost(int $inputTokens, int $outputTokens): float
    {
        $priceIn = 3.0; // $3 per 1M input tokens
        $priceOut = 15.0; // $15 per 1M output tokens
        return ($inputTokens / 1_000_000) * $priceIn + ($outputTokens / 1_000_000) * $priceOut;
    }

    public function getFrequencies(): array
    {
        return $this->frequencies;
    }

    public function getBrainwaves(): array
    {
        return $this->brainwaves;
    }

    public function getFrequencyById(string $id): ?array
    {
        foreach ($this->frequencies as $f) {
            if ($f['id'] === $id) {
                return $f;
            }
        }
        return null;
    }

    public function getBrainwaveById(string $id): ?array
    {
        foreach ($this->brainwaves as $b) {
            if ($b['id'] === $id) {
                return $b;
            }
        }
        return null;
    }
}