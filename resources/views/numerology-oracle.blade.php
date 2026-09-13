<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>AI Numerology · Oracle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: radial-gradient(circle at 10% 20%, #0a0718, #02010c);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 1.5rem;
    }
    .container {
      max-width: 880px;
      width: 100%;
      background: rgba(12, 9, 28, 0.85);
      backdrop-filter: blur(16px);
      border-radius: 2.5rem;
      border: 1px solid rgba(180, 140, 255, 0.45);
      padding: 2rem;
      box-shadow: 0 25px 45px -15px black;
    }
    h1 {
      font-size: 1.9rem;
      background: linear-gradient(120deg, #f2eaff, #cdadff, #b47eff);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      text-align: center;
    }
    .sub {
      text-align: center;
      color: #bbaee6;
      margin: 0.5rem 0 1.5rem;
      font-size: 0.8rem;
    }

    /* ── NUMBER CARDS ── */
    .cards-label {
      text-align: center;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #a092d8;
      margin-bottom: 0.8rem;
    }
    .number-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-bottom: 1.4rem;
    }
    .num-card {
      width: 80px;
      height: 90px;
      border-radius: 1.2rem;
      border: 1.5px solid #5a48a0;
      background: linear-gradient(145deg, #1a1538, #0e0c24);
      color: #cdbcff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
      user-select: none;
    }
    .num-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(180,126,255,0.15), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .num-card:hover::before { opacity: 1; }
    .num-card:hover { border-color: #a47eff; transform: translateY(-4px) scale(1.04); box-shadow: 0 8px 20px rgba(160,100,255,0.35); }
    .num-card.selected {
      background: linear-gradient(145deg, #4a35a0, #7555ea);
      border-color: #c49eff;
      box-shadow: 0 0 18px rgba(180,126,255,0.6);
      color: white;
    }
    .num-card.selected::before { opacity: 1; }
    .num-card .card-number {
      font-size: 1.8rem;
      font-weight: 700;
      font-family: monospace;
      line-height: 1;
    }
    .num-card .card-hint {
      font-size: 0.6rem;
      opacity: 0.65;
      margin-top: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .num-card .card-symbol {
      font-size: 1rem;
      margin-bottom: 2px;
    }

    /* ── OR DIVIDER ── */
    .or-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.2rem;
      color: #6a5898;
      font-size: 0.75rem;
    }
    .or-divider::before, .or-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(100,80,160,0.4);
    }

    /* ── CUSTOM INPUT ROW ── */
    .input-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 1.4rem;
    }
    .number-input {
      flex: 2;
      padding: 0.9rem;
      border-radius: 60px;
      border: 1px solid #6a4fbf;
      background: #0e0c24;
      color: white;
      font-size: 1.1rem;
      text-align: center;
      font-family: monospace;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 200px;
    }
    .number-input:focus { border-color: #ba8eff; box-shadow: 0 0 10px rgba(160,100,255,0.3); }
    .number-input.custom-active { border-color: #c49eff; box-shadow: 0 0 12px rgba(180,126,255,0.4); }

    .agent-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 1.5rem;
      justify-content: center;
    }
    .agent-btn {
      background: #1a1538;
      border: 1px solid #5a48a0;
      padding: 0.5rem 1rem;
      border-radius: 40px;
      color: #cdbcff;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.85rem;
      transition: 0.2s;
    }
    .agent-btn.active {
      background: linear-gradient(95deg, #755aea, #a47eff);
      color: white;
      border-color: #c49eff;
      box-shadow: 0 0 8px #a47eff;
    }
    .agent-btn:hover { transform: scale(0.96); background: #3a2e6e; }
    .ask-btn {
      background: linear-gradient(95deg, #755aea, #a47eff);
      border: none;
      padding: 0 1.8rem;
      border-radius: 60px;
      font-weight: bold;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.1s;
      white-space: nowrap;
    }
    .ask-btn:hover { transform: scale(0.97); }
    .ask-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .card {
      background: rgba(0, 0, 0, 0.45);
      border-radius: 1.5rem;
      margin-top: 1.5rem;
      padding: 1.2rem;
      border-left: 6px solid #b87eff;
    }
    .watch { background: rgba(255, 110, 110, 0.12); padding: 0.9rem; border-radius: 1.2rem; margin-bottom: 1rem; }
    .expect { background: rgba(100, 200, 255, 0.1); padding: 0.9rem; border-radius: 1.2rem; margin-bottom: 1rem; }
    .extra { background: rgba(210, 180, 255, 0.08); padding: 0.8rem; border-radius: 1rem; font-style: italic; font-size: 0.85rem; color: #ddd0ff; }
    .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; color: #ddccff; margin-bottom: 6px; }
    .message { color: #f5edff; line-height: 1.55; font-size: 0.95rem; }
    .cost-panel {
      background: rgba(0, 0, 0, 0.65);
      border-radius: 1rem;
      padding: 1rem;
      margin-top: 1rem;
      border: 1px solid rgba(120, 80, 200, 0.4);
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .cost-header { font-size: 0.75rem; letter-spacing: 1px; color: #cbbaff; margin-bottom: 0.75rem; border-left: 3px solid #b87eff; padding-left: 8px; }
    .cost-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.6rem; }
    .cost-item { background: rgba(30, 20, 55, 0.6); padding: 0.5rem 0.7rem; border-radius: 0.8rem; display: flex; justify-content: space-between; align-items: baseline; font-size: 0.8rem; }
    .cost-label { color: #b7a5f0; font-weight: 500; }
    .cost-value { color: #e2d9ff; font-weight: 600; font-family: monospace; }
    .highlight-cost { background: linear-gradient(95deg, #3a2d6e, #2a1f55); border-left: 3px solid #ffdf8c; }
    .demo-cost-note { background: rgba(255,220,100,0.1); border-radius: 12px; padding: 6px 12px; font-size: 0.7rem; text-align: center; margin-top: 8px; color: #ffe1a0; }
    .footer { text-align: center; font-size: 0.7rem; margin-top: 1rem; color: #836fc2; }
    hr { margin: 1rem 0; border-color: #2a2350; }
    .error-popup {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(20, 10, 40, 0.98); border: 1px solid #ff6b6b; border-radius: 1.5rem;
      padding: 2rem; max-width: 420px; width: 90%; z-index: 1000; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8); display: none;
    }
    .error-popup.show { display: block; animation: popupIn 0.3s ease; }
    @keyframes popupIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.8); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
    .error-popup h3 { color: #ff6b6b; margin-bottom: 1rem; font-size: 1.2rem; }
    .error-popup p { color: #ccc; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .error-popup button { background: linear-gradient(95deg, #ff6b6b, #ff8e8e); border: none; padding: 0.6rem 2rem; border-radius: 30px; color: white; font-weight: bold; cursor: pointer; }
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.65); z-index: 999; display: none; }
    .overlay.show { display: block; }
    .loading { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(180,140,255,0.3); border-top-color: #b47eff; border-radius: 50%; animation: spin 0.8s linear infinite; margin-left: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .history-toggle { background: rgba(100,70,150,0.3); border: 1px solid #6a4fbf; padding: 0.4rem 1rem; border-radius: 40px; color: #cdbcff; cursor: pointer; font-size: 0.75rem; margin-top: 1rem; width: 100%; text-align: center; }
    .history-panel { display: none; margin-top: 1rem; background: rgba(0,0,0,0.6); border-radius: 1rem; padding: 1rem; max-height: 400px; overflow-y: auto; }
    .history-panel.show { display: block; }
    .history-item { background: rgba(30,20,60,0.6); border-radius: 0.8rem; padding: 0.8rem; margin-bottom: 0.8rem; border-left: 3px solid #b87eff; }
    .stats-badge { display: inline-block; background: rgba(100,70,150,0.4); border-radius: 20px; padding: 0.2rem 0.6rem; font-size: 0.7rem; }
    @media (max-width: 600px) {
      .container { padding: 1rem; }
      h1 { font-size: 1.3rem; }
      .num-card { width: 60px; height: 70px; }
      .num-card .card-number { font-size: 1.3rem; }
    }
  </style>
</head>
<body>
<div class="overlay" id="overlay"></div>
<div class="error-popup" id="errorPopup">
  <h3>⚠️ API Error</h3>
  <p id="errorPopupMsg">Something went wrong</p>
  <button onclick="closeErrorPopup()">OK</button>
</div>

<div class="container">
  <h1>🔮 ORACLE NUMEROLOGY</h1>
  <div class="sub">OpenAI · Kimi · Perplexity · Gemini · DeepSeek — Live Token & Cost Insights</div>

  <!-- NUMBER CARDS -->
  <div class="cards-label" style="display:flex;align-items:center;justify-content:center;gap:10px;">✨ Choose your number <button onclick="genRandomCards()" style="background:rgba(100,70,150,0.35);border:1px solid #6a4fbf;color:#cdbcff;padding:2px 10px;border-radius:20px;cursor:pointer;font-size:0.65rem;letter-spacing:1px;">🔄 Shuffle</button></div>
  <div class="number-cards" id="numberCards">
    <div class="num-card" data-num=""><div class="card-symbol"></div><div class="card-number"></div><div class="card-hint"></div></div>
    <div class="num-card" data-num=""><div class="card-symbol"></div><div class="card-number"></div><div class="card-hint"></div></div>
    <div class="num-card" data-num=""><div class="card-symbol"></div><div class="card-number"></div><div class="card-hint"></div></div>
    <div class="num-card" data-num=""><div class="card-symbol"></div><div class="card-number"></div><div class="card-hint"></div></div>
    <div class="num-card" data-num=""><div class="card-symbol"></div><div class="card-number"></div><div class="card-hint"></div></div>
  </div>

  <!-- OR DIVIDER -->
  <div class="or-divider">— or enter your own —</div>

  <!-- CUSTOM INPUT + BUTTON -->
  <div class="input-group">
    <input type="number" id="userNumber" class="number-input" placeholder="Your spontaneous number (144, 333…)">
    <button id="askBtn" class="ask-btn">✨ ASK ORACLE ✨</button>
  </div>

  <!-- AGENT SELECTOR -->
  <div class="agent-grid" id="agentSelector">
    <div class="agent-btn" data-agent="kimi">🔥 Kimi</div>
    <div class="agent-btn active" data-agent="perplexity">🌊 Perplexity</div>
    <div class="agent-btn" data-agent="gemini">⭐ Gemini</div>
    <div class="agent-btn" data-agent="deepseek">🌀 DeepSeek</div>
    <div class="agent-btn" data-agent="openai">💠 OpenAI</div>
  </div>

  <div id="resultArea">
    <div class="card">
      <div class="watch"><div class="label">⚠️ WATCH OUT FOR</div><div class="message" id="watchMsg">Select a number or enter your own, then ask the Oracle.</div></div>
      <div class="expect"><div class="label">✨ EXPECT TODAY</div><div class="message" id="expectMsg">Each AI brings unique mystical insight.</div></div>
      <div class="extra" id="extraMsg">💫 Extra nuance appears here</div>
      <div class="cost-panel" id="costPanel">
        <div class="cost-header">💰 TOKEN COST BREAKDOWN (real-time from API)</div>
        <div class="cost-grid">
          <div class="cost-item"><span class="cost-label">📥 Input tokens</span><span class="cost-value" id="inputTokens">—</span></div>
          <div class="cost-item"><span class="cost-label">📤 Output tokens</span><span class="cost-value" id="outputTokens">—</span></div>
          <div class="cost-item"><span class="cost-label">⚡ Input cost</span><span class="cost-value" id="inputCost">—</span></div>
          <div class="cost-item"><span class="cost-label">✨ Output cost</span><span class="cost-value" id="outputCost">—</span></div>
        </div>
        <div class="cost-item highlight-cost" style="margin-top:6px;">
          <span class="cost-label">💎 TOTAL COST (USD)</span>
          <span class="cost-value" id="totalCost">$0.00000</span>
        </div>
        <div class="demo-cost-note">🤖 AI: <strong id="agentNameDisplay">—</strong> · pricing per 1M tokens</div>
      </div>
    </div>
  </div>

  <button class="history-toggle" id="historyToggleBtn">📜 View Search History</button>
  <div class="history-panel" id="historyPanel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px;">
      <span class="stats-badge" id="statsBadge">Loading stats...</span>
      <button id="clearHistoryBtn" style="background:rgba(255,100,100,0.2);border:1px solid #ff6b6b;color:#ffaa88;padding:0.3rem 0.8rem;border-radius:20px;cursor:pointer;">🗑️ Clear All History</button>
    </div>
    <div id="historyList">Loading history...</div>
  </div>

  <hr />
  <div class="footer">🔐 <strong>All API keys secured on server</strong> — Perplexity: sonar-pro, OpenAI: gpt-4o-mini, DeepSeek: deepseek-chat, Kimi: kimi-k3, Gemini: gemini-3-flash-preview.</div>
</div>

<script>
  // ==================== Laravel Backend Integration ====================
  
  const API_BASE = '/api/numerologyhistory';
  let currentAgent = 'perplexity';
  let selectedCard = null;
  
  // DOM elements
  const numberInput = document.getElementById('userNumber');
  const askBtn = document.getElementById('askBtn');
  const watchMsg = document.getElementById('watchMsg');
  const expectMsg = document.getElementById('expectMsg');
  const extraMsg = document.getElementById('extraMsg');
  const costPanel = document.getElementById('costPanel');
  const agentNameDisplay = document.getElementById('agentNameDisplay');
  const inputTokensSpan = document.getElementById('inputTokens');
  const outputTokensSpan = document.getElementById('outputTokens');
  const inputCostSpan = document.getElementById('inputCost');
  const outputCostSpan = document.getElementById('outputCost');
  const totalCostSpan = document.getElementById('totalCost');
  const errorPopup = document.getElementById('errorPopup');
  const errorPopupMsg = document.getElementById('errorPopupMsg');
  const overlay = document.getElementById('overlay');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const statsBadge = document.getElementById('statsBadge');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // ── Card generation ──
  const cardMeta = [
    { symbol: '🌱' }, { symbol: '🔮' }, { symbol: '⚡' }, { symbol: '🏛️' }, { symbol: '🌌' }
  ];
  const hints = ['Fortune','Cosmic','Mystic','Power','Spirit','Karma','Fate','Aura','Zenith','Shadow','Lumina','Echo'];

  function randDigits(d) {
    const min = d === 1 ? 1 : Math.pow(10, d - 1);
    const max = Math.pow(10, d) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  window.genRandomCards = function() {
    const used = new Set();
    document.querySelectorAll('.num-card').forEach((card, i) => {
      const digits = i + 1;
      let n;
      do { n = randDigits(digits); } while (used.has(n));
      used.add(n);
      card.dataset.num = n;
      card.querySelector('.card-number').innerText = n;
      card.querySelector('.card-symbol').innerText = cardMeta[i].symbol;
      card.querySelector('.card-hint').innerText = hints[Math.floor(Math.random() * hints.length)];
      card.classList.remove('selected');
    });
    numberInput.value = '';
    numberInput.classList.remove('custom-active');
    selectedCard = null;
  };
  genRandomCards();

  // ── Card selection ──
  document.querySelectorAll('.num-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.num-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCard = parseInt(card.dataset.num);
      numberInput.value = selectedCard;
      numberInput.classList.remove('custom-active');
    });
  });

  // ── When user types in the input, deselect cards ──
  numberInput.addEventListener('input', () => {
    document.querySelectorAll('.num-card').forEach(c => c.classList.remove('selected'));
    selectedCard = null;
    if (numberInput.value.trim()) numberInput.classList.add('custom-active');
    else numberInput.classList.remove('custom-active');
  });

  // ── Agent selection ──
  document.querySelectorAll('.agent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.agent-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAgent = btn.dataset.agent;
      agentNameDisplay.innerText = currentAgent.toUpperCase();
    });
  });

  function showErrorPopup(msg) {
    errorPopupMsg.innerText = msg;
    errorPopup.classList.add('show');
    overlay.classList.add('show');
  }

  window.closeErrorPopup = function() {
    errorPopup.classList.remove('show');
    overlay.classList.remove('show');
  };

  function formatUSD(cost) {
    const num = Number(cost);
    if (isNaN(num) || num <= 0) return '$0.00000';
    if (num < 0.000001) return `$${num.toExponential(4)}`;
    return `$${num.toFixed(5)}`;
  }

  function updateCostUI(agent, inp, out, inputCost, outputCost, totalCost) {
    inputTokensSpan.innerText = inp.toLocaleString();
    outputTokensSpan.innerText = out.toLocaleString();
    inputCostSpan.innerText = formatUSD(inputCost);
    outputCostSpan.innerText = formatUSD(outputCost);
    totalCostSpan.innerText = formatUSD(totalCost);
    agentNameDisplay.innerText = agent.toUpperCase();
  }

  // ========== API CALLS TO LARAVEL BACKEND ==========
  
  async function getNumerology(number, agent) {
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      credentials: 'include',
      body: JSON.stringify({ number, agent })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Prediction failed');
    }

    return result.data;
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${API_BASE}/history`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to load history');
      
      const data = await response.json();
      
      if (data.success && data.data) {
        displayHistory(data.data);
      } else {
        historyList.innerHTML = '<p style="color: #bbaee6; text-align: center;">No search history yet.</p>';
      }
    } catch (error) {
      console.error('Error loading history:', error);
      historyList.innerHTML = '<p style="color: #ffaa88; text-align: center;">Could not load history.</p>';
    }
  }

  async function loadStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      
      if (data.success && data.data) {
        statsBadge.innerHTML = `📊 ${data.data.total_searches} searches | 💰 ${formatUSD(data.data.total_cost)}`;
      } else {
        statsBadge.innerHTML = '📊 No searches yet';
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      statsBadge.innerHTML = '📊 Stats unavailable';
    }
  }

  function displayHistory(historyItems) {
    if (!historyItems || historyItems.length === 0) {
      historyList.innerHTML = '<p style="color: #bbaee6; text-align: center;">No search history yet.</p>';
      return;
    }
    
    historyList.innerHTML = historyItems.map(item => `
      <div class="history-item">
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#a092d8;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
          <span>🔢 ${item.user_number}</span>
          <span>🤖 ${item.agent_used.toUpperCase()}</span>
          <span>📅 ${new Date(item.created_at).toLocaleString()}</span>
        </div>
        <div style="font-size:0.85rem;color:#e0d8ff;">⚠️ ${escapeHtml(item.watch_out.substring(0, 100))}${item.watch_out.length > 100 ? '…' : ''}</div>
        <div style="font-size:0.7rem;margin-top:4px;color:#b7a5f0;">💰 ${formatUSD(parseFloat(item.cost_usd))}</div>
      </div>
    `).join('');
  }

  async function clearHistory() {
    if (confirm('Are you sure you want to clear all your search history?')) {
      try {
        const response = await fetch(`${API_BASE}/clear`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
          }
        });
        
        if (response.ok) {
          await loadHistory();
          await loadStats();
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
  }

  // ========== MAIN PREDICTION FUNCTION ==========
  
  async function handlePrediction() {
    const raw = numberInput.value.trim();
    if (!raw) {
      showErrorPopup("Select a card or enter a number first.");
      return;
    }
    const numValue = parseInt(raw, 10);
    if (isNaN(numValue) || numValue < 1) {
      showErrorPopup("Enter a valid positive integer.");
      return;
    }

    watchMsg.innerHTML = `🔮 Consulting ${currentAgent.toUpperCase()} oracle… <span class="loading"></span>`;
    expectMsg.innerText = "✨ Gathering cosmic insights…";
    extraMsg.innerText = "⏳ Decoding frequencies…";
    inputTokensSpan.innerText = "—";
    outputTokensSpan.innerText = "—";
    inputCostSpan.innerText = "$—";
    outputCostSpan.innerText = "$—";
    totalCostSpan.innerText = "$—";
    askBtn.disabled = true;

    try {
      const result = await getNumerology(numValue, currentAgent);
      
      watchMsg.innerText = result.watch || "Trust the flow";
      expectMsg.innerText = result.expect || "Light surrounds you";
      extraMsg.innerText = `💫 ${result.extra || "Quiet truth"}`;
      
      updateCostUI(
        result.agent,
        result.input_tokens,
        result.output_tokens,
        result.input_cost,
        result.output_cost,
        result.total_cost
      );
      
      // Refresh history if panel is open
      if (historyPanel.classList.contains('show')) {
        await loadHistory();
        await loadStats();
      }
    } catch (err) {
      console.error('Prediction error:', err);
      let msg = err.message.includes('Failed to fetch') ? 'Network issue. Check connection.' : err.message;
      watchMsg.innerText = `⚠️ ${currentAgent.toUpperCase()} error: ${err.message.substring(0, 100)}`;
      showErrorPopup(`${currentAgent.toUpperCase()} | ${msg}`);
    } finally {
      askBtn.disabled = false;
    }
  }

  // ========== EVENT LISTENERS ==========
  
  askBtn.addEventListener('click', handlePrediction);
  numberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePrediction();
  });

  historyToggleBtn.addEventListener('click', async () => {
    historyPanel.classList.toggle('show');
    if (historyPanel.classList.contains('show')) {
      await loadHistory();
      await loadStats();
    }
  });

  clearHistoryBtn.addEventListener('click', clearHistory);

  // Close popup on overlay click
  overlay.addEventListener('click', closeErrorPopup);

  // Load initial stats
  loadStats();

  // Set placeholder
  numberInput.placeholder = "e.g., 7, 22, 144... (try 42)";
  agentNameDisplay.innerText = currentAgent.toUpperCase();
</script>
</body>
</html>