<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>🌙 痴人说梦 · 灵境织梦机 | Kimi K2.5 + Perplexity Sonar Pro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: radial-gradient(circle at 10% 20%, #0b0b1a, #03030c);
            font-family: 'Inter', system-ui, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK', -apple-system, BlinkMacSystemFont, monospace;
            min-height: 100vh;
            padding: 1.5rem;
            color: #eef5ff;
        }

        .glass-panel {
            background: rgba(12, 20, 35, 0.45);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 2.5rem;
            border: 1px solid rgba(210, 180, 140, 0.25);
            box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
            transition: all 0.2s ease;
        }

        .container {
            max-width: 1300px;
            margin: 0 auto;
        }

        .hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(145deg, #FFE6B0, #E6C8A0, #C7A6FF);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            letter-spacing: -0.01em;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .badge-luminous {
            background: rgba(0, 210, 140, 0.2);
            border: 1px solid rgba(0, 210, 140, 0.6);
            font-size: 0.65rem;
            padding: 4px 14px;
            border-radius: 60px;
            font-weight: normal;
            color: #b9f6ca;
        }

        .activation-warning {
            background: rgba(255, 200, 100, 0.12);
            border-radius: 1rem;
            padding: 8px 16px;
            margin-bottom: 16px;
            border-left: 3px solid #ffcf9a;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.75rem;
        }

        .activation-warning .warning-icon {
            font-size: 1.1rem;
        }

        .stat-dashboard {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 2rem;
            padding: 0.8rem 1.5rem;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .stat-item {
            background: rgba(255, 255, 255, 0.02);
            padding: 4px 12px;
            border-radius: 2rem;
            font-size: 0.75rem;
            display: flex;
            gap: 6px;
            align-items: baseline;
        }

        .stat-number {
            font-weight: 800;
            font-size: 1.1rem;
            color: #ffdead;
        }

        .stat-detail {
            font-size: 0.65rem;
            opacity: 0.7;
            text-align: center;
            margin-top: 4px;
        }

        .clear-icon {
            cursor: pointer;
            background: rgba(255, 100, 100, 0.2);
            padding: 5px 12px;
            border-radius: 40px;
            font-size: 0.7rem;
            transition: 0.2s;
        }
        .clear-icon:hover {
            background: #ff7b5c;
            color: #0a0a1a;
        }

        .mode-tabs {
            display: flex;
            gap: 12px;
            margin: 1rem 0;
            flex-wrap: wrap;
        }
        .mode-pill {
            background: rgba(255, 255, 245, 0.07);
            border-radius: 60px;
            padding: 6px 22px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
            border: 1px solid rgba(255, 210, 150, 0.2);
        }
        .mode-pill.active {
            background: #d9b48b;
            color: #0b0b1a;
            font-weight: 600;
            border-color: transparent;
            box-shadow: 0 0 10px rgba(217, 180, 139, 0.6);
        }
        .style-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 1rem 0 1.2rem;
        }
        .style-chip {
            background: rgba(20, 25, 45, 0.7);
            border-radius: 40px;
            padding: 6px 20px;
            cursor: pointer;
            font-size: 0.8rem;
            backdrop-filter: blur(4px);
            transition: all 0.15s;
            border: 1px solid rgba(255, 215, 150, 0.2);
        }
        .style-chip.active {
            background: #ffcf9a;
            color: #0f0c29;
            font-weight: bold;
            border-color: #ffcf9a;
            box-shadow: 0 2px 8px rgba(255, 207, 154, 0.3);
        }

        .input-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin: 1.5rem 0;
        }
        .dream-input {
            flex: 3;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(210, 180, 140, 0.5);
            border-radius: 3rem;
            padding: 14px 24px;
            color: #f8f3e0;
            font-size: 1rem;
            font-family: inherit;
            outline: none;
        }
        .dream-input:focus {
            border-color: #ffcf9a;
            box-shadow: 0 0 0 2px rgba(255, 207, 154, 0.2);
        }
        .generate-btn {
            background: linear-gradient(135deg, #7b5e3b, #c49a6c);
            border: none;
            border-radius: 3rem;
            padding: 0 32px;
            font-weight: bold;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #0a0a1a;
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.2s;
            box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
        }
        .generate-btn:active { transform: scale(0.97); }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .story-stage {
            background: rgba(8, 12, 25, 0.7);
            border-radius: 2.2rem;
            padding: 1.8rem;
            margin: 1.2rem 0;
            border-left: 5px solid #ffcf9a;
            min-height: 300px;
            transition: all 0.25s;
        }

        .story-meta-bar {
            display: flex;
            justify-content: space-between;
            font-size: 0.7rem;
            color: #d9bc8b;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 8px;
        }

        .dream-text {
            font-size: 1.05rem;
            line-height: 1.65;
            white-space: pre-wrap;
            font-family: 'Crimson Text', 'Georgia', serif;
        }

        .loader-spinner {
            display: inline-block;
            width: 22px;
            height: 22px;
            border: 2px solid rgba(255,255,200,0.3);
            border-radius: 50%;
            border-top-color: #ffcf9a;
            animation: spin 0.7s infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .inspire-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            margin: 20px 0;
        }
        .idea-tile {
            background: rgba(255, 245, 210, 0.05);
            border-radius: 1.8rem;
            padding: 10px 12px;
            text-align: center;
            cursor: pointer;
            backdrop-filter: blur(4px);
            transition: 0.1s;
            border: 1px solid rgba(210, 180, 140, 0.2);
            font-size: 0.8rem;
        }
        .idea-tile:hover {
            background: rgba(255, 215, 150, 0.15);
            transform: translateY(-2px);
        }

        .split-layout {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-top: 1rem;
        }
        .dream-log {
            flex: 1;
            background: rgba(0, 0, 0, 0.35);
            border-radius: 1.8rem;
            padding: 1rem;
        }
        .log-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed rgba(255,210,130,0.3);
            margin-bottom: 14px;
            padding-bottom: 8px;
            font-weight: bold;
        }
        .story-chip-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .story-chip {
            background: rgba(255,255,210,0.08);
            border-radius: 30px;
            padding: 5px 14px;
            font-size: 0.7rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .remove-icon {
            font-size: 0.8rem;
            opacity: 0.6;
        }
        .remove-icon:hover {
            opacity: 1;
            color: #ff9f6e;
        }

        .toast-stack {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .toast-sweet {
            background: rgba(15, 18, 40, 0.85);
            backdrop-filter: blur(20px);
            border-radius: 1.2rem;
            padding: 12px 20px;
            border-left: 4px solid #ffcf9a;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.85rem;
            max-width: 340px;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .toast-sweet.show {
            transform: translateX(0);
        }

        .modal-aura {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        .modal-aura.active {
            opacity: 1;
            pointer-events: all;
        }
        .modal-card {
            background: linear-gradient(145deg, #171c30, #0a0e1c);
            border-radius: 2rem;
            max-width: 400px;
            width: 85%;
            padding: 2rem;
            text-align: center;
            border: 1px solid rgba(255,207,154,0.4);
            transform: scale(0.9);
            transition: transform 0.25s;
        }
        .modal-aura.active .modal-card {
            transform: scale(1);
        }
        .modal-buttons {
            display: flex;
            gap: 12px;
            margin-top: 28px;
        }
        .modal-btn {
            flex: 1;
            padding: 10px;
            border-radius: 3rem;
            border: none;
            font-weight: 600;
        }
        footer {
            text-align: center;
            margin: 2rem 0 0.5rem;
            font-size: 0.7rem;
            opacity: 0.6;
        }
        .cors-tip {
            background: rgba(255, 100, 100, 0.2);
            border-radius: 1rem;
            padding: 6px 12px;
            font-size: 0.7rem;
            display: none;
            margin-top: 8px;
        }
        button:disabled { opacity: 0.6; }
        .api-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-left: 6px;
        }
        .status-online { background-color: #4ade80; box-shadow: 0 0 6px #4ade80; }
        .status-offline { background-color: #f87171; }
        .status-testing { background-color: #fbbf24; animation: pulse 1s infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .pricing-note {
            font-size: 0.65rem;
            text-align: center;
            margin-top: 8px;
            color: #a0a0b0;
        }
        .keep-alive-badge {
            background: rgba(100, 200, 255, 0.15);
            border-radius: 20px;
            padding: 2px 10px;
            font-size: 0.65rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="hero">
        <h1>🧠 痴人说梦 · 灵境织梦机 <span class="badge-luminous">Kimi K2.5 + Perplexity Sonar Pro</span></h1>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div class="activation-warning" id="activationWarning">
            <span class="warning-icon">⚠️</span>
            <span><strong>Kimi API 需要保持标签页激活</strong> — 请勿最小化窗口或切换到其他标签页，否则请求可能被浏览器暂停。推荐使用 Perplexity 或离线模式作为替代。</span>
        </div>

        <div class="mode-tabs">
            <div data-mode="kimi" class="mode-pill active">🌙 Kimi K2.5 <span class="keep-alive-badge">需激活标签</span></div>
            <div data-mode="perplexity" class="mode-pill">🔮 Perplexity Sonar Pro <span id="pplxStatus" class="api-status status-testing"></span></div>
            <div data-mode="offline" class="mode-pill">📜 离线诗梦模式</div>
        </div>

        <div class="stat-dashboard">
            <div class="stat-item">💾 缓存 <span id="cacheCount" class="stat-number">0</span></div>
            <div class="stat-item">🌊 API请求 <span id="apiCountSpan" class="stat-number">0</span></div>
            <div class="stat-item">📖 Tokens <span id="tokenTotalSpan" class="stat-number">0</span></div>
            <div class="stat-item">💰 总成本 <span id="costSpan" class="stat-number">¥0.0000</span></div>
            <div id="clearCacheBtn" class="clear-icon">🗑️ 清空统计</div>
        </div>
        <div id="detailCostSpan" class="stat-detail"></div>

        <div class="style-group">
            <div data-style="surreal" class="style-chip active">🌀 荒诞梦境</div>
            <div data-style="poetic" class="style-chip">🌸 诗意幻想</div>
            <div data-style="dark" class="style-chip">🌑 暗黑童话</div>
            <div data-style="scifi" class="style-chip">🚀 科幻呓语</div>
            <div data-style="magic" class="style-chip">✨ 魔幻现实</div>
        </div>

        <div class="input-row">
            <input type="text" id="dreamWord" class="dream-input" placeholder="任何语言：말썽 꾸러기 · 失眠 · 月光与洗衣机 · 蒸汽波 · AI眼泪" value="失眠">
            <button id="generateDreamBtn" class="generate-btn"><span>🌙 织梦</span><span id="btnSpinner" style="display:none;"><div class="loader-spinner"></div></span></button>
        </div>

        <div id="storyContainer" class="story-stage">
            <div class="story-meta-bar"><span>✨ 等待灵光</span><span>💡 选择风格·输入词语</span></div>
            <div class="dream-text">「痴人说梦，荒唐愈醒」—— 轻触织梦，双AI梦境引擎为你编织低语梦境。</div>
        </div>

        <div style="margin-top: 12px;">
            <div style="font-size:0.75rem; margin-bottom: 6px;">⚡ 灵感碎片 · 一键入梦</div>
            <div id="quickIdeasPanel" class="inspire-grid"></div>
        </div>
        <div id="corsWarningMsg" class="cors-tip">⚠️ 注意：浏览器调用API可能遇到CORS，若报错请切换离线模式享受纯享梦境。</div>
        <div class="pricing-note">
            💰 Kimi K2.5: ¥12/1M输入 + ¥60/1M输出 | Perplexity Sonar Pro: $3/1M输入 + $15/1M输出 (汇率7.25)<br>
            🧠 Kimi 支持 262K 上下文 | 同词同风格永久缓存 | 梦境永不重复收费
        </div>
    </div>

    <div class="split-layout">
        <div class="dream-log">
            <div class="log-header"><span>📜 梦境余音</span><span id="clearHistoryAction" style="cursor:pointer;">🧹 清空</span></div>
            <div id="historyArea" class="story-chip-list"><div class="story-chip">空梦一场</div></div>
        </div>
        <div class="dream-log">
            <div class="log-header"><span>❤️ 收藏的梦境</span><span id="clearFavAction" style="cursor:pointer;">🗑️ 清空</span></div>
            <div id="favArea" class="story-chip-list"><div class="story-chip">暂无收藏，点击梦境右上角❤️</div></div>
        </div>
    </div>
    <footer>⚡ Kimi K2.5 · 视觉感知 · 函数调用 · 结构化输出 | Perplexity Sonar Pro · 联网搜索 | ⚠️ Kimi 需要保持标签页激活</footer>
</div>

<div class="toast-stack" id="toastStack"></div>
<div class="modal-aura" id="confirmModalAura">
    <div class="modal-card">
        <div style="font-size: 2rem;" id="modalIconSpan">⚠️</div>
        <h3 id="modalTitleText" style="margin: 8px 0; color:#ffcf9a;">确认</h3>
        <p id="modalDescText" style="margin-bottom: 20px;">操作不可逆</p>
        <div class="modal-buttons">
            <button id="modalCancelBtn" class="modal-btn" style="background:#2a2f4b;">取消</button>
            <button id="modalConfirmBtn" class="modal-btn" style="background:#c49a6c; color:#0a0a0a;">确认</button>
        </div>
    </div>
</div>

<script>
    // ==================== 痴人说梦 · 双AI织梦引擎 v3.2 (Laravel版) ====================
    
    let currentMode = 'kimi';
    let currentStyle = 'surreal';
    let storyCache = {};
    let historyList = [];
    let favoriteList = [];
    let apiCallCount = 0;
    let totalTokens = 0;
    let totalKimiCost = 0;
    let totalPerplexityCost = 0;
    let totalCostCNY = 0;
    let generating = false;

    function loadStorage() {
        try {
            const rawCache = localStorage.getItem("dream_laravel_cache_v4");
            const rawHist = localStorage.getItem("dream_laravel_hist_v4");
            const rawFav = localStorage.getItem("dream_laravel_fav_v4");
            const rawMode = localStorage.getItem("dream_laravel_mode_v4");
            const rawKimiCost = localStorage.getItem("dream_laravel_kimi_cost_v4");
            const rawPplxCost = localStorage.getItem("dream_laravel_pplx_cost_v4");
            const rawApiCalls = localStorage.getItem("dream_laravel_api_calls_v4");
            const rawTotalTokens = localStorage.getItem("dream_laravel_total_tokens_v4");
            
            if(rawCache) storyCache = JSON.parse(rawCache);
            if(rawHist) historyList = JSON.parse(rawHist);
            if(rawFav) favoriteList = JSON.parse(rawFav);
            if(rawMode === 'kimi' || rawMode === 'perplexity' || rawMode === 'offline') currentMode = rawMode;
            if(rawKimiCost) totalKimiCost = parseFloat(rawKimiCost);
            if(rawPplxCost) totalPerplexityCost = parseFloat(rawPplxCost);
            if(rawApiCalls) apiCallCount = parseInt(rawApiCalls);
            if(rawTotalTokens) totalTokens = parseInt(rawTotalTokens);
            
            totalCostCNY = totalKimiCost + totalPerplexityCost;
            
            document.querySelectorAll('.mode-pill').forEach(el => el.classList.remove('active'));
            const activePill = document.querySelector(`.mode-pill[data-mode="${currentMode}"]`);
            if(activePill) activePill.classList.add('active');
        } catch(e) { console.warn(e); }
    }
    
    function persistAll() {
        localStorage.setItem("dream_laravel_cache_v4", JSON.stringify(storyCache));
        localStorage.setItem("dream_laravel_hist_v4", JSON.stringify(historyList.slice(0, 35)));
        localStorage.setItem("dream_laravel_fav_v4", JSON.stringify(favoriteList));
        localStorage.setItem("dream_laravel_mode_v4", currentMode);
        localStorage.setItem("dream_laravel_kimi_cost_v4", totalKimiCost.toString());
        localStorage.setItem("dream_laravel_pplx_cost_v4", totalPerplexityCost.toString());
        localStorage.setItem("dream_laravel_api_calls_v4", apiCallCount.toString());
        localStorage.setItem("dream_laravel_total_tokens_v4", totalTokens.toString());
        updateStatsUI();
        renderHistory();
        renderFav();
    }
    
    function updateStatsUI() {
        document.getElementById('cacheCount').innerText = Object.keys(storyCache).length;
        document.getElementById('apiCountSpan').innerText = apiCallCount;
        document.getElementById('tokenTotalSpan').innerText = totalTokens.toLocaleString();
        document.getElementById('costSpan').innerHTML = `¥${totalCostCNY.toFixed(6)}`;
        document.getElementById('detailCostSpan').innerHTML = `📊 Kimi: ¥${totalKimiCost.toFixed(6)} | Perplexity: ¥${totalPerplexityCost.toFixed(6)} | 缓存: ${Object.keys(storyCache).length}`;
    }

    async function callLaravelAPI(word, style, mode) {
        const response = await fetch('/dream/weave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                word: word,
                style: style,
                mode: mode
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || '生成失败');
        }

        return result.data;
    }

    async function fetchOrGenerate(word, style) {
        const cacheKey = `${currentMode}_${word}_${style}`;
        if (storyCache[cacheKey]) {
            toastMessage(`📦 缓存梦境「${word}」 (0费用)`, 'success');
            return storyCache[cacheKey];
        }
        
        if (currentMode === 'offline') {
            // Laravel handles offline mode via the API
            const result = await callLaravelAPI(word, style, 'offline');
            const storyObj = { 
                content: result.content, 
                tokens: result.tokens, 
                mode: 'offline',
                model: 'offline'
            };
            storyCache[cacheKey] = storyObj;
            persistAll();
            toastMessage(`📜 离线诗意 · 「${word}」梦境生成`, 'info');
            return storyObj;
        }
        
        toastMessage(`${currentMode === 'kimi' ? '🌙 Kimi K2.5' : '🔮 Perplexity Sonar Pro'} 编织梦境「${word}」...`, 'info');
        
        try {
            const result = await callLaravelAPI(word, style, currentMode);
            
            apiCallCount++;
            if (result.tokens) {
                totalTokens += result.tokens.total;
                if (currentMode === 'kimi') {
                    totalKimiCost += result.tokens.costCNY;
                } else {
                    totalPerplexityCost += result.tokens.costCNY;
                }
                totalCostCNY = totalKimiCost + totalPerplexityCost;
            }
            
            const storyObj = { 
                content: result.content, 
                tokens: result.tokens || null, 
                mode: result.mode || currentMode,
                model: result.model || currentMode
            };
            storyCache[cacheKey] = storyObj;
            persistAll();
            
            if (currentMode === 'perplexity') {
                document.getElementById('pplxStatus').className = 'api-status status-online';
            }
            
            toastMessage(`✅ 梦境完成 · 输入 ${result.tokens?.input || 0} / 输出 ${result.tokens?.output || 0} tokens, 费用 ¥${(result.tokens?.costCNY || 0).toFixed(6)}`, 'success');
            return storyObj;
        } catch (err) {
            console.error(err);
            if (currentMode === 'perplexity') {
                document.getElementById('pplxStatus').className = 'api-status status-offline';
            }
            toastMessage(`⚠️ ${err.message.substring(0,60)}，使用离线梦境`, 'error');
            
            // Fallback: use offline mode via API
            const fallback = await callLaravelAPI(word, style, 'offline');
            const fallbackObj = { 
                content: fallback.content, 
                tokens: null, 
                fallback: true,
                mode: 'offline'
            };
            storyCache[cacheKey] = fallbackObj;
            persistAll();
            return fallbackObj;
        }
    }

    async function generateDream() {
        if (generating) { toastMessage("梦境正在编织中...", "warning"); return; }
        let word = document.getElementById("dreamWord").value.trim();
        if (!word) word = "星辰夜语";
        generating = true;
        const genBtn = document.getElementById("generateDreamBtn");
        const spinner = document.getElementById("btnSpinner");
        genBtn.disabled = true; 
        spinner.style.display = "inline-block";
        
        try {
            const storyRes = await fetchOrGenerate(word, currentStyle);
            const isCached = !!storyCache[`${currentMode}_${word}_${currentStyle}`];
            displayStoryOnUI(word, storyRes.content, currentStyle, isCached, storyRes.mode || currentMode);
            
            historyList.unshift({ 
                word, 
                content: storyRes.content, 
                style: currentStyle, 
                mode: storyRes.mode || currentMode, 
                timestamp: Date.now() 
            });
            if (historyList.length > 30) historyList.pop();
            persistAll();
        } catch (err) {
            toastMessage(`生成异常: ${err.message}`, "error");
        } finally {
            generating = false;
            genBtn.disabled = false;
            spinner.style.display = "none";
        }
    }

    function displayStoryOnUI(word, content, style, fromCacheHint, modeUsed) {
        const container = document.getElementById("storyContainer");
        const modeLabel = modeUsed === 'kimi' ? '🌙 Kimi K2.5' : (modeUsed === 'perplexity' ? '🔮 Perplexity Sonar Pro' : '📖 离线');
        container.innerHTML = `
            <div class="story-meta-bar">
                <span>📖 梦核: 「${escapeHtml(word)}」</span>
                <span>🎭 ${style} · ${modeLabel}</span>
                <span id="favoriteCurrentBtn" style="cursor:pointer; background:rgba(255,200,130,0.2); padding:4px 12px; border-radius:40px; font-size:0.7rem;">❤️ 收藏此梦</span>
            </div>
            <div class="dream-text">${escapeHtml(content).replace(/\n/g, '<br>')}</div>
            <div style="margin-top:16px; font-size:0.7rem; opacity:0.7;">${fromCacheHint ? '📦 缓存梦境 (零成本)' : `✨ ${modeLabel} 实时生梦`}</div>
        `;
        const favBtn = document.getElementById("favoriteCurrentBtn");
        if (favBtn) {
            favBtn.onclick = () => { 
                if (!favoriteList.some(f => f.word === word && f.content === content)) { 
                    favoriteList.unshift({ word, content, style, mode: modeUsed, timestamp: Date.now() }); 
                    persistAll(); 
                    toastMessage(`❤️ 收藏梦境「${word}」`, "success"); 
                } else {
                    toastMessage("已在收藏夹", "info"); 
                }
            };
        }
    }

    function renderHistory() {
        const histDiv = document.getElementById("historyArea");
        if (!historyList.length) { histDiv.innerHTML = '<div class="story-chip">🌸 暂无梦境记录</div>'; return; }
        histDiv.innerHTML = historyList.map((item, idx) => `
            <div class="story-chip" data-hist-idx="${idx}">
                ✨ ${escapeHtml(item.word)} 
                <span style="opacity:0.6;">${escapeHtml(item.content.substring(0,28))}…</span>
                <span class="remove-icon" data-remove-hist="${idx}">🗑️</span>
            </div>
        `).join('');
        
        document.querySelectorAll('[data-hist-idx]').forEach(el => { 
            el.addEventListener('click', (e) => { 
                if(e.target.classList.contains('remove-icon')) return; 
                const hist = historyList[el.dataset.histIdx]; 
                if(hist) displayStoryOnUI(hist.word, hist.content, hist.style, true, hist.mode || '离线'); 
            }); 
        });
        
        document.querySelectorAll('[data-remove-hist]').forEach(btn => { 
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                historyList.splice(btn.dataset.removeHist,1); 
                persistAll(); 
                renderHistory(); 
                toastMessage("移除梦境记录", "info"); 
            }); 
        });
    }
    
    function renderFav() {
        const favDiv = document.getElementById("favArea");
        if (!favoriteList.length) { favDiv.innerHTML = '<div class="story-chip">💖 收藏梦境显示于此</div>'; return; }
        favDiv.innerHTML = favoriteList.map((item, idx) => `
            <div class="story-chip" data-fav-idx="${idx}">
                ❤️ ${escapeHtml(item.word)} 
                <span style="opacity:0.7;">${escapeHtml(item.content.substring(0,28))}</span>
                <span class="remove-icon" data-remove-fav="${idx}">❌</span>
            </div>
        `).join('');
        
        document.querySelectorAll('[data-fav-idx]').forEach(el => { 
            el.addEventListener('click', (e) => { 
                if(e.target.classList.contains('remove-icon')) return; 
                const fav = favoriteList[el.dataset.favIdx]; 
                if(fav) displayStoryOnUI(fav.word, fav.content, fav.style, true, fav.mode || '收藏'); 
            }); 
        });
        
        document.querySelectorAll('[data-remove-fav]').forEach(btn => { 
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                favoriteList.splice(btn.dataset.removeFav,1); 
                persistAll(); 
                renderFav(); 
                toastMessage("移出收藏", "info"); 
            }); 
        });
    }

    let modalResolve = null;
    const modalAura = document.getElementById('confirmModalAura');
    function showConfirmDialog(title, desc) { 
        return new Promise((resolve) => { 
            document.getElementById('modalTitleText').innerText = title; 
            document.getElementById('modalDescText').innerText = desc; 
            modalResolve = resolve; 
            modalAura.classList.add('active'); 
        }); 
    }
    
    document.getElementById('modalConfirmBtn').onclick = () => { 
        modalAura.classList.remove('active'); 
        if(modalResolve) modalResolve(true); 
    };
    document.getElementById('modalCancelBtn').onclick = () => { 
        modalAura.classList.remove('active'); 
        if(modalResolve) modalResolve(false); 
    };

    async function clearCacheFull() { 
        if(await showConfirmDialog('清空所有梦境缓存', '将清除所有API缓存、token统计，确定吗？')) { 
            storyCache = {}; 
            totalTokens = 0; 
            totalKimiCost = 0; 
            totalPerplexityCost = 0; 
            totalCostCNY = 0; 
            apiCallCount = 0; 
            persistAll(); 
            toastMessage("缓存与统计已归零", "success"); 
        } 
    }

    function escapeHtml(str) { 
        return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); 
    }
    
    function toastMessage(msg, type='info') { 
        const stack = document.getElementById('toastStack'); 
        const toast = document.createElement('div'); 
        toast.className = 'toast-sweet'; 
        const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : (type === 'warning' ? '⚠️' : '🌙')); 
        toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(msg)}</span>`; 
        stack.appendChild(toast); 
        setTimeout(() => toast.classList.add('show'), 10); 
        setTimeout(() => { 
            toast.classList.remove('show'); 
            setTimeout(() => toast.remove(), 400); 
        }, 3000); 
    }

    async function testPerplexity() {
        try {
            const response = await fetch('/dream/test-perplexity', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            const result = await response.json();
            document.getElementById('pplxStatus').className = result.online ? 'api-status status-online' : 'api-status status-offline';
        } catch(e) {
            document.getElementById('pplxStatus').className = 'api-status status-offline';
        }
    }

    function init() {
        loadStorage();
        renderHistory(); 
        renderFav(); 
        updateStatsUI();
        testPerplexity();
        
        document.querySelectorAll('.mode-pill').forEach(btn => { 
            btn.addEventListener('click', () => { 
                document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active')); 
                btn.classList.add('active'); 
                currentMode = btn.dataset.mode; 
                persistAll(); 
                toastMessage(`模式切换至 ${currentMode === 'kimi' ? '🌙 Kimi K2.5 (需激活标签)' : currentMode === 'perplexity' ? '🔮 Perplexity Sonar Pro' : '📖 离线诗梦'}`, 'info'); 
            }); 
        });
        
        document.querySelectorAll('.style-chip').forEach(btn => { 
            btn.addEventListener('click', () => { 
                document.querySelectorAll('.style-chip').forEach(b => b.classList.remove('active')); 
                btn.classList.add('active'); 
                currentStyle = btn.dataset.style; 
                toastMessage(`🎭 梦境风格: ${btn.innerText}`, 'info'); 
            }); 
        });
        
        document.getElementById('generateDreamBtn').addEventListener('click', generateDream);
        document.getElementById('clearCacheBtn').addEventListener('click', clearCacheFull);
        
        document.getElementById('clearHistoryAction').addEventListener('click', async () => { 
            if(await showConfirmDialog('清空历史', '梦境记录将被清空')) { 
                historyList = []; 
                persistAll(); 
                toastMessage('历史已清', 'info'); 
            } 
        });
        
        document.getElementById('clearFavAction').addEventListener('click', async () => { 
            if(await showConfirmDialog('清空收藏', '收藏梦境将会移除')) { 
                favoriteList = []; 
                persistAll(); 
                toastMessage('收藏已清', 'info'); 
            } 
        });
        
        const quickList = ["말썽 꾸러기", "失眠", "月亮与洗衣机", "蒸汽波", "ありがとう", "AI的黄昏", "银河站台", "枯叶与梦", "琥珀色的记忆", "会说话的猫"];
        const quickPanel = document.getElementById('quickIdeasPanel');
        quickPanel.innerHTML = quickList.map(w => `<div class="idea-tile" data-quick="${w}">✨ ${w}</div>`).join('');
        document.querySelectorAll('[data-quick]').forEach(el => { 
            el.addEventListener('click', () => { 
                document.getElementById('dreamWord').value = el.dataset.quick; 
                generateDream(); 
            }); 
        });
        
        // Auto-generate on load
        generateDream();
    }
    
    // Page visibility detection
    document.addEventListener('visibilitychange', function() {
        const isVisible = !document.hidden;
        if (currentMode === 'kimi' && !isVisible) {
            toastMessage('⚠️ Kimi API 需要标签页保持激活！请返回此标签页', 'warning');
            document.getElementById('activationWarning').style.background = 'rgba(255, 100, 100, 0.2)';
            document.getElementById('activationWarning').style.borderLeftColor = '#ff6b6b';
        } else {
            document.getElementById('activationWarning').style.background = 'rgba(255, 200, 100, 0.12)';
            document.getElementById('activationWarning').style.borderLeftColor = '#ffcf9a';
        }
    });
    
    init();
</script>
</body>
</html>