<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Embed Row &amp; Masonry Builder</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --paper: #f3f4f1;
      --paper-raised: #ffffff;
      --paper-sunken: #eef0ea;
      --ink: #14171a;
      --ink-soft: #5b6066;
      --ink-faint: #8b9096;
      --line: #d9dbd4;
      --line-strong: #c2c5bd;
      --accent: #2f6fed;
      --accent-hover: #1e59e0;
      --accent-ink: #ffffff;
      --accent-soft: #e4ecfd;
      --success: #1f8f5f;
      --success-hover: #17734c;
      --success-ink: #ffffff;
      --success-soft: #e2f4ea;
      --success-border: #b8e3cb;
      --danger: #e5484d;
      --danger-soft: #fbeaea;
      --danger-border: #f3c2c3;
      --code-bg: #0f1216;
      --code-ink: #d9dee5;
      --code-line: #262b32;
      --code-accent: #7fb0ff;
      --shadow-sm: 0 1px 2px rgba(20, 23, 26, 0.04);
      --shadow: 0 1px 2px rgba(20, 23, 26, 0.04), 0 8px 24px -12px rgba(20, 23, 26, 0.12);
      --shadow-lg: 0 8px 32px -8px rgba(20, 23, 26, 0.16);
      --radius: 10px;
      --radius-sm: 8px;
      --radius-lg: 14px;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --paper: #15171a;
        --paper-raised: #1d2024;
        --paper-sunken: #101215;
        --ink: #edeeea;
        --ink-soft: #a3a8ad;
        --ink-faint: #6b7176;
        --line: #2c2f34;
        --line-strong: #3b3f45;
        --accent: #6c98ff;
        --accent-hover: #8cbaff;
        --accent-ink: #0f1115;
        --accent-soft: #212a3b;
        --success: #4fbf8f;
        --success-hover: #6ed3a3;
        --success-ink: #0f1115;
        --success-soft: #16261f;
        --success-border: #2a4a3a;
        --danger: #ff6b70;
        --danger-soft: #2a1a1b;
        --danger-border: #4a2426;
        --code-bg: #0a0c0e;
        --code-ink: #dbe1e7;
        --code-line: #22262b;
        --code-accent: #8cbaff;
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
        --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -12px rgba(0, 0, 0, 0.5);
        --shadow-lg: 0 8px 32px -8px rgba(0, 0, 0, 0.6);
      }
    }

    :root[data-theme="dark"] {
      --paper: #15171a;
      --paper-raised: #1d2024;
      --paper-sunken: #101215;
      --ink: #edeeea;
      --ink-soft: #a3a8ad;
      --ink-faint: #6b7176;
      --line: #2c2f34;
      --line-strong: #3b3f45;
      --accent: #6c98ff;
      --accent-hover: #8cbaff;
      --accent-ink: #0f1115;
      --accent-soft: #212a3b;
      --success: #4fbf8f;
      --success-hover: #6ed3a3;
      --success-ink: #0f1115;
      --success-soft: #16261f;
      --success-border: #2a4a3a;
      --danger: #ff6b70;
      --danger-soft: #2a1a1b;
      --danger-border: #4a2426;
      --code-bg: #0a0c0e;
      --code-ink: #dbe1e7;
      --code-line: #22262b;
      --code-accent: #8cbaff;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -12px rgba(0, 0, 0, 0.5);
      --shadow-lg: 0 8px 32px -8px rgba(0, 0, 0, 0.6);
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }

    /* ============================
       HEADER
       ============================ */
    header.top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 40px;
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-mark .glyph {
      display: flex;
      gap: 3px;
      flex-shrink: 0;
    }

    .brand-mark .glyph span {
      width: 7px;
      height: 28px;
      border-radius: 2px;
      background: var(--accent);
    }
    .brand-mark .glyph span:nth-child(1) { opacity: 0.4; }
    .brand-mark .glyph span:nth-child(2) { opacity: 0.7; }
    .brand-mark .glyph span:nth-child(3) { opacity: 1; }

    h1 {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.015em;
      margin: 0 0 5px;
      text-wrap: balance;
    }

    .subtitle {
      margin: 0;
      color: var(--ink-soft);
      font-size: 14px;
      max-width: 52ch;
      line-height: 1.55;
    }

    .theme-toggle {
      border: 1px solid var(--line-strong);
      background: var(--paper-raised);
      color: var(--ink-soft);
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      font-size: 16px;
      transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
    }
    .theme-toggle:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
    }
    .theme-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* ============================
       SECTIONS
       ============================ */
    section { margin-bottom: 40px; }

    .section-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .eyebrow {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-faint);
      font-weight: 600;
    }

    /* ============================
       SLOTS
       ============================ */
    .slots {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    @media (max-width: 1080px) {
      .slots { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 580px) {
      .slots { grid-template-columns: 1fr; }
    }

    .slot-card {
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      position: relative;
      transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.18s ease,
                  opacity 0.18s ease,
                  border-color 0.18s ease;
    }

    .slot-card:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .slot-card.is-dragging { opacity: 0.55; cursor: grabbing !important; }

    .slot-card.is-drag-placeholder {
      opacity: 0.35;
      border-style: dashed;
      border-color: var(--accent);
      box-shadow: none;
    }

    .slot-drag-ghost {
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      opacity: 0.92;
      transform: rotate(2deg) scale(1.03);
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius);
      transition: none;
      will-change: transform;
      overflow: hidden;
    }
    .slot-drag-ghost .slot-input {
      color: transparent !important;
      background: transparent !important;
    }
    .slot-drag-ghost .slot-input::placeholder { color: transparent !important; }

    .slot-drop-indicator {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--accent);
      border-radius: 2px;
      pointer-events: none;
      z-index: 5;
      box-shadow: 0 0 0 2px var(--accent-soft);
      animation: pulseIndicator 1.2s ease-in-out infinite;
    }

    .slot-drop-indicator.indicator-left { left: -8px; }
    .slot-drop-indicator.indicator-right { right: -8px; }

    @keyframes pulseIndicator {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .slot-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--line);
      background: var(--paper-sunken);
    }

    .slot-drag-handle {
      cursor: grab;
      color: var(--ink-faint);
      font-size: 14px;
      line-height: 1;
      padding: 3px 4px;
      user-select: none;
      -webkit-user-select: none;
      flex-shrink: 0;
      transition: color 0.15s ease, background 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      touch-action: none;
    }
    .slot-drag-handle:hover { color: var(--accent); background: var(--accent-soft); }
    .slot-drag-handle:active { cursor: grabbing; }

    .slot-num {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--accent-ink);
      background: var(--accent);
      width: 20px;
      height: 20px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .slot-title {
      font-size: 12.5px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .slot-status {
      margin-left: auto;
      font-size: 10.5px;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      color: var(--ink-faint);
      padding: 2px 7px;
      border-radius: 9999px;
      background: var(--paper);
      border: 1px solid var(--line);
    }
    .slot-status.filled {
      color: var(--success);
      background: var(--success-soft);
      border-color: var(--success-border);
    }

    .remove-slot-btn {
      border: none;
      background: transparent;
      color: var(--ink-faint);
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 3px 6px;
      border-radius: 5px;
      transition: color 0.15s ease, background 0.15s ease;
    }
    .remove-slot-btn:hover { color: var(--danger); background: var(--danger-soft); }

    textarea.slot-input {
      border: none;
      resize: vertical;
      min-height: 120px;
      padding: 12px 14px;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11.5px;
      line-height: 1.6;
      color: var(--ink);
      background: transparent;
      width: 100%;
      box-sizing: border-box;
    }
    textarea.slot-input::placeholder { color: var(--ink-faint); }
    textarea.slot-input:focus { outline: none; background: var(--accent-soft); }

    /* ============================
       CONTROLS
       ============================ */
    .controls-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }

    .gap-control {
      display: inline-flex;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
      box-shadow: var(--shadow-sm);
    }

    .gap-control button {
      border: none;
      background: transparent;
      color: var(--ink-soft);
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 12.5px;
      font-weight: 500;
      padding: 7px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .gap-control button:hover { color: var(--ink); background: var(--paper-sunken); }
    .gap-control button[aria-pressed="true"] {
      background: var(--accent);
      color: var(--accent-ink);
      box-shadow: 0 1px 2px rgba(47, 111, 237, 0.25);
    }
    .gap-control button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* ============================
       MASONRY PANEL
       ============================ */
    .masonry-controls-panel {
      margin-top: 18px;
      padding: 18px 20px;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeInPanel 0.18s ease;
    }

    @keyframes fadeInPanel {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .masonry-controls-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }

    .masonry-panel-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink);
    }
    .masonry-panel-badge svg { color: var(--accent); }

    .masonry-panel-hint {
      font-size: 11.5px;
      color: var(--ink-faint);
    }

    .masonry-presets-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px;
      background: var(--paper-sunken);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
    }

    .masonry-presets-label {
      font-size: 11px;
      font-family: "IBM Plex Mono", monospace;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-soft);
      margin-right: 4px;
    }

    .masonry-preset-pill {
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--paper-raised);
      color: var(--ink-soft);
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .masonry-preset-pill:hover {
      border-color: var(--accent);
      color: var(--ink);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    .masonry-preset-pill[data-active="true"] {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 700;
    }

    .masonry-controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .masonry-control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .masonry-control-group .gap-control { flex-wrap: wrap; }

    /* ============================
       BUTTONS
       ============================ */
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    button.btn {
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 14px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      padding: 10px 18px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease,
                  opacity 0.15s ease, transform 0.05s ease, box-shadow 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      line-height: 1.2;
    }
    button.btn:active { transform: translateY(1px); }
    button.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    button.btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-text {
      background: transparent;
      color: var(--ink-soft);
      font-weight: 600;
      padding: 10px 12px;
      border: none;
    }
    .btn-text:hover { color: var(--danger); background: var(--danger-soft); }

    .btn-primary {
      background: var(--accent);
      color: var(--accent-ink);
      box-shadow: 0 1px 2px rgba(47, 111, 237, 0.25);
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      box-shadow: 0 4px 12px -2px rgba(47, 111, 237, 0.35);
    }

    .btn-save {
      background: var(--success);
      color: var(--success-ink);
      box-shadow: 0 1px 2px rgba(31, 143, 95, 0.25);
    }
    .btn-save:hover {
      background: var(--success-hover);
      box-shadow: 0 4px 12px -2px rgba(31, 143, 95, 0.35);
    }

    /* ============================
       ADD SLOT BOTTOM
       ============================ */
    .add-slot-bottom-wrap {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .btn-add-slot-bottom {
      font-family: "IBM Plex Sans", -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: var(--ink-soft);
      background: var(--paper-raised);
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-sm);
      padding: 9px 16px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.15s ease;
    }
    .btn-add-slot-bottom:hover {
      border-color: var(--accent);
      border-style: solid;
      color: var(--accent);
      background: var(--accent-soft);
      transform: translateY(-1px);
    }
    .btn-add-slot-bottom:active { transform: translateY(0); }

    /* ============================
       STAGE / PREVIEW
       ============================ */
    .stage {
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 20px;
      overflow: auto;
      max-height: 80vh;
      -webkit-overflow-scrolling: touch;
    }

    .stage-row {
      display: grid;
      align-items: start;
      min-width: min-content;
      width: 100%;
    }

    .stage-row.is-single-embed,
    .stage-row:has(> .stage-cell:only-child) {
      max-width: 640px !important;
      width: 100% !important;
      margin: 0 auto !important;
      min-width: 0 !important;
      grid-template-columns: 1fr !important;
    }

    .masonry-preview {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .masonry-preview.is-single-embed {
      max-width: 640px !important;
      width: 100% !important;
      margin: 0 auto !important;
      min-width: 0 !important;
    }

    .masonry-preview-col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .masonry-stage-cell {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      justify-content: stretch !important;
      width: 100% !important;
      box-sizing: border-box !important;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.2s ease;
    }

    .masonry-stage-cell[data-mstyle="card"] {
      background: var(--paper-raised);
      border: 1px solid var(--line);
      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05);
    }

    .masonry-stage-cell[data-mstyle="minimal"] {
      background: transparent;
      border: 1px dashed var(--line);
      box-shadow: none;
    }

    .masonry-stage-cell[data-mstyle="outline"] {
      background: var(--paper-raised);
      border: 1px solid var(--line-strong);
      box-shadow: none;
    }

    .masonry-stage-cell[data-mstyle="glass"] {
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.06);
    }

    .masonry-stage-cell[data-mhover="lift"]:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.1);
    }

    .masonry-stage-cell[data-mhover="glow"]:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft), 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .masonry-slot-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 7px;
      border-radius: 5px;
      background: var(--accent);
      color: var(--accent-ink);
      opacity: 0.9;
      pointer-events: none;
      z-index: 2;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 760px) {
      .stage-row { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
      .stage-row.is-single-embed,
      .stage-row:has(> .stage-cell:only-child),
      .masonry-preview.is-single-embed { max-width: 100% !important; }
      .masonry-preview { flex-direction: column !important; }
      .masonry-preview-col { width: 100% !important; }
    }

    .stage-cell {
      min-width: 240px;
      box-sizing: border-box;
      border-radius: var(--radius-lg);
      background: var(--paper-raised);
      border: 1px solid var(--line);
      box-shadow: var(--shadow-sm);
      padding: 10px;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.15s ease;
      resize: both;
      overflow: auto;
      max-width: 100%;
      min-height: 180px;
      height: auto;
      position: relative;
    }
    .stage-cell:hover { box-shadow: var(--shadow); }

    .stage-cell.is-resizing iframe,
    .carousel-viewport.is-resizing iframe { pointer-events: none !important; }

    .stage-cell iframe {
      width: 100%;
      min-width: 0;
      min-height: 0;
      flex: 1 1 auto;
      height: 100%;
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-sm);
      background: var(--paper);
      overflow: auto;
      display: block;
      box-sizing: border-box;
    }

    .stage-empty {
      min-height: 120px;
      height: 100%;
      flex: 1;
      min-width: 220px;
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px;
      color: var(--ink-faint);
      font-size: 12.5px;
      line-height: 1.5;
      background: var(--paper-sunken);
    }

    /* ============================
       CAROUSEL
       ============================ */
    .carousel-preview {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      box-sizing: border-box;
    }

    .carousel-controls {
      order: -1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 0 auto 4px auto;
      padding: 5px 14px;
      background: var(--paper-sunken);
      border: 1px solid var(--line);
      border-radius: 9999px;
      box-shadow: var(--shadow-sm);
    }

    .carousel-viewport {
      order: 1;
      position: relative;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--paper-raised);
      overflow: auto;
      resize: both;
      box-shadow: var(--shadow);
      width: 100%;
      min-width: 280px;
      min-height: 180px;
      height: auto;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
    }

    .carousel-viewport iframe {
      width: 100%;
      height: 100%;
      min-height: 0;
      flex: 1 1 auto;
      border: none;
      display: block;
      background: var(--paper-raised);
    }

    .carousel-arrow {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid var(--line-strong);
      background: var(--paper-raised);
      color: var(--ink);
      cursor: pointer;
      font-size: 18px;
      font-weight: 600;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s ease;
    }
    .carousel-arrow:hover:not(:disabled) {
      border-color: var(--accent);
      color: var(--accent-ink);
      background: var(--accent);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(47, 111, 237, 0.25);
    }
    .carousel-arrow:active:not(:disabled) { transform: translateY(0px) scale(0.95); }
    .carousel-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
    .carousel-arrow:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .carousel-dots { display: flex; align-items: center; gap: 7px; padding: 0 4px; }
    .carousel-dots button {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: none;
      background: var(--line-strong);
      padding: 0;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .carousel-dots button.is-active {
      background: var(--accent);
      width: 22px;
      border-radius: 9999px;
    }
    .carousel-dots button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* ============================
       CODE PANEL
       ============================ */
    .code-panel {
      background: var(--code-bg);
      border-radius: var(--radius);
      border: 1px solid var(--code-line);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .code-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--code-line);
      background: rgba(255, 255, 255, 0.02);
      gap: 12px;
    }

    .code-panel-head .dots { display: flex; gap: 6px; flex-shrink: 0; }
    .code-panel-head .dots span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--code-line);
    }
    .code-panel-head .dots span:nth-child(1) { background: #ff5f57; opacity: 0.8; }
    .code-panel-head .dots span:nth-child(2) { background: #febc2e; opacity: 0.8; }
    .code-panel-head .dots span:nth-child(3) { background: #28c840; opacity: 0.8; }

    .code-panel-head #codeFileLabel {
      flex: 1;
      text-align: center;
    }

    /* ============================
       COPY BUTTON — works on light + dark contexts
       ============================ */
    .copy-btn {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--ink);
      background: var(--paper-raised);
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      padding: 7px 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease,
                  transform 0.05s ease, box-shadow 0.15s ease;
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .copy-btn::before {
      content: "";
      width: 13px;
      height: 13px;
      flex-shrink: 0;
      background: currentColor;
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><rect x='9' y='9' width='13' height='13' rx='2'/><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><rect x='9' y='9' width='13' height='13' rx='2'/><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/></svg>");
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }

    .copy-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
    }

    .copy-btn:active {
      transform: translateY(1px);
    }

    .copy-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .copy-btn.copied {
      color: var(--success);
      background: var(--success-soft);
      border-color: var(--success);
    }

    .copy-btn.copied::before {
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
    }

    /* Dark variant — for buttons inside the dark code-panel header */
    .code-panel-head .copy-btn {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.10);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset;
    }

    .code-panel-head .copy-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: var(--code-accent);
      color: var(--code-accent);
    }

    .code-panel-head .copy-btn.copied {
      color: #6ed3a3;
      background: rgba(79, 191, 143, 0.18);
      border-color: rgba(79, 191, 143, 0.55);
    }

    pre.code-out {
      margin: 0;
      padding: 18px 20px;
      overflow-x: auto;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12.5px;
      line-height: 1.65;
      color: var(--code-ink);
      tab-size: 2;
      white-space: pre;
      max-height: 520px;
    }

    pre.code-out::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    pre.code-out::-webkit-scrollbar-track {
      background: var(--code-bg);
    }
    pre.code-out::-webkit-scrollbar-thumb {
      background: var(--code-line);
      border-radius: 5px;
    }
    pre.code-out::-webkit-scrollbar-thumb:hover {
      background: #3a4048;
    }

    /* ============================
       SAVE PANEL
       ============================ */
    .save-panel {
      margin-top: 20px;
      padding: 20px 22px;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      animation: fadeInPanel 0.2s ease;
    }

    .save-panel-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .save-panel-head .icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--success-soft);
      color: var(--success);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 15px;
    }

    .save-panel h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .save-panel .hint {
      font-size: 12.5px;
      color: var(--ink-soft);
      margin: 0 0 16px;
      line-height: 1.55;
    }

    .save-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: stretch;
    }

    .save-row input[type="text"] {
      flex: 1 1 260px;
      min-width: 200px;
      padding: 10px 14px;
      font-family: "IBM Plex Sans", sans-serif;
      font-size: 14px;
      color: var(--ink);
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .save-row input[type="text"]::placeholder { color: var(--ink-faint); }
    .save-row input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
      background: var(--paper-raised);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }

    .save-result {
      margin-top: 16px;
      padding: 16px 18px;
      border-radius: var(--radius-sm);
      background: var(--success-soft);
      border: 1px solid var(--success-border);
      display: none;
      font-size: 13px;
      line-height: 1.55;
      color: var(--ink);
      animation: fadeInPanel 0.2s ease;
    }
    .save-result.is-visible { display: block; }
    .save-result.is-error {
      background: var(--danger-soft);
      border-color: var(--danger-border);
    }

    .save-result strong {
      color: var(--success);
      font-weight: 600;
      margin-right: 4px;
    }
    .save-result.is-error strong { color: var(--danger); }

    .save-result .save-url {
      display: block;
      margin: 10px 0 12px;
      font-family: "IBM Plex Mono", monospace;
      font-size: 12.5px;
      color: var(--accent);
      word-break: break-all;
      text-decoration: none;
      font-weight: 600;
      padding: 8px 12px;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: 6px;
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .save-result .save-url:hover {
      border-color: var(--accent);
      text-decoration: none;
    }

    .save-result .save-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .save-action-btn {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink);
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 7px 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, transform 0.05s ease;
      line-height: 1.2;
    }
    .save-action-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
    }
    .save-action-btn:active { transform: translateY(1px); }
    .save-action-btn.copied {
      color: var(--success);
      border-color: var(--success);
      background: var(--success-soft);
    }
    .save-action-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* ============================
       HISTORY PANEL
       ============================ */
    .history-panel {
      padding: 20px 22px;
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }

    /* History is now a top-level section — reset its top margin */
    section > .history-panel {
      margin-top: 0;
    }

    .history-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
      flex-wrap: wrap;
    }

    .history-panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .history-panel-title .icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
    }

    .history-refresh-btn {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--ink-soft);
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .history-refresh-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
    }
    .history-refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .history-list::-webkit-scrollbar { width: 8px; }
    .history-list::-webkit-scrollbar-track { background: transparent; }
    .history-list::-webkit-scrollbar-thumb {
      background: var(--line-strong);
      border-radius: 4px;
    }
    .history-list::-webkit-scrollbar-thumb:hover { background: var(--ink-faint); }

    .history-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
    }

    .history-item:hover {
      border-color: var(--accent);
      background: var(--paper-raised);
      transform: translateX(2px);
    }

    .history-item-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
      border: 1px solid var(--line);
    }

    .history-item-body {
      flex: 1;
      min-width: 0;
    }

    .history-item-title {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0 0 3px;
      line-height: 1.3;
    }

    .history-item-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 10.5px;
      color: var(--ink-faint);
    }

    .history-item-meta .badge {
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--paper-sunken);
      border: 1px solid var(--line);
      color: var(--ink-soft);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .history-item-meta .badge.mode-row {
      color: var(--accent);
      border-color: var(--accent-soft);
      background: var(--accent-soft);
    }
    .history-item-meta .badge.mode-carousel {
      color: #b45309;
      border-color: #fde68a;
      background: #fef3c7;
    }
    .history-item-meta .badge.mode-masonry {
      color: var(--success);
      border-color: var(--success-border);
      background: var(--success-soft);
    }

    :root[data-theme="dark"] .history-item-meta .badge.mode-carousel {
      color: #fcd34d;
      border-color: #78350f;
      background: #3a2a0d;
    }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) .history-item-meta .badge.mode-carousel {
        color: #fcd34d;
        border-color: #78350f;
        background: #3a2a0d;
      }
    }

    .history-item-meta .slug {
      color: var(--ink-faint);
      font-weight: 500;
    }

    .history-item-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .history-action-btn {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-soft);
      background: var(--paper-raised);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .history-action-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
      transform: translateY(-1px);
    }

    .history-empty {
      text-align: center;
      padding: 32px 20px;
      color: var(--ink-faint);
      font-size: 13px;
      line-height: 1.6;
    }

    .history-empty .icon {
      font-size: 32px;
      opacity: 0.4;
      margin-bottom: 8px;
      display: block;
    }

    .history-loading {
      text-align: center;
      padding: 32px 20px;
      color: var(--ink-faint);
      font-size: 13px;
    }

    .history-loading::after {
      content: "";
      display: inline-block;
      width: 14px;
      height: 14px;
      margin-left: 8px;
      vertical-align: -2px;
      border: 2px solid var(--line);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: histSpin 0.7s linear infinite;
    }

    @keyframes histSpin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .history-item {
        flex-wrap: wrap;
      }
      .history-item-actions {
        width: 100%;
        justify-content: flex-end;
      }
      .history-item-actions .history-action-btn {
        flex: 1;
        justify-content: center;
      }
    }

    /* ============================
       FOOTER
       ============================ */
    footer.hint-footer {
      margin-top: 48px;
      padding-top: 22px;
      border-top: 1px solid var(--line);
      color: var(--ink-faint);
      font-size: 12.5px;
      line-height: 1.6;
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; }
    }

    /* ============================
       TOAST
       ============================ */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--ink);
      color: var(--paper-raised);
      padding: 12px 20px;
      border-radius: 9999px;
      font-size: 13.5px;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 999999;
      max-width: 90vw;
      text-align: center;
    }
    .toast.is-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }
    .toast.is-error { background: var(--danger); color: #fff; }
    .toast.is-success { background: var(--success); color: #fff; }
  </style>
</head>
<body>

<div class="wrap">
  <header class="top">
    <div class="brand-mark">
      <div class="glyph"><span></span><span></span><span></span></div>
      <div>
        <h1>Embed Row &amp; Masonry Builder</h1>
        <p class="subtitle">Paste embed snippets, preview them together, and generate complete HTML files for Row, Carousel, or Masonry layouts (Max 4 columns per row). Drag the ⠿ handle to reorder slots.</p>
      </div>
    </div>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle color theme" title="Toggle color theme">◐</button>
  </header>

  <section>
    <div class="section-label">
      <span class="eyebrow">Slots — left to right order (drag to reorder)</span>
      <button class="btn btn-text" id="addSlotBtn" type="button" style="padding: 5px 12px; font-size: 12px;">+ Add on top slot</button>
    </div>
    <div class="slots" id="slotsContainer"></div>
    <div class="add-slot-bottom-wrap">
      <button class="btn-add-slot-bottom" id="addSlotBtnBottom" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add on bottom slot</span>
      </button>
    </div>
  </section>

  <section>
    <div class="controls-row">
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div>
          <div class="eyebrow" style="margin-bottom:8px;">Layout</div>
          <div class="gap-control" id="modeControl" role="group" aria-label="Layout">
            <button type="button" data-mode="row" aria-pressed="true">Row</button>
            <button type="button" data-mode="carousel" aria-pressed="false">Carousel</button>
            <button type="button" data-mode="masonry" aria-pressed="false">Masonry</button>
          </div>
        </div>
        <div id="gapControlWrap">
          <div class="eyebrow" style="margin-bottom:8px;">Spacing between embeds</div>
          <div class="gap-control" role="group" aria-label="Spacing between embeds">
            <button type="button" data-gap="8" aria-pressed="false">Compact</button>
            <button type="button" data-gap="24" aria-pressed="true">Comfortable</button>
            <button type="button" data-gap="40" aria-pressed="false">Spacious</button>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-text" id="resetBtn" type="button">Clear all</button>
        <button class="btn btn-primary" id="generateBtn" type="button">Generate HTML</button>
      </div>
    </div>

    <div class="masonry-controls-panel" id="masonryControlsPanel" style="display:none;">
      <div class="masonry-controls-header">
        <div class="masonry-panel-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
          </svg>
          <span>Masonry Layout &amp; Card Customizer</span>
        </div>
        <span class="masonry-panel-hint">Configure grid columns, spacing, card surfaces, and responsive breakpoints</span>
      </div>

      <div class="masonry-presets-bar">
        <span class="masonry-presets-label">⚡ Presets:</span>
        <button type="button" class="masonry-preset-pill" data-preset="default" data-active="true">🎨 Default Cards</button>
        <button type="button" class="masonry-preset-pill" data-preset="fullbleed" data-active="false">🖼️ Full-Bleed Media</button>
        <button type="button" class="masonry-preset-pill" data-preset="bento" data-active="false">🗂️ Bento Board</button>
        <button type="button" class="masonry-preset-pill" data-preset="social" data-active="false">📱 Social Feed</button>
        <button type="button" class="masonry-preset-pill" data-preset="minimal" data-active="false">✨ Clean Minimal</button>
      </div>

      <div class="masonry-controls-grid">
        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Grid Columns</div>
          <div class="gap-control" id="masonryColsControl" role="group" aria-label="Masonry Columns">
            <button type="button" data-mcols="auto" aria-pressed="true">Auto</button>
            <button type="button" data-mcols="1" aria-pressed="false">1 Col</button>
            <button type="button" data-mcols="2" aria-pressed="false">2 Cols</button>
            <button type="button" data-mcols="3" aria-pressed="false">3 Cols</button>
            <button type="button" data-mcols="4" aria-pressed="false">4 Cols</button>
            <button type="button" data-mcols="5" aria-pressed="false">5 Cols</button>
          </div>
        </div>

        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Column &amp; Gutter Spacing</div>
          <div class="gap-control" id="masonryGapControl" role="group" aria-label="Masonry Spacing">
            <button type="button" data-mgap="0" aria-pressed="false">0px (Seamless)</button>
            <button type="button" data-mgap="8" aria-pressed="false">8px</button>
            <button type="button" data-mgap="16" aria-pressed="false">16px</button>
            <button type="button" data-mgap="24" aria-pressed="true">24px</button>
            <button type="button" data-mgap="36" aria-pressed="false">36px</button>
            <button type="button" data-mgap="48" aria-pressed="false">48px</button>
          </div>
        </div>

        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Card Padding</div>
          <div class="gap-control" id="masonryPaddingControl" role="group" aria-label="Item Card Padding">
            <button type="button" data-mpadding="0" aria-pressed="false">0px (Flush)</button>
            <button type="button" data-mpadding="6" aria-pressed="false">6px</button>
            <button type="button" data-mpadding="12" aria-pressed="true">12px</button>
            <button type="button" data-mpadding="18" aria-pressed="false">18px</button>
            <button type="button" data-mpadding="24" aria-pressed="false">24px</button>
          </div>
        </div>

        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Corner Radius</div>
          <div class="gap-control" id="masonryRadiusControl" role="group" aria-label="Item Card Corners">
            <button type="button" data-mradius="0" aria-pressed="false">0px (Sharp)</button>
            <button type="button" data-mradius="6" aria-pressed="false">6px (Subtle)</button>
            <button type="button" data-mradius="12" aria-pressed="true">12px (Smooth)</button>
            <button type="button" data-mradius="18" aria-pressed="false">18px (Modern)</button>
            <button type="button" data-mradius="26" aria-pressed="false">26px (Pill)</button>
          </div>
        </div>

        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Card Surface</div>
          <div class="gap-control" id="masonryStyleControl" role="group" aria-label="Card Surface Style">
            <button type="button" data-mstyle="card" aria-pressed="true">Elevated Card</button>
            <button type="button" data-mstyle="minimal" aria-pressed="false">Minimal (No Card)</button>
            <button type="button" data-mstyle="outline" aria-pressed="false">Outline Only</button>
            <button type="button" data-mstyle="glass" aria-pressed="false">Frosted Glass</button>
          </div>
        </div>

        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Hover Interaction</div>
          <div class="gap-control" id="masonryHoverControl" role="group" aria-label="Hover Interaction">
            <button type="button" data-mhover="lift" aria-pressed="true">✨ 3D Lift</button>
            <button type="button" data-mhover="glow" aria-pressed="false">🌟 Glow</button>
            <button type="button" data-mhover="none" aria-pressed="false">Static</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="section-label">
      <span class="eyebrow">Live preview</span>
    </div>
    <div class="stage">
      <div class="stage-row" id="stageRow"></div>
    </div>
  </section>

  <section id="outputSection" style="display:none;">
    <div class="section-label">
      <span class="eyebrow">Generated HTML</span>
      <button class="copy-btn" id="copyBtn" type="button">Copy code</button>
    </div>
    <div class="code-panel">
      <div class="code-panel-head">
        <div class="dots"><span></span><span></span><span></span></div>
        <span class="eyebrow" id="codeFileLabel" style="color:var(--code-ink); opacity:0.5;">row.html</span>
      </div>
      <pre class="code-out" id="codeOut"></pre>
    </div>

    <!-- ============ SAVE PANEL ============ -->
    <div class="save-panel">
      <div class="save-panel-head">
        <div class="icon">💾</div>
        <h3>Save this page</h3>
      </div>
      <p class="hint">Give your page a name and save it to the server. You'll get a shareable link and a download option.</p>

      <div class="save-row">
        <input type="text" id="saveTitleInput" placeholder="Page name (e.g. My product embeds)" maxlength="120" />
        <button class="btn btn-save" id="saveDbBtn" type="button">Save to server</button>
      </div>

      <div class="save-result" id="saveResult"></div>
    </div>
    <!-- ============ /SAVE PANEL ============ -->
  </section>

  <!-- ============ HISTORY PANEL (always visible) ============ -->
  <section>
    <div class="history-panel" id="historyPanel">
      <div class="history-panel-head">
        <div class="history-panel-title">
          <div class="icon">📚</div>
          <span>History</span>
        </div>
        <button type="button" class="history-refresh-btn" id="historyRefreshBtn">
          ↻ Refresh
        </button>
      </div>
      <div class="history-list" id="historyList">
        <div class="history-loading">Loading your saved pages…</div>
      </div>
    </div>
  </section>
  <!-- ============ /HISTORY PANEL ============ -->

  <footer class="hint-footer">
    Generates a complete standalone HTML document. Maximum 4 columns per row with automatic mobile responsiveness.
  </footer>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  'use strict';

  // ============================================================
  // 0. LARAVEL INJECTED VALUES
  // ============================================================
  var CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').content;
  var STORE_URL  = "{{ route('pages.store') }}";
  var HISTORY_URL = "{{ route('pages.index') }}";

  // ============================================================
  // 1. CONFIG & STORAGE
  // ============================================================
  var STORAGE_KEY = 'embed-row:slots:v5';
  var THEME_KEY = 'embed-row:theme:v1';
  var MASONRY_CONFIG_KEY = 'embed-row:masonry-cfg:v2';

  var slotsContainer = document.getElementById('slotsContainer');
  var stageRow = document.getElementById('stageRow');
  var codeOut = document.getElementById('codeOut');
  var codeFileLabel = document.getElementById('codeFileLabel');
  var outputSection = document.getElementById('outputSection');
  var gapButtons = Array.prototype.slice.call(document.querySelectorAll('#gapControlWrap .gap-control button'));
  var gapControlWrap = document.getElementById('gapControlWrap');
  var modeButtons = Array.prototype.slice.call(document.querySelectorAll('#modeControl button'));
  var addSlotBtn = document.getElementById('addSlotBtn');
  var addSlotBtnBottom = document.getElementById('addSlotBtnBottom');
  var masonryControlsPanel = document.getElementById('masonryControlsPanel');

  var currentGap = 24;
  var layoutMode = 'row';
  var carouselIndex = 0;
  var carouselWidth = null;
  var carouselHeight = null;
  var slotsData = [];

  var dragState = null;
  var DRAG_THRESHOLD = 6;

  var masonryCols = 'auto';
  var masonryGap = 24;
  var masonryPadding = 12;
  var masonryRadius = 12;
  var masonryStyle = 'card';
  var masonryHover = 'lift';
  var activePreset = 'default';

  var masonryColsButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryColsControl button'));
  var masonryGapButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryGapControl button'));
  var masonryPaddingButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryPaddingControl button'));
  var masonryRadiusButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryRadiusControl button'));
  var masonryStyleButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryStyleControl button'));
  var masonryHoverButtons = Array.prototype.slice.call(document.querySelectorAll('#masonryHoverControl button'));
  var masonryPresetButtons = Array.prototype.slice.call(document.querySelectorAll('.masonry-preset-pill'));

  var MASONRY_PRESETS = {
    default: { cols: 'auto', gap: 24, padding: 12, radius: 12, style: 'card', hover: 'lift' },
    fullbleed: { cols: '3', gap: 16, padding: 0, radius: 8, style: 'minimal', hover: 'lift' },
    bento: { cols: '4', gap: 8, padding: 8, radius: 6, style: 'outline', hover: 'glow' },
    social: { cols: '2', gap: 16, padding: 12, radius: 18, style: 'card', hover: 'lift' },
    minimal: { cols: 'auto', gap: 24, padding: 0, radius: 0, style: 'minimal', hover: 'none' }
  };

  // ============================================================
  // 2. UTILITIES
  // ============================================================
  function parseSnippetHeight(code) {
    if (!code) return null;
    var match = code.match(/height=["']?(\d+)(?:px)?["']?/i);
    if (match && match[1]) {
      var val = parseInt(match[1], 10);
      if (val > 50 && val < 2000) return val;
    }
    var styleMatch = code.match(/height\s*:\s*(\d+)px/i);
    if (styleMatch && styleMatch[1]) {
      var sVal = parseInt(styleMatch[1], 10);
      if (sVal > 50 && sVal < 2000) return sVal;
    }
    return null;
  }

  function extractBodyContent(raw) {
    if (!raw) return '';
    var trimmed = raw.trim();
    if (!/<!DOCTYPE\s+html/i.test(trimmed) && !/<html[\s>]/i.test(trimmed)) return trimmed;
    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(trimmed, 'text/html');
      return doc.body ? doc.body.innerHTML.trim() : trimmed;
    } catch (e) { return trimmed; }
  }

  function indent(code, spaces) {
    var pad = new Array(spaces + 1).join(' ');
    return code.split('\n').map(function (line) { return pad + line; }).join('\n');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ============================================================
  // 3. THEME
  // ============================================================
  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function initTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved) applyTheme(saved);
    } catch (e) {}
  }

  document.getElementById('themeToggle').addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effectiveDark = current === 'dark' || (!current && prefersDark);
    var next = effectiveDark ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  // ============================================================
  // 4. MASONRY UI
  // ============================================================
  function updateMasonryButtonsUI() {
    masonryColsButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-mcols') === masonryCols ? 'true' : 'false');
    });
    masonryGapButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-mgap'), 10) === masonryGap ? 'true' : 'false');
    });
    masonryPaddingButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-mpadding'), 10) === masonryPadding ? 'true' : 'false');
    });
    masonryRadiusButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', parseInt(b.getAttribute('data-mradius'), 10) === masonryRadius ? 'true' : 'false');
    });
    masonryStyleButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-mstyle') === masonryStyle ? 'true' : 'false');
    });
    masonryHoverButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-mhover') === masonryHover ? 'true' : 'false');
    });
    masonryPresetButtons.forEach(function (b) {
      b.setAttribute('data-active', b.getAttribute('data-preset') === activePreset ? 'true' : 'false');
    });
  }

  function applyMasonryPreset(presetKey) {
    if (!MASONRY_PRESETS[presetKey]) return;
    var p = MASONRY_PRESETS[presetKey];
    masonryCols = p.cols;
    masonryGap = p.gap;
    masonryPadding = p.padding;
    masonryRadius = p.radius;
    masonryStyle = p.style;
    masonryHover = p.hover;
    activePreset = presetKey;
    updateMasonryButtonsUI();
    saveMasonryConfig();
    if (layoutMode === 'masonry') {
      renderPreview();
      if (outputSection.style.display !== 'none') renderCode();
    }
  }

  function saveMasonryConfig() {
    try {
      localStorage.setItem(MASONRY_CONFIG_KEY, JSON.stringify({
        cols: masonryCols, gap: masonryGap, padding: masonryPadding,
        radius: masonryRadius, style: masonryStyle, hover: masonryHover, preset: activePreset
      }));
    } catch (e) {}
  }

  function loadMasonryConfig() {
    try {
      var raw = localStorage.getItem(MASONRY_CONFIG_KEY);
      if (raw) {
        var cfg = JSON.parse(raw);
        if (cfg.cols) masonryCols = cfg.cols;
        if (cfg.gap !== undefined) masonryGap = parseInt(cfg.gap, 10);
        if (cfg.padding !== undefined) masonryPadding = parseInt(cfg.padding, 10);
        if (cfg.radius !== undefined) masonryRadius = parseInt(cfg.radius, 10);
        if (cfg.style) masonryStyle = cfg.style;
        if (cfg.hover) masonryHover = cfg.hover;
        if (cfg.preset) activePreset = cfg.preset;
      }
    } catch (e) {}
    updateMasonryButtonsUI();
  }

  // ============================================================
  // 5. SLOTS
  // ============================================================
  var placeholders = [
    '<iframe src="https://example.com/widget-1" width="100%" height="220"></iframe>',
    '<blockquote class="reviews-widget">…</blockquote>\n<script src="https://example.com/reviews.js"><' + '/script>',
    '<div id="chat-widget" data-id="12345"></div>\n<script src="https://example.com/chat.js"><' + '/script>',
    '<iframe src="https://example.com/widget-4" width="100%" height="220"></iframe>'
  ];

  function createSlotCard(val, index, customWidth, customHeight) {
    var card = document.createElement('div');
    card.className = 'slot-card';

    var head = document.createElement('div');
    head.className = 'slot-head';

    var dragHandle = document.createElement('span');
    dragHandle.className = 'slot-drag-handle';
    dragHandle.textContent = '⠿';
    dragHandle.title = 'Drag to reorder';

    var num = document.createElement('span');
    num.className = 'slot-num';
    num.textContent = index + 1;

    var title = document.createElement('span');
    title.className = 'slot-title';
    title.textContent = 'Embed ' + (index + 1);

    var status = document.createElement('span');
    status.className = 'slot-status';
    status.textContent = val.trim() ? 'ready' : 'empty';
    if (val.trim()) status.classList.add('filled');

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-slot-btn';
    removeBtn.title = 'Remove slot';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', function () { removeSlot(card); });

    head.appendChild(dragHandle);
    head.appendChild(num);
    head.appendChild(title);
    head.appendChild(status);
    head.appendChild(removeBtn);

    var input = document.createElement('textarea');
    input.className = 'slot-input';
    input.spellcheck = false;
    input.placeholder = placeholders[index % placeholders.length];
    input.value = val;
    input.addEventListener('input', onInput);

    card.appendChild(head);
    card.appendChild(input);

    var slotObj = {
      card: card, input: input, status: status, num: num, title: title,
      removeBtn: removeBtn, dragHandle: dragHandle,
      customWidth: customWidth || null, customHeight: customHeight || null
    };

    attachPointerDrag(slotObj);
    return slotObj;
  }

  // ============================================================
  // 6. DRAG & DROP
  // ============================================================
  function attachPointerDrag(slotObj) {
    var handle = slotObj.dragHandle;

    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      var sourceIndex = slotsData.indexOf(slotObj);
      if (sourceIndex === -1) return;
      e.preventDefault();
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      dragState = {
        sourceIndex: sourceIndex, pointerId: e.pointerId,
        startX: e.clientX, startY: e.clientY, ghostEl: null,
        ghostOffsetX: 0, ghostOffsetY: 0, currentTargetIndex: -1,
        currentInsertBefore: true, started: false
      };
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragState || dragState.pointerId !== e.pointerId) return;
      if (!dragState.started) {
        var dx = e.clientX - dragState.startX;
        var dy = e.clientY - dragState.startY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        beginDrag(e);
      }
      if (dragState.started) {
        e.preventDefault();
        updateGhostPosition(e.clientX, e.clientY);
        updateDropTarget(e.clientX, e.clientY);
      }
    });

    handle.addEventListener('pointerup', function (e) {
      if (!dragState || dragState.pointerId !== e.pointerId) return;
      if (dragState.started) endDrag(true); else dragState = null;
    });

    handle.addEventListener('pointercancel', function (e) {
      if (!dragState || dragState.pointerId !== e.pointerId) return;
      if (dragState.started) endDrag(false); else dragState = null;
    });

    handle.addEventListener('lostpointercapture', function (e) {
      if (!dragState || dragState.pointerId !== e.pointerId) return;
      if (dragState.started) endDrag(false); else dragState = null;
    });
  }

  function beginDrag(e) {
    if (!dragState) return;
    dragState.started = true;
    var sourceSlot = slotsData[dragState.sourceIndex];
    if (!sourceSlot) return;
    var srcRect = sourceSlot.card.getBoundingClientRect();

    var ghost = sourceSlot.card.cloneNode(true);
    ghost.classList.add('slot-drag-ghost');
    ghost.classList.remove('is-dragging');
    ghost.style.width = srcRect.width + 'px';
    ghost.style.height = srcRect.height + 'px';
    ghost.style.left = '0px';
    ghost.style.top = '0px';
    document.body.appendChild(ghost);
    dragState.ghostEl = ghost;

    dragState.ghostOffsetX = e.clientX - srcRect.left;
    dragState.ghostOffsetY = e.clientY - srcRect.top;

    sourceSlot.card.classList.add('is-drag-placeholder');
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.cursor = 'grabbing';
    updateGhostPosition(e.clientX, e.clientY);
  }

  function updateGhostPosition(clientX, clientY) {
    if (!dragState || !dragState.ghostEl) return;
    var gx = clientX - dragState.ghostOffsetX;
    var gy = clientY - dragState.ghostOffsetY;
    dragState.ghostEl.style.transform = 'translate3d(' + gx + 'px, ' + gy + 'px, 0) rotate(2deg) scale(1.03)';
  }

  function clearDropIndicators() {
    slotsData.forEach(function (o) {
      var ind = o.card.querySelector('.slot-drop-indicator');
      if (ind && ind.parentNode) ind.parentNode.removeChild(ind);
      o.card.classList.remove('is-drag-over');
    });
  }

  function updateDropTarget(clientX, clientY) {
    if (!dragState) return;
    var targetIndex = -1;
    var insertBefore = true;

    for (var i = 0; i < slotsData.length; i++) {
      var card = slotsData[i].card;
      var rect = card.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top - 20 && clientY <= rect.bottom + 20) {
        targetIndex = i;
        insertBefore = clientX < (rect.left + rect.width / 2);
        break;
      }
    }

    if (targetIndex === -1) {
      clearDropIndicators();
      dragState.currentTargetIndex = -1;
      return;
    }

    if (dragState.currentTargetIndex === targetIndex &&
        dragState.currentInsertBefore === insertBefore) return;

    dragState.currentTargetIndex = targetIndex;
    dragState.currentInsertBefore = insertBefore;
    clearDropIndicators();

    var targetCard = slotsData[targetIndex].card;
    var indicator = document.createElement('div');
    indicator.className = 'slot-drop-indicator ' + (insertBefore ? 'indicator-left' : 'indicator-right');
    targetCard.appendChild(indicator);
    targetCard.classList.add('is-drag-over');
  }

  function endDrag(commit) {
    if (!dragState) return;
    var sourceIndex = dragState.sourceIndex;
    var targetIndex = dragState.currentTargetIndex;
    var insertBefore = dragState.currentInsertBefore;

    if (dragState.ghostEl && dragState.ghostEl.parentNode) {
      dragState.ghostEl.parentNode.removeChild(dragState.ghostEl);
    }
    clearDropIndicators();
    if (slotsData[sourceIndex]) slotsData[sourceIndex].card.classList.remove('is-drag-placeholder');

    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.cursor = '';

    if (commit && targetIndex !== -1) {
      var insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      if (sourceIndex < insertIndex) insertIndex -= 1;
      if (insertIndex !== sourceIndex) reorderSlots(sourceIndex, insertIndex);
    }
    dragState = null;
  }

  function reorderSlots(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= slotsData.length) return;
    if (toIndex < 0 || toIndex >= slotsData.length) return;

    var moved = slotsData.splice(fromIndex, 1)[0];
    slotsData.splice(toIndex, 0, moved);

    slotsData.forEach(function (o) { slotsContainer.appendChild(o.card); });
    reindexSlots();
    updateStatuses();
    saveSlots();
    renderPreview();
    if (outputSection.style.display !== 'none') renderCode();
  }

  function addSlot(val, shouldFocus, customWidth, customHeight, insertAtStart) {
    var slotObj = createSlotCard(val || '', insertAtStart ? 0 : slotsData.length, customWidth, customHeight);
    if (insertAtStart) {
      slotsData.unshift(slotObj);
      slotsContainer.insertBefore(slotObj.card, slotsContainer.firstChild);
      reindexSlots();
    } else {
      slotsData.push(slotObj);
      slotsContainer.appendChild(slotObj.card);
    }
    updateRemoveButtons();
    onInput();
    if (shouldFocus) {
      slotObj.card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(function () { try { slotObj.input.focus(); } catch (e) {} }, 80);
    }
  }

  function removeSlot(cardEl) {
    if (slotsData.length <= 1) return;
    var idx = -1;
    for (var i = 0; i < slotsData.length; i++) {
      if (slotsData[i].card === cardEl) { idx = i; break; }
    }
    if (idx !== -1) {
      slotsContainer.removeChild(cardEl);
      slotsData.splice(idx, 1);
      reindexSlots();
      updateRemoveButtons();
      onInput();
    }
  }

  function reindexSlots() {
    slotsData.forEach(function (obj, i) {
      obj.num.textContent = i + 1;
      obj.title.textContent = 'Embed ' + (i + 1);
    });
  }

  function updateRemoveButtons() {
    slotsData.forEach(function (obj) {
      obj.removeBtn.style.display = slotsData.length > 1 ? '' : 'none';
    });
  }

  function saveSlots() {
    try {
      var data = slotsData.map(function (obj) {
        return { code: obj.input.value, width: obj.customWidth || null, height: obj.customHeight || null };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadSlots() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(function (val) {
            if (typeof val === 'string') addSlot(val);
            else if (val && typeof val === 'object') addSlot(val.code || '', false, val.width, val.height);
          });
          return;
        }
      }
    } catch (e) {}
    addSlot(''); addSlot(''); addSlot(''); addSlot('');
  }

  // ============================================================
  // 7. PREVIEW RENDERING
  // ============================================================
  function buildFrameDoc(code) {
    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<base target="_blank">' +
      '<style>' +
      '*,*::before,*::after{box-sizing:border-box;}' +
      'html{width:100%;margin:0;padding:0;background:transparent;}' +
      'body{margin:0;padding:8px;width:100%;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;' +
      'color:#0f172a;background:transparent;display:block;overflow:hidden;}' +
      'img{max-width:100%!important;height:auto!important;margin:0 auto;display:block;border-radius:6px;border:0;}' +
      'video,iframe,embed,object{max-width:100%!important;margin:0 auto;display:block;border-radius:6px;border:0;}' +
      'blockquote{max-width:100%!important;margin:0 auto!important;border-radius:6px;border:0;}' +
      '</style>' +
      '<script>' +
      '(function(){' +
      '  function sendSize(){' +
      '    var body = document.body, html = document.documentElement;' +
      '    var h = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight);' +
      '    if(h > 0){ window.parent.postMessage({ type: "EZ_FRAME_RESIZE", height: h }, "*"); }' +
      '  }' +
      '  window.addEventListener("load", function(){ sendSize(); setTimeout(sendSize, 300); setTimeout(sendSize, 1000); });' +
      '  window.addEventListener("resize", sendSize);' +
      '  if(window.ResizeObserver){ new ResizeObserver(sendSize).observe(document.body); }' +
      '})();' +
      '<' + '/script>' +
      '</head><body>' + code + '</body></html>';
  }

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'EZ_FRAME_RESIZE' && e.data.height) {
      var frames = document.querySelectorAll('.stage-cell iframe, .carousel-viewport iframe');
      for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) {
          var cell = frames[i].closest('.stage-cell, .carousel-viewport');
          if (cell && !cell.classList.contains('is-resizing')) {
            var targetH = Math.min(Math.max(e.data.height + 24, 180), 800);
            cell.style.height = targetH + 'px';
          }
        }
      }
    }
  });

  function renderPreview() {
    if (layoutMode === 'carousel') renderCarouselPreview();
    else if (layoutMode === 'masonry') renderMasonryPreview();
    else renderRowPreview();
  }

  function setupResizableCell(cell, obj) {
    var parsedH = parseSnippetHeight(obj.input.value);
    if (obj.customWidth) cell.style.width = obj.customWidth + 'px';
    if (obj.customHeight) cell.style.height = obj.customHeight + 'px';
    else if (parsedH) cell.style.height = (parsedH + 24) + 'px';

    cell.addEventListener('pointerdown', function (e) {
      var rect = cell.getBoundingClientRect();
      if (e.clientX > rect.right - 30 && e.clientY > rect.bottom - 30) {
        cell.classList.add('is-resizing');
        var onUp = function () {
          cell.classList.remove('is-resizing');
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
    });

    var isInitial = true;
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (isInitial) { isInitial = false; return; }
        if (cell.style.width || cell.style.height) {
          var w = Math.round(cell.getBoundingClientRect().width || cell.offsetWidth);
          var h = Math.round(cell.getBoundingClientRect().height || cell.offsetHeight);
          if (w > 50 && h > 50) {
            obj.customWidth = w;
            obj.customHeight = h;
            saveSlots();
            if (outputSection.style.display !== 'none') renderCode();
          }
        }
      });
      ro.observe(cell);
    }

    cell.addEventListener('pointerup', function () {
      if (cell.style.width || cell.style.height) {
        var w = Math.round(cell.getBoundingClientRect().width || cell.offsetWidth);
        var h = Math.round(cell.getBoundingClientRect().height || cell.offsetHeight);
        if (w > 50) obj.customWidth = w;
        if (h > 50) obj.customHeight = h;
        saveSlots();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  }

  function renderRowPreview() {
    var maxCols = Math.min(slotsData.length, 4);
    var isSingle = slotsData.length === 1;
    stageRow.className = 'stage-row' + (isSingle ? ' is-single-embed' : '');
    stageRow.style.display = 'grid';
    stageRow.style.columnCount = '';
    stageRow.style.columnGap = '';
    stageRow.style.gap = currentGap + 'px';
    stageRow.style.gridTemplateColumns = isSingle ? '1fr' : 'repeat(' + maxCols + ', minmax(280px, 1fr))';
    stageRow.style.minWidth = isSingle ? '0' : (maxCols * 280 + (maxCols - 1) * currentGap) + 'px';
    stageRow.style.maxWidth = isSingle ? '640px' : '';
    stageRow.style.margin = '0 auto';
    stageRow.innerHTML = '';

    slotsData.forEach(function (obj, i) {
      var cell = document.createElement('div');
      cell.className = 'stage-cell';
      var code = extractBodyContent(obj.input.value);
      if (code) {
        var frame = document.createElement('iframe');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation');
        frame.setAttribute('srcdoc', buildFrameDoc(code));
        frame.title = 'Preview of slot ' + (i + 1);
        cell.appendChild(frame);
      } else {
        var empty = document.createElement('div');
        empty.className = 'stage-empty';
        empty.textContent = 'Slot ' + (i + 1) + ' — paste embed code above to preview it here';
        cell.appendChild(empty);
      }
      setupResizableCell(cell, obj);
      stageRow.appendChild(cell);
    });
  }

  function renderMasonryPreview() {
    var cols = masonryCols === 'auto' ? Math.min(slotsData.length, 4) : parseInt(masonryCols, 10);
    if (!cols || cols < 1) cols = 1;
    var isSingle = slotsData.length === 1 && (masonryCols === 'auto' || masonryCols === '1');

    stageRow.className = 'masonry-preview' + (isSingle ? ' is-single-embed' : '');
    stageRow.style.display = 'flex';
    stageRow.style.flexDirection = 'row';
    stageRow.style.alignItems = 'flex-start';
    stageRow.style.gap = masonryGap + 'px';
    stageRow.style.columnCount = '';
    stageRow.style.columnGap = '';
    stageRow.style.gridTemplateColumns = '';
    stageRow.style.minWidth = isSingle ? '0' : '100%';
    stageRow.style.maxWidth = isSingle ? '640px' : '100%';
    stageRow.style.margin = '0 auto';
    stageRow.innerHTML = '';

    var colEls = [];
    for (var c = 0; c < cols; c++) {
      var colDiv = document.createElement('div');
      colDiv.className = 'masonry-preview-col';
      colDiv.style.flex = '1 1 0';
      colDiv.style.display = 'flex';
      colDiv.style.flexDirection = 'column';
      colDiv.style.gap = masonryGap + 'px';
      colDiv.style.minWidth = '0';
      stageRow.appendChild(colDiv);
      colEls.push(colDiv);
    }

    slotsData.forEach(function (obj, i) {
      var targetCol = colEls[i % cols];
      var cell = document.createElement('div');
      cell.className = 'stage-cell masonry-stage-cell';
      cell.setAttribute('data-mstyle', masonryStyle);
      cell.setAttribute('data-mhover', masonryHover);
      cell.style.padding = masonryPadding + 'px';
      cell.style.borderRadius = masonryRadius + 'px';

      var badge = document.createElement('span');
      badge.className = 'masonry-slot-badge';
      badge.textContent = '#' + (i + 1);
      cell.appendChild(badge);

      var code = extractBodyContent(obj.input.value);
      if (code) {
        var frame = document.createElement('iframe');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation');
        frame.setAttribute('srcdoc', buildFrameDoc(code));
        frame.title = 'Preview of slot ' + (i + 1);
        cell.appendChild(frame);
      } else {
        var empty = document.createElement('div');
        empty.className = 'stage-empty';
        empty.textContent = 'Slot ' + (i + 1) + ' — paste embed code above to preview it here';
        cell.appendChild(empty);
      }
      setupResizableCell(cell, obj);
      targetCol.appendChild(cell);
    });
  }

  function filledSlots() {
    return slotsData
      .map(function (obj, i) {
        return {
          i: i,
          code: extractBodyContent(obj.input.value),
          width: obj.customWidth || null,
          height: obj.customHeight || null
        };
      })
      .filter(function (s) { return s.code; });
  }

  function renderCarouselPreview() {
    stageRow.className = 'carousel-preview';
    stageRow.style.display = 'flex';
    stageRow.style.flexDirection = 'column';
    stageRow.style.columnCount = '';
    stageRow.style.columnGap = '';
    stageRow.style.gap = '14px';
    stageRow.style.gridTemplateColumns = '';
    stageRow.style.minWidth = '0';
    stageRow.style.width = '100%';
    stageRow.style.maxWidth = '640px';
    stageRow.style.margin = '0 auto';
    stageRow.innerHTML = '';
    var filled = filledSlots();

    if (!filled.length) {
      var empty = document.createElement('div');
      empty.className = 'stage-empty';
      empty.style.height = '360px';
      empty.style.minWidth = '100%';
      empty.textContent = 'Paste embed code into at least one slot to preview the carousel';
      stageRow.appendChild(empty);
      return;
    }

    if (carouselIndex >= filled.length) carouselIndex = 0;

    if (filled.length > 1) {
      var controls = document.createElement('div');
      controls.className = 'carousel-controls';

      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'carousel-arrow';
      prevBtn.setAttribute('aria-label', 'Previous clip');
      prevBtn.textContent = '‹';
      prevBtn.addEventListener('click', function () {
        carouselIndex = (carouselIndex - 1 + filled.length) % filled.length;
        renderCarouselPreview();
      });

      var dots = document.createElement('div');
      dots.className = 'carousel-dots';
      filled.forEach(function (s, idx) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Go to clip ' + (idx + 1));
        if (idx === carouselIndex) d.className = 'is-active';
        d.addEventListener('click', function () {
          carouselIndex = idx;
          renderCarouselPreview();
        });
        dots.appendChild(d);
      });

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'carousel-arrow';
      nextBtn.setAttribute('aria-label', 'Next clip');
      nextBtn.textContent = '›';
      nextBtn.addEventListener('click', function () {
        carouselIndex = (carouselIndex + 1) % filled.length;
        renderCarouselPreview();
      });

      controls.appendChild(prevBtn);
      controls.appendChild(dots);
      controls.appendChild(nextBtn);
      stageRow.appendChild(controls);
    }

    var viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';
    if (carouselWidth) viewport.style.width = carouselWidth + 'px';
    if (carouselHeight) viewport.style.height = carouselHeight + 'px';

    var frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation allow-top-navigation-by-user-activation');
    frame.setAttribute('srcdoc', buildFrameDoc(filled[carouselIndex].code));
    frame.title = 'Preview of clip ' + (carouselIndex + 1) + ' of ' + filled.length;
    viewport.appendChild(frame);
    stageRow.appendChild(viewport);

    viewport.addEventListener('pointerdown', function (e) {
      var rect = viewport.getBoundingClientRect();
      if (e.clientX > rect.right - 30 && e.clientY > rect.bottom - 30) {
        viewport.classList.add('is-resizing');
        var onUp = function () {
          viewport.classList.remove('is-resizing');
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
    });

    var isInitialVp = true;
    if (window.ResizeObserver) {
      var roVp = new ResizeObserver(function () {
        if (isInitialVp) { isInitialVp = false; return; }
        if (viewport.style.width || viewport.style.height) {
          var w = Math.round(viewport.getBoundingClientRect().width || viewport.offsetWidth);
          var h = Math.round(viewport.getBoundingClientRect().height || viewport.offsetHeight);
          if (w > 50) carouselWidth = w;
          if (h > 50) carouselHeight = h;
          if (outputSection.style.display !== 'none') renderCode();
        }
      });
      roVp.observe(viewport);
    }

    viewport.addEventListener('pointerup', function () {
      if (viewport.style.width || viewport.style.height) {
        var w = Math.round(viewport.getBoundingClientRect().width || viewport.offsetWidth);
        var h = Math.round(viewport.getBoundingClientRect().height || viewport.offsetHeight);
        if (w > 50) carouselWidth = w;
        if (h > 50) carouselHeight = h;
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  }

  function updateStatuses() {
    slotsData.forEach(function (obj) {
      var filled = extractBodyContent(obj.input.value).length > 0;
      obj.status.textContent = filled ? 'ready' : 'empty';
      obj.status.classList.toggle('filled', filled);
    });
  }

  // ============================================================
  // 8. HTML GENERATORS
  // ============================================================
  function buildRowHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Embed Row</title>\n</head>\n<body>\n  <!-- Paste embed code into at least one slot above -->\n</body>\n</html>';
    }

    var uid = 'embed-row-' + Math.random().toString(36).slice(2, 8);
    var cols = Math.min(filled.length, 4);
    var isSingle = filled.length === 1;

    var itemsHtml = filled.map(function (s) {
      var styleParts = [];
      if (s.width) styleParts.push('width: ' + s.width + 'px');
      if (s.height) styleParts.push('height: ' + s.height + 'px');
      var styleAttr = styleParts.length ? ' style="' + styleParts.join('; ') + ';"' : '';
      return '    <div class="embed-row-item' + (isSingle ? ' is-single' : '') + '"' + styleAttr + '>\n' + indent(s.code, 6) + '\n    </div>';
    }).join('\n');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Side-by-Side Embeds</title>\n  <style>\n    *, *::before, *::after { box-sizing: border-box; }\n    html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; overflow-x: auto; -webkit-overflow-scrolling: touch; }\n    .embed-scroll-container { width: 100%; max-width: 1400px; margin: 0 auto; overflow-x: auto; overflow-y: hidden; padding: 24px 20px; box-sizing: border-box; -webkit-overflow-scrolling: touch; }\n    #' + uid + ' { display: grid; grid-template-columns: ' + (isSingle ? '1fr' : 'repeat(' + cols + ', minmax(280px, 1fr))') + '; gap: ' + currentGap + 'px; width: 100%;' + (isSingle ? ' max-width: 640px; margin: 0 auto;' : '') + ' box-sizing: border-box; align-items: start; }\n    #' + uid + ' .embed-row-item { min-width: 240px; box-sizing: border-box; border-radius: 14px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02); padding: 12px; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; resize: both; overflow: auto; min-height: 180px; max-width: 100%; transition: box-shadow 0.2s ease; }\n    #' + uid + ' .embed-row-item:hover { box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 3px 8px -2px rgba(0, 0, 0, 0.04); transform: translateY(-2px); }\n    #' + uid + ' .embed-row-item > * { width: 100% !important; height: 100% !important; min-height: 0 !important; max-width: 100% !important; max-height: 100% !important; flex: 1 1 auto !important; box-sizing: border-box !important; }\n    #' + uid + ' .embed-row-item iframe, #' + uid + ' .embed-row-item video, #' + uid + ' .embed-row-item embed, #' + uid + ' .embed-row-item object { width: 100% !important; height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; margin: 0 auto !important; border: 0 !important; border-radius: 8px; display: block; }\n    #' + uid + ' .embed-row-item img { width: 100% !important; height: 100% !important; object-fit: contain !important; min-height: 0 !important; flex: 1 1 auto !important; margin: 0 auto !important; border: 0 !important; border-radius: 8px; display: block; }\n    #' + uid + ' .embed-row-item blockquote { width: 100% !important; max-width: 100% !important; max-height: 100% !important; overflow: auto !important; margin: 0 auto !important; border: 0 !important; border-radius: 8px; display: block; }\n    @media (min-width: 769px) { #' + uid + ':has(> .embed-row-item:only-child), #' + uid + '.is-single { max-width: 640px !important; width: 100% !important; margin: 0 auto !important; } }\n    @media (max-width: 1100px) { #' + uid + ' { grid-template-columns: ' + (isSingle ? '1fr' : 'repeat(' + Math.min(cols, 3) + ', minmax(260px, 1fr))') + '; } }\n    @media (max-width: 768px) { #' + uid + ' { grid-template-columns: 1fr; gap: ' + Math.max(12, Math.round(currentGap * 0.75)) + 'px; max-width: 100% !important; } .embed-scroll-container { padding: 16px 12px; } }\n  </style>\n</head>\n<body>\n  <div class="embed-scroll-container">\n    <div class="embed-row-wrapper' + (isSingle ? ' is-single' : '') + '" id="' + uid + '">\n' + itemsHtml + '\n    </div>\n  </div>\n</body>\n</html>';
  }

  function buildMasonryHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Masonry Embeds</title>\n</head>\n<body>\n  <!-- Paste embed code into at least one slot above -->\n</body>\n</html>';
    }

    var uid = 'embed-masonry-' + Math.random().toString(36).slice(2, 8);
    var cols = masonryCols === 'auto' ? Math.min(filled.length, 4) : parseInt(masonryCols, 10);
    if (!cols || cols < 1) cols = 1;
    var isSingle = filled.length === 1 && (masonryCols === 'auto' || masonryCols === '1');

    var surfaceCss = '';
    if (masonryStyle === 'minimal') {
      surfaceCss = '      background: transparent;\n      border: none;\n      box-shadow: none;';
    } else if (masonryStyle === 'outline') {
      surfaceCss = '      background: #ffffff;\n      border: 1px solid #cbd5e1;\n      box-shadow: none;';
    } else if (masonryStyle === 'glass') {
      surfaceCss = '      background: rgba(255, 255, 255, 0.75);\n      backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      border: 1px solid rgba(255, 255, 255, 0.5);\n      box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.06);';
    } else {
      surfaceCss = '      background: #ffffff;\n      border: 1px solid #e2e8f0;\n      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);';
    }

    var hoverCss = '';
    if (masonryHover === 'lift') {
      hoverCss = '    #' + uid + ' .masonry-item:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.04); }\n';
    } else if (masonryHover === 'glow') {
      hoverCss = '    #' + uid + ' .masonry-item:hover { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06); }\n';
    }

    var colBuckets = [];
    for (var c = 0; c < cols; c++) { colBuckets.push([]); }
    filled.forEach(function (s, idx) { colBuckets[idx % cols].push(s); });

    var colsHtml = colBuckets.map(function (bucket) {
      var itemsHtml = bucket.map(function (s) {
        var styleParts = [];
        if (s.width) styleParts.push('width: ' + s.width + 'px');
        if (s.height) styleParts.push('height: ' + s.height + 'px');
        var styleAttr = styleParts.length ? ' style="' + styleParts.join('; ') + ';"' : '';
        return '      <div class="masonry-item' + (isSingle ? ' is-single' : '') + '"' + styleAttr + '>\n' + indent(s.code, 8) + '\n      </div>';
      }).join('\n');
      return '    <div class="masonry-col">\n' + itemsHtml + '\n    </div>';
    }).join('\n');

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Masonry Embeds</title>\n  <style>\n    *, *::before, *::after { box-sizing: border-box; }\n    html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; overflow-x: auto; -webkit-overflow-scrolling: touch; }\n    .masonry-scroll-container { width: 100%; max-width: 1400px; margin: 0 auto; overflow-x: auto; padding: 24px 20px; box-sizing: border-box; -webkit-overflow-scrolling: touch; }\n    #' + uid + ' { display: flex; flex-direction: row; align-items: flex-start; gap: ' + masonryGap + 'px; width: 100%;' + (isSingle ? ' max-width: 640px; margin: 0 auto;' : '') + ' box-sizing: border-box; }\n    #' + uid + ' .masonry-col { flex: 1 1 0; display: flex; flex-direction: column; gap: ' + masonryGap + 'px; min-width: 0; }\n    #' + uid + ' .masonry-item { display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; width: 100%; box-sizing: border-box; min-width: 200px; border-radius: ' + masonryRadius + 'px;\n' + surfaceCss + '\n      padding: ' + masonryPadding + 'px;\n      resize: both;\n      overflow: auto;\n      min-height: 180px;\n      max-width: 100%;\n      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;\n    }\n' + hoverCss + '    #' + uid + ' .masonry-item > * { width: 100% !important; height: 100% !important; min-height: 0 !important; max-width: 100% !important; max-height: 100% !important; flex: 1 1 auto !important; box-sizing: border-box !important; }\n    #' + uid + ' .masonry-item iframe, #' + uid + ' .masonry-item video, #' + uid + ' .masonry-item embed, #' + uid + ' .masonry-item object { width: 100% !important; height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; margin: 0 auto !important; border: 0 !important; border-radius: inherit; display: block; }\n    #' + uid + ' .masonry-item img { width: 100% !important; height: 100% !important; object-fit: contain !important; min-height: 0 !important; flex: 1 1 auto !important; margin: 0 auto !important; border: 0 !important; border-radius: inherit; display: block; }\n    #' + uid + ' .masonry-item blockquote { width: 100% !important; max-width: 100% !important; max-height: 100% !important; overflow: auto !important; margin: 0 auto !important; border: 0 !important; border-radius: inherit; display: block; }\n    @media (max-width: 768px) { #' + uid + ' { flex-direction: column; gap: ' + Math.max(8, Math.round(masonryGap * 0.6)) + 'px; max-width: 100% !important; } #' + uid + ' .masonry-col { width: 100%; } #' + uid + ' .masonry-item { padding: ' + Math.max(6, Math.round(masonryPadding * 0.75)) + 'px; } .masonry-scroll-container { padding: 16px 10px; } }\n  </style>\n</head>\n<body>\n  <div class="masonry-scroll-container">\n    <div class="masonry-wrapper' + (isSingle ? ' is-single' : '') + '" id="' + uid + '">\n' + colsHtml + '\n    </div>\n  </div>\n</body>\n</html>';
  }

  function buildCarouselHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Embed Carousel</title>\n</head>\n<body>\n  <!-- Paste embed code into at least one slot above -->\n</body>\n</html>';
    }

    var uid = 'embed-carousel-' + Math.random().toString(36).slice(2, 8);
    var multi = filled.length > 1;

    var slidesHtml = filled.map(function (s, i) {
      return '      <div class="ec-slide" data-active="' + (i === 0 ? 'true' : 'false') + '">\n' + indent(s.code, 8) + '\n      </div>';
    }).join('\n');

    var dotsHtml = filled.map(function (_, i) {
      return '          <button type="button" class="ec-dot' + (i === 0 ? ' is-active' : '') + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
    }).join('\n');

    var controlsHtml = multi
      ? '    <div class="ec-controls">\n      <button type="button" class="ec-prev" aria-label="Previous clip">‹</button>\n      <div class="ec-dots">\n' + dotsHtml + '\n      </div>\n      <button type="button" class="ec-next" aria-label="Next clip">›</button>\n    </div>\n'
      : '';

    var controlsCss = multi
      ? '    #' + uid + ' { display: flex; flex-direction: column; width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; gap: 14px; }\n    #' + uid + ' .ec-controls { order: -1; display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 auto 4px auto; padding: 5px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); width: fit-content; }\n    #' + uid + ' .ec-prev, #' + uid + ' .ec-next { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; cursor: pointer; font-size: 18px; font-weight: 600; line-height: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); transition: all 0.15s ease; }\n    #' + uid + ' .ec-prev:hover, #' + uid + ' .ec-next:hover { border-color: #2563eb; background: #2563eb; color: #ffffff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }\n    #' + uid + ' .ec-prev:active, #' + uid + ' .ec-next:active { transform: translateY(0px) scale(0.95); }\n    #' + uid + ' .ec-dots { display: flex; align-items: center; gap: 7px; padding: 0 4px; }\n    #' + uid + ' .ec-dots button { width: 8px; height: 8px; border-radius: 50%; border: none; background: #cbd5e1; padding: 0; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }\n    #' + uid + ' .ec-dots button.is-active { background: #2563eb; width: 22px; border-radius: 9999px; }\n    #' + uid + ' .ec-viewport { order: 1; position: relative; overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; width: 100%; min-width: 280px; min-height: 180px; padding: 12px; box-sizing: border-box; resize: both; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; }\n'
      : '    #' + uid + ' { width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; }\n    #' + uid + ' .ec-viewport { position: relative; overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; width: 100%; min-width: 280px; min-height: 180px; padding: 12px; box-sizing: border-box; resize: both; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; }\n';

    var script = multi
      ? '  <script>\n  (function () {\n    var root = document.getElementById(\'' + uid + '\');\n    if (!root) return;\n    var slides = root.querySelectorAll(\'.ec-slide\');\n    var dots = root.querySelectorAll(\'.ec-dot\');\n    var prev = root.querySelector(\'.ec-prev\');\n    var next = root.querySelector(\'.ec-next\');\n    var idx = 0;\n    function show(i) {\n      idx = (i + slides.length) % slides.length;\n      for (var j = 0; j < slides.length; j++) slides[j].setAttribute(\'data-active\', j === idx ? \'true\' : \'false\');\n      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle(\'is-active\', k === idx);\n    }\n    if (prev) prev.addEventListener(\'click\', function () { show(idx - 1); });\n    if (next) next.addEventListener(\'click\', function () { show(idx + 1); });\n    for (var d = 0; d < dots.length; d++) {\n      (function (n) { dots[n].addEventListener(\'click\', function () { show(n); }); })(d);\n    }\n    root.setAttribute(\'tabindex\', \'0\');\n    root.addEventListener(\'keydown\', function (e) {\n      if (e.key === \'ArrowLeft\') show(idx - 1);\n      if (e.key === \'ArrowRight\') show(idx + 1);\n    });\n    var startX = 0;\n    root.addEventListener(\'touchstart\', function (e) { if (e.touches[0]) startX = e.touches[0].clientX; }, { passive: true });\n    root.addEventListener(\'touchend\', function (e) {\n      if (!e.changedTouches[0]) return;\n      var diffX = e.changedTouches[0].clientX - startX;\n      if (Math.abs(diffX) > 45) {\n        if (diffX > 0) show(idx - 1); else show(idx + 1);\n      }\n    }, { passive: true });\n  })();\n  <' + '/script>'
      : '';

    var viewportStyle = '';
    if (carouselWidth || carouselHeight) {
      var vpParts = [];
      if (carouselWidth) vpParts.push('width: ' + carouselWidth + 'px');
      if (carouselHeight) vpParts.push('height: ' + carouselHeight + 'px');
      viewportStyle = ' style="' + vpParts.join('; ') + ';"';
    }

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Embed Carousel</title>\n  <style>\n    html, body { margin: 0; padding: 24px 16px; font-family: system-ui, -apple-system, sans-serif; background-color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; overflow-x: hidden; overflow-y: auto; }\n    *, *::before, *::after { box-sizing: border-box; }\n    #' + uid + ' { width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; }\n    #' + uid + ' .ec-slide { display: none; width: 100%; height: 100%; min-height: 100%; align-items: stretch; justify-content: stretch; overflow: auto; -webkit-overflow-scrolling: touch; }\n    #' + uid + ' .ec-slide[data-active="true"] { display: flex; flex-direction: column; }\n    #' + uid + ' .ec-slide > * { width: 100% !important; height: 100% !important; min-height: 0 !important; max-width: 100% !important; max-height: 100% !important; flex: 1 1 auto !important; box-sizing: border-box !important; }\n    #' + uid + ' .ec-slide iframe, #' + uid + ' .ec-slide video, #' + uid + ' .ec-slide embed, #' + uid + ' .ec-slide object { width: 100% !important; height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\n    #' + uid + ' .ec-slide img { width: 100% !important; height: 100% !important; object-fit: contain !important; min-height: 0 !important; flex: 1 1 auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\n    #' + uid + ' .ec-slide blockquote { width: 100% !important; max-width: 100% !important; max-height: 100% !important; overflow: auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\n' + controlsCss + '  </style>\n</head>\n<body>\n  <div class="ec" id="' + uid + '">\n' + controlsHtml + '    <div class="ec-viewport"' + viewportStyle + '>\n' + slidesHtml + '\n    </div>\n  </div>\n' + (script ? '\n' + script + '\n' : '') + '</body>\n</html>';
  }

  function renderCode() {
    var html, filename;
    if (layoutMode === 'carousel') { html = buildCarouselHTML(); filename = 'carousel.html'; }
    else if (layoutMode === 'masonry') { html = buildMasonryHTML(); filename = 'masonry.html'; }
    else { html = buildRowHTML(); filename = 'row.html'; }

    codeOut.textContent = html;
    codeOut.dataset.raw = html;
    codeFileLabel.textContent = filename;
  }

  // ============================================================
  // 9. EVENT HANDLERS
  // ============================================================
  var debounceHandle = null;
  function onInput() {
    saveSlots();
    updateStatuses();
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(renderPreview, 350);
    if (outputSection.style.display !== 'none') renderCode();
  }

  if (addSlotBtn) addSlotBtn.addEventListener('click', function () { addSlot('', true, null, null, true); });
  if (addSlotBtnBottom) addSlotBtnBottom.addEventListener('click', function () { addSlot('', true, null, null, false); });

  gapButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      gapButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      currentGap = parseInt(btn.getAttribute('data-gap'), 10);
      renderPreview();
      if (outputSection.style.display !== 'none') renderCode();
    });
  });

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      modeButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      layoutMode = btn.getAttribute('data-mode');
      if (layoutMode === 'masonry') {
        gapControlWrap.style.display = 'none';
        if (masonryControlsPanel) masonryControlsPanel.style.display = '';
      } else if (layoutMode === 'carousel') {
        gapControlWrap.style.display = 'none';
        if (masonryControlsPanel) masonryControlsPanel.style.display = 'none';
      } else {
        gapControlWrap.style.display = '';
        if (masonryControlsPanel) masonryControlsPanel.style.display = 'none';
      }
      carouselIndex = 0;
      renderPreview();
      if (outputSection.style.display !== 'none') renderCode();
    });
  });

  masonryPresetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyMasonryPreset(btn.getAttribute('data-preset')); });
  });

  function bindMasonryToggle(buttons, applyFn) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        applyFn(btn);
        activePreset = 'custom';
        updateMasonryButtonsUI();
        saveMasonryConfig();
        if (layoutMode === 'masonry') {
          renderPreview();
          if (outputSection.style.display !== 'none') renderCode();
        }
      });
    });
  }

  bindMasonryToggle(masonryColsButtons, function (b) { masonryCols = b.getAttribute('data-mcols') || 'auto'; });
  bindMasonryToggle(masonryGapButtons, function (b) { masonryGap = parseInt(b.getAttribute('data-mgap'), 10) || 0; });
  bindMasonryToggle(masonryPaddingButtons, function (b) { masonryPadding = parseInt(b.getAttribute('data-mpadding'), 10) || 0; });
  bindMasonryToggle(masonryRadiusButtons, function (b) { masonryRadius = parseInt(b.getAttribute('data-mradius'), 10) || 0; });
  bindMasonryToggle(masonryStyleButtons, function (b) { masonryStyle = b.getAttribute('data-mstyle') || 'card'; });
  bindMasonryToggle(masonryHoverButtons, function (b) { masonryHover = b.getAttribute('data-mhover') || 'none'; });

  document.getElementById('generateBtn').addEventListener('click', function () {
    renderCode();
    outputSection.style.display = '';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    slotsData.forEach(function (obj) {
      obj.input.value = '';
      obj.customWidth = null;
      obj.customHeight = null;
    });
    carouselWidth = null;
    carouselHeight = null;
    saveSlots();
    updateStatuses();
    renderPreview();
    outputSection.style.display = 'none';

    var saveResultEl = document.getElementById('saveResult');
    if (saveResultEl) {
      saveResultEl.classList.remove('is-visible', 'is-error');
      saveResultEl.innerHTML = '';
    }
  });

  var copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', function () {
    var text = codeOut.dataset.raw || codeOut.textContent || '';
    function showCopied() {
      var original = 'Copy code';
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('copied');
      setTimeout(function () {
        copyBtn.textContent = original;
        copyBtn.classList.remove('copied');
      }, 1600);
    }
    function fallbackCopy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) { showCopied(); return; }
      } catch (e) {}
      copyBtn.textContent = 'Select & press ⌘/Ctrl+C';
      setTimeout(function () { copyBtn.textContent = 'Copy code'; }, 2200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied, fallbackCopy);
    } else {
      fallbackCopy();
    }
  });

  // ============================================================
  // 10. TOAST
  // ============================================================
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'toast is-visible' + (type ? ' is-' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  // ============================================================
  // 11. SAVE TO SERVER
  // ============================================================
  var saveDbBtn = document.getElementById('saveDbBtn');
  var saveTitleInput = document.getElementById('saveTitleInput');
  var saveResultEl = document.getElementById('saveResult');

  function collectSettings() {
    return {
      gap: currentGap,
      masonry: {
        cols: masonryCols, gap: masonryGap, padding: masonryPadding,
        radius: masonryRadius, style: masonryStyle, hover: masonryHover, preset: activePreset
      }
    };
  }

  function collectSlotsForSave() {
    return slotsData.map(function (obj) {
      return {
        code: obj.input.value,
        width: obj.customWidth || null,
        height: obj.customHeight || null
      };
    });
  }

  function showSaveResult(html, isError) {
    saveResultEl.innerHTML = html;
    saveResultEl.classList.add('is-visible');
    saveResultEl.classList.toggle('is-error', !!isError);
  }

  if (saveDbBtn) {
    saveDbBtn.addEventListener('click', function () {
      renderCode();
      outputSection.style.display = '';
      var html = codeOut.dataset.raw || codeOut.textContent || '';

      if (!html || html.indexOf('<!DOCTYPE html>') !== 0) {
        showSaveResult('Please add some embed code before saving.', true);
        return;
      }

      var title = (saveTitleInput.value || '').trim() || 'Untitled embed page';

      saveDbBtn.disabled = true;
      var originalText = saveDbBtn.textContent;
      saveDbBtn.textContent = 'Saving…';
      saveResultEl.classList.remove('is-visible', 'is-error');
      saveResultEl.innerHTML = '';

      fetch(STORE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': CSRF_TOKEN
        },
        body: JSON.stringify({
          title: title,
          html: html,
          layout_mode: layoutMode,
          slots: collectSlotsForSave(),
          settings: collectSettings()
        })
      })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) {
            var msg = body && body.message
              ? body.message
              : (body && body.errors ? Object.values(body.errors).flat().join(' ') : 'Save failed.');
            throw new Error(msg);
          }
          return body;
        });
      })
      .then(function (data) {
        var safeUrl = escapeHtml(data.view_url);
        var safeDownload = escapeHtml(data.download_url);

        showSaveResult(
          '<strong>Saved ✓</strong> Your page is live at:' +
          '<a class="save-url" href="' + safeUrl + '" target="_blank" rel="noopener">' + safeUrl + '</a>' +
          '<div class="save-actions">' +
            '<button class="save-action-btn" type="button" id="copyShareUrlBtn">📋 Copy link</button>' +
            '<a class="save-action-btn" href="' + safeDownload + '">⬇ Download .html</a>' +
          '</div>',
          false
        );

        var copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
        if (copyShareUrlBtn) {
          copyShareUrlBtn.addEventListener('click', function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(data.view_url).then(function () {
                copyShareUrlBtn.textContent = 'Copied ✓';
                copyShareUrlBtn.classList.add('copied');
                setTimeout(function () {
                  copyShareUrlBtn.textContent = '📋 Copy link';
                  copyShareUrlBtn.classList.remove('copied');
                }, 1500);
              });
            }
          });
        }

        saveDbBtn.textContent = 'Saved ✓';
        showToast('Page saved successfully!', 'success');
        loadHistory();
        setTimeout(function () {
          saveDbBtn.textContent = originalText;
          saveDbBtn.disabled = false;
        }, 1500);
      })
      .catch(function (err) {
        console.error(err);
        showSaveResult('<strong>Could not save:</strong> ' + escapeHtml(err.message || 'Unknown error'), true);
        showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
        saveDbBtn.textContent = originalText;
        saveDbBtn.disabled = false;
      });
    });
  }

  // ============================================================
  // 12. HISTORY — list saved pages from DB
  // ============================================================
  var historyList = document.getElementById('historyList');
  var historyRefreshBtn = document.getElementById('historyRefreshBtn');

  function timeAgo(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
    return d.toLocaleDateString();
  }

  function renderHistory(items) {
    if (!historyList) return;
    if (!items || !items.length) {
      historyList.innerHTML =
        '<div class="history-empty">' +
          '<span class="icon">📭</span>' +
          'No saved pages yet.<br>Save your first page above to see it here.' +
        '</div>';
      return;
    }

    historyList.innerHTML = items.map(function (item) {
      return '' +
        '<div class="history-item" data-slug="' + escapeHtml(item.slug) + '">' +
          '<div class="history-item-thumb">' + (item.layout_mode === 'carousel' ? '🎠' : item.layout_mode === 'masonry' ? '🧱' : '▦') + '</div>' +
          '<div class="history-item-body">' +
            '<p class="history-item-title">' + escapeHtml(item.title || 'Untitled') + '</p>' +
            '<div class="history-item-meta">' +
              '<span class="badge mode-' + escapeHtml(item.layout_mode) + '">' + escapeHtml(item.layout_mode) + '</span>' +
              '<span class="slug">/' + escapeHtml(item.slug) + '</span>' +
              '<span>· ' + escapeHtml(timeAgo(item.created_at)) + '</span>' +
              (item.views ? '<span>· 👁 ' + item.views + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="history-item-actions">' +
            '<a class="history-action-btn" href="' + escapeHtml(item.view_url) + '" target="_blank" rel="noopener" title="Open">↗ Open</a>' +
            '<a class="history-action-btn" href="' + escapeHtml(item.download_url) + '" title="Download HTML">⬇</a>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function loadHistory() {
    if (!historyList) return;
    historyList.innerHTML = '<div class="history-loading">Loading your saved pages…</div>';

    fetch(HISTORY_URL, {
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Could not load history');
      return res.json();
    })
    .then(function (data) {
      renderHistory(data.items || []);
    })
    .catch(function (err) {
      historyList.innerHTML =
        '<div class="history-empty">' +
          '<span class="icon">⚠️</span>' +
          'Could not load history.<br>' + escapeHtml(err.message) +
        '</div>';
    });
  }

  if (historyRefreshBtn) {
    historyRefreshBtn.addEventListener('click', function () {
      historyRefreshBtn.disabled = true;
      loadHistory();
      setTimeout(function () { historyRefreshBtn.disabled = false; }, 800);
    });
  }

  // ============================================================
  // 13. INIT
  // ============================================================
  initTheme();
  loadMasonryConfig();
  loadSlots();
  loadHistory();

  window.__embedBuilder = {
    renderPreview: renderPreview,
    renderCode: renderCode,
    getSlots: function() { return slotsData; }
  };
})();
</script>
</body>
</html>