<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>5‑AI Numerology | Working · OpenAI · Kimi · Perplexity · Gemini · DeepSeek</title>
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
      min-width: 200px;
    }
    .number-input:focus { border-color: #ba8eff; box-shadow: 0 0 10px rgba(160,100,255,0.3); }
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
      background: rgba(0, 0, 0, 0.55);
      border-radius: 1rem;
      padding: 0.7rem 0.9rem;
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.6rem;
      font-size: 0.7rem;
      font-family: monospace;
      color: #ffffff;
    }
    .footer { text-align: center; font-size: 0.7rem; margin-top: 1rem; color: #836fc2; }
    hr { margin: 1rem 0; border-color: #2a2350; }
    .warning { color: #ffccaa; background: #2a1a0e; padding: 0.5rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.7rem; text-align: center; border-left: 3px solid #ffaa66; }
    .error-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 10, 40, 0.98);
      border: 1px solid #ff6b6b;
      border-radius: 1.5rem;
      padding: 2rem;
      max-width: 420px;
      width: 90%;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
      display: none;
    }
    .error-popup.show { display: block; animation: popupIn 0.3s ease; }
    @keyframes popupIn {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    .error-popup h3 { color: #ff6b6b; margin-bottom: 1rem; font-size: 1.2rem; }
    .error-popup p { color: #ccc; font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5; word-break: break-word; }
    .error-popup button {
      background: linear-gradient(95deg, #ff6b6b, #ff8e8e);
      border: none;
      padding: 0.6rem 2rem;
      border-radius: 30px;
      color: white;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.65);
      z-index: 999;
      display: none;
    }
    .overlay.show { display: block; }
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(180, 140, 255, 0.3);
      border-top-color: #b47eff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-left: 8px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .history-toggle {
      background: rgba(100, 70, 150, 0.3);
      border: 1px solid #6a4fbf;
      padding: 0.4rem 1rem;
      border-radius: 40px;
      color: #cdbcff;
      cursor: pointer;
      font-size: 0.75rem;
      margin-top: 1rem;
      width: 100%;
      text-align: center;
    }
    .history-panel {
      display: none;
      margin-top: 1rem;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 1rem;
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    .history-panel.show { display: block; }
    .history-item {
      background: rgba(30, 20, 60, 0.6);
      border-radius: 0.8rem;
      padding: 0.8rem;
      margin-bottom: 0.8rem;
      border-left: 3px solid #b87eff;
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #bbaee6;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      gap: 4px;
    }
    .history-number {
      font-weight: bold;
      color: #cdadff;
    }
    .history-watch {
      font-size: 0.8rem;
      color: #ffccaa;
    }
    .clear-history-btn {
      background: rgba(255, 100, 100, 0.2);
      border: 1px solid #ff6b6b;
      color: #ffaa88;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.7rem;
      cursor: pointer;
      margin-left: 0.5rem;
    }
    .stats-badge {
      display: inline-block;
      background: rgba(100, 70, 150, 0.4);
      border-radius: 20px;
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
      margin-right: 0.5rem;
    }
    @media (max-width: 600px) {
      .container { padding: 1rem; }
      h1 { font-size: 1.3rem; }
      .number-input { font-size: 0.9rem; }
      .ask-btn { padding: 0 1rem; font-size: 0.9rem; }
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
  <h1>🔮 5‑ORACLE NUMEROLOGY</h1>
  <div class="sub">OpenAI · Kimi · Perplexity · Gemini · DeepSeek — All APIs Working</div>

  <div class="input-group">
    <input type="number" id="userNumber" class="number-input" placeholder="Your spontaneous number (7, 22, 144...)" value="">
    <button id="askBtn" class="ask-btn">✨ ASK ORACLE ✨</button>
  </div>

  <div class="agent-grid" id="agentSelector">
    <div class="agent-btn" data-agent="kimi">🔥 Kimi</div>
    <div class="agent-btn active" data-agent="perplexity">🌊 Perplexity</div>
    <div class="agent-btn" data-agent="gemini">⭐ Gemini</div>
    <div class="agent-btn" data-agent="deepseek">🌀 DeepSeek</div>
  </div>

  <div id="resultArea">
    <div class="card">
      <div class="watch"><div class="label">⚠️ WATCH OUT FOR</div><div class="message" id="watchMsg">Select an AI, enter a number...</div></div>
      <div class="expect"><div class="label">✨ EXPECT TODAY</div><div class="message" id="expectMsg">Each AI brings unique mystical insight.</div></div>
      <div class="extra" id="extraMsg">💫 Extra nuance appears here</div>
      <div class="cost-panel" id="costPanel" style="display: none;">
        <span>🤖 <strong id="agentNameDisplay">—</strong></span>
        <span>📥 <span id="inputTokens">—</span> tok</span>
        <span>📤 <span id="outputTokens">—</span> tok</span>
        <span>💰 <span id="totalCost">—</span> USD</span>
      </div>
    </div>
  </div>
  
  <button class="history-toggle" id="historyToggleBtn">📜 View Search History</button>
  
  <div class="history-panel" id="historyPanel">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;">
      <span class="stats-badge" id="statsBadge">Loading stats...</span>
      <button class="clear-history-btn" id="clearHistoryBtn">🗑️ Clear All History</button>
    </div>
    <div id="historyList">Loading history...</div>
  </div>
  
  <hr />
  <div class="footer">
    🔐 <strong>All API keys secured on server</strong> — Perplexity: sonar-pro, OpenAI: gpt-4o-mini, DeepSeek: deepseek-chat, Kimi: kimi-k3, Gemini: gemini-3-flash-preview.
  </div>
</div>

<script>
  // ==================== Laravel Backend Integration ====================
  
  const API_BASE = '/api/numerology';
  let currentAgent = 'perplexity';
  
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
  const totalCostSpan = document.getElementById('totalCost');
  const errorPopup = document.getElementById('errorPopup');
  const errorPopupMsg = document.getElementById('errorPopupMsg');
  const overlay = document.getElementById('overlay');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const statsBadge = document.getElementById('statsBadge');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Agent selection
  document.querySelectorAll('.agent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.agent-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAgent = btn.dataset.agent;
      if (costPanel.style.display !== 'none') costPanel.style.display = 'none';
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
        <div class="history-header">
          <span class="history-number">🔢 Number: ${item.user_number}</span>
          <span>🤖 ${item.agent_used.toUpperCase()}</span>
          <span>📅 ${new Date(item.created_at).toLocaleString()}</span>
        </div>
        <div class="history-watch">⚠️ ${escapeHtml(item.watch_out.substring(0, 100))}${item.watch_out.length > 100 ? '...' : ''}</div>
        <div style="font-size: 0.7rem; color: #bbaee6; margin-top: 0.5rem;">
          💰 ${formatUSD(parseFloat(item.cost_usd))}
        </div>
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
      showErrorPopup("Please enter a spontaneous number first.");
      return;
    }
    const numValue = parseInt(raw, 10);
    if (isNaN(numValue) || numValue < 1) {
      showErrorPopup("That doesn't look like a valid number. Please enter a positive integer.");
      return;
    }

    watchMsg.innerHTML = `🔮 Consulting ${currentAgent.toUpperCase()} oracle... <span class="loading"></span>`;
    expectMsg.innerText = "✨ Gathering cosmic insights...";
    extraMsg.innerText = "⏳ Decoding frequencies, please wait...";
    costPanel.style.display = 'none';
    askBtn.disabled = true;

    try {
      const result = await getNumerology(numValue, currentAgent);
      
      watchMsg.innerText = result.watch;
      expectMsg.innerText = result.expect;
      extraMsg.innerText = `💫 ${result.extra}`;

      agentNameDisplay.innerText = result.agent.toUpperCase();
      inputTokensSpan.innerText = result.input_tokens.toLocaleString();
      outputTokensSpan.innerText = result.output_tokens.toLocaleString();
      totalCostSpan.innerText = formatUSD(result.cost);
      costPanel.style.display = 'flex';
      
      // Refresh history if panel is open
      if (historyPanel.classList.contains('show')) {
        await loadHistory();
        await loadStats();
      }
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMsg = err.message;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = `${currentAgent.toUpperCase()} network error. Please try again.`;
      }
      watchMsg.innerText = `⚠️ ${currentAgent.toUpperCase()} could not respond: ${err.message.substring(0, 120)}`;
      showErrorPopup(`${currentAgent.toUpperCase()} | ${errorMsg}`);
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
</script>
</body>
</html>