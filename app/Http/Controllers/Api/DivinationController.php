<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DivinationRecord;
use App\Models\GlobalStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DivinationController extends Controller
{
    // API 配置
    private $kimiConfig;
    private $perplexityConfig;
    private $pricing;
    
    public function __construct()
    {
        $this->kimiConfig = [
            'api_key' => env('KIMI_API_KEY', 'sk-6WgIud23PdYluNxmJp6laFlAuBCE0hfsX4PJvtBXuGcoiapI'),
            'model' => 'kimi-k3',
            'base_url' => 'https://api.moonshot.ai/v1'
        ];
        
        $this->perplexityConfig = [
            'api_key' => env('PERPLEXITY_API_KEY', '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'),
            'model' => 'sonar-pro',
            'base_url' => 'https://api.perplexity.ai'
        ];
        
        $this->pricing = [
            'kimi' => ['inputPerM' => 0.60, 'outputPerM' => 3.00],
            'perplexity' => ['inputPerM' => 3.00, 'outputPerM' => 15.00, 'searchFee' => 0.005]
        ];
    }
    
    /**
     * 獲取全局統計
     */
    public function getGlobalStats()
    {
        $stats = GlobalStat::first();
        return response()->json([
            'success' => true,
            'data' => [
                'total_cost_usd' => $stats ? (float)$stats->total_cost_usd : 0,
                'total_tokens' => $stats ? (int)$stats->total_tokens : 0,
                'total_requests' => $stats ? (int)$stats->total_requests : 0
            ]
        ]);
    }
    
    /**
     * 獲取拆字紀錄
     */
    public function getHistory(Request $request)
    {
        $limit = $request->get('limit', 50);
        $records = DivinationRecord::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $records->map(function($record) {
                return [
                    'id' => $record->id,
                    'character' => $record->character,
                    'structure' => $record->structure,
                    'fortune' => $record->fortune,
                    'luck_level' => $record->luck_level,
                    'ai_source' => $record->ai_source,
                    'cost_data' => $record->cost_data,
                    'response_time_ms' => $record->response_time_ms,
                    'is_favorite' => $record->is_favorite,
                    'created_at' => $record->created_at->toISOString()
                ];
            })
        ]);
    }
    
    /**
     * 獲取珍藏列表
     */
    public function getFavorites()
    {
        $records = DivinationRecord::where('is_favorite', true)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $records->map(function($record) {
                return [
                    'id' => $record->id,
                    'character' => $record->character,
                    'structure' => $record->structure,
                    'fortune' => $record->fortune,
                    'luck_level' => $record->luck_level,
                    'ai_source' => $record->ai_source,
                    'created_at' => $record->created_at->toISOString()
                ];
            })
        ]);
    }
    
    /**
     * 切換珍藏狀態
     */
    public function toggleFavorite(Request $request, $id)
    {
        $record = DivinationRecord::findOrFail($id);
        $record->is_favorite = !$record->is_favorite;
        $record->save();
        
        return response()->json([
            'success' => true,
            'message' => $record->is_favorite ? '已加入珍藏' : '已移除珍藏',
            'data' => ['is_favorite' => $record->is_favorite]
        ]);
    }
    
    /**
     * 删除紀錄
     */
    public function deleteRecord($id)
    {
        $record = DivinationRecord::findOrFail($id);
        $record->delete();
        
        return response()->json([
            'success' => true,
            'message' => '刪除成功'
        ]);
    }
    
    /**
     * 清空歷史紀錄
     */
    public function clearHistory()
    {
        DivinationRecord::where('is_favorite', false)->delete();
        
        return response()->json([
            'success' => true,
            'message' => '歷史紀錄已清空'
        ]);
    }
    
    /**
     * 清空珍藏
     */
    public function clearFavorites()
    {
        DivinationRecord::where('is_favorite', true)->update(['is_favorite' => false]);
        
        return response()->json([
            'success' => true,
            'message' => '珍藏已清空'
        ]);
    }
    
    /**
     * 離線拆字（古法）
     */
    public function offlineDivination(Request $request)
    {
        $request->validate([
            'character' => 'required|string|size:1'
        ]);
        
        $char = $request->input('character');
        $result = $this->analyzeStructureOffline($char);
        
        // 保存紀錄
        $record = DivinationRecord::create([
            'character' => $char,
            'structure' => $result['structure'],
            'fortune' => $result['description'],
            'luck_level' => $result['luckLevel'],
            'ai_source' => 'offline',
            'cost_data' => ['total_cost' => 0],
            'response_time_ms' => $result['elapsed'],
            'is_favorite' => false
        ]);
        
        return response()->json([
            'success' => true,
            'data' => [
                'record_id' => $record->id,
                'character' => $char,
                'structure' => $result['structure'],
                'parts' => $result['element'],
                'fortune' => $result['description'],
                'luck' => $result['luckLevel'],
                'elapsed_ms' => $result['elapsed'],
                'is_offline' => true
            ]
        ]);
    }
    
    /**
     * 雙AI拆字
     */
    public function dualAIDivination(Request $request)
    {
        $request->validate([
            'character' => 'required|string|size:1'
        ]);
        
        $char = $request->input('character');
        
        // 檢查快取
        $cacheKey = "divination:{$char}";
        if (Cache::has($cacheKey)) {
            return response()->json([
                'success' => true,
                'data' => Cache::get($cacheKey),
                'cached' => true
            ]);
        }
        
        // 並行調用兩個AI
        $kimiPromise = $this->fetchKimiDivination($char);
        $perpPromise = $this->fetchPerplexityDivination($char);
        
        $results = [
            'kimi' => $kimiPromise,
            'perplexity' => $perpPromise
        ];
        
        // 保存紀錄
        $kimiRecord = null;
        $perpRecord = null;
        
        if (isset($results['kimi']['success']) && $results['kimi']['success']) {
            $kimiRecord = DivinationRecord::create([
                'character' => $char,
                'structure' => $results['kimi']['data']['structure'] ?? null,
                'fortune' => $results['kimi']['data']['fortune'] ?? null,
                'luck_level' => $results['kimi']['data']['luck'] ?? null,
                'ai_source' => 'kimi',
                'cost_data' => $results['kimi']['cost_data'] ?? null,
                'response_time_ms' => $results['kimi']['elapsed'] ?? null,
                'is_favorite' => false
            ]);
            $results['kimi']['record_id'] = $kimiRecord->id;
        }
        
        if (isset($results['perplexity']['success']) && $results['perplexity']['success']) {
            $perpRecord = DivinationRecord::create([
                'character' => $char,
                'structure' => $results['perplexity']['data']['structure'] ?? null,
                'fortune' => $results['perplexity']['data']['fortune'] ?? null,
                'luck_level' => $results['perplexity']['data']['luck'] ?? null,
                'ai_source' => 'perplexity',
                'cost_data' => $results['perplexity']['cost_data'] ?? null,
                'response_time_ms' => $results['perplexity']['elapsed'] ?? null,
                'is_favorite' => false
            ]);
            $results['perplexity']['record_id'] = $perpRecord->id;
        }
        
        // 更新全局統計
        $totalCost = ($results['kimi']['cost_data']['total_cost'] ?? 0) + ($results['perplexity']['cost_data']['total_cost'] ?? 0);
        $totalTokens = ($results['kimi']['cost_data']['input_tokens'] ?? 0) + ($results['kimi']['cost_data']['output_tokens'] ?? 0) +
                       ($results['perplexity']['cost_data']['input_tokens'] ?? 0) + ($results['perplexity']['cost_data']['output_tokens'] ?? 0);
        GlobalStat::updateStats($totalCost, $totalTokens);
        
        // 快取結果（1小時）
        Cache::put($cacheKey, $results, 3600);
        
        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }
    
    /**
     * 調用 Kimi API
     */
    private function fetchKimiDivination($char)
    {
        $startTime = microtime(true);
        
        $prompt = "你是漢字拆字宗師，對「{$char}」拆解結構(上下/左右/包圍/獨體/複合)，部件五行意涵，並給出運勢指引（優美文言約70字）。輸出JSON: {\"structure\":\"結構\",\"parts\":\"部件解讀\",\"fortune\":\"運勢建議\",\"luck\":\"吉凶(大吉/中吉/小吉/平)\"}";
        
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->kimiConfig['api_key']
            ])->post($this->kimiConfig['base_url'] . '/chat/completions', [
                'model' => $this->kimiConfig['model'],
                'messages' => [['role' => 'user', 'content' => $prompt]],
                'temperature' => 0.75,
                'max_tokens' => 550
            ]);
            
            if (!$response->successful()) {
                throw new \Exception('Kimi API error: ' . $response->status());
            }
            
            $data = $response->json();
            $content = $data['choices'][0]['message']['content'];
            $usage = $data['usage'] ?? ['prompt_tokens' => 280, 'completion_tokens' => 460];
            
            $inputTokens = $usage['prompt_tokens'];
            $outputTokens = $usage['completion_tokens'];
            $inputCost = ($inputTokens / 1000000) * $this->pricing['kimi']['inputPerM'];
            $outputCost = ($outputTokens / 1000000) * $this->pricing['kimi']['outputPerM'];
            $totalCost = $inputCost + $outputCost;
            
            // 解析JSON
            $jsonData = $this->extractJSON($content);
            $fallback = $this->analyzeStructureOffline($char);
            
            $elapsed = round((microtime(true) - $startTime) * 1000);
            
            return [
                'success' => true,
                'data' => [
                    'structure' => $jsonData['structure'] ?? $fallback['structure'],
                    'parts' => $jsonData['parts'] ?? $fallback['element'],
                    'fortune' => $jsonData['fortune'] ?? $fallback['description'],
                    'luck' => $jsonData['luck'] ?? $fallback['luckLevel']
                ],
                'cost_data' => [
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'input_cost' => $inputCost,
                    'output_cost' => $outputCost,
                    'total_cost' => $totalCost
                ],
                'elapsed' => $elapsed
            ];
            
        } catch (\Exception $e) {
            Log::error('Kimi API Error: ' . $e->getMessage());
            $fallback = $this->analyzeStructureOffline($char);
            return [
                'success' => false,
                'data' => $fallback,
                'cost_data' => ['total_cost' => 0],
                'elapsed' => 0,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * 調用 Perplexity API
     */
    private function fetchPerplexityDivination($char)
    {
        $startTime = microtime(true);
        
        $prompt = "拆字古法：「{$char}」字形結構（上下/左右/包圍）、部首五行、每日機緣。輸出JSON: {\"structure\":\"\",\"elements\":\"意涵拆解\",\"fortune\":\"開運建議\",\"luck\":\"吉凶\"}";
        
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->perplexityConfig['api_key']
            ])->post($this->perplexityConfig['base_url'] . '/chat/completions', [
                'model' => $this->perplexityConfig['model'],
                'messages' => [
                    ['role' => 'system', 'content' => '你是測字聖手，只輸出JSON無其它。'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 550
            ]);
            
            if (!$response->successful()) {
                throw new \Exception('Perplexity API error: ' . $response->status());
            }
            
            $data = $response->json();
            $content = $data['choices'][0]['message']['content'];
            $usage = $data['usage'] ?? ['prompt_tokens' => 290, 'completion_tokens' => 480];
            
            $inputTokens = $usage['prompt_tokens'];
            $outputTokens = $usage['completion_tokens'];
            $inputCost = ($inputTokens / 1000000) * $this->pricing['perplexity']['inputPerM'];
            $outputCost = ($outputTokens / 1000000) * $this->pricing['perplexity']['outputPerM'];
            $searchFee = $this->pricing['perplexity']['searchFee'];
            $totalCost = $inputCost + $outputCost + $searchFee;
            
            // 解析JSON
            $jsonData = $this->extractJSON($content);
            $fallback = $this->analyzeStructureOffline($char);
            
            $elapsed = round((microtime(true) - $startTime) * 1000);
            
            return [
                'success' => true,
                'data' => [
                    'structure' => $jsonData['structure'] ?? $fallback['structure'],
                    'parts' => $jsonData['elements'] ?? $fallback['element'],
                    'fortune' => $jsonData['fortune'] ?? $fallback['description'],
                    'luck' => $jsonData['luck'] ?? $fallback['luckLevel']
                ],
                'cost_data' => [
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'input_cost' => $inputCost,
                    'output_cost' => $outputCost,
                    'search_fee' => $searchFee,
                    'total_cost' => $totalCost
                ],
                'elapsed' => $elapsed
            ];
            
        } catch (\Exception $e) {
            Log::error('Perplexity API Error: ' . $e->getMessage());
            $fallback = $this->analyzeStructureOffline($char);
            return [
                'success' => false,
                'data' => $fallback,
                'cost_data' => ['total_cost' => 0],
                'elapsed' => 0,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * 從文本中提取JSON
     */
    private function extractJSON($content)
    {
        if (preg_match('/\{[\s\S]*?\}/', $content, $matches)) {
            return json_decode($matches[0], true) ?? [];
        }
        return [];
    }
    
    /**
     * 離線拆字算法
     */
    private function analyzeStructureOffline($char)
    {
        $code = (ord($char) + strlen($char)) % 7;
        
        $structures = [
            "上下結構 · 天地垂象",
            "左右結構 · 陰陽相濟",
            "包圍結構 · 四維守藏",
            "獨體字 · 太初渾元",
            "複合結構 · 交泰生機",
            "品字結構 · 众星拱月",
            "半包結構 · 龍盤虎踞"
        ];
        
        $elements = [
            "木火通明 · 春華秋實",
            "水土相涵 · 厚德載物",
            "金玉其相 · 剛柔並濟",
            "日月光華 · 乾坤朗照",
            "雲雷文采 · 天機暗湧",
            "風火家人 · 和氣致祥",
            "山水蒙 · 啟智開悟"
        ];
        
        $descriptions = [
            "根基穩固，上承天時，下接地利。福澤綿長。",
            "左右相輔，人際圓融，財祿雙收，貴人提攜。",
            "四方包藏，守成得吉，宜靜不宜動，內修福德。",
            "渾然一體，獨立自主，心志堅毅，大器晚成。",
            "陰陽交泰，變化之中見生機，動中得財。",
            "高臺累土，眾志聚福，事業合作大吉。",
            "潛龍勿用，待時而動，沉潛修心。"
        ];
        
        $luckLevels = [
            "大吉 · 元亨利貞",
            "上吉 · 萬事順遂",
            "中吉 · 守正待時",
            "小吉 · 漸入佳境",
            "平 · 心平福至",
            "大吉 · 紫氣東來",
            "上吉 · 福星高照"
        ];
        
        $idx = $code % count($structures);
        
        return [
            'structure' => $structures[$idx],
            'element' => $elements[$idx],
            'description' => $descriptions[$idx],
            'luckLevel' => $luckLevels[$idx],
            'elapsed' => rand(15, 30)
        ];
    }
}