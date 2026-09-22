<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>V16.28 Wall · cards + Facebook + Generate HTML</title>
  <!-- ===== 共用樣式：編輯器與獨立牆共用 ===== -->
  <style id="wall-css">
    :root{--cloud:#F7F5F1;--teal:#0E7C7B;--green:#0A7A34;--yellow:#FFE27A;--ink:#111}
    *{box-sizing:border-box}
    html{scrollbar-gutter:stable}
    body{margin:0;padding:16px;background:var(--cloud);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",sans-serif}
    html:lang(zh-TW) body{font-family:-apple-system,"PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif}
    html:lang(zh-CN) body{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif}
    html:lang(ja) body{font-family:-apple-system,"Hiragino Sans","Yu Gothic UI","Noto Sans JP",sans-serif}
    html:lang(ko) body{font-family:-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
    html:lang(th) body{font-family:-apple-system,"Thonburi","Leelawadee UI","Noto Sans Thai",sans-serif}
    .masonry{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;margin-top:90px;position:relative;z-index:0}
    .item{flex:0 0 auto;max-width:100%;border-radius:18px;overflow:hidden;background:#111;border:2.5px solid var(--ink);position:relative;box-shadow:0 10px 24px rgba(0,0,0,.14);min-height:100px}
    .item iframe{width:100%;height:100%;border:0;display:block;background:#fff}
    .corner-tri{position:absolute;left:0;top:0;width:29px;height:29px;background:rgba(255,226,122,0.95);clip-path:polygon(0 0,100% 0,0 100%);z-index:5;pointer-events:none;border-right:1px solid var(--ink);border-bottom:1px solid var(--ink)}
    .corner-text{position:absolute;left:-8px;top:6px;width:36px;text-align:center;font-size:6.5px;font-weight:900;letter-spacing:-.2px;z-index:6;pointer-events:none;line-height:7px;color:var(--green);transform:rotate(-45deg);white-space:nowrap}
    .empty{padding:40px 16px;text-align:center;opacity:.55;font-weight:800}

    /* ===== Toolbar (unchanged look, lower z-index so panel sits above it) ===== */
    .fab-wrap{
      position:relative;
      top:10px;
      left:50%;
      transform:translateX(-50%);
      z-index:40;
      max-width:calc(100vw - 16px);
      display:flex;
      gap:8px;
      align-items:center;
      background:#fff;
      border:2.5px solid var(--ink);
      border-radius:999px;
      padding:6px 12px;
      box-shadow:0 8px 24px rgba(0,0,0,.15);
      flex-wrap:wrap;
      justify-content:center;
      width:max-content;
    }
    .fab{background:var(--teal);color:#fff;border:2px solid var(--ink);border-radius:999px;padding:9px 14px;font-weight:900;cursor:pointer;font-size:12px}
    .lang-select{border:2px solid var(--ink);border-radius:999px;padding:7px 10px;font-weight:800;background:#fff;font-size:12px}
    button,select{font-family:inherit}
    .fab{max-width:34vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .menu-wrap{position:relative;flex:0 0 auto}
    .pill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:2px solid var(--ink);border-radius:999px;padding:7px 10px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;color:var(--ink)}
    .pill.random{background:var(--yellow)}
    .pill .caret{font-size:9px;transition:transform .15s}
    .pill[aria-expanded="true"] .caret{transform:rotate(180deg)}
    .menu{position:absolute;top:calc(100% + 12px);left:50%;transform:translateX(-50%);min-width:176px;background:#fff;border:2.5px solid var(--ink);border-radius:16px;padding:6px;box-shadow:0 12px 28px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:2px;z-index:50}
    .menu[hidden]{display:none}
    .menu button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:10px;padding:9px 10px;font-size:12px;font-weight:800;text-align:left;cursor:pointer;color:var(--ink)}
    .menu button:hover,.menu button:focus-visible{background:var(--cloud);outline:none}
    .menu button.on{background:var(--ink);color:#fff}
    .menu button[data-cols="0"].on{background:var(--yellow);color:var(--ink);box-shadow:inset 0 0 0 2px var(--ink)}
    .menu hr{border:0;border-top:1.5px dashed rgba(0,0,0,.25);margin:4px 6px}
    .mi{display:inline-flex;justify-content:center;width:22px;flex:0 0 22px}
    .ci{display:inline-flex;gap:2px;width:20px;height:12px}.ci i{flex:1;background:currentColor;border-radius:1.5px}
    @media (max-width:560px){.pill .lbl{display:none}.fab{max-width:28vw}}
    @media (prefers-reduced-motion:reduce){.pill .caret{transition:none}}
    button:focus-visible,.tool-btn:focus-within,select:focus-visible{outline:3px solid var(--teal);outline-offset:2px}
    .fab.badge{cursor:default}
    .pill.shuffle:hover{background:var(--cloud)}
    .pill[aria-busy="true"]{opacity:.55;cursor:progress}
    body.shuffling iframe{pointer-events:none}
    body.shuffling{overflow-x:hidden}
    .menu button[data-cols="-1"].on{background:var(--teal);color:#fff}
    .globe{background:#fff;border:2.5px solid var(--ink);border-radius:50%;width:36px;height:36px;cursor:pointer;flex:0 0 auto}
    .gen-btn{background:var(--yellow);color:var(--ink);border:2px solid var(--ink);border-radius:999px;padding:9px 14px;font-weight:900;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
  </style>

  <!-- ===== 編輯器專用樣式 ===== -->
  <style>
    .del,.edit{position:absolute;top:6px;width:18px;height:18px;padding:0;border-radius:50%;border:0;cursor:pointer;z-index:7;font-weight:900;font-size:9px;line-height:18px;text-align:center;opacity:.35;transition:opacity .15s}
    .del{right:6px;background:rgba(0,0,0,.6);color:#fff}
    .edit{right:28px;background:rgba(255,255,255,.75);color:#111}
    .item:hover .del,.item:hover .edit,.del:focus-visible,.edit:focus-visible{opacity:1}
    @media (pointer:coarse){.del,.edit{width:22px;height:22px;line-height:22px;font-size:10px;opacity:.5}.edit{right:32px}}
    @media (prefers-reduced-motion:reduce){.del,.edit{transition:none}}
    .resize-anchor{position:absolute;right:0;bottom:0;width:44px;height:44px;cursor:nwse-resize;z-index:8;touch-action:none;background:linear-gradient(135deg,transparent 50%,rgba(255,226,122,0.95) 50%);border-left:2.5px solid var(--ink);border-top:2.5px solid var(--ink);border-radius:16px 0 0 0}
    .resize-anchor::after{content:'↘';position:absolute;right:6px;bottom:3px;font-weight:900;font-size:16px}
    body.resizing{user-select:none;cursor:nwse-resize}
    body.resizing iframe{pointer-events:none}

    /* ===== Import panel — now centered, above toolbar (z-index 120) ===== */
    .import-panel{
      position:fixed;
      inset:0;
      margin:auto;
      width:min(920px,96vw);
      max-height:92vh;
      background:#fff;
      border:2.5px solid var(--ink);
      border-radius:20px;
      padding:16px;
      display:flex;
      flex-direction:column;
      z-index:120;
      overflow:auto;
      box-shadow:0 20px 60px rgba(0,0,0,.35);
    }
    .import-panel.hidden{display:none}
    textarea{width:100%;flex:1;min-height:380px;border:2px solid var(--ink);border-radius:12px;padding:12px;font-family:monospace;background:var(--cloud);line-height:1.8;font-size:12px}
    .toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;align-items:center}
    .tool-btn{border:2px solid var(--ink);border-radius:999px;padding:8px 14px;font-size:11px;font-weight:800;cursor:pointer;background:#fff}
    .tool-btn.primary{background:var(--teal);color:#fff}
    .toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);background:var(--ink);color:#fff;padding:10px 16px;border-radius:999px;font-size:12px;font-weight:800;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:200;max-width:92vw}
    .toast.show{opacity:1;transform:translate(-50%,0)}
    @media (prefers-reduced-motion:reduce){.toast{transition:none}}

    /* ===== 生成 HTML 彈窗 ===== */
    .gen-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
    .gen-modal.hidden{display:none}
    .gen-box{background:#fff;border:2.5px solid var(--ink);border-radius:24px;width:min(960px,100%);max-height:90vh;display:flex;flex-direction:column;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    .gen-box h3{margin:0 0 12px;font-size:16px;display:flex;justify-content:space-between;align-items:center}
    .gen-box textarea{flex:1;min-height:300px;font-size:12px;background:#f8f6f0}
    .gen-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
    .gen-actions button{border:2px solid var(--ink);border-radius:999px;padding:9px 16px;font-weight:800;font-size:12px;cursor:pointer;background:#fff}
    .gen-actions button.primary{background:var(--teal);color:#fff}
    .gen-actions button.close{background:#ff8a80}
    .gen-modal .close-x{background:none;border:0;font-size:20px;cursor:pointer;font-weight:900;padding:0 6px}
    @media (max-width:560px){.gen-box{padding:14px}.gen-actions button{flex:1 1 auto}}

    /* ===== Header: 4 iframes in one row, responsive scaling ===== */
    .header-cards{
      display:flex;
      flex-wrap:nowrap;
      gap:18px;
      justify-content:flex-start;
      margin-bottom:8px;
      align-items:flex-start;
      overflow-x:auto;
      padding-bottom:12px;
    }
    .header-cards .item{flex:0 0 auto;transform-origin:top left;}

    @media (max-width:1400px){
      .header-cards .item:nth-child(1){width:400px !important;height:480px !important;}
      .header-cards .item:nth-child(2){width:214px !important;height:473px !important;}
      .header-cards .item:nth-child(3){width:214px !important;height:473px !important;}
      .header-cards .item:nth-child(4){width:400px !important;height:398px !important;}
    }
    @media (max-width:1100px){
      .header-cards .item:nth-child(1){width:320px !important;height:384px !important;}
      .header-cards .item:nth-child(2){width:171px !important;height:378px !important;}
      .header-cards .item:nth-child(3){width:171px !important;height:378px !important;}
      .header-cards .item:nth-child(4){width:320px !important;height:318px !important;}
    }
    @media (max-width:820px){
      .header-cards .item:nth-child(1){width:260px !important;height:312px !important;}
      .header-cards .item:nth-child(2){width:139px !important;height:307px !important;}
      .header-cards .item:nth-child(3){width:139px !important;height:307px !important;}
      .header-cards .item:nth-child(4){width:260px !important;height:259px !important;}
    }
    @media (max-width:600px){
      .header-cards .item:nth-child(1){width:200px !important;height:240px !important;}
      .header-cards .item:nth-child(2){width:107px !important;height:236px !important;}
      .header-cards .item:nth-child(3){width:107px !important;height:236px !important;}
      .header-cards .item:nth-child(4){width:200px !important;height:199px !important;}
    }
    @media (max-width:460px){
      .header-cards .item:nth-child(1){width:160px !important;height:192px !important;}
      .header-cards .item:nth-child(2){width:86px !important;height:189px !important;}
      .header-cards .item:nth-child(3){width:86px !important;height:189px !important;}
      .header-cards .item:nth-child(4){width:160px !important;height:159px !important;}
    }
  </style>
</head>
<body>
  <!-- ===== HEADER: four Facebook iframe cards in one row ===== -->
  <div class="header-cards">
    <!-- Facebook Page Timeline -->
    <div class="item" style="width:500px;height:600px;">
      <iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61591927593180&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true" width="500" height="600" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
    </div>

    <!-- Facebook Reel 1 -->
    <div class="item" style="width:267px;height:591px;">
      <iframe src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1300373618712982%2F&show_text=true&width=267&t=0" width="267" height="591" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>
    </div>

    <!-- Facebook Reel 2 -->
    <div class="item" style="width:267px;height:591px;">
      <iframe src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1781918356156485%2F&show_text=true&width=267&t=0" width="267" height="591" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen="true"></iframe>
    </div>

    <!-- Facebook Post -->
    <div class="item" style="width:500px;height:498px;">
      <iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3Dpfbid02dRJoXS2hMVx7YDaLTSEmyvh19EYfLxDeTMm2HEbixX1mEdqKM6aw3rcT5kCnsQZQl%26id%3D61591927593180&show_text=true&width=500" width="500" height="498" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
    </div>
  </div>
  <!-- ===== END HEADER CARDS ===== -->

  <!-- ===== 編輯器工具列 ===== -->
  <div class="fab-wrap">
    <button class="globe" onclick="openPanel()" data-i18n-aria="openEditor">🌍</button>
    <button id="fab" class="fab" onclick="openPanel()"><span id="idDisplay"></span></button>
    <span id="menuSlot"></span>
    <span id="shuffleSlot"></span>
    <button id="genHTMLBtn" class="gen-btn" onclick="openGenModal()">📄 <span data-i18n="genHTML">Generate HTML</span></button>
    <span id="langSlot"></span>
  </div>

  <div id="panel" class="import-panel hidden">
    <div style="display:flex;justify-content:space-between"><b>V16.28 <span data-i18n="title"></span> - <span id="idDisplay2"></span></b><button onclick="closePanel()" class="tool-btn" data-i18n-aria="close">✕</button></div>
    <div class="toolbar">
      <label class="tool-btn" style="background:#e3f2fd"><input type="file" id="fileUpload" accept=".json,.html,.htm,.txt" hidden>📥 <span data-i18n="upload"></span></label>
      <button class="tool-btn" style="background:#fff9c4" onclick="downloadJSON()">📤 <span data-i18n="download"></span></button>
      <button class="tool-btn" style="background:#f3e5f5;font-weight:900" onclick="copyFullHTML()">📋 <span data-i18n="copyWall"></span></button>
      <button class="tool-btn" style="background:#f3e5f5" onclick="downloadStandalone()">💾 <span data-i18n="dlWall"></span></button>
      <button class="tool-btn" style="background:#ff8a80" onclick="clearWall()">🗑️ <span data-i18n="clear"></span></button>
    </div>
    <div class="toolbar"><span style="font-size:10px;opacity:0.6" data-i18n="hint"></span></div>
    <textarea id="input"></textarea>
    <div style="display:flex;justify-content:space-between;margin-top:10px"><span id="count"></span><div style="display:flex;gap:8px"><button class="tool-btn" onclick="closePanel()" data-i18n="cancel"></button><button class="tool-btn primary" onclick="batchImport()" data-i18n="push"></button></div></div>
  </div>

  <!-- ===== 生成 HTML 彈窗 ===== -->
  <div id="genModal" class="gen-modal hidden">
    <div class="gen-box">
      <h3>
        <span>📄 <span data-i18n="genHTML">Generate HTML</span></span>
        <button class="close-x" onclick="closeGenModal()" aria-label="Close">✕</button>
      </h3>
      <textarea id="genCode" readonly spellcheck="false"></textarea>
      <div class="gen-actions">
        <button class="primary" onclick="copyGenCode()">📋 <span data-i18n="copyGen">Copy code</span></button>
        <button onclick="downloadGenCode()">💾 <span data-i18n="dlGen">Download .html</span></button>
        <button class="close" onclick="closeGenModal()" data-i18n="close">Close</button>
      </div>
    </div>
  </div>

  <div id="wall" class="masonry"></div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <!-- ===== 共用核心 ===== -->
  <script id="wall-core">
    (function(){
      const STD_W=340,STD_H=220,HTML_W=520,HTML_H=720,GRID=20,MIN=120,MAX=4000;
      const YT=/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtube-nocookie\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
      function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>ESC[c]);}
      function httpUrl(s){try{const u=new URL(String(s));return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';}catch(e){return '';}}
      function size(v,d){v=Math.round(Number(v));return Number.isFinite(v)&&v>=MIN&&v<=MAX?v:d;}
      function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}
      function sameOrigin(url){try{return new URL(url).origin===location.origin;}catch(e){return false;}}

      function normalize(o){
        if(!o||typeof o!=='object')return null;
        const raw=String(o._raw||o.html||o.url||'');
        const _id=/^[a-z0-9]{6,32}$/i.test(String(o._id||''))?o._id:uid();
        if(o.type==='youtube'){
          const id=/^[a-zA-Z0-9_-]{11}$/.test(String(o.id||''))?o.id:(String(o.embedSrc||o.url||raw).match(YT)||[])[1];
          return id?{_id,_raw:raw,type:'youtube',id,url:String(o.url||raw),w:size(o.w,STD_W),h:size(o.h,STD_H)}:null;
        }
        if(o.type==='html'){
          const html=String(o.html||raw);
          return html.trim()?{_id,_raw:raw||html,type:'html',html,w:size(o.w,HTML_W),h:size(o.h,HTML_H)}:null;
        }
        const url=httpUrl(o.url||raw);
        return url?{_id,_raw:raw||url,type:'web',url,w:size(o.w,STD_W),h:size(o.h,STD_H)}:null;
      }

      function frameHTML(o){
        if(o.type==='youtube')return `<iframe src="https://www.youtube-nocookie.com/embed/${esc(o.id)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
        if(o.type==='html')return `<iframe class="html-frame" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation" loading="lazy"></iframe>`;
        const sb=sameOrigin(o.url)?'allow-scripts allow-popups allow-forms':'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation';
        return `<iframe src="${esc(o.url)}" sandbox="${sb}" loading="lazy" allowfullscreen></iframe>`;
      }

      function cardHTML(o,ro){
        const tools=ro?'':'<button class="del" data-act="del" aria-label="'+esc(t('del'))+'">✕</button><button class="edit" data-act="edit" aria-label="'+esc(t('edit'))+'">✎</button><div class="resize-anchor"></div>';
        return `<div class="item" data-id="${esc(o._id)}" style="width:${o.w}px;height:${o.h}px"><div class="corner-tri"></div><div class="corner-text">${o.w}×${o.h}</div>${frameHTML(o)}${tools}</div>`;
      }

      function makeCard(o,ro){
        const t=document.createElement('template');t.innerHTML=cardHTML(o,ro);
        const el=t.content.firstElementChild;
        const f=el.querySelector('.html-frame');if(f)f.srcdoc=o.html;
        return el;
      }

      function renderAll(wall,list,ro){wall.replaceChildren(...list.map((o,i)=>{const el=makeCard(o,ro);el.style.order=i;return el;}));}

      function applySize(el,o){el.style.width=o.w+'px';el.style.height=o.h+'px';const t=el.querySelector('.corner-text');if(t)t.textContent=o.w+'×'+o.h;}

      function colSize(wall,n){
        const W=wall.clientWidth,gap=parseFloat(getComputedStyle(wall).columnGap)||18;
        const k=Math.max(1,Math.min(n,Math.floor((W+gap)/(MIN+gap))));
        const w=Math.max(MIN,Math.floor((W-gap*(k-1))/k));
        return {k,w,h:Math.max(MIN,Math.round(w*(k===1?0.5625:0.75)))};
      }
      function fitColumns(wall,list,n){
        const {w,h}=colSize(wall,n);
        list.forEach(o=>{o.w=w;o.h=h;});
        wall.querySelectorAll('.item').forEach(el=>{const o=list.find(x=>x._id===el.dataset.id);if(o)applySize(el,o);});
      }
      function watchWidth(wall,cb){
        let last=wall.clientWidth,raf=0;
        const run=()=>{raf=0;const W=wall.clientWidth;if(W!==last){last=W;cb();}};
        const kick=()=>{if(!raf)raf=requestAnimationFrame(run);};
        if('ResizeObserver' in window)new ResizeObserver(kick).observe(wall);else window.addEventListener('resize',kick);
      }
      const validCols=c=>Number.isInteger(c)&&c>=0&&c<=4;

      const I18N={"en": {"title": "Wall editor", "upload": "Upload", "download": "Download", "copyWall": "Copy standalone wall", "dlWall": "Download standalone wall", "clear": "Clear", "hint": "Enter adds a ━━━━ divider | Shift+Enter: line break only | No divider until embed code is closed | Ctrl+Enter: push to wall", "placeholder": "Paste URLs, one per line", "cancel": "Cancel", "push": "✓ Push to wall", "count": "{n} items", "layout": "Layout", "random": "Random", "cols": "{n} columns", "col1": "1 column", "openEditor": "Open editor", "close": "Close", "edit": "Edit", "language": "Language", "noInput": "No URLs or embed code found", "skipped": "Skipped {n} unrecognized line(s)", "storageFull": "⚠️ Not saved: browser storage is full or disabled. Download a backup first.", "emptyWall": "The wall is empty. Add content first.", "copied": "✓ Standalone wall HTML copied ({n} items)", "clipFallback": "Clipboard unavailable. Downloaded .html instead.", "downloaded": "✓ Standalone wall downloaded ({n} items)", "fileEmpty": "No usable content in this file", "loaded": "✓ Loaded {n} items", "loadedSkip": ", {n} skipped", "confirmClear": "Clear this wall?", "wallEmpty": "This wall has no content yet", "del": "Delete", "original": "Original", "shuffle": "Shuffle", "genHTML": "Generate HTML", "copyGen": "Copy code", "dlGen": "Download .html"}, "zh-TW": {"title": "牆面編輯", "upload": "上傳", "download": "下載", "copyWall": "複製獨立牆", "dlWall": "下載獨立牆", "clear": "清空", "hint": "Enter 自動加━━━━分隔｜Shift+Enter 純換行｜嵌入碼沒收尾前 Enter 不會插分隔｜Ctrl+Enter 推上牆", "placeholder": "貼網址，每行一個", "cancel": "取消", "push": "✓ 推上牆", "count": "{n} 組", "layout": "版面", "random": "自由隨機", "cols": "{n} 欄", "openEditor": "開啟編輯面板", "close": "關閉", "edit": "編輯", "language": "語言", "noInput": "沒抓到可用的網址或嵌入碼", "skipped": "已略過 {n} 行無法辨識的內容", "storageFull": "⚠️ 沒存到：瀏覽器儲存空間已滿或被停用，請先下載備份", "emptyWall": "牆是空的，先推內容上牆", "copied": "✓ 已複製獨立牆 HTML（{n} 組）", "clipFallback": "剪貼簿無法使用，已改為下載 .html", "downloaded": "✓ 已下載獨立牆（{n} 組）", "fileEmpty": "檔案裡沒有可用的內容", "loaded": "✓ 已載入 {n} 組", "loadedSkip": "，略過 {n} 組", "confirmClear": "清空這面牆？", "wallEmpty": "這面牆目前沒有內容", "del": "刪除", "original": "原始版面", "shuffle": "洗牌", "genHTML": "生成 HTML", "copyGen": "複製程式碼", "dlGen": "下載 .html"}, "zh-CN": {"title": "墙面编辑", "upload": "上传", "download": "下载", "copyWall": "复制独立墙", "dlWall": "下载独立墙", "clear": "清空", "hint": "Enter 自动加━━━━分隔｜Shift+Enter 纯换行｜嵌入码没收尾前 Enter 不会插分隔｜Ctrl+Enter 推上墙", "placeholder": "粘贴网址，每行一个", "cancel": "取消", "push": "✓ 推上墙", "count": "{n} 组", "layout": "版面", "random": "自由随机", "cols": "{n} 栏", "openEditor": "打开编辑面板", "close": "关闭", "edit": "编辑", "language": "语言", "noInput": "没抓到可用的网址或嵌入码", "skipped": "已跳过 {n} 行无法识别的内容", "storageFull": "⚠️ 没保存：浏览器存储空间已满或被禁用，请先下载备份", "emptyWall": "墙是空的，先推内容上墙", "copied": "✓ 已复制独立墙 HTML（{n} 组）", "clipFallback": "剪贴板无法使用，已改为下载 .html", "downloaded": "✓ 已下载独立墙（{n} 组）", "fileEmpty": "文件里没有可用的内容", "loaded": "✓ 已载入 {n} 组", "loadedSkip": "，跳过 {n} 组", "confirmClear": "清空这面墙？", "wallEmpty": "这面墙目前没有内容", "del": "删除", "original": "原始版面", "shuffle": "洗牌", "genHTML": "生成 HTML", "copyGen": "复制代码", "dlGen": "下载 .html"}, "ja": {"title": "ウォール編集", "upload": "アップロード", "download": "ダウンロード", "copyWall": "単体ウォールをコピー", "dlWall": "単体ウォールを保存", "clear": "クリア", "hint": "Enterで━━━━区切りを追加｜Shift+Enterは改行のみ｜埋め込みコードが閉じるまで区切りは入りません｜Ctrl+Enterでウォールに追加", "placeholder": "URLを1行に1つずつ貼り付け", "cancel": "キャンセル", "push": "✓ ウォールに追加", "count": "{n}件", "layout": "レイアウト", "random": "ランダム", "cols": "{n}列", "openEditor": "エディタを開く", "close": "閉じる", "edit": "編集", "language": "言語", "noInput": "URLや埋め込みコードが見つかりません", "skipped": "認識できない{n}行をスキップしました", "storageFull": "⚠️ 保存できません：ブラウザのストレージが満杯か無効です。先にバックアップをダウンロードしてください", "emptyWall": "ウォールが空です。先に内容を追加してください", "copied": "✓ 単体ウォールのHTMLをコピーしました（{n}件）", "clipFallback": "クリップボードが使えないため .html をダウンロードしました", "downloaded": "✓ 単体ウォールを保存しました（{n}件）", "fileEmpty": "このファイルに使える内容がありません", "loaded": "✓ {n}件を読み込みました", "loadedSkip": "（{n}件スキップ）", "confirmClear": "このウォールをクリアしますか？", "wallEmpty": "このウォールにはまだ内容がありません", "del": "削除", "original": "オリジナル", "shuffle": "シャッフル", "genHTML": "HTMLを生成", "copyGen": "コードをコピー", "dlGen": ".htmlをダウンロード"}, "ko": {"title": "월 편집", "upload": "업로드", "download": "다운로드", "copyWall": "독립 월 복사", "dlWall": "독립 월 저장", "clear": "비우기", "hint": "Enter로 ━━━━ 구분선 추가｜Shift+Enter는 줄바꿈만｜임베드 코드가 닫히기 전에는 구분선이 들어가지 않음｜Ctrl+Enter로 월에 올리기", "placeholder": "URL을 한 줄에 하나씩 붙여넣기", "cancel": "취소", "push": "✓ 월에 올리기", "count": "{n}개", "layout": "레이아웃", "random": "랜덤", "cols": "{n}열", "openEditor": "편집기 열기", "close": "닫기", "edit": "편집", "language": "언어", "noInput": "URL이나 임베드 코드를 찾지 못했습니다", "skipped": "인식할 수 없는 {n}줄을 건너뛰었습니다", "storageFull": "⚠️ 저장 실패: 브라우저 저장 공간이 가득 찼거나 꺼져 있습니다. 먼저 백업을 다운로드하세요", "emptyWall": "월이 비어 있습니다. 먼저 콘텐츠를 올리세요", "copied": "✓ 독립 월 HTML을 복사했습니다({n}개)", "clipFallback": "클립보드를 쓸 수 없어 .html로 다운로드했습니다", "downloaded": "✓ 독립 월을 저장했습니다({n}개)", "fileEmpty": "이 파일에 사용할 수 있는 내용이 없습니다", "loaded": "✓ {n}개를 불러왔습니다", "loadedSkip": ", {n}개 건너뜀", "confirmClear": "이 월을 비울까요?", "wallEmpty": "이 월에는 아직 콘텐츠가 없습니다", "del": "삭제", "original": "원본", "shuffle": "셔플", "genHTML": "HTML 생성", "copyGen": "코드 복사", "dlGen": ".html 다운로드"}, "th": {"title": "แก้ไขวอลล์", "upload": "อัปโหลด", "download": "ดาวน์โหลด", "copyWall": "คัดลอกวอลล์แบบแยก", "dlWall": "ดาวน์โหลดวอลล์แบบแยก", "clear": "ล้าง", "hint": "Enter เพิ่มเส้นคั่น ━━━━ | Shift+Enter ขึ้นบรรทัดใหม่อย่างเดียว | ยังไม่ใส่เส้นคั่นจนกว่าโค้ดฝังจะปิดแท็ก | Ctrl+Enter ส่งขึ้นวอลล์", "placeholder": "วาง URL บรรทัดละหนึ่งรายการ", "cancel": "ยกเลิก", "push": "✓ ส่งขึ้นวอลล์", "count": "{n} รายการ", "layout": "เลย์เอาต์", "random": "สุ่ม", "cols": "{n} คอลัมน์", "openEditor": "เปิดตัวแก้ไข", "close": "ปิด", "edit": "แก้ไข", "language": "ภาษา", "noInput": "ไม่พบ URL หรือโค้ดฝัง", "skipped": "ข้ามบรรทัดที่อ่านไม่ออก {n} บรรทัด", "storageFull": "⚠️ บันทึกไม่ได้: พื้นที่เบราว์เซอร์เต็มหรือถูกปิดไว้ โปรดดาวน์โหลดสำรองก่อน", "emptyWall": "วอลล์ยังว่างอยู่ เพิ่มเนื้อหาก่อน", "copied": "✓ คัดลอก HTML วอลล์แบบแยกแล้ว ({n} รายการ)", "clipFallback": "ใช้คลิปบอร์ดไม่ได้ จึงดาวน์โหลดเป็น .html แทน", "downloaded": "✓ ดาวน์โหลดวอลล์แบบแยกแล้ว ({n} รายการ)", "fileEmpty": "ไม่มีเนื้อหาที่ใช้ได้ในไฟล์นี้", "loaded": "✓ โหลดแล้ว {n} รายการ", "loadedSkip": " ข้าม {n} รายการ", "confirmClear": "ล้างวอลล์นี้หรือไม่?", "wallEmpty": "วอลล์นี้ยังไม่มีเนื้อหา", "del": "ลบ", "original": "ต้นฉบับ", "shuffle": "สับไพ่", "genHTML": "สร้าง HTML", "copyGen": "คัดลอกโค้ด", "dlGen": "ดาวน์โหลด .html"}};
      let LANG='en';
      function setLangCode(l){LANG=I18N[l]?l:'en';return LANG;}
      function getLang(){return LANG;}
      function t(k,v){let s=(I18N[LANG]||{})[k];if(s==null)s=I18N.en[k];if(s==null)s=k;return v?s.replace(/\{(\w+)\}/g,(_,x)=>v[x]!=null?v[x]:''):s;}
      function colsText(n){return t(n===1&&I18N[LANG].col1?'col1':'cols',{n});}
      function applyI18n(){
        document.documentElement.lang=LANG;
        document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
        document.querySelectorAll('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria));el.title=t(el.dataset.i18nAria);});
        document.querySelectorAll('[data-i18n-cols]').forEach(el=>{el.textContent=colsText(+el.dataset.i18nCols);});
        document.querySelectorAll('.item .del').forEach(b=>b.setAttribute('aria-label',t('del')));
        document.querySelectorAll('.item .edit').forEach(b=>b.setAttribute('aria-label',t('edit')));
      }
      const LANGS=[['en','EN'],['zh-TW','繁中'],['zh-CN','简中'],['ja','日本語'],['ko','한국어'],['th','ไทย']];
      function langSelectHTML(){return '<select id="lang" class="lang-select" data-i18n-aria="language">'+LANGS.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')+'</select>';}

      const bars=n=>'<span class="ci">'+'<i></i>'.repeat(n)+'</span>';
      function menuHTML(withOriginal){
        let items=withOriginal?'<button role="menuitemradio" data-cols="-1"><span class="mi">📌</span><span data-i18n="original"></span></button>':'';
        items+='<button role="menuitemradio" data-cols="0"><span class="mi">🎲</span><span data-i18n="random"></span></button><hr>';
        for(let n=1;n<=4;n++)items+='<button role="menuitemradio" data-cols="'+n+'"><span class="mi">'+bars(n)+'</span><span data-i18n-cols="'+n+'"></span></button>';
        return '<div class="menu-wrap" id="menuWrap"><button id="layoutBtn" class="pill" aria-haspopup="menu" aria-expanded="false" aria-controls="layoutMenu"><span class="mi" id="layoutIcon"></span><span class="lbl" id="layoutText"></span><span class="caret">▼</span></button><div id="layoutMenu" class="menu" role="menu" hidden>'+items+'</div></div>';
      }
      function updateLayoutUI(mode){
        document.querySelectorAll('#layoutMenu [data-cols]').forEach(b=>{const on=+b.dataset.cols===mode;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);});
        const txt=mode>0?colsText(mode):mode===0?t('random'):t('original');
        const icon=document.getElementById('layoutIcon');if(!icon)return;
        icon.innerHTML=mode>0?bars(mode):mode===0?'🎲':'📌';
        document.getElementById('layoutText').textContent=txt;
        const b=document.getElementById('layoutBtn');b.classList.toggle('random',mode===0);b.setAttribute('aria-label',t('layout')+': '+txt);b.title=t('layout');
      }
      function bindMenu(onPick){
        const menu=document.getElementById('layoutMenu'),btn=document.getElementById('layoutBtn'),wrap=document.getElementById('menuWrap');
        const items=()=>[...menu.querySelectorAll('button')];
        const open=()=>{menu.hidden=false;btn.setAttribute('aria-expanded','true');(menu.querySelector('.on')||items()[0]).focus();};
        const close=f=>{if(menu.hidden)return;menu.hidden=true;btn.setAttribute('aria-expanded','false');if(f)btn.focus();};
        btn.addEventListener('click',()=>menu.hidden?open():close(false));
        btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'&&menu.hidden){e.preventDefault();open();}});
        menu.addEventListener('click',e=>{const b=e.target.closest('[data-cols]');if(!b)return;close(true);onPick(+b.dataset.cols);});
        menu.addEventListener('keydown',e=>{
          const it=items(),i=it.indexOf(document.activeElement);
          if(e.key==='ArrowDown'){e.preventDefault();it[(i+1)%it.length].focus();}
          else if(e.key==='ArrowUp'){e.preventDefault();it[(i-1+it.length)%it.length].focus();}
          else if(e.key==='Home'){e.preventDefault();it[0].focus();}
          else if(e.key==='End'){e.preventDefault();it[it.length-1].focus();}
          else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}
          else if(e.key==='Tab')close(false);
        });
        document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!wrap.contains(e.target))close(false);});
      }

      function shuffled(a){
        if(a.length<2)return a.slice();
        let b;do{b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}}
        while(b.every((o,i)=>o===a[i]));
        return b;
      }
      function shuffleBtnHTML(){return '<button id="shuffleBtn" class="pill shuffle" data-i18n-aria="shuffle"><span class="mi">🔀</span><span class="lbl" data-i18n="shuffle"></span></button>';}
      let busy=false;
      async function reorderAnimated(wall,next,commit){
        if(busy)return false;
        const els=new Map([...wall.querySelectorAll('.item')].map(el=>[el.dataset.id,el]));
        const apply=()=>{next.forEach((o,i)=>{const el=els.get(o._id);if(el)el.style.order=i;});if(commit)commit();};
        const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(reduce||typeof Element.prototype.animate!=='function'||els.size<2){apply();return true;}
        busy=true;document.body.classList.add('shuffling');
        const btn=document.getElementById('shuffleBtn');if(btn)btn.setAttribute('aria-busy','true');
        const cards=[...els.values()].sort((a,b)=>(+a.style.order||0)-(+b.style.order||0));
        try{
          const cx=innerWidth/2,cy=innerHeight/2,CARD=150,n=cards.length;
          const info=new Map(cards.map(el=>{const r=el.getBoundingClientRect();return [el,{r,s:Math.min(1,CARD/Math.max(1,r.width)),rot:Math.random()*14-7}];}));
          const T=(el,dx=0,rot=0)=>{const f=info.get(el);return `translate(${cx-(f.r.left+f.r.width/2)+dx}px,${cy-(f.r.top+f.r.height/2)}px) rotate(${f.rot+rot}deg) scale(${f.s})`;};
          const setZ=list=>list.forEach((el,k)=>{el.style.zIndex=String(1+k);});
          setZ(cards);
          const g=Math.min(35,520/n);
          await Promise.all(cards.map((el,k)=>el.animate([{transform:'none'},{transform:T(el)}],
            {duration:480,delay:k*g,easing:'cubic-bezier(.55,0,.25,1)',fill:'forwards'}).finished));
          const dealOrder=next.map(o=>els.get(o._id)).filter(Boolean);
          for(let pass=0;pass<2;pass++){
            const stackNow=[...cards].sort((a,b)=>(+a.style.zIndex)-(+b.style.zIndex));
            const half=Math.ceil(n/2),L=stackNow.slice(0,half),R=stackNow.slice(half);
            const woven=[];for(let i=0;i<half;i++){if(L[i])woven.push(L[i]);if(R[i])woven.push(R[i]);}
            const zAfter=pass===0?woven:[...dealOrder].reverse();
            const anims=stackNow.map((el,k)=>{const side=k<half?-1:1;
              return el.animate([{transform:T(el)},{transform:T(el,side*120,side*8),offset:.45},{transform:T(el)}],
                {duration:600,delay:(k%half)*8,easing:'ease-in-out',fill:'forwards'}).finished;});
            setTimeout(()=>setZ(zAfter),300);
            await Promise.all(anims);
          }
          cards.forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
          apply();
          dealOrder.forEach((el,k)=>{info.get(el).r=el.getBoundingClientRect();el.style.zIndex=String(n+1-k);});
          const d=Math.min(80,1200/n);
          await Promise.all(dealOrder.map((el,k)=>el.animate([{transform:T(el)},{transform:'none'}],
            {duration:560,delay:k*d,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}).finished));
        }catch(e){cards.forEach(el=>el.getAnimations().forEach(a=>a.cancel()));apply();}
        finally{
          cards.forEach(el=>{el.style.zIndex='';});
          document.body.classList.remove('shuffling');
          if(btn)btn.removeAttribute('aria-busy');
          busy=false;
        }
        return true;
      }
      function randomSize(o){return {...o,w:Math.round((240+Math.random()*360)/GRID)*GRID,h:Math.round((180+Math.random()*380)/GRID)*GRID};}

      function bootReadonly(){
        let d={};try{d=JSON.parse(document.getElementById('wall-data').textContent);}catch(e){}
        const arr=Array.isArray(d)?d:(Array.isArray(d.list)?d.list:[]);
        const items=arr.map(normalize).filter(Boolean);
        const orig=new Map(items.map((o,i)=>[o._id,{w:o.w,h:o.h,i}]));
        const byId=new Map(items.map(o=>[o._id,o]));
        const id=String(d.id||'');
        const authorMode=validCols(d.cols)&&d.cols>0?d.cols:-1;
        const VKEY='wall_view_'+(id||'default');
        let pref={};try{pref=JSON.parse(localStorage.getItem(VKEY)||'{}')||{};}catch(e){}
        let mode=[-1,0,1,2,3,4].includes(pref.mode)?pref.mode:authorMode;
        setLangCode(I18N[pref.lang]?pref.lang:d.lang);
        const savePref=()=>{try{localStorage.setItem(VKEY,JSON.stringify({mode,lang:LANG}));}catch(e){}};

        document.body.insertAdjacentHTML('afterbegin','<div class="fab-wrap"><span class="fab badge">'+esc(id||'Wall')+'</span>'+menuHTML(true)+shuffleBtnHTML()+langSelectHTML()+'</div>');
        if(id)document.title=id;
        const wall=document.getElementById('wall');
        let empty=null;
        if(items.length)renderAll(wall,items,true);
        else{empty=document.createElement('div');empty.className='empty';wall.replaceChildren(empty);}

        function apply(){
          if(mode===-1)items.forEach(o=>{const g=orig.get(o._id);o.w=g.w;o.h=g.h;});
          else if(mode===0)items.forEach((o,i)=>{items[i]=Object.assign(o,randomSize(o));});
          if(mode>0)fitColumns(wall,items,mode);
          else wall.querySelectorAll('.item').forEach(el=>{const o=byId.get(el.dataset.id);if(o)applySize(el,o);});
          updateLayoutUI(mode);
        }
        function applyLangUI(){applyI18n();updateLayoutUI(mode);if(empty)empty.textContent=t('wallEmpty');}

        const reorder=next=>reorderAnimated(wall,next,()=>{items.splice(0,items.length,...next);});
        bindMenu(n=>{mode=n;savePref();apply();
          if(n===-1){const back=[...items].sort((a,b)=>orig.get(a._id).i-orig.get(b._id).i);if(back.some((o,i)=>o!==items[i]))reorder(back);}});
        document.getElementById('shuffleBtn').addEventListener('click',()=>{if(items.length>1)reorder(shuffled(items));});
        const sel=document.getElementById('lang');sel.value=LANG;
        sel.addEventListener('change',()=>{setLangCode(sel.value);applyLangUI();savePref();});
        applyLangUI();apply();
        watchWidth(wall,()=>{if(mode>0)fitColumns(wall,items,mode);});
      }

      window.WallCore={STD_W,STD_H,GRID,MIN,YT,esc,httpUrl,normalize,makeCard,renderAll,applySize,fitColumns,watchWidth,validCols,bootReadonly,
        I18N,t,colsText,setLangCode,getLang,applyI18n,langSelectHTML,menuHTML,updateLayoutUI,bindMenu,randomSize,
        shuffled,shuffleBtnHTML,reorderAnimated};
    })();
  </script>

  <!-- ===== 編輯器 ===== -->
  <script>
    const {GRID,MIN,YT,esc,httpUrl,normalize,makeCard,applySize,fitColumns,watchWidth,validCols,I18N,t,getLang,randomSize}=WallCore;
    const $=id=>document.getElementById(id);
    const wall=$('wall'),ta=$('input');
    $('menuSlot').outerHTML=WallCore.menuHTML(false);
    $('langSlot').outerHTML=WallCore.langSelectHTML();
    $('shuffleSlot').outerHTML=WallCore.shuffleBtnHTML();
    $('lang').addEventListener('change',e=>setLang(e.target.value));

    function applyLang(){
      WallCore.applyI18n();
      ta.placeholder=t('placeholder')+'\nhttps://example.com\nhttps://www.youtube.com/watch?v=xxxxxxxxxxx\n<iframe src=...></iframe>';
      updateCount();WallCore.updateLayoutUI(cols);
    }

    function getWallId(){
      const DEF='一起維基';
      const m=location.href.match(/ez\.wiki\/([A-Za-z0-9]+)/);if(m)return m[1];
      if(!/^https?:$/.test(location.protocol))return DEF;
      const p=location.pathname.split('/').filter(Boolean)[0]||'';
      return /^[A-Za-z0-9_-]+$/.test(p)&&!/^(srcdoc|blank)$/i.test(p)?p:DEF;
    }
    const WALL_ID=getWallId();const KEY=`wiki_wall_${WALL_ID}`;
    if(WALL_ID==='一起維基'){try{
      const OLD='wiki_wall_srcdoc';
      if(localStorage.getItem(KEY)===null&&localStorage.getItem(OLD)!==null){
        localStorage.setItem(KEY,localStorage.getItem(OLD));
        const c=localStorage.getItem(OLD+'_cols');if(c!==null)localStorage.setItem(KEY+'_cols',c);
      }
    }catch(e){}}
    $('idDisplay').textContent=WALL_ID;$('idDisplay2').textContent=WALL_ID;

    function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.map(normalize).filter(Boolean):[];}catch(e){return [];}}
    function save(){try{localStorage.setItem(KEY,JSON.stringify(list));return true;}catch(e){toast(t('storageFull'));return false;}}
    let list=load();

    let toastT;
    function toast(m){const el=$('toast');el.textContent=m;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2800);}
    function updateCount(){$('count').textContent=t('count',{n:list.length});}

    const SEP='━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const isSep=s=>/^[━─—\-=]{3,}$/.test(s.trim());
    const VOID=/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
    function tagDepth(s){let d=0,m;const re=/<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g;while((m=re.exec(s))){if(VOID.test(m[2])||m[3])continue;d+=m[1]?-1:1;}return d;}
    function closed(s){return s.lastIndexOf('<')<=s.lastIndexOf('>')&&tagDepth(s)<=0;}

    function splitBlocks(text){
      const out=[];let buf=null;
      for(const rawLine of text.split(/\r?\n/)){
        const line=rawLine.trim();
        if(buf!==null){
          if(isSep(line)||(/^https?:\/\/\S+$/i.test(line)&&buf.lastIndexOf('<')<=buf.lastIndexOf('>'))){out.push(buf.trim());buf=null;}
          else{buf+='\n'+rawLine;if(closed(buf)){out.push(buf.trim());buf=null;}continue;}
        }
        if(!line||isSep(line))continue;
        if(line.startsWith('<')){
          if(/^<script\b/i.test(line)&&out.length&&out[out.length-1].startsWith('<'))buf=out.pop()+'\n'+rawLine;
          else buf=rawLine;
          if(closed(buf)){out.push(buf.trim());buf=null;}
          continue;
        }
        const found=line.match(/https?:\/\/[^\s"'<>]+/gi);
        if(found)out.push(...found);else out.push(line);
      }
      if(buf!==null)out.push(buf.trim());
      return out;
    }

    function makeItem(raw){
      raw=raw.trim();if(!raw)return null;
      if(raw.startsWith('<')){
        const src=((raw.match(/\bsrc=["']([^"']+)["']/i)||[])[1]||'').replace(/&amp;/g,'&');
        const yt=src.match(YT);
        if(yt)return normalize({_raw:raw,type:'youtube',id:yt[1],url:src});
        if(/^<iframe\b[^>]*>\s*<\/iframe>$/i.test(raw)){const u=httpUrl(src);if(u)return normalize({_raw:raw,type:'web',url:u});}
        return normalize({_raw:raw,type:'html',html:raw});
      }
      const yt=raw.match(YT);if(yt)return normalize({_raw:raw,type:'youtube',id:yt[1],url:raw});
      let s=raw;
      if(!/^https?:\/\//i.test(s)){if(/\s/.test(s)||!/^[^\/\s]+\.[a-z]{2,}(\/|:|$)/i.test(s))return null;s='https://'+s;}
      const u=httpUrl(s);return u?normalize({_raw:raw,type:'web',url:u}):null;
    }

    function parseBatch(text){
      text=String(text||'').trim();if(!text)return {items:[],skipped:0};
      if(/^[\[{]/.test(text)){
        try{
          const obj=JSON.parse(text);
          const arr=Array.isArray(obj)?obj:(obj.list||obj.current||obj.data);
          if(Array.isArray(arr)){const items=arr.map(o=>normalize(o&&typeof o==='object'?{...o,_id:null}:null)).filter(Boolean);return {items,skipped:arr.length-items.length,cols:validCols(obj.cols)?obj.cols:undefined};}
        }catch(e){}
      }
      const items=[];let skipped=0;
      splitBlocks(text).forEach(b=>{const it=makeItem(b);it?items.push(it):skipped++;});
      return {items,skipped};
    }

    function render(){
      const keep=new Set(list.map(o=>o._id));
      [...wall.children].forEach(el=>{if(!keep.has(el.dataset.id))el.remove();});
      const have=new Map([...wall.children].map(el=>[el.dataset.id,el]));
      list.forEach((o,i)=>{
        let el=have.get(o._id);
        if(!el){el=makeCard(o,false);wall.appendChild(el);}
        applySize(el,o);el.style.order=i;
      });
      updateCount();
    }

    function openPanel(i){
      if(Number.isInteger(i)&&list[i]){ta.value=list[i]._raw.trim();ta.dataset.editIndex=i;}
      else{ta.value=list.length?list.map(o=>o._raw.trim()).join('\n'+SEP+'\n')+'\n'+SEP+'\n':'';delete ta.dataset.editIndex;}
      updateCount();$('panel').classList.remove('hidden');ta.focus();
      const end=ta.value.length;ta.setSelectionRange(end,end);ta.scrollTop=ta.scrollHeight;
    }

    function insertText(txt,at){
      ta.focus();ta.setSelectionRange(at,at);
      let ok=false;try{ok=document.execCommand('insertText',false,txt);}catch(e){}
      if(!ok)ta.setRangeText(txt,at,at,'end');
    }
    ta.addEventListener('keydown',e=>{
      if(e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.keyCode===229)return;
      if(ta.dataset.editIndex!==undefined&&ta.dataset.editIndex!=='')return;
      const v=ta.value,pos=ta.selectionStart;if(pos!==ta.selectionEnd)return;
      const ls=v.lastIndexOf('\n',pos-1)+1;let le=v.indexOf('\n',pos);if(le<0)le=v.length;
      if(!v.slice(ls,le).trim()||isSep(v.slice(ls,le)))return;
      const lines=v.slice(0,le).split('\n'),seg=[];
      for(let k=lines.length-1;k>=0&&!isSep(lines[k]);k--)seg.unshift(lines[k]);
      const s=seg.join('\n').trim();
      if(s.startsWith('<')&&!closed(s))return;
      e.preventDefault();
      if(le<v.length){
        const ne=v.indexOf('\n',le+1),next=v.slice(le+1,ne<0?v.length:ne);
        if(isSep(next)){if(ne<0)insertText('\n',v.length);else ta.setSelectionRange(ne+1,ne+1);return;}
      }
      insertText('\n'+SEP+'\n',le);
    });
    function closePanel(){$('panel').classList.add('hidden');}
    function setLang(l){l=WallCore.setLangCode(l);try{localStorage.setItem('wiki_lang',l);}catch(e){}$('lang').value=l;applyLang();}

    function batchImport(){
      const r=parseBatch(ta.value),{items,skipped}=r;
      if(!items.length){toast(t('noInput'));return;}
      const idx=ta.dataset.editIndex;
      if(idx!==undefined&&idx!==''){
        const i=parseInt(idx,10),old=list[i];
        if(old){items[0].w=old.w;items[0].h=old.h;list.splice(i,1,...items);}else list.push(...items);
      }else{
        const pool=new Map();
        list.forEach(o=>{if(!pool.has(o._raw))pool.set(o._raw,[]);pool.get(o._raw).push(o);});
        list=items.map(o=>{const q=pool.get(o._raw),old=q&&q.shift();return old?{...o,_id:old._id,w:old.w,h:old.h}:o;});
      }
      if(r.cols!==undefined)setCols(r.cols);
      save();render();refit();closePanel();
      if(skipped)toast(t('skipped',{n:skipped}));
    }

    wall.addEventListener('click',e=>{
      const b=e.target.closest('[data-act]');if(!b)return;
      const el=b.closest('.item'),i=list.findIndex(x=>x._id===el.dataset.id);if(i<0)return;
      if(b.dataset.act==='del'){list.splice(i,1);save();el.remove();updateCount();}
      else openPanel(i);
    });

    wall.addEventListener('pointerdown',e=>{
      const a=e.target.closest('.resize-anchor');if(!a)return;
      const el=a.closest('.item'),o=list.find(x=>x._id===el.dataset.id);if(!o)return;
      e.preventDefault();
      try{a.setPointerCapture(e.pointerId);}catch(err){}
      document.body.classList.add('resizing');
      const sx=e.clientX,sy=e.clientY,sw=el.offsetWidth,sh=el.offsetHeight;
      const move=ev=>{
        o.w=Math.max(MIN,Math.round((sw+ev.clientX-sx)/GRID)*GRID);
        o.h=Math.max(MIN,Math.round((sh+ev.clientY-sy)/GRID)*GRID);
        applySize(el,o);
      };
      const up=()=>{
        a.removeEventListener('pointermove',move);a.removeEventListener('pointerup',up);a.removeEventListener('pointercancel',up);
        document.body.classList.remove('resizing');if(cols)setCols(0);save();
      };
      a.addEventListener('pointermove',move);a.addEventListener('pointerup',up);a.addEventListener('pointercancel',up);
    });

    const LKEY=KEY+'_cols';
    let cols=0;try{const c=parseInt(localStorage.getItem(LKEY),10);if(validCols(c))cols=c;}catch(e){}
    function setCols(n){cols=n;try{localStorage.setItem(LKEY,String(n));}catch(e){}WallCore.updateLayoutUI(n);}
    WallCore.bindMenu(n=>{if(n>0)columnLayout(n);else randomLayout();});
    function refit(){if(cols&&list.length){fitColumns(wall,list,cols);save();}}
    function columnLayout(n){setCols(n);refit();}
    watchWidth(wall,refit);

    function randomLayout(){
      setCols(0);
      list=list.map(randomSize);
      save();render();
    }
    async function shuffleWall(){
      if(list.length<2)return;
      const next=WallCore.shuffled(list);
      await WallCore.reorderAnimated(wall,next,()=>{list=next;save();});
    }
    $('shuffleBtn').addEventListener('click',shuffleWall);
    function clearWall(){if(!confirm(t('confirmClear')))return;list=[];save();render();}

    function exportItem(o){const r={_raw:o._raw,type:o.type,w:o.w,h:o.h};if(o.type==='youtube'){r.id=o.id;r.url=o.url;}else if(o.type==='html'){r.html=o.html;}else{r.url=o.url;}return r;}
    function downloadText(text,type,name){
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    }
    function downloadJSON(){downloadText(JSON.stringify({id:WALL_ID,count:list.length,cols,list:list.map(exportItem)},null,2),'application/json',WALL_ID+'-random.json');}

    function buildStandalone(){
      const css=$('wall-css').textContent;
      const core=$('wall-core').textContent;
      const data=JSON.stringify({id:WALL_ID,count:list.length,cols,lang:getLang(),list:list.map(exportItem)})
        .replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
      return '<!DOCTYPE html>\n<html lang="'+getLang()+'"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>'+esc(WALL_ID)+'</title>'
        +'<style>'+css+'</style></head><body class="ro"><div id="wall" class="masonry"></div>'
        +'<script id="wall-data" type="application/json">'+data+'<\/script>'
        +'<script>'+core+'<\/script><script>WallCore.bootReadonly();<\/script></body></html>';
    }
    function legacyCopy(text){
      const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;left:-9999px;top:0';
      document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();return ok;
    }
    async function copyFullHTML(){
      if(!list.length){toast(t('emptyWall'));return;}
      const html=buildStandalone();
      try{await navigator.clipboard.writeText(html);toast(t('copied',{n:list.length}));return;}catch(e){}
      if(legacyCopy(html)){toast(t('copied',{n:list.length}));return;}
      downloadText(html,'text/html',WALL_ID+'-wall.html');toast(t('clipFallback'));
    }
    function downloadStandalone(){
      if(!list.length){toast(t('emptyWall'));return;}
      downloadText(buildStandalone(),'text/html',WALL_ID+'-wall.html');toast(t('downloaded',{n:list.length}));
    }

    /* ===== 生成 HTML 彈窗 ===== */
    function openGenModal(){
      if(!list.length){toast(t('emptyWall'));return;}
      const html=buildStandalone();
      $('genCode').value=html;
      $('genModal').classList.remove('hidden');
      $('genCode').focus();
      $('genCode').setSelectionRange(0,0);
    }
    function closeGenModal(){ $('genModal').classList.add('hidden'); }
    async function copyGenCode(){
      const code=$('genCode').value;
      if(!code)return;
      try{ await navigator.clipboard.writeText(code); toast(t('copied',{n:list.length})); return; }catch(e){}
      if(legacyCopy(code)){ toast(t('copied',{n:list.length})); return; }
      toast(t('clipFallback'));
    }
    function downloadGenCode(){
      const code=$('genCode').value;
      if(!code)return;
      downloadText(code,'text/html',WALL_ID+'-wall.html');
      toast(t('downloaded',{n:list.length}));
    }
    $('genModal').addEventListener('click',e=>{ if(e.target===$('genModal')) closeGenModal(); });

    $('fileUpload').addEventListener('change',function(e){
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=ev=>{
        let txt=String(ev.target.result||'');
        const m=txt.match(/<script id="wall-data" type="application\/json">([\s\S]*?)<\/script>/);if(m)txt=m[1];
        const r=parseBatch(txt),{items,skipped}=r;
        if(!items.length){toast(t('fileEmpty'));return;}
        list=items;if(r.cols!==undefined)setCols(r.cols);save();render();refit();closePanel();
        toast(t('loaded',{n:items.length})+(skipped?t('loadedSkip',{n:skipped}):''));
      };
      r.readAsText(f);this.value='';
    });

    document.addEventListener('keydown',e=>{
      if($('panel').classList.contains('hidden') && $('genModal').classList.contains('hidden'))return;
      if(e.key==='Escape'){ closePanel(); closeGenModal(); }
      else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey) && !$('panel').classList.contains('hidden')){e.preventDefault();batchImport();}
    });

    (function init(){let l=null;try{l=localStorage.getItem('wiki_lang');}catch(e){}setCols(cols);setLang(I18N[l]?l:'en');render();refit();})();
  </script>
</body>
</html>