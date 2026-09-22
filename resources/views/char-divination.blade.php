<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>拆字占卜 · 頻率調理</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body {
      min-height: 100vh;
      background: linear-gradient(145deg, #0b001a 0%, #12082b 60%, #0a0018 100%);
      color: #e8d5ff;
      font-family: 'Noto Serif TC', 'Noto Serif SC', serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 18px 50px;
    }
    button { font-family: inherit; cursor: pointer; }
    input { font-family: inherit; }

    /* 帳本標記 */
    #ledgerBadge {
      position: fixed; top: 14px; right: 14px; z-index: 60;
      display: flex; align-items: center; gap: 12px;
      background: rgba(16, 6, 40, 0.92);
      border: 1px solid rgba(160, 100, 255, 0.35);
      border-radius: 40px;
      padding: 8px 20px 8px 18px;
      color: #c9a8ff;
      cursor: pointer;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 13px;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.7);
      letter-spacing: 0.3px;
    }
    #ledgerBadge span { display: inline-flex; align-items: center; gap: 4px; }
    #ledgerBadge .cost-badge { color: #7fe0a8; font-weight: 700; }

    #ledgerPanel {
      position: fixed; top: 70px; right: 14px; width: 340px; z-index: 60;
      background: rgba(12, 5, 30, 0.97);
      border: 1px solid rgba(160, 100, 255, 0.25);
      border-radius: 16px;
      padding: 16px 18px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.8);
      font-family: 'SF Mono', 'Consolas', monospace;
      display: none;
      backdrop-filter: blur(8px);
    }
    #ledgerPanel.show { display: block; }
    .ledger-title { font-size: 11px; letter-spacing: 2px; color: #9b7fca; margin-bottom: 6px; font-family: 'Noto Serif TC', serif; }
    .ledger-sub { font-size: 10px; color: #6b5590; margin-bottom: 12px; }
    .ledger-empty { font-size: 11px; color: #6b5590; padding: 10px 0; }
    .ledger-list { max-height: 260px; overflow-y: auto; }
    .ledger-row {
      display: flex; justify-content: space-between; gap: 6px;
      padding: 7px 0; border-bottom: 1px solid rgba(120,80,200,0.12);
      font-size: 11px;
    }
    .ledger-row .name { color: #b89fdd; font-family: 'Noto Serif TC', serif; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ledger-row .in, .ledger-total .in { color: #a080d0; }
    .ledger-row .out, .ledger-total .out { color: #a080d0; }
    .ledger-row .cost, .ledger-total .cost { color: #7fe0a8; }
    .ledger-total {
      display: flex; justify-content: space-between; gap: 8px;
      padding-top: 12px; font-size: 12px; font-weight: 700;
      border-top: 1px solid rgba(160,100,255,0.2);
      margin-top: 6px;
    }
    .ledger-total .name { color: #d4b8ff; font-family: 'Noto Serif TC', serif; }

    .header { text-align: center; margin-bottom: 32px; }
    .eyebrow { font-size: 13px; letter-spacing: 8px; color: #9b7fca; margin-bottom: 8px; }
    h1 {
      font-size: clamp(28px, 6vw, 50px);
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #d4a8ff, #f0c8ff, #a08cff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle { font-size: 13px; letter-spacing: 6px; color: #7b5fa0; margin-top: 4px; }

    .input-row {
      display: flex; gap: 16px; margin-bottom: 28px;
      align-items: center; flex-wrap: wrap; justify-content: center;
    }
    #charInput {
      width: 76px; height: 76px; font-size: 40px; text-align: center;
      background: rgba(70, 30, 130, 0.3);
      border: 1.5px solid rgba(180, 120, 255, 0.4);
      border-radius: 16px;
      color: #f0d8ff; outline: none; caret-color: #c084fc;
      transition: 0.2s;
    }
    #charInput:focus { border-color: #b07aff; box-shadow: 0 0 20px rgba(140, 80, 255, 0.3); }
    #divineBtn {
      padding: 0 34px; height: 56px; font-size: 17px; letter-spacing: 4px;
      background: linear-gradient(135deg, #7c3aed, #9f4dff);
      border: none; border-radius: 40px;
      color: #f0d8ff; cursor: pointer;
      box-shadow: 0 4px 28px rgba(124, 58, 237, 0.5);
      transition: 0.2s;
    }
    #divineBtn:disabled {
      background: rgba(80, 40, 120, 0.3);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }
    #errorMsg { color: #f08080; margin-bottom: 14px; font-size: 15px; display: none; }

    #resultWrap {
      width: 100%; max-width: 940px;
      display: none; flex-direction: column; gap: 20px;
      margin-top: 8px;
    }
    .card {
      background: rgba(20, 10, 45, 0.7);
      border-radius: 16px;
      padding: 20px 28px;
      border: 1px solid rgba(140, 80, 220, 0.2);
      backdrop-filter: blur(8px);
    }
    .card-label {
      font-size: 12px; letter-spacing: 5px; color: #9b7fca;
      margin-bottom: 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .card-content { font-size: 16px; line-height: 2; color: #e8d5ff; }

    .player {
      background: rgba(20, 10, 45, 0.7);
      border-radius: 16px;
      border: 1px solid rgba(140, 80, 220, 0.25);
      padding: 22px 28px;
    }
    .player-reason {
      font-size: 15px; color: #e0ccff; line-height: 1.9;
      margin-bottom: 16px;
      padding-left: 4px;
    }
    .chip-row {
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-bottom: 14px;
    }
    .freq-chip {
      padding: 6px 16px; font-size: 12px; letter-spacing: 1px;
      background: rgba(70, 30, 130, 0.3);
      border: 1px solid rgba(160, 100, 255, 0.2);
      border-radius: 30px;
      color: #b89fdd;
      cursor: pointer;
      transition: 0.2s;
    }
    .freq-chip.active {
      background: linear-gradient(135deg, #7c3aed, #9f4dff);
      border-color: rgba(200, 150, 255, 0.6);
      color: #fff;
      box-shadow: 0 2px 16px rgba(124, 58, 237, 0.5);
    }
    .bw-row {
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-bottom: 20px; align-items: center;
    }
    .bw-label { font-size: 12px; color: #7b5fa0; letter-spacing: 1px; margin-right: 4px; }
    .bw-chip {
      padding: 5px 14px; font-size: 11px; letter-spacing: 1px;
      background: rgba(50, 20, 100, 0.3);
      border: 1px solid rgba(160, 100, 255, 0.2);
      border-radius: 30px;
      color: #a88fd0;
      cursor: pointer;
      transition: 0.2s;
    }
    .bw-chip.active { background: rgba(124, 58, 237, 0.55); color: #fff; border-color: #b07aff; }

    .controls-row {
      display: flex; align-items: center; gap: 18px;
      flex-wrap: wrap;
    }
    #playBtn {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #9f4dff);
      border: none;
      color: #fff; font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(124, 58, 237, 0.5);
      display: flex; align-items: center; justify-content: center;
      transition: 0.2s;
    }
    #playBtn.playing { background: rgba(124, 58, 237, 0.35); border: 2px solid rgba(200, 150, 255, 0.7); }
    .vol-block { flex: 1; min-width: 160px; }
    #nowPlaying { font-size: 14px; color: #d4b8ff; margin-bottom: 6px; }
    .vol-row { display: flex; align-items: center; gap: 10px; }
    #volumeSlider { flex: 1; accent-color: #9f4dff; }
    #ytLink {
      padding: 10px 20px; font-size: 13px; letter-spacing: 1px;
      background: rgba(200, 40, 40, 0.15);
      border: 1px solid rgba(255, 100, 100, 0.3);
      border-radius: 40px;
      color: #ffb0b0;
      text-decoration: none;
      white-space: nowrap;
      transition: 0.2s;
    }
    #ytLink:hover { background: rgba(200, 40, 40, 0.25); }
    #binauralNote {
      margin-top: 14px;
      font-size: 12px;
      color: #8a6fb0;
      letter-spacing: 0.5px;
      display: none;
    }
    .disclaimer {
      margin-top: 12px;
      font-size: 11px;
      color: #4a2f6a;
      letter-spacing: 1px;
    }

    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #3a2550;
      letter-spacing: 3px;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #1a0a30; }
    ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 8px; }

    @media (max-width: 500px) {
      #ledgerBadge { font-size: 11px; padding: 6px 14px; gap: 6px; }
      #ledgerPanel { width: 280px; right: 6px; }
      .card { padding: 16px; }
      .player { padding: 16px; }
      .controls-row { gap: 12px; }
      #charInput { width: 60px; height: 60px; font-size: 32px; }
      #divineBtn { padding: 0 20px; height: 48px; font-size: 14px; }
    }
  </style>
</head>
<body>

<!-- 帳本按鈕 -->
<button id="ledgerBadge">
  <span>⬇<span id="badgeIn">0</span></span>
  <span>⬆<span id="badgeOut">0</span></span>
  <span class="cost-badge">$<span id="badgeCost">0.0000</span></span>
</button>
<div id="ledgerPanel">
  <div class="ledger-title">✦ Token 消費明細 (Claude Haiku)</div>
  <div class="ledger-sub">Input $3/M · Output $15/M tokens</div>
  <div id="ledgerBody"></div>
</div>

<!-- 標題 -->
<div class="header">
  <div class="eyebrow">✦ 古法拆字 ✦</div>
  <h1>拆字占卜</h1>
  <div class="subtitle">× 頻率調理</div>
</div>

<!-- 輸入區 -->
<div class="input-row">
  <input id="charInput" maxlength="1" placeholder="字" value="安">
  <button id="divineBtn">✦ 開始占卜</button>
</div>
<div id="errorMsg"></div>

<!-- 結果面板 -->
<div id="resultWrap">
  <div class="card"><div class="card-label"><span>⊞</span>拆字分析</div><div class="card-content" id="partsContent"></div></div>
  <div class="card"><div class="card-label"><span>◈</span>意象解讀</div><div class="card-content" id="imageryContent"></div></div>
  <div class="card"><div class="card-label"><span>✦</span>占卜結果</div><div class="card-content" id="fortuneContent"></div></div>
  <div class="card"><div class="card-label"><span>⟡</span>行動建議</div><div class="card-content" id="adviceContent"></div></div>

  <div class="player">
    <div class="card-label"><span style="font-size:16px;">🎵</span>身心調理頻率・精準生成</div>
    <div class="player-reason" id="freqReason"></div>
    <div class="chip-row" id="freqChips"></div>
    <div class="bw-row" id="bwChips"><span class="bw-label">腦波模式</span></div>
    <div class="controls-row">
      <button id="playBtn">▶</button>
      <div class="vol-block">
        <div id="nowPlaying"></div>
        <div class="vol-row">
          <span>🔉</span>
          <input type="range" id="volumeSlider" min="0" max="1" step="0.05" value="0.5">
          <span>🔊</span>
        </div>
      </div>
      <a id="ytLink" href="#" target="_blank" rel="noopener noreferrer">▶ YouTube 完整影音</a>
    </div>
    <div id="binauralNote"></div>
    <div class="disclaimer">✦ 頻率音樂僅供放鬆聆聽與心靈調適，非醫療用途</div>
  </div>
</div>

<div class="footer">✦ 以字觀象，以象測命 ✦</div>

<script>
  // ==================== Laravel Backend Integration ====================
  
  const API_BASE = '/api/divinationtwo';
  
  // Frequency and brainwave data from PHP
  const FREQUENCIES = @json($frequencies);
  const BRAINWAVES = @json($brainwaves);

  let ledger = [];
  let playerState = { 
    activeId: "432", 
    bwId: "theta", 
    playing: false, 
    volume: 0.5, 
    recommendedId: null, 
    recommendedBw: null 
  };

  // DOM elements
  const charInput = document.getElementById('charInput');
  const divineBtn = document.getElementById('divineBtn');
  const errorMsg = document.getElementById('errorMsg');
  const resultWrap = document.getElementById('resultWrap');
  const partsContent = document.getElementById('partsContent');
  const imageryContent = document.getElementById('imageryContent');
  const fortuneContent = document.getElementById('fortuneContent');
  const adviceContent = document.getElementById('adviceContent');
  const freqReason = document.getElementById('freqReason');
  const playBtn = document.getElementById('playBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const nowPlaying = document.getElementById('nowPlaying');
  const ytLink = document.getElementById('ytLink');
  const binauralNote = document.getElementById('binauralNote');

  // ============ Ledger Functions ============
  function addLedger(label, inputTokens, outputTokens, cost) {
    ledger.push({ label, in: inputTokens, out: outputTokens, cost: cost });
    renderLedger();
  }

  function renderLedger() {
    const totals = ledger.reduce((a, e) => ({ 
      in: a.in + e.in, 
      out: a.out + e.out, 
      cost: a.cost + e.cost 
    }), { in: 0, out: 0, cost: 0 });
    
    document.getElementById("badgeIn").textContent = totals.in.toLocaleString();
    document.getElementById("badgeOut").textContent = totals.out.toLocaleString();
    document.getElementById("badgeCost").textContent = totals.cost.toFixed(5);

    const body = document.getElementById("ledgerBody");
    if (ledger.length === 0) {
      body.innerHTML = `<div class="ledger-empty">尚無消費紀錄</div>`;
      return;
    }
    let html = `<div class="ledger-list">`;
    ledger.forEach(e => {
      html += `<div class="ledger-row">
        <span class="name">${escapeHtml(e.label)}</span>
        <span class="in">⬇${e.in}</span>
        <span class="out">⬆${e.out}</span>
        <span class="cost">$${e.cost.toFixed(5)}</span>
      </div>`;
    });
    html += `<div class="ledger-total">
      <span class="name">合計</span>
      <span class="in">⬇${totals.in.toLocaleString()}</span>
      <span class="out">⬆${totals.out.toLocaleString()}</span>
      <span class="cost">$${totals.cost.toFixed(5)}</span>
    </div></div>`;
    body.innerHTML = html;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  document.getElementById("ledgerBadge").addEventListener("click", () => {
    document.getElementById("ledgerPanel").classList.toggle("show");
  });

  // ============ Audio Engine ============
  function createFreqEngine() {
    let ctx = null, master = null, chimeTimer = null;
    
    function start(hz, beat, volume) {
      stop();
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);

      const makeSide = (freq, pan) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = 0.26;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.07;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.05;
        lfo.connect(lfoG); lfoG.connect(g.gain);
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        osc.connect(g); g.connect(p); p.connect(master);
        osc.start(); lfo.start();
        const h = ctx.createOscillator();
        h.type = "sine";
        h.frequency.value = freq * 2;
        const hg = ctx.createGain();
        hg.gain.value = 0.035;
        h.connect(hg); hg.connect(p);
        h.start();
      };

      if (beat > 0) {
        makeSide(hz - beat / 2, -0.9);
        makeSide(hz + beat / 2, 0.9);
      } else {
        makeSide(hz, 0);
      }

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = hz / 4;
      const subG = ctx.createGain();
      subG.gain.value = 0.09;
      sub.connect(subG); subG.connect(master);
      sub.start();

      const scheduleChime = () => {
        if (!ctx) return;
        const mult = [1.5, 2, 2.5, 3][Math.floor(Math.random() * 4)];
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = hz * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.2);
        o.connect(g); g.connect(master);
        o.start(); o.stop(ctx.currentTime + 4.5);
        chimeTimer = setTimeout(scheduleChime, 4500 + Math.random() * 6000);
      };
      chimeTimer = setTimeout(scheduleChime, 2000);
    }
    
    function setVolume(v) {
      if (ctx && master) master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.15);
    }
    
    function stop() {
      if (chimeTimer) { clearTimeout(chimeTimer); chimeTimer = null; }
      if (ctx) {
        try { master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); } catch(e) {}
        const c = ctx;
        setTimeout(() => { try { c.close(); } catch(e) {} }, 500);
        ctx = null; master = null;
      }
    }
    return { start, stop, setVolume, isOn: () => !!ctx };
  }

  const engine = createFreqEngine();

  // ============ Player Functions ============
  function getFreq() { 
    return FREQUENCIES.find(f => f.id === playerState.activeId) || FREQUENCIES[2]; 
  }
  
  function getBw() { 
    return BRAINWAVES.find(b => b.id === playerState.bwId) || BRAINWAVES[0]; 
  }

  function selectFreq(id) {
    if (playerState.playing) doStop();
    playerState.activeId = id;
    renderFreqChips();
    updatePlayerUI();
  }

  function selectBw(id) {
    if (playerState.playing) doStop();
    playerState.bwId = id;
    renderBwChips();
    updatePlayerUI();
  }

  function doPlay() {
    const f = getFreq(), b = getBw();
    engine.start(f.hz, b.beat, playerState.volume);
    playerState.playing = true;
    updatePlayerUI();
  }

  function doStop() {
    engine.stop();
    playerState.playing = false;
    updatePlayerUI();
  }

  function renderFreqChips() {
    const wrap = document.getElementById("freqChips");
    wrap.innerHTML = "";
    FREQUENCIES.forEach(f => {
      const btn = document.createElement("button");
      btn.className = "freq-chip" + (playerState.activeId === f.id ? " active" : "");
      const rec = (f.id === playerState.recommendedId) ? " ✦" : "";
      btn.textContent = f.label + "・" + f.name + rec;
      btn.onclick = () => selectFreq(f.id);
      wrap.appendChild(btn);
    });
  }

  function renderBwChips() {
    const wrap = document.getElementById("bwChips");
    wrap.innerHTML = `<span class="bw-label">腦波模式</span>`;
    BRAINWAVES.forEach(b => {
      const btn = document.createElement("button");
      btn.className = "bw-chip" + (playerState.bwId === b.id ? " active" : "");
      const rec = (b.id === playerState.recommendedBw) ? " ✦" : "";
      btn.textContent = b.label + "・" + b.desc + rec;
      btn.onclick = () => selectBw(b.id);
      wrap.appendChild(btn);
    });
  }

  function updatePlayerUI() {
    const f = getFreq(), b = getBw();
    playBtn.textContent = playerState.playing ? "◼" : "▶";
    playBtn.className = playerState.playing ? "playing" : "";

    nowPlaying.textContent = playerState.playing
      ? `正在播放 ${f.label}${b.beat > 0 ? `（${b.label} 雙耳拍頻）` : "（純音）"}`
      : `${f.label}・${f.name}`;

    ytLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(f.query)}`;

    if (b.beat > 0) {
      binauralNote.style.display = "block";
      binauralNote.textContent = `💡 雙耳拍頻需配戴耳機才有效果（左右耳 ${f.hz - b.beat / 2} Hz / ${f.hz + b.beat / 2} Hz）`;
    } else {
      binauralNote.style.display = "none";
    }
  }

  playBtn.addEventListener("click", () => {
    if (playerState.playing) doStop(); else doPlay();
  });

  volumeSlider.addEventListener("input", (e) => {
    playerState.volume = Number(e.target.value);
    engine.setVolume(playerState.volume);
  });

  // ============ API Calls ============
  async function getDivination(character) {
    const response = await fetch(`${API_BASE}/divine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      credentials: 'include',
      body: JSON.stringify({ character })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '占卜失敗');
    }

    return result.data;
  }

  async function loadStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update ledger with existing stats
          ledger = [{
            label: '歷史累計',
            in: data.data.total_input_tokens || 0,
            out: data.data.total_output_tokens || 0,
            cost: data.data.total_cost || 0
          }];
          renderLedger();
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  // ============ Main Divination Function ============
  async function handleDivine() {
    const char = charInput.value.trim();
    if (!char || char.length !== 1) {
      errorMsg.textContent = "請輸入單一漢字";
      errorMsg.style.display = "block";
      return;
    }
    errorMsg.style.display = "none";
    divineBtn.disabled = true;
    divineBtn.textContent = "✦ 解讀中……";

    try {
      const result = await getDivination(char);
      
      // Display results
      partsContent.textContent = result.parts;
      imageryContent.textContent = result.imagery;
      fortuneContent.textContent = result.fortune;
      adviceContent.textContent = result.advice;
      freqReason.textContent = result.frequency.reason;

      // Update player state with recommended frequencies
      playerState.recommendedId = result.frequency.id;
      playerState.recommendedBw = result.brainwave.id;
      playerState.activeId = result.frequency.id;
      playerState.bwId = result.brainwave.id;

      if (playerState.playing) doStop();

      renderFreqChips();
      renderBwChips();
      updatePlayerUI();

      resultWrap.style.display = "flex";

      // Add to ledger
      addLedger(
        `占卜「${char}」`,
        result.input_tokens,
        result.output_tokens,
        result.cost
      );

    } catch (err) {
      console.error('Divination error:', err);
      errorMsg.textContent = "解讀失敗，請再試一次。";
      errorMsg.style.display = "block";
    }

    divineBtn.disabled = false;
    divineBtn.textContent = "✦ 開始占卜";
  }

  // ============ Event Listeners ============
  charInput.addEventListener("input", () => {
    charInput.value = charInput.value.slice(-1);
  });

  charInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !divineBtn.disabled) handleDivine();
  });

  divineBtn.addEventListener("click", handleDivine);

  // ============ Initialize ============
  renderLedger();
  renderFreqChips();
  renderBwChips();
  updatePlayerUI();
  loadStats();

  // Auto-divine on load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!partsContent.textContent) {
        handleDivine();
      }
    }, 300);
  });
</script>
</body>
</html>