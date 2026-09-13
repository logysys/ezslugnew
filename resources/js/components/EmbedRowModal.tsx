import React, { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faHtml5 } from '@fortawesome/free-brands-svg-icons';

export const EMBED_ROW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Embed Row & Masonry Builder</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<style>
  :root {
    --paper: #f3f4f1;
    --paper-raised: #ffffff;
    --ink: #14171a;
    --ink-soft: #5b6066;
    --ink-faint: #8b9096;
    --line: #d9dbd4;
    --line-strong: #c2c5bd;
    --accent: #2f6fed;
    --accent-ink: #ffffff;
    --accent-soft: #e4ecfd;
    --success: #1f8f5f;
    --success-soft: #e2f4ea;
    --code-bg: #0f1216;
    --code-ink: #d9dee5;
    --code-line: #262b32;
    --code-accent: #7fb0ff;
    --shadow: 0 1px 2px rgba(20, 23, 26, 0.04), 0 8px 24px -12px rgba(20, 23, 26, 0.12);
    --radius: 10px;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #15171a;
      --paper-raised: #1d2024;
      --ink: #edeeea;
      --ink-soft: #a3a8ad;
      --ink-faint: #6b7176;
      --line: #2c2f34;
      --line-strong: #3b3f45;
      --accent: #6c98ff;
      --accent-ink: #0f1115;
      --accent-soft: #212a3b;
      --success: #4fbf8f;
      --success-soft: #16261f;
      --code-bg: #0a0c0e;
      --code-ink: #dbe1e7;
      --code-line: #22262b;
      --code-accent: #8cbaff;
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -12px rgba(0, 0, 0, 0.5);
    }
  }

  :root[data-theme="dark"] {
    --paper: #15171a;
    --paper-raised: #1d2024;
    --ink: #edeeea;
    --ink-soft: #a3a8ad;
    --ink-faint: #6b7176;
    --line: #2c2f34;
    --line-strong: #3b3f45;
    --accent: #6c98ff;
    --accent-ink: #0f1115;
    --accent-soft: #212a3b;
    --success: #4fbf8f;
    --success-soft: #16261f;
    --code-bg: #0a0c0e;
    --code-ink: #dbe1e7;
    --code-line: #22262b;
    --code-accent: #8cbaff;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px -12px rgba(0, 0, 0, 0.5);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  .wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 32px 20px 70px;
  }

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
    gap: 12px;
  }

  .brand-mark .glyph {
    display: flex;
    gap: 3px;
    flex-shrink: 0;
  }

  .brand-mark .glyph span {
    width: 7px;
    height: 26px;
    border-radius: 2px;
    background: var(--accent);
  }
  .brand-mark .glyph span:nth-child(1) { opacity: 0.45; }
  .brand-mark .glyph span:nth-child(2) { opacity: 0.75; }
  .brand-mark .glyph span:nth-child(3) { opacity: 1; }

  h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 4px;
    text-wrap: balance;
  }

  .subtitle {
    margin: 0;
    color: var(--ink-soft);
    font-size: 14.5px;
    max-width: 46ch;
    line-height: 1.5;
  }

  .theme-toggle {
    border: 1px solid var(--line-strong);
    background: var(--paper-raised);
    color: var(--ink-soft);
    width: 38px;
    height: 38px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    font-size: 16px;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
  .theme-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  section { margin-bottom: 36px; }

  .section-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .eyebrow {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  @media (max-width: 1080px) {
    .slots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 580px) {
    .slots {
      grid-template-columns: 1fr;
    }
  }

  .slot-card {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .slot-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--line);
  }

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
  }
  .slot-status.filled { color: var(--success); }

  .remove-slot-btn {
    border: none;
    background: transparent;
    color: var(--ink-faint);
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
    margin-left: 2px;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .remove-slot-btn:hover {
    color: #e5484d;
    background: rgba(229, 72, 77, 0.12);
  }

  textarea.slot-input {
    border: none;
    resize: vertical;
    min-height: 110px;
    padding: 10px 12px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--ink);
    background: transparent;
    width: 100%;
    box-sizing: border-box;
  }
  textarea.slot-input::placeholder { color: var(--ink-faint); }
  textarea.slot-input:focus {
    outline: none;
    background: var(--accent-soft);
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .gap-control {
    display: inline-flex;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
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
  .gap-control button:hover { color: var(--ink); }
  .gap-control button[aria-pressed="true"] {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .gap-control button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* Masonry Controls Panel */
  .masonry-controls-panel {
    margin-top: 14px;
    padding: 16px 18px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 14px;
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
    padding-bottom: 12px;
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
  .masonry-panel-badge svg {
    color: var(--accent);
  }

  .masonry-panel-hint {
    font-size: 11.5px;
    color: var(--ink-faint);
  }

  /* Masonry Presets Bar */
  .masonry-presets-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 8px;
  }

  .masonry-presets-label {
    font-size: 11px;
    font-family: "IBM Plex Mono", monospace;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
    margin-right: 4px;
  }

  .masonry-preset-pill {
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 11px;
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
  }
  .masonry-preset-pill[data-active="true"] {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 700;
  }

  .masonry-controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px;
    align-items: start;
  }

  .masonry-control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .masonry-control-group .gap-control {
    flex-wrap: wrap;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  button.btn {
    font-family: "IBM Plex Sans", sans-serif;
    font-size: 14px;
    font-weight: 700;
    border-radius: 10px;
    padding: 10px 20px;
    cursor: pointer;
    border: none;
    transition: background 0.15s ease, opacity 0.15s ease, transform 0.05s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    line-height: 1.2;
  }
  button.btn:active { transform: translateY(1px); }
  button.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .btn-text {
    background: transparent;
    color: var(--ink);
    font-weight: 600;
    padding: 10px 12px;
  }
  .btn-text:hover { color: var(--accent); opacity: 0.85; }

  .btn-primary {
    background: #2b6bf3;
    color: #ffffff;
  }
  .btn-primary:hover { background: #1e59e0; }

  .btn-convo {
    background: #00a66c;
    color: #ffffff;
  }
  .btn-convo:hover { background: #008f5d; }
  .btn-convo:disabled { opacity: 0.65; cursor: not-allowed; }

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
    color: var(--ink);
    background: var(--paper-raised);
    border: 1px dashed var(--line-strong);
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.15s ease;
  }
  .btn-add-slot-bottom:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  .btn-add-slot-bottom:active {
    transform: translateY(0);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .stage {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 20px;
    overflow-x: auto;
    overflow-y: auto;
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
    max-width: 50%;
    margin: 0 auto;
    min-width: 0;
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
    max-width: 50%;
    margin: 0 auto;
    min-width: 0;
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
    vertical-align: top;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
  }

  .masonry-stage-cell[data-mstyle="card"] {
    background: var(--paper-raised);
    border: 1px solid var(--line);
    box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
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
    box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.04);
  }

  .masonry-stage-cell[data-mhover="glow"]:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft), 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .masonry-slot-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--accent);
    color: var(--accent-ink);
    opacity: 0.85;
    pointer-events: none;
    z-index: 2;
  }

  @media (max-width: 760px) {
    .stage-row { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
    .stage-row.is-single-embed,
    .stage-row:has(> .stage-cell:only-child),
    .masonry-preview.is-single-embed {
      max-width: 100% !important;
    }
    .masonry-preview { flex-direction: column !important; }
    .masonry-preview-col { width: 100% !important; }
  }

  .stage-cell {
    min-width: 240px;
    box-sizing: border-box;
    border-radius: 12px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    box-shadow: 0 2px 10px -2px rgba(0, 0, 0, 0.05);
    padding: 10px;
    display: flex; flex-direction: column;
    transition: box-shadow 0.15s ease;
    resize: both;
    overflow: auto;
    max-width: 100%;
    min-height: 180px;
    height: auto;      /* Allow auto height for shorter content */
    position: relative;
  }
  .stage-cell:hover {
    box-shadow: 0 6px 18px -4px rgba(0, 0, 0, 0.08);
  }

  .stage-cell.is-resizing iframe,
  .carousel-viewport.is-resizing iframe {
    pointer-events: none !important;
  }

  .stage-cell iframe {
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    height: 100%;
    border: 1px dashed var(--line-strong);
    border-radius: 8px;
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
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
    color: var(--ink-faint);
    font-size: 12.5px;
    line-height: 1.5;
    box-sizing: border-box;
  }

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
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 9999px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .carousel-viewport {
    order: 1;
    position: relative;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #ffffff;
    overflow: auto;
    resize: both;
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
    width: 100%;
    min-width: 280px;
    min-height: 180px;
    height: auto;      /* Allow auto height for shorter content */
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
    background: #ffffff;
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
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.15s ease;
  }
  .carousel-arrow:hover:not(:disabled) {
    border-color: var(--accent);
    color: #ffffff;
    background: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(47, 111, 237, 0.25);
  }
  .carousel-arrow:active:not(:disabled) {
    transform: translateY(0px) scale(0.95);
  }
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

  .carousel-counter {
    text-align: center;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    color: var(--ink-faint);
  }

  .code-panel {
    background: var(--code-bg);
    border-radius: var(--radius);
    border: 1px solid var(--code-line);
    overflow: hidden;
  }

  .code-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--code-line);
  }

  .code-panel-head .dots { display: flex; gap: 6px; }
  .code-panel-head .dots span {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--code-line);
  }

  .copy-btn {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
    font-weight: 500;
    color: var(--code-ink);
    background: transparent;
    border: 1px solid var(--code-line);
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .copy-btn:hover { border-color: var(--code-accent); color: var(--code-accent); }
  .copy-btn:focus-visible { outline: 2px solid var(--code-accent); outline-offset: 2px; }
  .copy-btn.copied { color: var(--success); border-color: var(--success); }

  pre.code-out {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--code-ink);
    tab-size: 2;
    white-space: pre;
  }

  footer.hint {
    margin-top: 44px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
    color: var(--ink-faint);
    font-size: 12.5px;
    line-height: 1.6;
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>
</head>
<body>

<div class="wrap">
  <header class="top">
    <div class="brand-mark">
      <div class="glyph"><span></span><span></span><span></span></div>
      <div>
        <h1>Embed Row & Masonry Builder</h1>
        <p class="subtitle">Paste embed snippets, preview them together, and generate complete HTML files for Row, Carousel, or Masonry layouts (Max 4 columns per row).</p>
      </div>
    </div>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle color theme" title="Toggle color theme">◐</button>
  </header>

  <section>
    <div class="section-label">
      <span class="eyebrow">Slots — left to right order</span>
      <button class="btn btn-text" id="addSlotBtn" type="button" style="padding: 5px 12px; font-size: 12px;">+ Add Slot</button>
    </div>
    <div class="slots" id="slotsContainer"></div>
    <div class="add-slot-bottom-wrap">
      <button class="btn-add-slot-bottom" id="addSlotBtnBottom" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Slot</span>
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

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-text" id="resetBtn" type="button">Clear all</button>
        <button class="btn btn-primary" id="generateBtn" type="button">Generate HTML</button>
        <button class="btn btn-convo" id="convoBtn" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span id="convoBtnLabel">Convo</span>
        </button>
      </div>
    </div>

    <!-- Dedicated Masonry Controls Panel -->
    <div class="masonry-controls-panel" id="masonryControlsPanel" style="display:none;">
      <div class="masonry-controls-header">
        <div class="masonry-panel-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
          </svg>
          <span>Masonry Layout & Card Customizer</span>
        </div>
        <span class="masonry-panel-hint">Configure grid columns, spacing, card surfaces, and responsive breakpoints</span>
      </div>

      <!-- Masonry Presets Bar -->
      <div class="masonry-presets-bar">
        <span class="masonry-presets-label">⚡ Presets:</span>
        <button type="button" class="masonry-preset-pill" data-preset="default" data-active="true">🎨 Default Cards</button>
        <button type="button" class="masonry-preset-pill" data-preset="fullbleed" data-active="false">🖼️ Full-Bleed Media</button>
        <button type="button" class="masonry-preset-pill" data-preset="bento" data-active="false">🗂️ Bento Board</button>
        <button type="button" class="masonry-preset-pill" data-preset="social" data-active="false">📱 Social Feed</button>
        <button type="button" class="masonry-preset-pill" data-preset="minimal" data-active="false">✨ Clean Minimal</button>
      </div>

      <div class="masonry-controls-grid">
        <!-- Grid Columns Selection -->
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

        <!-- Column & Row Spacing -->
        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Column & Gutter Spacing</div>
          <div class="gap-control" id="masonryGapControl" role="group" aria-label="Masonry Spacing">
            <button type="button" data-mgap="0" aria-pressed="false">0px (Seamless)</button>
            <button type="button" data-mgap="8" aria-pressed="false">8px</button>
            <button type="button" data-mgap="16" aria-pressed="false">16px</button>
            <button type="button" data-mgap="24" aria-pressed="true">24px</button>
            <button type="button" data-mgap="36" aria-pressed="false">36px</button>
            <button type="button" data-mgap="48" aria-pressed="false">48px</button>
          </div>
        </div>

        <!-- Item Div Padding -->
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

        <!-- Item Div Corners -->
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

        <!-- Surface Style -->
        <div class="masonry-control-group">
          <div class="eyebrow" style="margin-bottom:6px;">Card Surface</div>
          <div class="gap-control" id="masonryStyleControl" role="group" aria-label="Card Surface Style">
            <button type="button" data-mstyle="card" aria-pressed="true">Elevated Card</button>
            <button type="button" data-mstyle="minimal" aria-pressed="false">Minimal (No Card)</button>
            <button type="button" data-mstyle="outline" aria-pressed="false">Outline Only</button>
            <button type="button" data-mstyle="glass" aria-pressed="false">Frosted Glass</button>
          </div>
        </div>

        <!-- Hover Animation Effect -->
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
  </section>

  <footer class="hint">
    Generates a complete standalone HTML document. Maximum 4 columns per row with automatic mobile responsiveness.
  </footer>
</div>

<script>
(function () {
  'use strict';

  var STORAGE_KEY = 'embed-row:slots:v5';
  var THEME_KEY = 'embed-row:theme:v1';
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
  var currentGap = 24;
  var layoutMode = 'row';
  var carouselIndex = 0;
  var carouselWidth = null;
  var carouselHeight = null;
  var slotsData = [];
  var isEditMode = false;
  var editId = null;
  var editSlug = null;

  // Masonry Controls State & DOM Elements
  var MASONRY_CONFIG_KEY = 'embed-row:masonry-cfg:v2';
  var masonryCols = 'auto';
  var masonryGap = 24;
  var masonryPadding = 12;
  var masonryRadius = 12;
  var masonryStyle = 'card';
  var masonryHover = 'lift';
  var activePreset = 'default';

  var masonryControlsPanel = document.getElementById('masonryControlsPanel');
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

  /* Listen for message to activate edit mode or load initial content */
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'EZ_SET_EDIT_MODE') {
      isEditMode = !!e.data.isEdit;
      editId = e.data.editId || null;
      editSlug = e.data.editSlug || null;
      if (e.data.isEdit) {
        var labelSpan = document.getElementById('convoBtnLabel');
        if (labelSpan) labelSpan.textContent = 'Update';
      }
      if (e.data.initialHtml && typeof e.data.initialHtml === 'string' && e.data.initialHtml.trim()) {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(e.data.initialHtml, 'text/html');

          // Auto-detect and switch layout mode
          if (doc.querySelector('.masonry-grid, .masonry-item')) {
            var mBtn = document.querySelector('#modeControl button[data-mode="masonry"]');
            if (mBtn) mBtn.click();
          } else if (doc.querySelector('.ec-track, .ec-slide, .embed-carousel')) {
            var cBtn = document.querySelector('#modeControl button[data-mode="carousel"]');
            if (cBtn) cBtn.click();
          } else {
            var rBtn = document.querySelector('#modeControl button[data-mode="row"]');
            if (rBtn) rBtn.click();
          }

          var items = doc.querySelectorAll('.embed-row-item, .masonry-item, .ec-slide');
          if (items && items.length > 0) {
            slotsContainer.innerHTML = '';
            slotsData = [];
            items.forEach(function (item) {
              var w = null;
              var h = null;
              if (item.style && item.style.width) {
                var pw = parseInt(item.style.width, 10);
                if (pw > 0) w = pw;
              }
              if (item.style && item.style.height) {
                var ph = parseInt(item.style.height, 10);
                if (ph > 0) h = ph;
              }
              addSlot(item.innerHTML.trim(), false, w, h);
            });
            renderPreview();
          } else {
            // Check for direct embed elements (iframe, video, blockquote, twitter-tweet, audio, embed, object)
            var mediaNodes = doc.querySelectorAll('iframe, video, blockquote, twitter-tweet, audio, embed, object');
            if (mediaNodes && mediaNodes.length > 0) {
              slotsContainer.innerHTML = '';
              slotsData = [];
              mediaNodes.forEach(function (node) {
                addSlot(node.outerHTML.trim(), false);
              });
              renderPreview();
            } else {
              var bodyContent = extractBodyContent(e.data.initialHtml);
              if (bodyContent && bodyContent.trim().length > 0) {
                slotsContainer.innerHTML = '';
                slotsData = [];
                addSlot(bodyContent.trim(), false);
                renderPreview();
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse initial embed html:', err);
        }
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /* Helper to parse dimension attributes from pasted code snippets     */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /* Extract only <body> inner content if a full HTML document is pasted */
  /* ------------------------------------------------------------------ */
  function extractBodyContent(raw) {
    if (!raw) return '';
    var trimmed = raw.trim();

    // If it doesn't look like a full HTML document, return as-is
    if (!/<!DOCTYPE\s+html/i.test(trimmed) && !/<html[\s>]/i.test(trimmed)) {
      return trimmed;
    }

    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(trimmed, 'text/html');
      // Return only what's inside <body>
      return doc.body ? doc.body.innerHTML.trim() : trimmed;
    } catch (e) {
      return trimmed;
    }
  }

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
        cols: masonryCols,
        gap: masonryGap,
        padding: masonryPadding,
        radius: masonryRadius,
        style: masonryStyle,
        hover: masonryHover,
        preset: activePreset
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

  var placeholders = [
    '<iframe src="https://example.com/widget-1" width="100%" height="220"></iframe>',
    '<blockquote class="reviews-widget">…</blockquote>\\n<script src="https://example.com/reviews.js"><' + '/script>',
    '<div id="chat-widget" data-id="12345"></div>\\n<script src="https://example.com/chat.js"><' + '/script>',
    '<iframe src="https://example.com/widget-4" width="100%" height="220"></iframe>'
  ];

  function createSlotCard(val, index, customWidth, customHeight) {
    var card = document.createElement('div');
    card.className = 'slot-card';

    var head = document.createElement('div');
    head.className = 'slot-head';

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
    removeBtn.addEventListener('click', function () {
      removeSlot(card);
    });

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

    return {
      card: card,
      input: input,
      status: status,
      num: num,
      title: title,
      removeBtn: removeBtn,
      customWidth: customWidth || null,
      customHeight: customHeight || null
    };
  }

  function addSlot(val, shouldFocus, customWidth, customHeight) {
    var slotObj = createSlotCard(val || '', slotsData.length, customWidth, customHeight);
    slotsData.push(slotObj);
    slotsContainer.appendChild(slotObj.card);
    updateRemoveButtons();
    onInput();
    if (shouldFocus) {
      slotObj.card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(function () {
        try { slotObj.input.focus(); } catch (e) {}
      }, 80);
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
        return {
          code: obj.input.value,
          width: obj.customWidth || null,
          height: obj.customHeight || null
        };
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
            if (typeof val === 'string') {
              addSlot(val);
            } else if (val && typeof val === 'object') {
              addSlot(val.code || '', false, val.width, val.height);
            }
          });
          return;
        }
      }
    } catch (e) {}
    addSlot('');
    addSlot('');
    addSlot('');
    addSlot('');
  }

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

  if (addSlotBtn) {
    addSlotBtn.addEventListener('click', function () {
      addSlot('', true);
    });
  }

  if (addSlotBtnBottom) {
    addSlotBtnBottom.addEventListener('click', function () {
      addSlot('', true);
    });
  }

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

  // Masonry Controls Event Listeners
  masonryPresetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var presetKey = btn.getAttribute('data-preset');
      applyMasonryPreset(presetKey);
    });
  });

  masonryColsButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryColsButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryCols = btn.getAttribute('data-mcols') || 'auto';
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

  masonryGapButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryGapButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryGap = parseInt(btn.getAttribute('data-mgap'), 10) || 0;
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

  masonryPaddingButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryPaddingButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryPadding = parseInt(btn.getAttribute('data-mpadding'), 10) || 0;
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

  masonryRadiusButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryRadiusButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryRadius = parseInt(btn.getAttribute('data-mradius'), 10) || 0;
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

  masonryStyleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryStyleButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryStyle = btn.getAttribute('data-mstyle') || 'card';
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

  masonryHoverButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      masonryHoverButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      masonryHover = btn.getAttribute('data-mhover') || 'none';
      activePreset = 'custom';
      updateMasonryButtonsUI();
      saveMasonryConfig();
      if (layoutMode === 'masonry') {
        renderPreview();
        if (outputSection.style.display !== 'none') renderCode();
      }
    });
  });

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

  /* Listen for frame auto-height messages from srcdoc previews */
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

  function setupResizableCell(cell, obj, i) {
    var parsedH = parseSnippetHeight(obj.input.value);
    if (obj.customWidth) cell.style.width = obj.customWidth + 'px';
    if (obj.customHeight) cell.style.height = obj.customHeight + 'px';
    else if (parsedH) cell.style.height = (parsedH + 24) + 'px';

    // Prevent iframe from intercepting pointer events during resize dragging
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
        if (isInitial) {
          isInitial = false;
          return;
        }
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
    stageRow.style.maxWidth = isSingle ? '50%' : '';
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
      setupResizableCell(cell, obj, i);
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
    stageRow.style.maxWidth = isSingle ? '50%' : '100%';
    stageRow.style.margin = '0 auto';
    stageRow.innerHTML = '';

    // Create column containers for round-robin distribution
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
      setupResizableCell(cell, obj, i);
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
        if (isInitialVp) {
          isInitialVp = false;
          return;
        }
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

  function indent(code, spaces) {
    var pad = new Array(spaces + 1).join(' ');
    return code.split('\\n').map(function (line) { return pad + line; }).join('\\n');
  }

  function buildRowHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n  <meta charset="UTF-8">\\n  <title>Embed Row</title>\\n</head>\\n<body>\\n  <!-- Paste embed code into at least one slot above -->\\n</body>\\n</html>';
    }

    var uid = 'embed-row-' + Math.random().toString(36).slice(2, 8);
    var cols = Math.min(filled.length, 4);
    var isSingle = filled.length === 1;

    var itemsHtml = filled.map(function (s) {
      var styleParts = [];
      if (s.width) styleParts.push('width: ' + s.width + 'px');
      if (s.height) styleParts.push('height: ' + s.height + 'px');
      var styleAttr = styleParts.length ? ' style="' + styleParts.join('; ') + ';"' : '';
      return '    <div class="embed-row-item' + (isSingle ? ' is-single' : '') + '"' + styleAttr + '>\\n' + indent(s.code, 6) + '\\n    </div>';
    }).join('\\n');

    return '<!DOCTYPE html>\\n' +
      '<html lang="en">\\n' +
      '<head>\\n' +
      '  <meta charset="UTF-8">\\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
      '  <title>Side-by-Side Embeds</title>\\n' +
      '  <style>\\n' +
      '    *, *::before, *::after {\\n' +
      '      box-sizing: border-box;\\n' +
      '    }\\n' +
      '    html, body {\\n' +
      '      margin: 0;\\n' +
      '      padding: 0;\\n' +
      '      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\\n' +
      '      background: #f8fafc;\\n' +
      '      color: #0f172a;\\n' +
      '      min-height: 100vh;\\n' +
      '      overflow-x: auto;\\n' +
      '      -webkit-overflow-scrolling: touch;\\n' +
      '    }\\n' +
      '    .embed-scroll-container {\\n' +
      '      width: 100%;\\n' +
      '      max-width: 1400px;\\n' +
      '      margin: 0 auto;\\n' +
      '      overflow-x: auto;\\n' +
      '      overflow-y: hidden;\\n' +
      '      padding: 24px 20px;\\n' +
      '      box-sizing: border-box;\\n' +
      '      -webkit-overflow-scrolling: touch;\\n' +
      '    }\\n' +
      '    #' + uid + ' {\\n' +
      '      display: grid;\\n' +
      '      grid-template-columns: ' + (isSingle ? '1fr' : 'repeat(' + cols + ', minmax(280px, 1fr))') + ';\\n' +
      '      gap: ' + currentGap + 'px;\\n' +
      '      width: 100%;\\n' +
      (isSingle ? '      max-width: 50%;\\n      margin: 0 auto;\\n' : '') +
      '      box-sizing: border-box;\\n' +
      '      align-items: start;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item {\\n' +
      '      min-width: 240px;\\n' +
      '      box-sizing: border-box;\\n' +
      '      border-radius: 14px;\\n' +
      '      background: #ffffff;\\n' +
      '      border: 1px solid #e2e8f0;\\n' +
      '      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);\\n' +
      '      padding: 12px;\\n' +
      '      display: flex;\\n' +
      '      flex-direction: column;\\n' +
      '      align-items: stretch;\\n' +
      '      justify-content: stretch;\\n' +
      '      resize: both;\\n' +
      '      overflow: auto;\\n' +
      '      min-height: 180px;\\n' +
      '      max-width: 100%;\\n' +
      '      transition: box-shadow 0.2s ease;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item:hover {\\n' +
      '      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 3px 8px -2px rgba(0, 0, 0, 0.04);\\n' +
      '      transform: translateY(-2px);\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item > * {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      max-width: 100% !important;\\n' +
      '      max-height: 100% !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      box-sizing: border-box !important;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item iframe,\\n' +
      '    #' + uid + ' .embed-row-item video,\\n' +
      '    #' + uid + ' .embed-row-item embed,\\n' +
      '    #' + uid + ' .embed-row-item object {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: 8px;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item img {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      object-fit: contain !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: 8px;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item blockquote {\\n' +
      '      width: 100% !important;\\n' +
      '      max-width: 100% !important;\\n' +
      '      max-height: 100% !important;\\n' +
      '      overflow: auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: 8px;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item div > iframe,\\n' +
      '    #' + uid + ' .embed-row-item div > video,\\n' +
      '    #' + uid + ' .embed-row-item div > embed,\\n' +
      '    #' + uid + ' .embed-row-item div > object {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '    }\\n' +
      '    #' + uid + ' .embed-row-item div > img {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      object-fit: contain !important;\\n' +
      '    }\\n' +
      '    @media (min-width: 769px) {\\n' +
      '      #' + uid + ':has(> .embed-row-item:only-child), #' + uid + '.is-single {\\n' +
      '        max-width: 50% !important;\\n' +
      '        margin: 0 auto !important;\\n' +
      '      }\\n' +
      '    }\\n' +
      '    @media (max-width: 1100px) {\\n' +
      '      #' + uid + ' {\\n' +
      '        grid-template-columns: ' + (isSingle ? '1fr' : 'repeat(' + Math.min(cols, 3) + ', minmax(260px, 1fr))') + ';\\n' +
      '      }\\n' +
      '    }\\n' +
      '    @media (max-width: 768px) {\\n' +
      '      #' + uid + ' {\\n' +
      '        grid-template-columns: 1fr;\\n' +
      '        gap: ' + Math.max(12, Math.round(currentGap * 0.75)) + 'px;\\n' +
      '        max-width: 100% !important;\\n' +
      '      }\\n' +
      '      .embed-scroll-container {\\n' +
      '        padding: 16px 12px;\\n' +
      '      }\\n' +
      '    }\\n' +
      '  </style>\\n' +
      '</head>\\n' +
      '<body>\\n' +
      '  <div class="embed-scroll-container">\\n' +
      '    <div class="embed-row-wrapper' + (isSingle ? ' is-single' : '') + '" id="' + uid + '">\\n' +
      itemsHtml + '\\n' +
      '    </div>\\n' +
      '  </div>\\n' +
      '</body>\\n' +
      '</html>';
  }

  function buildMasonryHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n  <meta charset="UTF-8">\\n  <title>Masonry Embeds</title>\\n</head>\\n<body>\\n  <!-- Paste embed code into at least one slot above -->\\n</body>\\n</html>';
    }

    var uid = 'embed-masonry-' + Math.random().toString(36).slice(2, 8);
    var cols = masonryCols === 'auto' ? Math.min(filled.length, 4) : parseInt(masonryCols, 10);
    if (!cols || cols < 1) cols = 1;
    var isSingle = filled.length === 1 && (masonryCols === 'auto' || masonryCols === '1');

    var surfaceCss = '';
    if (masonryStyle === 'minimal') {
      surfaceCss = '      background: transparent;\\n      border: none;\\n      box-shadow: none;';
    } else if (masonryStyle === 'outline') {
      surfaceCss = '      background: #ffffff;\\n      border: 1px solid #cbd5e1;\\n      box-shadow: none;';
    } else if (masonryStyle === 'glass') {
      surfaceCss = '      background: rgba(255, 255, 255, 0.75);\\n      backdrop-filter: blur(12px);\\n      -webkit-backdrop-filter: blur(12px);\\n      border: 1px solid rgba(255, 255, 255, 0.5);\\n      box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.06);';
    } else {
      // card
      surfaceCss = '      background: #ffffff;\\n      border: 1px solid #e2e8f0;\\n      box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);';
    }

    var hoverCss = '';
    if (masonryHover === 'lift') {
      hoverCss = '    #' + uid + ' .masonry-item:hover {\\n' +
        '      transform: translateY(-3px);\\n' +
        '      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.04);\\n' +
        '    }\\n';
    } else if (masonryHover === 'glow') {
      hoverCss = '    #' + uid + ' .masonry-item:hover {\\n' +
        '      border-color: #2563eb;\\n' +
        '      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);\\n' +
        '    }\\n';
    }

    // Group items by column (round-robin distribution)
    var colBuckets = [];
    for (var c = 0; c < cols; c++) {
      colBuckets.push([]);
    }
    filled.forEach(function (s, idx) {
      colBuckets[idx % cols].push(s);
    });

    var colsHtml = colBuckets.map(function (bucket, colIdx) {
      var itemsHtml = bucket.map(function (s) {
        var styleParts = [];
        if (s.width) styleParts.push('width: ' + s.width + 'px');
        if (s.height) styleParts.push('height: ' + s.height + 'px');
        var styleAttr = styleParts.length ? ' style="' + styleParts.join('; ') + ';"' : '';
        return '      <div class="masonry-item' + (isSingle ? ' is-single' : '') + '"' + styleAttr + '>\\n' + indent(s.code, 8) + '\\n      </div>';
      }).join('\\n');

      return '    <div class="masonry-col">\\n' + itemsHtml + '\\n    </div>';
    }).join('\\n');

    return '<!DOCTYPE html>\\n' +
      '<html lang="en">\\n' +
      '<head>\\n' +
      '  <meta charset="UTF-8">\\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
      '  <title>Masonry Embeds</title>\\n' +
      '  <style>\\n' +
      '    *, *::before, *::after {\\n' +
      '      box-sizing: border-box;\\n' +
      '    }\\n' +
      '    html, body {\\n' +
      '      margin: 0;\\n' +
      '      padding: 0;\\n' +
      '      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\\n' +
      '      background: #f8fafc;\\n' +
      '      color: #0f172a;\\n' +
      '      min-height: 100vh;\\n' +
      '      overflow-x: auto;\\n' +
      '      -webkit-overflow-scrolling: touch;\\n' +
      '    }\\n' +
      '    .masonry-scroll-container {\\n' +
      '      width: 100%;\\n' +
      '      max-width: 1400px;\\n' +
      '      margin: 0 auto;\\n' +
      '      overflow-x: auto;\\n' +
      '      padding: 24px 20px;\\n' +
      '      box-sizing: border-box;\\n' +
      '      -webkit-overflow-scrolling: touch;\\n' +
      '    }\\n' +
      '    #' + uid + ' {\\n' +
      '      display: flex;\\n' +
      '      flex-direction: row;\\n' +
      '      align-items: flex-start;\\n' +
      '      gap: ' + masonryGap + 'px;\\n' +
      '      width: 100%;\\n' +
      (isSingle ? '      max-width: 50%;\\n      margin: 0 auto;\\n' : '') +
      '      box-sizing: border-box;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-col {\\n' +
      '      flex: 1 1 0;\\n' +
      '      display: flex;\\n' +
      '      flex-direction: column;\\n' +
      '      gap: ' + masonryGap + 'px;\\n' +
      '      min-width: 0;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item {\\n' +
      '      display: flex;\\n' +
      '      flex-direction: column;\\n' +
      '      align-items: stretch;\\n' +
      '      justify-content: stretch;\\n' +
      '      width: 100%;\\n' +
      '      box-sizing: border-box;\\n' +
      '      min-width: 200px;\\n' +
      '      border-radius: ' + masonryRadius + 'px;\\n' +
      surfaceCss + '\\n' +
      '      padding: ' + masonryPadding + 'px;\\n' +
      '      resize: both;\\n' +
      '      overflow: auto;\\n' +
      '      min-height: 180px;\\n' +
      '      max-width: 100%;\\n' +
      '      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;\\n' +
      '    }\\n' +
      hoverCss +
      '    #' + uid + ' .masonry-item > * {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      max-width: 100% !important;\\n' +
      '      max-height: 100% !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      box-sizing: border-box !important;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item iframe,\\n' +
      '    #' + uid + ' .masonry-item video,\\n' +
      '    #' + uid + ' .masonry-item embed,\\n' +
      '    #' + uid + ' .masonry-item object {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: inherit;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item img {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      object-fit: contain !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '      flex: 1 1 auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: inherit;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item blockquote {\\n' +
      '      width: 100% !important;\\n' +
      '      max-width: 100% !important;\\n' +
      '      max-height: 100% !important;\\n' +
      '      overflow: auto !important;\\n' +
      '      margin: 0 auto !important;\\n' +
      '      border: 0 !important;\\n' +
      '      border-radius: inherit;\\n' +
      '      display: block;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item div > iframe,\\n' +
      '    #' + uid + ' .masonry-item div > video,\\n' +
      '    #' + uid + ' .masonry-item div > embed,\\n' +
      '    #' + uid + ' .masonry-item div > object {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      min-height: 0 !important;\\n' +
      '    }\\n' +
      '    #' + uid + ' .masonry-item div > img {\\n' +
      '      width: 100% !important;\\n' +
      '      height: 100% !important;\\n' +
      '      object-fit: contain !important;\\n' +
      '    }\\n' +
      '    @media (max-width: 768px) {\\n' +
      '      #' + uid + ' {\\n' +
      '        flex-direction: column;\\n' +
      '        gap: ' + Math.max(8, Math.round(masonryGap * 0.6)) + 'px;\\n' +
      '        max-width: 100% !important;\\n' +
      '      }\\n' +
      '      #' + uid + ' .masonry-col {\\n' +
      '        width: 100%;\\n' +
      '      }\\n' +
      '      #' + uid + ' .masonry-item {\\n' +
      '        padding: ' + Math.max(6, Math.round(masonryPadding * 0.75)) + 'px;\\n' +
      '      }\\n' +
      '      .masonry-scroll-container {\\n' +
      '        padding: 16px 10px;\\n' +
      '      }\\n' +
      '    }\\n' +
      '  </style>\\n' +
      '</head>\\n' +
      '<body>\\n' +
      '  <div class="masonry-scroll-container">\\n' +
      '    <div class="masonry-wrapper' + (isSingle ? ' is-single' : '') + '" id="' + uid + '">\\n' +
      colsHtml + '\\n' +
      '    </div>\\n' +
      '  </div>\\n' +
      '</body>\\n' +
      '</html>';
  }

  function buildCarouselHTML() {
    var filled = filledSlots();
    if (!filled.length) {
      return '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n  <meta charset="UTF-8">\\n  <title>Embed Carousel</title>\\n</head>\\n<body>\\n  <!-- Paste embed code into at least one slot above -->\\n</body>\\n</html>';
    }

    var uid = 'embed-carousel-' + Math.random().toString(36).slice(2, 8);
    var multi = filled.length > 1;

    var slidesHtml = filled.map(function (s, i) {
      return '      <div class="ec-slide" data-active="' + (i === 0 ? 'true' : 'false') + '">\\n' +
        indent(s.code, 8) + '\\n      </div>';
    }).join('\\n');

    var dotsHtml = filled.map(function (_, i) {
      return '          <button type="button" class="ec-dot' + (i === 0 ? ' is-active' : '') +
        '" aria-label="Go to slide ' + (i + 1) + '"></button>';
    }).join('\\n');

    var controlsHtml = multi
      ? '    <div class="ec-controls">\\n' +
        '      <button type="button" class="ec-prev" aria-label="Previous clip">‹</button>\\n' +
        '      <div class="ec-dots">\\n' + dotsHtml + '\\n      </div>\\n' +
        '      <button type="button" class="ec-next" aria-label="Next clip">›</button>\\n' +
        '    </div>\\n'
      : '';

    var controlsCss = multi
      ? '    #' + uid + ' { display: flex; flex-direction: column; width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; gap: 14px; }\\n' +
        '    #' + uid + ' .ec-controls { order: -1; display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 auto 4px auto; padding: 5px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); width: fit-content; }\\n' +
        '    #' + uid + ' .ec-prev, #' + uid + ' .ec-next { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; cursor: pointer; font-size: 18px; font-weight: 600; line-height: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); transition: all 0.15s ease; }\\n' +
        '    #' + uid + ' .ec-prev:hover, #' + uid + ' .ec-next:hover { border-color: #2563eb; background: #2563eb; color: #ffffff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }\\n' +
        '    #' + uid + ' .ec-prev:active, #' + uid + ' .ec-next:active { transform: translateY(0px) scale(0.95); }\\n' +
        '    #' + uid + ' .ec-dots { display: flex; align-items: center; gap: 7px; padding: 0 4px; }\\n' +
        '    #' + uid + ' .ec-dots button { width: 8px; height: 8px; border-radius: 50%; border: none; background: #cbd5e1; padding: 0; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }\\n' +
        '    #' + uid + ' .ec-dots button.is-active { background: #2563eb; width: 22px; border-radius: 9999px; }\\n' +
        '    #' + uid + ' .ec-viewport { order: 1; position: relative; overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; width: 100%; min-width: 280px; min-height: 180px; padding: 12px; box-sizing: border-box; resize: both; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; }\\n'
      : '    #' + uid + ' { width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; }\\n' +
        '    #' + uid + ' .ec-viewport { position: relative; overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; width: 100%; min-width: 280px; min-height: 180px; padding: 12px; box-sizing: border-box; resize: both; display: flex; flex-direction: column; align-items: stretch; justify-content: stretch; }\\n';

    var script = multi
      ? '  <script>\\n' +
        '  (function () {\\n' +
        '    var root = document.getElementById(\\'' + uid + '\\');\\n' +
        '    if (!root) return;\\n' +
        '    var slides = root.querySelectorAll(\\'.ec-slide\\');\\n' +
        '    var dots = root.querySelectorAll(\\'.ec-dot\\');\\n' +
        '    var prev = root.querySelector(\\'.ec-prev\\');\\n' +
        '    var next = root.querySelector(\\'.ec-next\\');\\n' +
        '    var idx = 0;\\n' +
        '    function show(i) {\\n' +
        '      idx = (i + slides.length) % slides.length;\\n' +
        '      for (var j = 0; j < slides.length; j++) slides[j].setAttribute(\\'data-active\\', j === idx ? \\'true\\' : \\'false\\');\\n' +
        '      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle(\\'is-active\\', k === idx);\\n' +
        '    }\\n' +
        '    if (prev) prev.addEventListener(\\'click\\', function () { show(idx - 1); });\\n' +
        '    if (next) next.addEventListener(\\'click\\', function () { show(idx + 1); });\\n' +
        '    for (var d = 0; d < dots.length; d++) {\\n' +
        '      (function (n) { dots[n].addEventListener(\\'click\\', function () { show(n); }); })(d);\\n' +
        '    }\\n' +
        '    root.setAttribute(\\'tabindex\\', \\'0\\');\\n' +
        '    root.addEventListener(\\'keydown\\', function (e) {\\n' +
        '      if (e.key === \\'ArrowLeft\\') show(idx - 1);\\n' +
        '      if (e.key === \\'ArrowRight\\') show(idx + 1);\\n' +
        '    });\\n' +
        '    var startX = 0;\\n' +
        '    root.addEventListener(\\'touchstart\\', function (e) { if (e.touches[0]) startX = e.touches[0].clientX; }, { passive: true });\\n' +
        '    root.addEventListener(\\'touchend\\', function (e) {\\n' +
        '      if (!e.changedTouches[0]) return;\\n' +
        '      var diffX = e.changedTouches[0].clientX - startX;\\n' +
        '      if (Math.abs(diffX) > 45) {\\n' +
        '        if (diffX > 0) show(idx - 1); else show(idx + 1);\\n' +
        '      }\\n' +
        '    }, { passive: true });\\n' +
        '  })();\\n' +
        '  <' + '/script>'
      : '';

    var viewportStyle = '';
    if (carouselWidth || carouselHeight) {
      var vpParts = [];
      if (carouselWidth) vpParts.push('width: ' + carouselWidth + 'px');
      if (carouselHeight) vpParts.push('height: ' + carouselHeight + 'px');
      viewportStyle = ' style="' + vpParts.join('; ') + ';"';
    }

    return '<!DOCTYPE html>\\n' +
      '<html lang="en">\\n' +
      '<head>\\n' +
      '  <meta charset="UTF-8">\\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
      '  <title>Embed Carousel</title>\\n' +
      '  <style>\\n' +
      '    html, body {\\n' +
      '      margin: 0;\\n' +
      '      padding: 24px 16px;\\n' +
      '      font-family: system-ui, -apple-system, sans-serif;\\n' +
      '      background-color: #f1f5f9;\\n' +
      '      min-height: 100vh;\\n' +
      '      display: flex;\\n' +
      '      flex-direction: column;\\n' +
      '      align-items: center;\\n' +
      '      box-sizing: border-box;\\n' +
      '      overflow-x: hidden;\\n' +
      '      overflow-y: auto;\\n' +
      '    }\\n' +
      '    *, *::before, *::after { box-sizing: border-box; }\\n' +
      '    #' + uid + ' { width: 100%; max-width: 680px; margin: 0 auto; box-sizing: border-box; }\\n' +
      '    #' + uid + ' .ec-slide { display: none; width: 100%; height: 100%; min-height: 100%; align-items: stretch; justify-content: stretch; overflow: auto; -webkit-overflow-scrolling: touch; }\\n' +
      '    #' + uid + ' .ec-slide[data-active="true"] { display: flex; flex-direction: column; }\\n' +
      '    #' + uid + ' .ec-slide > * { width: 100% !important; height: 100% !important; min-height: 0 !important; max-width: 100% !important; max-height: 100% !important; flex: 1 1 auto !important; box-sizing: border-box !important; }\\n' +
      '    #' + uid + ' .ec-slide iframe, #' + uid + ' .ec-slide video, #' + uid + ' .ec-slide embed, #' + uid + ' .ec-slide object { width: 100% !important; height: 100% !important; min-height: 0 !important; flex: 1 1 auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\\n' +
      '    #' + uid + ' .ec-slide img { width: 100% !important; height: 100% !important; object-fit: contain !important; min-height: 0 !important; flex: 1 1 auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\\n' +
      '    #' + uid + ' .ec-slide blockquote { width: 100% !important; max-width: 100% !important; max-height: 100% !important; overflow: auto !important; border: 0 !important; border-radius: 10px; display: block; margin: 0 auto; }\\n' +
      '    #' + uid + ' .ec-slide div > iframe, #' + uid + ' .ec-slide div > video, #' + uid + ' .ec-slide div > embed, #' + uid + ' .ec-slide div > object { width: 100% !important; height: 100% !important; min-height: 0 !important; }\\n' +
      '    #' + uid + ' .ec-slide div > img { width: 100% !important; height: 100% !important; object-fit: contain !important; }\\n' +
      controlsCss +
      '  </style>\\n' +
      '</head>\\n' +
      '<body>\\n' +
      '  <div class="ec" id="' + uid + '">\\n' +
      controlsHtml +
      '    <div class="ec-viewport"' + viewportStyle + '>\\n' + slidesHtml + '\\n    </div>\\n' +
      '  </div>\\n' +
      (script ? '\\n' + script + '\\n' : '') +
      '</body>\\n' +
      '</html>';
  }

  function renderCode() {
    var html;
    var filename;
    if (layoutMode === 'carousel') {
      html = buildCarouselHTML();
      filename = 'carousel.html';
    } else if (layoutMode === 'masonry') {
      html = buildMasonryHTML();
      filename = 'masonry.html';
    } else {
      html = buildRowHTML();
      filename = 'row.html';
    }

    codeOut.textContent = html;
    codeOut.dataset.raw = html;
    codeFileLabel.textContent = filename;
  }

  var debounceHandle = null;
  function onInput() {
    saveSlots();
    updateStatuses();
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(renderPreview, 350);
    if (outputSection.style.display !== 'none') renderCode();
  }

  document.getElementById('generateBtn').addEventListener('click', function () {
    renderCode();
    outputSection.style.display = '';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  var convoBtn = document.getElementById('convoBtn');
  if (convoBtn) {
    convoBtn.addEventListener('click', function () {
      var html = layoutMode === 'carousel' ? buildCarouselHTML() : (layoutMode === 'masonry' ? buildMasonryHTML() : buildRowHTML());
      
      convoBtn.disabled = true;
      var originalBtnContent = convoBtn.innerHTML;
      convoBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg><span>Processing...</span>';

      // 1. Notify parent React window if hosted in iframe
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'EZ_CREATE_CONVO_HTML',
            html: html,
            content_type: 'embed',
            isEdit: !!isEditMode,
            editId: editId,
            editSlug: editSlug
          }, '*');
          return;
        }
      } catch (e) {}

      // If standalone/new-tab and in edit mode, update existing message
      if (isEditMode && (editId || editSlug)) {
        var targetMsgIdentifier = editId || editSlug;
        fetch('/ai/message/' + encodeURIComponent(targetMsgIdentifier) + '/update-content', {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ content: html, content_type: 'embed' })
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            convoBtn.innerHTML = '<span>Updated!</span>';
            setTimeout(function () {
              convoBtn.disabled = false;
              convoBtn.innerHTML = originalBtnContent;
            }, 1500);
          } else {
            convoBtn.disabled = false;
            convoBtn.innerHTML = originalBtnContent;
            alert((data && data.error) || 'Failed to update embed content.');
          }
        })
        .catch(function (err) {
          console.error(err);
          convoBtn.disabled = false;
          convoBtn.innerHTML = originalBtnContent;
          alert('Failed to update embed content.');
        });
        return;
      }

      // 2. Fetch CSRF token if available
      var csrfToken = '';
      try {
        if (window.parent && window.parent.document) {
          var metaParent = window.parent.document.querySelector('meta[name="csrf-token"]');
          if (metaParent) csrfToken = metaParent.getAttribute('content') || '';
        }
      } catch (e) {}
      if (!csrfToken) {
        var metaLocal = document.querySelector('meta[name="csrf-token"]');
        if (metaLocal) csrfToken = metaLocal.getAttribute('content') || '';
      }

      var headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      }

      // 3. Post to /content/comment API
      fetch('/content/comment', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ content: html, content_type: 'embed' })
      })
      .then(function (res) {
        return res.json().catch(function () {
          return { success: res.ok, redirected: res.redirected, url: res.url };
        });
      })
      .then(function (data) {
        if (data && (data.slug || data.conversation_id)) {
          var targetSlug = data.slug || data.conversation_id;
          var targetUrl = '/X/' + encodeURIComponent(targetSlug);
          try {
            if (window.parent && window.parent !== window) {
              window.parent.location.href = targetUrl;
              return;
            }
          } catch (e) {}
          window.location.href = targetUrl;
        } else if (data && data.comment && data.comment.slug) {
          var targetUrl2 = '/X/' + encodeURIComponent(data.comment.slug);
          try {
            if (window.parent && window.parent !== window) {
              window.parent.location.href = targetUrl2;
              return;
            }
          } catch (e) {}
          window.location.href = targetUrl2;
        } else {
          submitFallbackForm(html, csrfToken);
        }
      })
      .catch(function () {
        submitFallbackForm(html, csrfToken);
      });

      function submitFallbackForm(contentHtml, token) {
        try {
          var form = document.createElement('form');
          form.method = 'POST';
          form.action = '/content/comment';
          if (window.parent && window.parent !== window) {
            form.target = '_top';
          }
          if (token) {
            var tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = token;
            form.appendChild(tokenInput);
          }
          var contentInput = document.createElement('input');
          contentInput.type = 'hidden';
          contentInput.name = 'content';
          contentInput.value = contentHtml;
          form.appendChild(contentInput);
          var contentTypeInput = document.createElement('input');
          contentTypeInput.type = 'hidden';
          contentTypeInput.name = 'content_type';
          contentTypeInput.value = 'embed';
          form.appendChild(contentTypeInput);
          document.body.appendChild(form);
          form.submit();
        } catch (err) {
          convoBtn.disabled = false;
          convoBtn.innerHTML = originalBtnContent;
          alert('Failed to save conversation. Please try again.');
        }
      }
    });
  }

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
  });

  var copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', function () {
    var text = codeOut.dataset.raw || codeOut.textContent || '';
    function showCopied() {
      var original = 'Copy code';
      copyBtn.textContent = 'Copied ✓';
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

  initTheme();
  loadMasonryConfig();
  loadSlots();
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'EZ_BUILDER_READY' }, '*');
    }
  } catch (e) {}
})();
</script>

</body>
</html>`;

export interface EmbedRowModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentSlug?: string;
    conversationId?: string;
    onChildConvoCreated?: (html: string, contentType?: string) => Promise<any> | void;
    onCommentCreated?: (messages: any[]) => void;
    isEdit?: boolean;
    editId?: string | number;
    editSlug?: string;
    initialHtml?: string;
    onUpdate?: (html: string) => Promise<any> | void;
}

export const EmbedRowModal: React.FC<EmbedRowModalProps> = ({
    isOpen,
    onClose,
    parentSlug,
    conversationId,
    onChildConvoCreated,
    onCommentCreated,
    isEdit = false,
    editId,
    editSlug,
    initialHtml,
    onUpdate,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const postEditMode = useCallback(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'EZ_SET_EDIT_MODE',
                isEdit: !!isEdit,
                editId: editId || null,
                editSlug: editSlug || null,
                initialHtml: initialHtml || '',
            }, '*');
        }
    }, [isEdit, editId, editSlug, initialHtml]);

    useEffect(() => {
        if (!isOpen) return;

        const timer1 = setTimeout(postEditMode, 100);
        const timer2 = setTimeout(postEditMode, 300);
        const timer3 = setTimeout(postEditMode, 600);
        const timer4 = setTimeout(postEditMode, 1200);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [isOpen, postEditMode]);

    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = async (event: MessageEvent) => {
            // Guard: ensure message originates strictly from this modal's own iframe contentWindow
            if (!iframeRef.current || !iframeRef.current.contentWindow) return;
            if (event.source !== iframeRef.current.contentWindow) return;

            if (event.data && event.data.type === 'EZ_BUILDER_READY') {
                postEditMode();
                return;
            }

            if (event.data && event.data.type === 'EZ_CREATE_CONVO_HTML' && event.data.html) {
                const generatedHtml = event.data.html;

                // 1. Check if editing or if onUpdate callback is explicitly provided
                if (isEdit || onUpdate || event.data.isEdit) {
                    if (onUpdate) {
                        try {
                            await onUpdate(generatedHtml);
                            onClose();
                            return;
                        } catch (err) {
                            console.error('Failed in onUpdate:', err);
                        }
                    }

                    // Otherwise post to update API directly without generating new slug redirect
                    const targetId = editId || event.data.editId || editSlug || event.data.editSlug || parentSlug;
                    if (targetId) {
                        try {
                            const response = await axios.patch(`/ai/message/${targetId}/update-content`, {
                                content: generatedHtml,
                                content_type: 'embed',
                            });

                            if (response.data && response.data.success) {
                                window.dispatchEvent(new CustomEvent('ez:conversation-updated', { detail: response.data }));
                                onClose();
                                return;
                            }
                        } catch (err) {
                            console.error('Failed to update embed message:', err);
                        }
                    }
                    return;
                }

                // 2. Check if onChildConvoCreated callback is explicitly provided (e.g. from AISearchView)
                if (onChildConvoCreated) {
                    try {
                        await onChildConvoCreated(generatedHtml, 'embed');
                        onClose();
                        return;
                    } catch (err) {
                        console.error('Failed in onChildConvoCreated:', err);
                    }
                }

                // 3. Otherwise post to /content/comment API for new conversation creation
                try {
                    const payload: { content: string; content_type: string; parent_slug?: string | null; conversation_id?: string | null } = {
                        content: generatedHtml,
                        content_type: 'embed',
                        parent_slug: null,
                        conversation_id: conversationId || null,
                    };

                    const response = await axios.post('/content/comment', payload, {
                        headers: {
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    });

                    if (response.data && response.data.success) {
                        if (onCommentCreated && response.data.conversation_messages) {
                            onCommentCreated(response.data.conversation_messages);
                            onClose();
                            return;
                        }

                        if (parentSlug || conversationId) {
                            onClose();
                            window.dispatchEvent(new CustomEvent('ez:conversation-updated', { detail: response.data }));
                            return;
                        }

                        if (response.data.slug) {
                            window.location.href = '/X/' + encodeURIComponent(response.data.slug);
                        } else if (response.data.conversation_id) {
                            window.location.href = '/X/' + encodeURIComponent(response.data.conversation_id);
                        }
                    }
                } catch (err) {
                    console.error('Failed to create conversation from message:', err);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onClose, parentSlug, conversationId, onChildConvoCreated, onCommentCreated, isEdit, editId, editSlug, onUpdate, postEditMode]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOpenInNewTab = () => {
        try {
            const blob = new Blob([EMBED_ROW_HTML], { type: 'text/html;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const newWindow = window.open(blobUrl, '_blank');
            if (newWindow) {
                newWindow.focus();
            }
        } catch {
            const newWin = window.open();
            if (newWin) {
                newWin.document.open();
                newWin.document.write(EMBED_ROW_HTML);
                newWin.document.close();
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-[1240px] h-[92vh] max-h-[920px] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/80 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-slate-950 px-5 py-3 flex items-center justify-between border-b border-slate-800 select-none">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:opacity-80 transition-opacity cursor-pointer border-0"
                                title="Close popup"
                            />
                            <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] inline-block"></span>
                            <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f] inline-block"></span>
                        </div>
                        <div className="h-4 w-px bg-slate-800 mx-1"></div>
                        <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faHtml5} className="text-orange-500 text-sm" />
                            <span className="text-sm font-bold text-white tracking-wide">
                                Embed Row & Masonry Builder
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleOpenInNewTab}
                            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 font-medium border border-slate-700 cursor-pointer"
                            title="Open in a new tab"
                        >
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                            <span className="hidden sm:inline">Open Tab</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Close modal"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                            <span>Close</span>
                        </button>
                    </div>
                </div>

                {/* Modal Body iframe hosting Embed Row & Masonry Builder */}
                <div className="flex-1 w-full h-full bg-white relative overflow-hidden">
                    <iframe
                        ref={iframeRef}
                        srcDoc={EMBED_ROW_HTML}
                        title="Embed Row & Masonry Builder"
                        className="w-full h-full border-0 block"
                        style={{ backgroundColor: '#f3f4f1' }}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                        allowFullScreen={true}
                        onLoad={postEditMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default EmbedRowModal;