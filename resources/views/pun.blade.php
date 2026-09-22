<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>🐋 跨文化谐音引擎 · Laravel版 · DeepSeek 支持</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK', sans-serif;
            background: linear-gradient(135deg, #0f0c29, #1a1a3e, #24243e);
            min-height: 100vh;
            padding: 2rem 1rem;
            color: #f0f0f0;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .card {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(12px);
            border-radius: 2rem;
            padding: 2rem;
            margin-bottom: 1.8rem;
            border: 1px solid rgba(255,215,150,0.2);
        }
        h1 {
            font-size: 1.8rem;
            background: linear-gradient(135deg, #ffd89b, #c7e9fb);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }
        .badge {
            background: #00c853;
            font-size: 0.7rem;
            padding: 4px 12px;
            border-radius: 40px;
            margin-left: 12px;
            color: white;
        }
        .info-bar {
            background: rgba(0,0,0,0.4);
            border-radius: 1.5rem;
            padding: 0.8rem 1.2rem;
            margin: 1rem 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 0.8rem;
        }
        .info-text {
            color: #ffd89b;
        }
        .input-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin: 20px 0;
        }
        input[type="text"] {
            flex: 3;
            padding: 16px 20px;
            font-size: 1rem;
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(255,215,150,0.3);
            border-radius: 48px;
            outline: none;
            color: white;
            min-width: 200px;
        }
        button {
            background: #ff6b6b;
            border: none;
            padding: 0 32px;
            border-radius: 48px;
            font-weight: 700;
            color: white;
            cursor: pointer;
            transition: 0.1s;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .loader {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #ffd89b;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-top: 12px;
            font-size: 0.8rem;
            color: #aaa;
            flex-wrap: wrap;
        }
        .grid-8 {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .pun-card {
            background: rgba(0,0,0,0.4);
            border-radius: 1.3rem;
            padding: 1rem;
            cursor: pointer;
            border: 1px solid rgba(255,215,150,0.2);
            transition: all 0.15s;
        }
        .pun-card:hover {
            background: rgba(255,215,150,0.1);
            transform: translateY(-3px);
        }
        .pun-text {
            font-size: 1.2rem;
            font-weight: 700;
            color: #ffd89b;
            word-break: break-word;
        }
        .pun-meaning {
            font-size: 0.7rem;
            color: #aaa;
            margin-top: 8px;
        }
        .pun-lang {
            font-size: 0.6rem;
            background: rgba(255,107,107,0.3);
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            margin-top: 6px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #ffd89b;
        }
        .split-panel {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
        }
        .history-box, .fav-box {
            flex: 1;
            background: rgba(0,0,0,0.3);
            border-radius: 1.5rem;
            padding: 1.2rem;
            min-width: 250px;
        }
        .section-title {
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.8rem;
            border-bottom: 1px solid rgba(255,215,150,0.3);
            padding-bottom: 5px;
        }
        .pun-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            max-height: 200px;
            overflow-y: auto;
        }
        .pun-chip {
            background: rgba(255,255,255,0.1);
            border-radius: 30px;
            padding: 5px 14px;
            font-size: 0.8rem;
            cursor: pointer;
            display: inline-flex;
            gap: 8px;
            align-items: center;
        }
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffd89b;
            color: #1a1a2e;
            padding: 10px 24px;
            border-radius: 50px;
            font-size: 0.85rem;
            opacity: 0;
            transition: 0.2s;
            font-weight: bold;
            z-index: 999;
            pointer-events: none;
        }
        footer {
            text-align: center;
            font-size: 0.7rem;
            color: #666;
            margin-top: 2rem;
        }
        .badge-clear {
            font-size: 0.7rem;
            background: rgba(255,255,255,0.1);
            padding: 2px 12px;
            border-radius: 30px;
            cursor: pointer;
        }
        .clear-cache-btn {
            background: rgba(255,107,107,0.3);
            padding: 4px 12px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 0.7rem;
        }
        .empty-message {
            color: #666;
            font-size: 0.8rem;
            padding: 10px 0;
        }
        .remove-history, .remove-fav {
            cursor: pointer;
            opacity: 0.6;
        }
        .remove-history:hover, .remove-fav:hover {
            opacity: 1;
        }
        @media (max-width: 600px) {
            .card { padding: 1rem; }
            h1 { font-size: 1.2rem; }
            .input-group input { font-size: 0.9rem; padding: 12px 16px; }
            button { padding: 0 20px; font-size: 0.9rem; }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="card">
        <h1>🐋 跨文化谐音引擎 <span class="badge">Laravel版 · DeepSeek 支持</span></h1>
        <div class="sub" style="color:#aaa; margin-bottom:0.5rem;">
            ✨ 理解韩语·日语·英语·中文·俄语·阿拉伯语 · 创造有灵魂的谐音梗
        </div>
        
        <div class="info-bar">
            <span class="info-text">🎉 完全免费 · API密钥安全存储在服务端</span>
            <span class="info-text">📦 已缓存 <span id="cacheCount">0</span> 个词 · 命中缓存不消耗API</span>
        </div>
        
        <div class="input-group">
            <input type="text" id="wordInput" placeholder="任何语言：말썽 꾸러기 · ありがとう · love · bonjour · 我爱你 · звезда" autocomplete="off">
            <button id="generateBtn">
                <span>🌐 生成 8 个谐音</span>
                <span id="btnLoader" style="display:none;"><div class="loader"></div></span>
            </button>
        </div>
        
        <div class="stats">
            <span>📖 使用纪录: <strong id="historyCount">0</strong></span>
            <span>❤️ 收藏: <strong id="favCount">0</strong></span>
            <span id="clearCacheBtn" class="clear-cache-btn">🗑️ 清空缓存</span>
        </div>
        
        <div id="eightGrid" class="grid-8">
            <div class="pun-card"><div class="pun-text">✨</div><div class="pun-meaning">输入词语，点击生成</div></div>
        </div>
    </div>
    
    <div class="split-panel">
        <div class="history-box">
            <div class="section-title">📜 使用纪录 <span class="badge-clear" id="clearHistoryBtn">清空</span></div>
            <div id="historyList" class="pun-list"><div class="empty-message">📭 暂无纪录</div></div>
        </div>
        <div class="fav-box">
            <div class="section-title">❤️ 我的最愛 <span class="badge-clear" id="clearFavBtn">清空最愛</span></div>
            <div id="favList" class="pun-list"><div class="empty-message">⭐ 点击卡片收藏谐音</div></div>
        </div>
    </div>
    <footer>⚡ API密钥安全存储在服务端 · 同一词只调用一次 API · 之后永久免费 · 数据存于你的浏览器</footer>
    <div id="toastMsg" class="toast"></div>
</div>

<script>
    // ==================== Laravel 后端版 · 通过 API 调用 ====================
    
    let historyList = [];
    let favoriteList = [];
    let isGenerating = false;
    
    // Load from localStorage
    try {
        const h = localStorage.getItem("pun_laravel_history");
        const f = localStorage.getItem("pun_laravel_fav");
        if (h) historyList = JSON.parse(h);
        if (f) favoriteList = JSON.parse(f);
    } catch(e) {}
    
    function saveAll() {
        localStorage.setItem("pun_laravel_history", JSON.stringify(historyList.slice(0, 50)));
        localStorage.setItem("pun_laravel_fav", JSON.stringify(favoriteList));
        updateDisplay();
        renderHistory();
        renderFav();
    }
    
    function updateDisplay() {
        // Cache count is updated from server response
        document.getElementById('historyCount').innerText = historyList.length;
        document.getElementById('favCount').innerText = favoriteList.length;
    }
    
    // 调用 Laravel API
    async function generatePuns(word) {
        const response = await fetch('/pun/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ word: word })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`服务器错误: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '生成失败');
        }
        
        return data;
    }
    
    async function getPuns(word) {
        toastMsg(`🐋 生成「${word}」...`);
        try {
            const result = await generatePuns(word);
            if (result.cached) {
                toastMsg(`📦 缓存命中 · 「${word}」 0 成本`);
            } else {
                toastMsg(`✅ 生成成功 · 已缓存，下次免费`);
            }
            // Update cache count from server if available
            return result.puns;
        } catch (error) {
            console.error(error);
            toastMsg(`❌ 生成失败: ${error.message}`);
            // Return fallback
            return generateFallbackPuns(word);
        }
    }
    
    // 离线降级
    function generateFallbackPuns(word) {
        const templates = [
            { pun: `✨ ${word} · 灵境`, meaning: `从「${word}」幻化的创意谐音`, style: '灵感' },
            { pun: `🌍 寰宇·${word}`, meaning: `跨文化融合基础版`, style: '通用' },
            { pun: `🎭 谐·${word.substring(0, 3)}趣`, meaning: `谐音基础创作`, style: '智慧' },
            { pun: `💫 ${word}·变奏`, meaning: `创意变体`, style: '离线' },
            { pun: `🌟 星·${word}`, meaning: `星辰大海的谐音`, style: '诗意' },
            { pun: `🔥 燃·${word}`, meaning: `热情迸发的创意`, style: '活力' },
            { pun: `🍃 风·${word}`, meaning: `随风而来的灵感`, style: '自然' },
            { pun: `💧 梦·${word}`, meaning: `如水如梦的谐音`, style: '浪漫' }
        ];
        return templates;
    }
    
    // ========== UI 函数 ==========
    function addHistory(original, pun, meaning, style) {
        historyList.unshift({ original, pun, meaning, style, ts: Date.now() });
        if (historyList.length > 40) historyList.pop();
        saveAll();
    }
    
    function addFav(original, pun, meaning, style) {
        if (favoriteList.some(f => f.pun === pun && f.original === original)) {
            toastMsg(`❤️ 「${pun}」已存在`);
            return false;
        }
        favoriteList.unshift({ original, pun, meaning, style });
        saveAll();
        toastMsg(`✅ 收藏：${pun}`);
        return true;
    }
    
    function renderGrid(punsArray, originalWord) {
        let grid = document.getElementById("eightGrid");
        if (!grid) return;
        grid.innerHTML = punsArray.map(p => `
            <div class="pun-card" data-pun="${escapeHtml(p.pun)}" data-original="${escapeHtml(originalWord)}" data-meaning="${escapeHtml(p.meaning)}" data-style="${escapeHtml(p.style)}">
                <div class="pun-text">${escapeHtml(p.pun)}</div>
                <div class="pun-meaning">📖 ${escapeHtml(p.meaning || 'AI创意')}</div>
                <div class="pun-lang">🎭 ${escapeHtml(p.style || '跨文化')}</div>
            </div>
        `).join('');
        
        document.querySelectorAll("#eightGrid .pun-card").forEach(card => {
            card.addEventListener("click", () => {
                let pun = card.getAttribute("data-pun");
                let orig = card.getAttribute("data-original");
                let mean = card.getAttribute("data-meaning");
                let style = card.getAttribute("data-style");
                addFav(orig, pun, mean, style);
                addHistory(orig, pun, mean, style);
            });
        });
    }
    
    function renderHistory() {
        let c = document.getElementById("historyList");
        if (!c) return;
        if (historyList.length === 0) {
            c.innerHTML = '<div class="empty-message">📭 暂无纪录</div>';
            return;
        }
        c.innerHTML = historyList.map((item, idx) => `
            <div class="pun-chip" data-idx="${idx}">
                <span>${escapeHtml(item.pun)}</span>
                <span style="opacity:0.6">(${escapeHtml(item.original)})</span>
                <span class="remove-history" data-idx="${idx}" style="margin-left:6px; cursor:pointer;">🗑️</span>
            </div>
        `).join('');
        
        document.querySelectorAll(".remove-history").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                let idx = parseInt(btn.dataset.idx);
                if (!isNaN(idx)) {
                    historyList.splice(idx, 1);
                    saveAll();
                    renderHistory();
                    toastMsg("已删除");
                }
            });
        });
    }
    
    function renderFav() {
        let c = document.getElementById("favList");
        if (!c) return;
        if (favoriteList.length === 0) {
            c.innerHTML = '<div class="empty-message">⭐ 点击卡片收藏</div>';
            return;
        }
        c.innerHTML = favoriteList.map((item, idx) => `
            <div class="pun-chip" data-idx="${idx}">
                <span>${escapeHtml(item.pun)}</span>
                <span style="opacity:0.6">(${escapeHtml(item.original)})</span>
                <span class="remove-fav" data-idx="${idx}" style="margin-left:6px; cursor:pointer;">❌</span>
            </div>
        `).join('');
        
        document.querySelectorAll(".remove-fav").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                let idx = parseInt(btn.dataset.idx);
                if (!isNaN(idx)) {
                    favoriteList.splice(idx, 1);
                    saveAll();
                    renderFav();
                    toastMsg("已移除");
                }
            });
        });
    }
    
    function showLoading(show) {
        isGenerating = show;
        const btn = document.getElementById('generateBtn');
        const btnText = btn.querySelector('span:first-child');
        const btnLoader = document.getElementById('btnLoader');
        const grid = document.getElementById('eightGrid');
        
        if (show) {
            btn.disabled = true;
            btnText.style.opacity = '0.6';
            btnLoader.style.display = 'inline-block';
            grid.innerHTML = '<div class="loading">🐋 AI 正在理解语义并创造谐音...<br>⏳ 首次约 2-4 秒</div>';
        } else {
            btn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    }
    
    async function generateAndDisplay() {
        if (isGenerating) {
            toastMsg("⏳ 正在生成中，请稍后...");
            return;
        }
        
        let raw = document.getElementById("wordInput").value.trim();
        if (raw === "") raw = "말썽 꾸러기";
        
        showLoading(true);
        try {
            const puns = await getPuns(raw);
            renderGrid(puns, raw);
        } catch (error) {
            console.error(error);
            toastMsg(`生成失败: ${error.message}`);
            const fallback = generateFallbackPuns(raw);
            renderGrid(fallback, raw);
        } finally {
            showLoading(false);
        }
    }
    
    function escapeHtml(str) {
        return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    function toastMsg(msg) {
        let t = document.getElementById("toastMsg");
        t.innerText = msg;
        t.style.opacity = "1";
        t.style.pointerEvents = "none";
        setTimeout(() => t.style.opacity = "0", 2500);
    }
    
    // 清空缓存（仅前端显示）
    document.getElementById("clearCacheBtn")?.addEventListener("click", () => {
        if (confirm("清空所有缓存？之后重新生成会调用 API（消耗额度）")) {
            // Clear server cache via API
            fetch('/pun/clear-cache', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            }).then(() => {
                document.getElementById('cacheCount').innerText = '0';
                toastMsg("缓存已清空");
            }).catch(() => {
                toastMsg("清空缓存失败");
            });
        }
    });
    
    // 事件绑定
    document.getElementById("generateBtn").addEventListener("click", generateAndDisplay);
    document.getElementById("wordInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') generateAndDisplay();
    });
    document.getElementById("clearHistoryBtn")?.addEventListener("click", () => {
        if (confirm("清空所有纪录？")) {
            historyList = [];
            saveAll();
            renderHistory();
            toastMsg("纪录已清空");
        }
    });
    document.getElementById("clearFavBtn")?.addEventListener("click", () => {
        if (confirm("清空最爱？")) {
            favoriteList = [];
            saveAll();
            renderFav();
            toastMsg("最爱已清空");
        }
    });
    
    // 初始化
    renderHistory();
    renderFav();
    updateDisplay();
    
    // Get cache count from server
    fetch('/pun/cache-count', {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.count !== undefined) {
            document.getElementById('cacheCount').innerText = data.count;
        }
    })
    .catch(() => {
        document.getElementById('cacheCount').innerText = '0';
    });
</script>
</body>
</html>