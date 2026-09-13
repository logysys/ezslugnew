<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MD Composer</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<style>
  :root {
    --ground: #f6f7fa;
    --surface: #ffffff;
    --surface-2: #eef0f5;
    --ink: #1a1f29;
    --ink-soft: #5c6577;
    --ink-faint: #8890a0;
    --line: #dce0e7;
    --accent: #3454d1;
    --accent-ink: #ffffff;
    --accent-soft: #e7ebfc;
    --good: #2f8f5b;
    --good-soft: #e4f5ec;
    --warn: #b7791f;
    --warn-soft: #fbf0dd;
    --shadow: 0 1px 2px rgba(26, 31, 41, 0.04), 0 8px 24px -12px rgba(26, 31, 41, 0.12);
    color-scheme: light;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #12151c;
      --surface: #1a1e27;
      --surface-2: #20242f;
      --ink: #e7e9ee;
      --ink-soft: #9aa2b2;
      --ink-faint: #6b7385;
      --line: #2b303c;
      --accent: #8093ff;
      --accent-ink: #12151c;
      --accent-soft: #242b4a;
      --good: #4fc786;
      --good-soft: #16261e;
      --warn: #e0a94d;
      --warn-soft: #2e2415;
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 28px -14px rgba(0, 0, 0, 0.6);
      color-scheme: dark;
    }
  }

  :root[data-theme="dark"] {
    --ground: #12151c;
    --surface: #1a1e27;
    --surface-2: #20242f;
    --ink: #e7e9ee;
    --ink-soft: #9aa2b2;
    --ink-faint: #6b7385;
    --line: #2b303c;
    --accent: #8093ff;
    --accent-ink: #12151c;
    --accent-soft: #242b4a;
    --good: #4fc786;
    --good-soft: #16261e;
    --warn: #e0a94d;
    --warn-soft: #2e2415;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 28px -14px rgba(0, 0, 0, 0.6);
    color-scheme: dark;
  }

  * { box-sizing: border-box; }

  body {
    background: var(--ground);
    color: var(--ink);
    font-family: "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.5;
  }

  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px 28px 64px;
  }

  header.top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
  }

  .brand h1 {
    font-family: "Fraunces", Georgia, "Iowan Old Style", serif;
    font-optical-sizing: auto;
    font-weight: 600;
    font-size: 32px;
    letter-spacing: -0.01em;
    margin: 0;
    text-wrap: balance;
  }

  .brand h1 .mark {
    color: var(--accent);
  }

  .tagline {
    color: var(--ink-soft);
    font-size: 15px;
    max-width: 38ch;
    margin: 6px 0 0;
  }

  .badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 100px;
    background: var(--good-soft);
    color: var(--good);
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .badge-pill .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .workspace {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    align-items: stretch;
  }

  @media (max-width: 880px) {
    .workspace { grid-template-columns: 1fr; }
    .controls { flex-direction: row; justify-content: center; }
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    min-height: 480px;
    overflow: hidden;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--line);
    background: var(--surface-2);
    gap: 10px;
  }

  .panel-head h2 {
    font-size: 12.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    margin: 0;
  }

  textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    padding: 18px;
    font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink);
    background: transparent;
    width: 100%;
  }

  textarea::placeholder { color: var(--ink-faint); }

  .panel-foot {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid var(--line);
  }

  .field-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .field-row label {
    font-size: 12px;
    color: var(--ink-faint);
    white-space: nowrap;
    min-width: 84px;
    padding-top: 7px;
  }

  .field-row input,
  .field-row textarea {
    flex: 1;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 12.5px;
    color: var(--ink);
    background: var(--surface);
    outline: none;
    min-width: 0;
  }

  .field-row textarea {
    font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    resize: vertical;
    min-height: 40px;
    max-height: 100px;
  }

  .field-row input:focus, .field-row textarea:focus { border-color: var(--accent); }

  .opt-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 3px;
  }

  .opt-btn {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink-soft);
    font-size: 12px;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 100px;
    cursor: pointer;
  }

  .opt-btn[aria-pressed="true"] {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }

  .text-btn {
    border: none;
    background: none;
    color: var(--ink-soft);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 6px;
  }

  .text-btn:hover { color: var(--ink); background: var(--surface-2); }
  .text-btn:focus-visible, button:focus-visible, .tab:focus-visible, input:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 4px;
  }

  .compose-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 19px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
    transition: transform 0.12s ease;
    flex-shrink: 0;
  }

  .compose-btn:hover { transform: scale(1.06); }
  .compose-btn:active { transform: scale(0.96); }

  .compose-label {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ink-faint);
    text-align: center;
    letter-spacing: 0.03em;
    max-width: 90px;
  }

  .arrow {
    color: var(--ink-faint);
    font-size: 18px;
    display: none;
  }

  @media (min-width: 881px) {
    .arrow { display: block; }
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .head-divider {
    width: 1px;
    height: 18px;
    background: var(--line);
    flex-shrink: 0;
  }

  .format-toggle {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    flex-shrink: 0;
  }

  .fmt-btn {
    border: none;
    background: none;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 4px 9px;
    border-radius: 6px;
    color: var(--ink-faint);
    cursor: pointer;
  }

  .fmt-btn[aria-pressed="true"] {
    background: var(--accent);
    color: var(--accent-ink);
  }

  .tabs {
    display: flex;
    gap: 4px;
  }

  .tab {
    border: none;
    background: none;
    color: var(--ink-faint);
    font-size: 12.5px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 7px;
    cursor: pointer;
  }

  .tab[aria-selected="true"] {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }

  .output-body {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .output-view {
    position: absolute;
    inset: 0;
    overflow: auto;
  }

  .output-view[hidden] { display: none; }

  #sourceView {
    margin: 0;
    padding: 18px;
    font-family: "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--ink);
  }

  #previewView {
    padding: 20px 22px;
  }

  #previewView h1, #previewView h2, #previewView h3 {
    font-family: "Fraunces", Georgia, serif;
    font-weight: 600;
    line-height: 1.25;
    margin: 1.1em 0 0.4em;
    text-wrap: balance;
  }
  #previewView h1:first-child, #previewView h2:first-child, #previewView h3:first-child { margin-top: 0; }
  #previewView h1 { font-size: 24px; }
  #previewView h2 { font-size: 19px; }
  #previewView h3 { font-size: 16px; }
  #previewView p { margin: 0.65em 0; }
  #previewView ul, #previewView ol { margin: 0.5em 0; padding-left: 1.4em; }
  #previewView li { margin: 0.25em 0; }
  #previewView li.task { list-style: none; margin-left: -1.4em; padding-left: 0; }
  #previewView li.task input { margin-right: 7px; }
  #previewView code {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    background: var(--surface-2);
    padding: 0.1em 0.4em;
    border-radius: 5px;
    font-size: 0.88em;
  }
  #previewView pre {
    background: var(--surface-2);
    padding: 12px 14px;
    border-radius: 9px;
    overflow-x: auto;
    border: 1px solid var(--line);
  }
  #previewView pre code { background: none; padding: 0; }
  #previewView blockquote {
    margin: 0.7em 0;
    padding: 2px 14px;
    border-left: 3px solid var(--accent);
    color: var(--ink-soft);
  }
  #previewView hr { border: none; border-top: 1px solid var(--line); margin: 1.3em 0; }
  #previewView a { color: var(--accent); }
  #previewView strong { font-weight: 700; }
  #previewView iframe {
    display: block;
    max-width: 100%;
    margin: 0.8em 0;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--surface-2);
  }

  .output-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font-size: 12.5px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
  }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
  .copy-btn.copied { background: var(--good-soft); border-color: var(--good); color: var(--good); }

  .status-row {
    min-height: 20px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .status-row.warn { color: var(--warn); }

  footer.note {
    margin-top: 22px;
    font-size: 12.5px;
    color: var(--ink-faint);
    text-align: center;
  }
</style>
</head>
<body>

<div class="page">
  <header class="top">
    <div>
      <div class="brand">
        <h1>MD <span class="mark">Composer</span></h1>
        <span class="badge-pill"><span class="dot"></span>No AI · runs in your browser</span>
      </div>
      <p class="tagline">Paste rough notes and a link on the left. Get one clean, paste‑ready document on the right — parsed instantly, nothing leaves your browser.</p>
    </div>
  </header>

  <div class="workspace">
    <section class="panel" aria-label="Raw text input">
      <div class="panel-head">
        <h2>Raw text</h2>
        <div>
          <button class="text-btn" id="loadExampleBtn" type="button">Load example</button>
          <button class="text-btn" id="clearBtn" type="button">Clear</button>
        </div>
      </div>
      <textarea id="rawInput" placeholder="Paste meeting notes, a brain dump, an email draft…" spellcheck="false"></textarea>
      <div class="panel-foot">
        <div class="field-row">
          <label for="embedInput">Social Embed</label>
          <textarea id="embedInput" rows="2" placeholder="optional — a link to embed (YouTube, Vimeo, Spotify…) or a full embed snippet" spellcheck="false"></textarea>
        </div>
        <div class="field-row">
          <label>Options</label>
          <div class="opt-toggles">
            <button class="opt-btn" id="optTasks" type="button" aria-pressed="true">To‑dos</button>
            <button class="opt-btn" id="optBold" type="button" aria-pressed="true">Bold terms</button>
            <button class="opt-btn" id="optSections" type="button" aria-pressed="true">Sections</button>
          </div>
        </div>
      </div>
    </section>

    <div class="controls">
      <span class="arrow">→</span>
      <button class="compose-btn" id="composeBtn" type="button" title="Compose" aria-label="Compose">↻</button>
      <span class="compose-label">Compose</span>
    </div>

    <section class="panel" aria-label="Markdown output">
      <div class="panel-head">
        <div class="head-left">
          <div class="format-toggle" role="group" aria-label="Output format">
            <button class="fmt-btn" id="fmtMd" type="button" aria-pressed="true">MD</button>
            <button class="fmt-btn" id="fmtHtml" type="button" aria-pressed="false">HTML</button>
          </div>
          <span class="head-divider"></span>
          <div class="tabs" role="tablist" aria-label="Output view">
            <button class="tab" id="tabSource" role="tab" aria-selected="true" type="button">Source</button>
            <button class="tab" id="tabPreview" role="tab" aria-selected="false" type="button">Preview</button>
          </div>
        </div>
        <div class="output-actions">
          <button class="copy-btn" id="copyBtn" type="button">Copy</button>
        </div>
      </div>
      <div class="output-body">
        <div class="output-view" id="sourceViewWrap"><pre id="sourceView"></pre></div>
        <div class="output-view" id="previewViewWrap" hidden><div id="previewView"></div></div>
      </div>
    </section>
  </div>

  <div class="status-row" id="statusRow"></div>

  <footer class="note">Everything above runs locally in your browser — nothing you paste is sent anywhere.</footer>
</div>

<script>
(function () {
  "use strict";

  var EXAMPLE_RAW = "quick sync notes tuesday. talked about the q3 launch timeline, sarah is worried about the api rate limits we saw last week. action items - mike to check with infra team by friday, need decision on whether we delay the beta by a week or push through. also discussed marketing asset review, still waiting on final logo files from design. next meeting thursday 10am. reminder budget for user testing is 3 sessions max this sprint";

  var EXAMPLE_EMBED = "https://www.youtube.com/watch?v=N1x_9vLp3Qw";

  var EMPTY_HINT = "Your composed document will appear here.";

  var rawInput = document.getElementById("rawInput");
  var embedInput = document.getElementById("embedInput");
  var composeBtn = document.getElementById("composeBtn");
  var copyBtn = document.getElementById("copyBtn");
  var sourceView = document.getElementById("sourceView");
  var previewView = document.getElementById("previewView");
  var sourceViewWrap = document.getElementById("sourceViewWrap");
  var previewViewWrap = document.getElementById("previewViewWrap");
  var tabSource = document.getElementById("tabSource");
  var tabPreview = document.getElementById("tabPreview");
  var fmtMd = document.getElementById("fmtMd");
  var fmtHtml = document.getElementById("fmtHtml");
  var optTasks = document.getElementById("optTasks");
  var optBold = document.getElementById("optBold");
  var optSections = document.getElementById("optSections");
  var statusRow = document.getElementById("statusRow");
  var loadExampleBtn = document.getElementById("loadExampleBtn");
  var clearBtn = document.getElementById("clearBtn");

  var currentOutput = "";
  var outputFormat = "md";

  // ---------- escaping ----------
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- sentence splitting (char scan — no regex lookbehind needed) ----------
  function splitIntoSentences(str) {
    var out = [];
    var current = "";
    for (var i = 0; i < str.length; i++) {
      current += str[i];
      var ch = str[i];
      if (ch === "." || ch === "!" || ch === "?") {
        var next = str[i + 1];
        if (next === undefined || next === " " || next === "\n") {
          out.push(current.trim());
          current = "";
        }
      }
    }
    if (current.trim()) out.push(current.trim());
    return out.filter(Boolean);
  }

  // ---------- deterministic term highlighting: weekdays, times, money, quantities ----------
  var WEEKDAYS = {
    mon: "Monday", monday: "Monday", tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
    wed: "Wednesday", weds: "Wednesday", wednesday: "Wednesday", thu: "Thursday", thur: "Thursday",
    thurs: "Thursday", thursday: "Thursday", fri: "Friday", friday: "Friday",
    sat: "Saturday", saturday: "Saturday", sun: "Sunday", sunday: "Sunday"
  };

  function boldTerms(text) {
    text = text.replace(/\b(\d{1,2})(:(\d{2}))?\s?(am|pm)\b/gi, function (m, h, _g, mm, ap) {
      return "**" + h + ":" + (mm || "00") + " " + ap.toUpperCase() + "**";
    });
    text = text.replace(/\b(mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)\b/gi, function (m) {
      return "**" + (WEEKDAYS[m.toLowerCase()] || m) + "**";
    });
    text = text.replace(/\$\d[\d,]*(\.\d+)?/g, function (m) { return "**" + m + "**"; });
    text = text.replace(/\b\d+(\.\d+)?%/g, function (m) { return "**" + m + "**"; });
    text = text.replace(/\b(\d+)\s+(sessions?|weeks?|days?|hours?|minutes?|mins?|people|persons?|points?|reviewers?|dollars?)\b/gi, function (m) { return "**" + m + "**"; });
    return text;
  }

  // ---------- heading helpers ----------
  function titleCase(str) {
    return str.split(/\s+/).map(function (w) {
      if (!w) return w;
      if (/^[A-Z0-9]{2,}$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(" ");
  }

  var HEADING_STOP_TAIL = ["is", "are", "was", "were", "be", "been", "being", "has", "have", "had",
    "the", "a", "an", "to", "of", "for", "with", "on", "in", "and", "or"];

  function cleanHeadingWords(str, maxWords) {
    var words = str.replace(/^(the|a|an)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, maxWords || 5);
    while (words.length > 1 && HEADING_STOP_TAIL.indexOf(words[words.length - 1].toLowerCase()) !== -1) {
      words.pop();
    }
    var joined = words.join(" ").replace(/[.,;:!?]+$/, "");
    return titleCase(joined);
  }

  function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }

  var TOPIC_HINT = /\b(talked about|discussed|regarding|about)\b\s+(.+)/i;

  // Cuts a heading source at whichever comes first: a comma, or a linking verb
  // ("review IS friday" -> "review") — both mark where the topic phrase ends.
  function firstClauseCut(str) {
    var commaIdx = str.indexOf(",");
    var verbMatch = str.match(/\b(is|are|was|were)\b/i);
    var verbIdx = verbMatch ? verbMatch.index : -1;
    if (commaIdx === -1 && verbIdx === -1) return str;
    if (commaIdx === -1) return str.slice(0, verbIdx).trim();
    if (verbIdx === -1) return str.slice(0, commaIdx).trim();
    return str.slice(0, Math.min(commaIdx, verbIdx)).trim();
  }

  function deriveHeading(sentence) {
    var m = sentence.match(TOPIC_HINT);
    var source = m ? m[2] : sentence;
    source = firstClauseCut(source);
    return cleanHeadingWords(source, 5) || "Notes";
  }

  function stripTopicPrefix(sentence) {
    var m = sentence.match(TOPIC_HINT);
    if (!m) return sentence;
    var cut = m[0].split(",")[0];
    var idx = sentence.indexOf(cut);
    if (idx === -1) return sentence;
    var rest = sentence.slice(idx + cut.length).replace(/^[,\s]+/, "").trim();
    return rest ? capitalizeFirst(rest) : sentence;
  }

  function deriveTitle(sentence) {
    var s = sentence.replace(/^(quick|just|so|ok|okay|hey|hi)\b[\s,]*/i, "");
    return cleanHeadingWords(s, 5) || "Notes";
  }

  // ---------- topic-change triggers (keyword based) ----------
  var TRIGGERS = [
    { re: /^(action items?|to-?dos?|next steps?)\b\s*[:\-,]*\s*/i, heading: "Action Items", task: true },
    { re: /^(next meeting|next sync|next call)\b\s*[:\-,]*\s*/i, heading: "Next Meeting" },
    { re: /^(decision|decided|we decided)\b\s*[:\-,]*\s*/i, heading: "Decisions" },
    { re: /^(budget)\b\s*[:\-,]*\s*/i, heading: "Budget" },
    { re: /^(reminder|note|ps|fyi)\b\s*[:\-,]*\s*/i, heading: null },
    { re: /^(also discussed|additionally|separately|also)\b\s*[:\-,]*\s*/i, heading: null }
  ];

  function matchTrigger(sentence) {
    for (var t = 0; t < TRIGGERS.length; t++) {
      if (TRIGGERS[t].re.test(sentence)) return TRIGGERS[t];
    }
    return null;
  }

  // ---------- section builder ----------
  function newSectionInto(sections, heading, task) {
    var sec = { heading: heading, task: !!task, items: [] };
    sections.push(sec);
    return sec;
  }

  // Turns one run of sentences into sections, switching to a new section whenever a
  // topic-change trigger fires. Called once for a single-blob note (sections flow
  // continuously) or once per paragraph (each paragraph always starts its own section).
  function processSentences(sentences, opts, sections) {
    var current = null;
    sentences.forEach(function (sentence) {
      var trig = matchTrigger(sentence);
      if (trig && opts.sections) {
        var rest = sentence.replace(trig.re, "").replace(/^(is|are|was|were)\s+/i, "").trim();
        var heading = trig.heading || deriveHeading(rest || sentence);
        current = newSectionInto(sections, heading, trig.task);
        if (trig.task) {
          rest.split(/,\s*/).forEach(function (part) {
            part = part.trim();
            if (part) current.items.push({ text: capitalizeFirst(part), list: true });
          });
        } else if (rest) {
          current.items.push({ text: capitalizeFirst(rest), list: false });
        }
      } else {
        if (!current) {
          var heading2 = opts.sections ? deriveHeading(sentence) : null;
          current = newSectionInto(sections, heading2, false);
        }
        current.items.push({ text: stripTopicPrefix(sentence), list: false });
      }
    });
  }

  function buildSections(raw, opts) {
    var paragraphs = raw.replace(/\r\n/g, "\n").split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
    var sections = [];
    var title = null;

    if (paragraphs.length > 1) {
      // Blank-line separated paragraphs are a strong signal — trust them as section breaks.
      var firstSentences = splitIntoSentences(paragraphs[0].replace(/\n/g, " "));
      var startParaIdx = 0;
      if (firstSentences.length === 1 && firstSentences[0].split(/\s+/).length <= 6) {
        // A short first line on its own paragraph reads as a title, not content.
        title = deriveTitle(firstSentences[0]);
        startParaIdx = 1;
      } else if (firstSentences.length) {
        title = deriveTitle(firstSentences[0]);
      }
      paragraphs.slice(startParaIdx).forEach(function (para) {
        var sentences = splitIntoSentences(para.replace(/\n/g, " "));
        if (sentences.length) processSentences(sentences, opts, sections);
      });
    } else {
      // One blob of text — fall back to keyword-based section splitting.
      var all = splitIntoSentences(paragraphs[0] || raw);
      var startIdx = 0;
      if (all.length > 1 && all[0].split(/\s+/).length <= 6) {
        title = deriveTitle(all[0]);
        startIdx = 1;
      } else if (all.length) {
        title = deriveTitle(all[0]);
      }
      processSentences(all.slice(startIdx), opts, sections);
    }

    if (!sections.length) sections.push({ heading: null, task: false, items: [{ text: raw.trim(), list: false }] });
    return { title: title || "Notes", sections: sections };
  }

  // ---------- iframe conversion (pattern-matched, no AI) ----------
  function extractYouTubeId(url) {
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,15})/i);
    return m ? m[1] : null;
  }

  function toIframe(raw) {
    var s = (raw || "").trim();
    if (!s) return null;
    if (/^<iframe[\s>]/i.test(s)) return { html: s };

    var yt = extractYouTubeId(s);
    if (yt) {
      return { html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + yt + '" ' +
        'title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; ' +
        'encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" ' +
        "allowfullscreen></iframe>" };
    }
    var vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeo) {
      return { html: '<iframe src="https://player.vimeo.com/video/' + vimeo[1] + '" width="560" height="315" ' +
        'frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>' };
    }
    var spotify = s.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/i);
    if (spotify) {
      return { html: '<iframe src="https://open.spotify.com/embed/' + spotify[1] + "/" + spotify[2] + '" width="100%" height="152" ' +
        'frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>' };
    }
    if (/soundcloud\.com\//i.test(s)) {
      return { html: '<iframe width="100%" height="166" frameborder="0" src="https://w.soundcloud.com/player/?url=' +
        encodeURIComponent(s) + '"></iframe>' };
    }
    var codepen = s.match(/codepen\.io\/([\w-]+)\/pen\/([\w-]+)/i);
    if (codepen) {
      return { html: '<iframe height="400" style="width:100%" src="https://codepen.io/' + codepen[1] + "/embed/" + codepen[2] +
        '?default-tab=result" loading="lazy"></iframe>' };
    }
    if (/figma\.com\//i.test(s)) {
      return { html: '<iframe width="800" height="450" src="https://www.figma.com/embed?embed_host=share&url=' +
        encodeURIComponent(s) + '" loading="lazy"></iframe>' };
    }
    if (/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl)/i.test(s)) {
      return { html: '<iframe width="600" height="450" style="border:0" loading="lazy" src="https://maps.google.com/maps?q=' +
        encodeURIComponent(s) + '&output=embed"></iframe>' };
    }
    // Platforms that block iframing (X/Twitter, Instagram, TikTok, LinkedIn…) or anything unrecognized: link instead.
    return { html: null, url: s };
  }

  // ---------- markdown rendering ----------
  function renderMarkdown(title, sections, opts) {
    var out = ["# " + title, ""];
    sections.forEach(function (sec) {
      if (sec.heading) out.push("## " + sec.heading, "");
      var hasList = false;
      sec.items.forEach(function (it) {
        if (it.raw) { out.push(it.text, ""); return; }
        var text = opts.bold ? boldTerms(it.text) : it.text;
        if (sec.task && opts.tasks) { out.push("- [ ] " + text); hasList = true; }
        else if (sec.task || it.list) { out.push("- " + text); hasList = true; }
        else { out.push(text, ""); }
      });
      if (hasList) out.push("");
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function composeMarkdown(raw, embedRaw, opts) {
    var built = buildSections(raw, opts);
    var sections = built.sections.slice();
    if (embedRaw && embedRaw.trim()) {
      var frame = toIframe(embedRaw);
      var body = frame && frame.html ? frame.html : ("Referenced link: " + embedRaw.trim());
      sections.push({ heading: opts.sections ? "Social" : null, task: false, items: [{ text: body, list: false, raw: !!(frame && frame.html) }] });
    }
    return renderMarkdown(built.title, sections, opts);
  }

  // ---------- tiny markdown -> HTML (also drives the Preview tab) ----------
  function inline(s) {
    s = escapeHtml(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function mdToHtml(md) {
    var lines = (md || "").replace(/\r\n/g, "\n").split("\n");
    var html = [];
    var i = 0;
    var listType = null; // "ul" | "ol"

    function closeList() {
      if (listType) { html.push("</" + listType + ">"); listType = null; }
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^```/.test(line)) {
        closeList();
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        i++;
        continue;
      }

      // Raw <iframe> blocks (standard embed code) pass through unescaped so they render live.
      if (/^<iframe[\s>]/i.test(line.trim())) {
        closeList();
        var frame = [line];
        var closed = /<\/iframe>/i.test(line) || /\/>\s*$/.test(line.trim());
        while (!closed && i + 1 < lines.length) {
          i++;
          frame.push(lines[i]);
          closed = /<\/iframe>/i.test(lines[i]);
        }
        html.push(frame.join("\n"));
        i++;
        continue;
      }

      if (/^\s*$/.test(line)) { closeList(); i++; continue; }

      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        closeList();
        var level = h[1].length;
        html.push("<h" + level + ">" + inline(h[2]) + "</h" + level + ">");
        i++;
        continue;
      }

      if (/^\s*---+\s*$/.test(line) || /^\s*\*\*\*+\s*$/.test(line)) {
        closeList();
        html.push("<hr>");
        i++;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        closeList();
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        html.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>");
        continue;
      }

      var task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (task) {
        if (listType !== "ul") { closeList(); html.push("<ul>"); listType = "ul"; }
        var checked = /x/i.test(task[1]) ? " checked" : "";
        html.push('<li class="task"><input type="checkbox" disabled' + checked + '>' + inline(task[2]) + "</li>");
        i++;
        continue;
      }

      var ul = line.match(/^\s*[-*]\s+(.*)$/);
      if (ul) {
        if (listType !== "ul") { closeList(); html.push("<ul>"); listType = "ul"; }
        html.push("<li>" + inline(ul[1]) + "</li>");
        i++;
        continue;
      }

      var ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ol) {
        if (listType !== "ol") { closeList(); html.push("<ol>"); listType = "ol"; }
        html.push("<li>" + inline(ol[1]) + "</li>");
        i++;
        continue;
      }

      closeList();
      html.push("<p>" + inline(line) + "</p>");
      i++;
    }
    closeList();
    return html.join("\n");
  }

  function setStatus(text, kind) {
    statusRow.className = "status-row" + (kind === "warn" ? " warn" : "");
    statusRow.textContent = text || "";
  }

  // ---------- tabs ----------
  function selectTab(name) {
    var isSource = name === "source";
    tabSource.setAttribute("aria-selected", String(isSource));
    tabPreview.setAttribute("aria-selected", String(!isSource));
    sourceViewWrap.hidden = !isSource;
    previewViewWrap.hidden = isSource;
  }
  tabSource.addEventListener("click", function () { selectTab("source"); });
  tabPreview.addEventListener("click", function () { selectTab("preview"); });

  // ---------- options ----------
  function currentOpts() {
    return {
      tasks: optTasks.getAttribute("aria-pressed") === "true",
      bold: optBold.getAttribute("aria-pressed") === "true",
      sections: optSections.getAttribute("aria-pressed") === "true"
    };
  }
  [optTasks, optBold, optSections].forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.setAttribute("aria-pressed", btn.getAttribute("aria-pressed") === "true" ? "false" : "true");
      recompose();
    });
  });

  // ---------- format toggle ----------
  function selectFormat(format) {
    outputFormat = format;
    fmtMd.setAttribute("aria-pressed", String(format === "md"));
    fmtHtml.setAttribute("aria-pressed", String(format === "html"));
    recompose();
  }
  fmtMd.addEventListener("click", function () { selectFormat("md"); });
  fmtHtml.addEventListener("click", function () { selectFormat("html"); });

  // ---------- compose (local, deterministic) ----------
  function recompose() {
    var raw = rawInput.value.trim();
    if (!raw) {
      currentOutput = "";
      sourceView.textContent = EMPTY_HINT;
      previewView.innerHTML = '<p style="color:var(--ink-faint)">' + escapeHtml(EMPTY_HINT) + "</p>";
      setStatus("", null);
      return;
    }
    var opts = currentOpts();
    var md = composeMarkdown(raw, embedInput.value, opts);
    var htmlFrag = mdToHtml(md);
    currentOutput = outputFormat === "html" ? htmlFrag : md;
    sourceView.textContent = currentOutput;
    previewView.innerHTML = htmlFrag;
    setStatus("Composed.", null);
  }

  composeBtn.addEventListener("click", function () {
    recompose();
    if (rawInput.value.trim()) selectTab("source");
    else rawInput.focus();
  });

  // ---------- example / clear ----------
  loadExampleBtn.addEventListener("click", function () {
    rawInput.value = EXAMPLE_RAW;
    embedInput.value = EXAMPLE_EMBED;
    recompose();
    rawInput.focus();
  });
  clearBtn.addEventListener("click", function () {
    rawInput.value = "";
    embedInput.value = "";
    recompose();
    rawInput.focus();
  });

  // ---------- copy ----------
  copyBtn.addEventListener("click", async function () {
    if (!currentOutput) return;
    try {
      await navigator.clipboard.writeText(currentOutput);
      copyBtn.textContent = "Copied";
      copyBtn.classList.add("copied");
    } catch (err) {
      var ta = document.createElement("textarea");
      ta.value = currentOutput;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      document.body.removeChild(ta);
      copyBtn.textContent = ok ? "Copied" : "Select → Copy";
      if (ok) copyBtn.classList.add("copied");
    }
    setTimeout(function () {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 1600);
  });

  // ---------- boot ----------
  rawInput.value = EXAMPLE_RAW;
  embedInput.value = EXAMPLE_EMBED;
  recompose();
})();
</script>

</body>
</html>