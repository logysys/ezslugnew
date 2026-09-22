<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>拆字占卜 ─ 靈犀字觀</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    background:radial-gradient(circle at 15% 20%,#0d0718,#02010c 70%);
    min-height:100vh;display:flex;justify-content:center;align-items:flex-start;
    font-family:'PingFang TC','Microsoft JhengHei',system-ui,sans-serif;padding:1.5rem;
  }
  .container{
    max-width:880px;width:100%;
    background:rgba(12,9,28,.88);backdrop-filter:blur(16px);
    border-radius:2.5rem;border:1px solid rgba(200,160,255,.4);
    padding:2rem 1.8rem;box-shadow:0 25px 50px -10px #000;margin:auto;
  }
  h1{
    font-size:2rem;text-align:center;letter-spacing:4px;
    background:linear-gradient(120deg,#f5eaff,#d4aaff,#b47eff);
    -webkit-background-clip:text;background-clip:text;color:transparent;
  }
  .sub{text-align:center;color:#bbaee6;font-size:.78rem;margin:.4rem 0 1.6rem;letter-spacing:2px}

  .cards-label{text-align:center;font-size:.7rem;letter-spacing:2px;color:#a092d8;margin-bottom:.8rem}
  .number-cards{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:1.4rem}
  .num-card{
    width:108px;height:96px;border-radius:1.2rem;border:1.5px solid #5a48a0;
    background:linear-gradient(145deg,#1a1538,#0e0c24);
    color:#cdbcff;display:flex;flex-direction:column;align-items:center;justify-content:center;
    cursor:pointer;transition:all .2s;position:relative;overflow:hidden;user-select:none;
  }
  .num-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(180,126,255,.15),transparent);opacity:0;transition:opacity .2s}
  .num-card:hover::before{opacity:1}
  .num-card:hover{border-color:#a47eff;transform:translateY(-4px) scale(1.04);box-shadow:0 8px 20px rgba(160,100,255,.35)}
  .num-card.selected{background:linear-gradient(145deg,#4a35a0,#7555ea);border-color:#c49eff;box-shadow:0 0 20px rgba(180,126,255,.6);color:#fff}
  .num-card.selected::before{opacity:1}
  .card-symbol{font-size:1.5rem;margin-bottom:4px}
  .card-label{font-size:.82rem;font-weight:700;letter-spacing:2px}

  .or-divider{display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;color:#6a5898;font-size:.8rem}
  .or-divider::before,.or-divider::after{content:'';flex:1;height:1px;background:rgba(100,80,160,.4)}
  .input-group{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:1.2rem}
  .char-input{
    flex:2;padding:.9rem 1.2rem;border-radius:60px;border:1px solid #6a4fbf;
    background:#0e0c24;color:#fff;font-size:1.8rem;text-align:center;
    font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s;letter-spacing:6px;
  }
  .char-input:focus{border-color:#ba8eff;box-shadow:0 0 12px rgba(160,100,255,.3)}
  .char-input.active{border-color:#c49eff;box-shadow:0 0 14px rgba(180,126,255,.4)}

  .ask-btn{
    background:linear-gradient(95deg,#755aea,#a47eff);border:none;
    padding:0 1.6rem;border-radius:60px;font-weight:700;color:#fff;
    cursor:pointer;font-size:1rem;font-family:inherit;transition:transform .1s,opacity .2s;letter-spacing:2px;
  }
  .ask-btn:hover{transform:scale(.97);opacity:.9}
  .ask-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

  .agent-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem;justify-content:center}
  .agent-btn{
    background:#1a1538;border:1px solid #5a48a0;padding:.45rem 1rem;
    border-radius:40px;color:#cdbcff;cursor:pointer;font-weight:600;
    font-size:.83rem;transition:.2s;font-family:inherit;
  }
  .agent-btn.active{background:linear-gradient(95deg,#755aea,#a47eff);color:#fff;border-color:#c49eff;box-shadow:0 0 8px #a47eff}
  .agent-btn:hover:not(.active){background:#3a2e6e;transform:scale(.97)}

  .result-card{background:rgba(0,0,0,.45);border-radius:1.5rem;margin-top:1.5rem;padding:1.2rem;border-left:6px solid #b87eff}
  .section{border-radius:1.2rem;padding:.9rem 1rem;margin-bottom:.8rem}
  .sec-analysis{background:rgba(180,126,255,.1)}
  .sec-luck{background:rgba(100,200,130,.08)}
  .sec-caution{background:rgba(255,110,110,.1)}
  .sec-tip{background:rgba(210,180,255,.08);font-style:italic}
  .sec-label{font-size:.68rem;text-transform:uppercase;letter-spacing:2px;font-weight:700;color:#ddccff;margin-bottom:6px}
  .sec-msg{color:#f5edff;line-height:1.65;font-size:.92rem}

  .cost-panel{
    background:rgba(0,0,0,.65);border-radius:1rem;padding:1rem;
    margin-top:1rem;border:1px solid rgba(120,80,200,.4);
    font-family:'SF Mono','Fira Code',monospace;
  }
  .cost-header{font-size:.72rem;letter-spacing:1px;color:#cbbaff;margin-bottom:.75rem;border-left:3px solid #b87eff;padding-left:8px}
  .cost-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:.6rem}
  .cost-item{background:rgba(30,20,55,.6);padding:.5rem .7rem;border-radius:.8rem;display:flex;justify-content:space-between;align-items:baseline;font-size:.78rem}
  .cost-label{color:#b7a5f0;font-weight:500}
  .cost-value{color:#e2d9ff;font-weight:600}
  .highlight-cost{background:linear-gradient(95deg,#3a2d6e,#2a1f55);border-left:3px solid #ffdf8c;margin-top:6px}
  .agent-tag{background:rgba(255,220,100,.1);border-radius:12px;padding:5px 12px;font-size:.7rem;text-align:center;margin-top:8px;color:#ffe1a0}

  .loading{display:inline-block;width:14px;height:14px;border:2px solid rgba(180,140,255,.3);border-top-color:#b47eff;border-radius:50%;animation:spin .8s linear infinite;margin-left:8px;vertical-align:middle}
  @keyframes spin{to{transform:rotate(360deg)}}

  .warning-box{
    margin-top:1.8rem;padding:1rem 1.2rem;
    background:rgba(255,200,80,.07);border:1px solid rgba(255,200,80,.25);
    border-radius:1rem;font-size:.72rem;color:#c8b880;line-height:1.8;text-align:center;letter-spacing:.5px;
  }
  .warning-box strong{color:#ffe180}

  .overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.65);z-index:999;display:none}
  .overlay.show{display:block}
  .error-popup{
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(20,10,40,.98);border:1px solid #ff6b6b;border-radius:1.5rem;
    padding:2rem;max-width:380px;width:90%;z-index:1000;text-align:center;
    box-shadow:0 20px 60px rgba(0,0,0,.8);display:none;
  }
  .error-popup.show{display:block;animation:popIn .3s ease}
  @keyframes popIn{from{opacity:0;transform:translate(-50%,-50%) scale(.8)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  .error-popup h3{color:#ff6b6b;margin-bottom:1rem}
  .error-popup p{color:#ccc;font-size:.85rem;margin-bottom:1.5rem}
  .error-popup button{background:linear-gradient(95deg,#ff6b6b,#ff8e8e);border:none;padding:.6rem 2rem;border-radius:30px;color:#fff;font-weight:700;cursor:pointer;font-family:inherit}

  hr{margin:1rem 0;border-color:#2a2350}
  .footer{text-align:center;font-size:.68rem;color:#6a5898;margin-top:.8rem;letter-spacing:1px}
</style>
</head>
<body>
<div class="overlay" id="overlay"></div>
<div class="error-popup" id="errorPopup">
  <h3>⚠️ 發生錯誤</h3>
  <p id="errMsg"></p>
  <button onclick="closeErr()">確認</button>
</div>

<div class="container">
  <h1>🔮 拆字占卜</h1>
  <div class="sub">以字問天・以形解命・多元AI智慧解讀</div>

  <div class="cards-label">✦ 選擇占問主題 ✦</div>
  <div class="number-cards">
    <div class="num-card selected" data-theme="今日財運"><div class="card-symbol">💰</div><div class="card-label">今日財運</div></div>
    <div class="num-card" data-theme="出行計畫"><div class="card-symbol">🗺️</div><div class="card-label">出行計畫</div></div>
    <div class="num-card" data-theme="職場適應"><div class="card-symbol">🏢</div><div class="card-label">職場適應</div></div>
    <div class="num-card" data-theme="家庭和諧"><div class="card-symbol">🏡</div><div class="card-label">家庭和諧</div></div>
    <div class="num-card" data-theme="努力方向"><div class="card-symbol">🌟</div><div class="card-label">努力方向</div></div>
  </div>

  <div class="or-divider">— 輸入你心中浮現的一個中文字 —</div>

  <div class="input-group">
    <input type="text" id="charInput" class="char-input" placeholder="字" maxlength="2">
    <button id="askBtn" class="ask-btn">✨ 開始占卜</button>
  </div>

  <div class="agent-grid" id="agentGrid">
    <button class="agent-btn active" data-agent="openai">💠 OpenAI</button>
    <button class="agent-btn" data-agent="deepseek">🌀 DeepSeek</button>
    <button class="agent-btn" data-agent="gemini">⭐ Gemini</button>
    <button class="agent-btn" data-agent="perplexity">🌊 Perplexity</button>
  </div>

  <div id="resultArea">
    <div class="result-card">
      <div class="section sec-analysis">
        <div class="sec-label">📖 字形解析</div>
        <div class="sec-msg" id="msgAnalysis">選擇主題，輸入一個漢字，讓占卜師為你解讀字中玄機。</div>
      </div>
      <div class="section sec-luck">
        <div class="sec-label">✨ 吉象指引</div>
        <div class="sec-msg" id="msgLuck">每一個字都藏著獨特的能量與啟示。</div>
      </div>
      <div class="section sec-caution">
        <div class="sec-label">⚠️ 留意事項</div>
        <div class="sec-msg" id="msgCaution">順應自然，靜待時機。</div>
      </div>
      <div class="section sec-tip">
        <div class="sec-label">💫 今日錦言</div>
        <div class="sec-msg" id="msgTip">萬物皆有其時，靜心方能洞見。</div>
      </div>

      <div class="cost-panel" id="costPanel">
        <div class="cost-header">💰 詞元耗用與費用明細（即時 API 回傳）</div>
        <div class="cost-grid">
          <div class="cost-item"><span class="cost-label">📥 輸入詞元</span><span class="cost-value" id="inTok">—</span></div>
          <div class="cost-item"><span class="cost-label">📤 輸出詞元</span><span class="cost-value" id="outTok">—</span></div>
          <div class="cost-item"><span class="cost-label">⚡ 輸入費用</span><span class="cost-value" id="inCost">—</span></div>
          <div class="cost-item"><span class="cost-label">✨ 輸出費用</span><span class="cost-value" id="outCost">—</span></div>
        </div>
        <div class="cost-item highlight-cost">
          <span class="cost-label">💎 本次總費用 (USD)</span>
          <span class="cost-value" id="totalCost">$0.00000</span>
        </div>
        <div class="agent-tag">🤖 AI引擎：<strong id="agentTag">—</strong> · 費率依每百萬詞元計算</div>
      </div>
    </div>
  </div>

  <hr>
  <div class="warning-box">
    <strong>⚠️ 娛樂性質聲明</strong><br>
    本占卜工具純屬娛樂參考，所有解讀均由人工智慧依據漢字結構與文化意涵生成，<br>
    <strong>不構成任何財務、醫療、法律或人生決策之建議。</strong><br>
    請以理性判斷為主，切勿因占卜結果影響重大決定。如有心理困擾，請尋求專業協助。
  </div>
  <div class="footer">✦ 拆字問天 · 字字有緣 · 僅供娛樂 ✦</div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    let currentTheme = '今日財運';
    let currentAgent = 'openai';

    // Theme selection
    document.querySelectorAll('.num-card').forEach(c => {
      c.addEventListener('click', function() {
        document.querySelectorAll('.num-card').forEach(x => x.classList.remove('selected'));
        this.classList.add('selected');
        currentTheme = this.dataset.theme;
      });
    });

    // Agent selection
    document.querySelectorAll('.agent-btn').forEach(b => {
      b.addEventListener('click', function() {
        document.querySelectorAll('.agent-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        currentAgent = this.dataset.agent;
      });
    });

    const charInput = document.getElementById('charInput');
    charInput.addEventListener('input', function() {
      if (this.value.length > 1) {
        const chars = [...this.value].filter(c => /[\u4e00-\u9fff]/.test(c));
        this.value = chars.slice(-1).join('');
      }
      this.classList.toggle('active', this.value.trim().length > 0);
    });
    charInput.addEventListener('keypress', e => { if (e.key === 'Enter') go(); });
    document.getElementById('askBtn').addEventListener('click', go);

    function showErr(msg) {
      document.getElementById('errMsg').innerText = msg;
      document.getElementById('errorPopup').classList.add('show');
      document.getElementById('overlay').classList.add('show');
    }

    window.closeErr = function() {
      document.getElementById('errorPopup').classList.remove('show');
      document.getElementById('overlay').classList.remove('show');
    };

    function fmtUSD(v) {
      const num = Number(v);
      if (isNaN(num) || num <= 0) return '$0.00000';
      if (num < 0.000001) return '$' + num.toExponential(4);
      return '$' + num.toFixed(5);
    }

    function updateCost(agent, inp, out, pricing) {
      const ic = (inp / 1e6) * pricing.input;
      const oc = (out / 1e6) * pricing.output;
      document.getElementById('inTok').innerText = inp.toLocaleString();
      document.getElementById('outTok').innerText = out.toLocaleString();
      document.getElementById('inCost').innerText = fmtUSD(ic);
      document.getElementById('outCost').innerText = fmtUSD(oc);
      document.getElementById('totalCost').innerText = fmtUSD(ic + oc);
      document.getElementById('agentTag').innerText = pricing.label;
    }

    function setMsg(a, l, c, t) {
      document.getElementById('msgAnalysis').innerHTML = a;
      document.getElementById('msgLuck').innerHTML = l;
      document.getElementById('msgCaution').innerHTML = c;
      document.getElementById('msgTip').innerHTML = t;
    }

    async function go() {
      const ch = charInput.value.trim();
      if (!ch) { showErr('請先輸入一個中文字'); return; }
      if (!/[\u4e00-\u9fff]/.test(ch)) { showErr('請輸入一個有效的中文漢字'); return; }

      const btn = document.getElementById('askBtn');
      btn.disabled = true;
      setMsg(
        `🔮 正在解析「${ch}」的字形結構… <span class="loading"></span>`,
        '✨ 占卜師正在閱讀字中玄機…',
        '⏳ 解讀天地之間的訊息…',
        '💫 靜候錦言…'
      );
      ['inTok','outTok','inCost','outCost'].forEach(id => document.getElementById(id).innerText = '—');
      document.getElementById('totalCost').innerText = '$…';

      try {
        const response = await fetch('/a9/divinate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({
            character: ch,
            theme: currentTheme,
            agent: currentAgent
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '占卜失敗');
        }

        const data = result.data;
        setMsg(
          `<strong>「${ch}」字形解析</strong><br>${data.analysis}`,
          data.luck,
          data.caution,
          `💫 ${data.tip}`
        );
        updateCost(data.agent, data.inp, data.out, data.pricing);

      } catch (err) {
        console.error('占卜錯誤:', err);
        setMsg(`⚠️ ${currentAgent.toUpperCase()} 占卜暫時中斷，請稍後再試。`, '', '', '');
        showErr(`${currentAgent.toUpperCase()} 錯誤：${err.message}`);
      } finally {
        btn.disabled = false;
      }
    }
  });
</script>
</body>
</html>