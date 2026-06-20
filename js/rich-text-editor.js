/**
 * RichTextEditor v4.0 — Advanced block-style editing system
 * Features: Slash commands, markdown shortcuts, table context menus,
 *           JSON hydration/export, no-format paste toggle, smart caret escaping,
 *           custom popovers, draggable image resizing, palette color dropdowns.
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     SECTION 1: STYLES
  ═══════════════════════════════════════════════════════════════════ */
  function ensureStyles() {
    if (document.getElementById('rte-shared-styles-v4')) return;
    const style = document.createElement('style');
    style.id = 'rte-shared-styles-v4';
    style.textContent = `
      :root {
        --rte-bg: #ffffff;
        --rte-border: #e2e8f0;
        --rte-toolbar-bg: #f8fafc;
        --rte-toolbar-border: #e2e8f0;
        --rte-btn-bg: transparent;
        --rte-btn-hover-bg: #edf2fb;
        --rte-btn-active-bg: #dde4f7;
        --rte-btn-active-color: #2563eb;
        --rte-btn-color: #374151;
        --rte-btn-border: #d1d5db;
        --rte-radius: 0.625rem;
        --rte-editor-min-height: 200px;
        --rte-focus-ring: 0 0 0 3px rgba(37,99,235,0.14);
        --rte-shadow: 0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
        --rte-divider: #e2e8f0;
        --rte-blockquote-border: #2563eb;
        --rte-blockquote-bg: #f0f4ff;
        --rte-code-bg: #1e293b;
        --rte-code-color: #e2e8f0;
        --rte-font: 'Söhne', 'Helvetica Neue', 'Segoe UI', system-ui, sans-serif;
        --rte-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        --rte-transition: 0.12s ease;
        --rte-tooltip-bg: #1e293b;
        --rte-tooltip-color: #f8fafc;
        --rte-separator-color: #dde2ec;
        --rte-popover-bg: #ffffff;
        --rte-popover-border: #e2e8f0;
        --rte-popover-shadow: 0 8px 30px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07);
        --rte-table-border: #cbd5e1;
        --rte-table-head-bg: #f1f5f9;
        --rte-table-alt-bg: #f8fafc;
        --rte-img-handle-size: 10px;
        --rte-img-handle-color: #2563eb;
        --rte-slash-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.07);
        --rte-ctx-shadow: 0 8px 24px rgba(0,0,0,0.13), 0 2px 6px rgba(0,0,0,0.06);
      }

      /* ── WRAPPER ── */
      .rte-wrap {
        border: 1.5px solid var(--rte-border);
        border-radius: var(--rte-radius);
        background: var(--rte-bg);
        box-shadow: var(--rte-shadow);
        font-family: var(--rte-font);
        overflow: visible;
        position: relative;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .rte-wrap:focus-within {
        border-color: #93b4f5;
        box-shadow: var(--rte-focus-ring), var(--rte-shadow);
      }

      /* ── TOOLBAR ── */
      .rte-toolbar {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-wrap: wrap;
        padding: 5px 8px;
        border-bottom: 1px solid var(--rte-toolbar-border);
        background: var(--rte-toolbar-bg);
        border-radius: var(--rte-radius) var(--rte-radius) 0 0;
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        min-height: 44px;
      }
      .rte-toolbar-group { display: flex; align-items: center; gap: 2px; }
      .rte-separator {
        width: 1px;
        height: 20px;
        background: var(--rte-separator-color);
        margin: 0 4px;
        flex-shrink: 0;
        border-radius: 1px;
      }

      /* ── TOOLBAR BUTTONS ── */
      .rte-toolbar button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 6px;
        background: var(--rte-btn-bg);
        color: var(--rte-btn-color);
        cursor: pointer;
        transition: background var(--rte-transition), border-color var(--rte-transition),
                    color var(--rte-transition), transform 0.07s;
        outline: none;
        flex-shrink: 0;
        user-select: none;
        -webkit-user-select: none;
      }
      .rte-toolbar button:hover {
        background: var(--rte-btn-hover-bg);
        border-color: var(--rte-btn-border);
      }
      .rte-toolbar button:active { transform: scale(0.91); }
      .rte-toolbar button.rte-active {
        background: var(--rte-btn-active-bg);
        color: var(--rte-btn-active-color);
        border-color: #bcd0f7;
      }
      .rte-toolbar button svg {
        width: 15px;
        height: 15px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
        pointer-events: none;
        flex-shrink: 0;
      }
      .rte-toolbar button svg.rte-filled { fill: currentColor; stroke: none; }

      /* ── TOOLTIP ── */
      .rte-toolbar button[data-tip]::after {
        content: attr(data-tip);
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        background: var(--rte-tooltip-bg);
        color: var(--rte-tooltip-color);
        font-size: 11px;
        font-family: var(--rte-font);
        font-weight: 500;
        white-space: nowrap;
        padding: 4px 8px;
        border-radius: 5px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.14s, transform 0.14s;
        z-index: 200;
      }
      .rte-toolbar button[data-tip]:hover::after {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }

      /* ── NO-FORMAT PASTE TOGGLE (wider) ── */
      .rte-toolbar button.rte-paste-toggle {
        width: auto;
        padding: 0 8px;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        font-family: var(--rte-font);
        letter-spacing: 0.01em;
        white-space: nowrap;
        color: #64748b;
      }
      .rte-toolbar button.rte-paste-toggle.rte-active {
        color: var(--rte-btn-active-color);
        background: var(--rte-btn-active-bg);
        border-color: #bcd0f7;
      }
      .rte-toolbar button.rte-paste-toggle svg {
        width: 13px;
        height: 13px;
      }

      /* ── TOOLBAR SELECT ── */
      .rte-toolbar select {
        height: 30px;
        padding: 0 24px 0 8px;
        border: 1px solid var(--rte-btn-border);
        border-radius: 6px;
        background: #fff;
        color: var(--rte-btn-color);
        font-family: var(--rte-font);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: border-color var(--rte-transition);
        flex-shrink: 0;
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 7px center;
      }
      .rte-toolbar select:hover, .rte-toolbar select:focus { border-color: #93b4f5; }

      /* ── COLOR PALETTE ── */
      .rte-palette-wrap { position: relative; display: flex; align-items: center; flex-shrink: 0; }
      .rte-palette-btn {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 2px; width: 30px; height: 30px; border: 1px solid transparent;
        border-radius: 6px; background: transparent; color: var(--rte-btn-color);
        cursor: pointer; transition: background var(--rte-transition), border-color var(--rte-transition);
      }
      .rte-palette-btn:hover { background: var(--rte-btn-hover-bg); border-color: var(--rte-btn-border); }
      .rte-palette-btn svg {
        width: 14px; height: 14px; fill: none; stroke: currentColor;
        stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none;
      }
      .rte-color-bar { display: block; width: 14px; height: 3px; border-radius: 2px; margin-top: 1px; }
      .rte-palette-dropdown {
        position: absolute; top: calc(100% + 6px); left: 0;
        background: var(--rte-popover-bg); border: 1px solid var(--rte-popover-border);
        border-radius: 10px; box-shadow: var(--rte-popover-shadow);
        padding: 10px; z-index: 300; display: none; flex-direction: column; gap: 6px;
        min-width: 168px; animation: rte-in 0.15s ease;
      }
      .rte-palette-dropdown.rte-open { display: flex; }
      .rte-palette-title {
        font-size: 10px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 2px;
      }
      .rte-palette-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; }
      .rte-palette-swatch {
        width: 16px; height: 16px; border-radius: 4px; cursor: pointer;
        border: 1.5px solid rgba(0,0,0,0.08);
        transition: transform 0.1s, box-shadow 0.1s; flex-shrink: 0;
      }
      .rte-palette-swatch:hover {
        transform: scale(1.3); box-shadow: 0 2px 8px rgba(0,0,0,0.22);
        z-index: 1; border-color: rgba(0,0,0,0.22);
      }

      /* ── TABLE PICKER ── */
      .rte-table-wrap { position: relative; flex-shrink: 0; }
      .rte-table-panel {
        position: absolute; top: calc(100% + 6px); left: 0;
        background: var(--rte-popover-bg); border: 1px solid var(--rte-popover-border);
        border-radius: 10px; box-shadow: var(--rte-popover-shadow);
        padding: 10px; z-index: 300; display: none; flex-direction: column; gap: 8px;
        animation: rte-in 0.15s ease;
      }
      .rte-table-panel.rte-open { display: flex; }
      .rte-table-grid {
        display: grid; grid-template-columns: repeat(5, 22px);
        grid-template-rows: repeat(5, 22px); gap: 3px;
      }
      .rte-table-cell {
        width: 22px; height: 22px; border: 1.5px solid #d1d5db;
        border-radius: 3px; cursor: pointer; transition: background 0.08s, border-color 0.08s;
        background: #f8fafc;
      }
      .rte-table-cell.rte-hovered { background: #dde8ff; border-color: #2563eb; }
      .rte-table-label { font-size: 11px; font-weight: 600; color: #64748b; text-align: center; font-family: var(--rte-font); }

      /* ── POPOVERS ── */
      .rte-popover {
        position: fixed; background: var(--rte-popover-bg);
        border: 1px solid var(--rte-popover-border); border-radius: 12px;
        box-shadow: var(--rte-popover-shadow); padding: 16px; z-index: 9999;
        display: none; flex-direction: column; gap: 10px; min-width: 300px;
        animation: rte-in 0.16s ease;
      }
      .rte-popover.rte-open { display: flex; }
      .rte-popover-title { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; margin: 0; }
      .rte-popover-field { display: flex; flex-direction: column; gap: 4px; }
      .rte-popover-field label {
        font-size: 11px; font-weight: 600; color: #64748b;
        text-transform: uppercase; letter-spacing: 0.05em;
      }
      .rte-popover-field input {
        height: 36px; padding: 0 10px; border: 1.5px solid #e2e8f0; border-radius: 7px;
        font-family: var(--rte-font); font-size: 13px; color: #1e293b; outline: none;
        transition: border-color 0.13s, box-shadow 0.13s; background: #f8fafc;
        width: 100%; box-sizing: border-box;
      }
      .rte-popover-field input:focus {
        border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
      }
      .rte-popover-field input.rte-input-error { border-color: #ef4444; }
      .rte-popover-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 2px; }
      .rte-popover-cancel {
        height: 32px; padding: 0 14px; border: 1px solid #e2e8f0; border-radius: 7px;
        background: #fff; color: #64748b; font-family: var(--rte-font); font-size: 12px;
        font-weight: 600; cursor: pointer; transition: background 0.12s, border-color 0.12s;
      }
      .rte-popover-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
      .rte-popover-submit {
        height: 32px; padding: 0 16px; border: none; border-radius: 7px; background: #2563eb;
        color: #fff; font-family: var(--rte-font); font-size: 12px; font-weight: 700;
        cursor: pointer; transition: background 0.12s, transform 0.07s;
      }
      .rte-popover-submit:hover { background: #1d4ed8; }
      .rte-popover-submit:active { transform: scale(0.96); }
      .rte-popover-close {
        position: absolute; top: 10px; right: 10px; width: 24px; height: 24px;
        border: none; background: none; cursor: pointer; display: flex;
        align-items: center; justify-content: center; color: #94a3b8;
        border-radius: 5px; transition: background 0.1s, color 0.1s;
      }
      .rte-popover-close:hover { background: #f1f5f9; color: #374151; }

      /* ── SLASH COMMAND MENU ── */
      .rte-slash-menu {
        position: fixed; background: var(--rte-popover-bg);
        border: 1px solid var(--rte-popover-border); border-radius: 12px;
        box-shadow: var(--rte-slash-shadow); z-index: 9998;
        display: none; flex-direction: column; overflow: hidden;
        min-width: 240px; max-height: 320px;
        animation: rte-in 0.14s ease;
      }
      .rte-slash-menu.rte-open { display: flex; }
      .rte-slash-header {
        padding: 8px 12px 4px;
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.07em; color: #94a3b8; border-bottom: 1px solid #f1f5f9;
        font-family: var(--rte-font);
      }
      .rte-slash-list {
        overflow-y: auto; flex: 1;
        scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
      }
      .rte-slash-item {
        display: flex; align-items: center; gap: 10px; padding: 8px 12px;
        cursor: pointer; transition: background 0.09s;
        font-family: var(--rte-font); border: none; background: none;
        width: 100%; text-align: left;
      }
      .rte-slash-item:hover, .rte-slash-item.rte-selected {
        background: #f0f4ff;
      }
      .rte-slash-item-icon {
        width: 30px; height: 30px; border-radius: 7px;
        background: #f1f5f9; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; color: #374151; transition: background 0.09s;
      }
      .rte-slash-item:hover .rte-slash-item-icon,
      .rte-slash-item.rte-selected .rte-slash-item-icon {
        background: #dde8ff; color: #2563eb;
      }
      .rte-slash-item-icon svg {
        width: 14px; height: 14px; fill: none; stroke: currentColor;
        stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none;
      }
      .rte-slash-item-text { display: flex; flex-direction: column; gap: 1px; }
      .rte-slash-item-label { font-size: 13px; font-weight: 600; color: #1e293b; }
      .rte-slash-item-desc { font-size: 11px; color: #94a3b8; }
      .rte-slash-empty { padding: 16px 12px; font-size: 12px; color: #94a3b8; font-family: var(--rte-font); }

      /* ── TABLE CONTEXT MENU ── */
      .rte-ctx-menu {
        position: fixed; background: var(--rte-popover-bg);
        border: 1px solid var(--rte-popover-border); border-radius: 10px;
        box-shadow: var(--rte-ctx-shadow); z-index: 9997;
        display: none; flex-direction: column; overflow: hidden;
        min-width: 200px; animation: rte-in 0.13s ease; padding: 4px;
      }
      .rte-ctx-menu.rte-open { display: flex; }
      .rte-ctx-item {
        display: flex; align-items: center; gap: 8px; padding: 8px 10px;
        cursor: pointer; border: none; background: none; width: 100%;
        text-align: left; border-radius: 7px; transition: background 0.09s;
        font-family: var(--rte-font);
      }
      .rte-ctx-item:hover { background: #f0f4ff; }
      .rte-ctx-item svg {
        width: 13px; height: 13px; fill: none; stroke: currentColor;
        stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
        pointer-events: none; color: #64748b; flex-shrink: 0;
      }
      .rte-ctx-item-label { font-size: 12px; font-weight: 500; color: #374151; }
      .rte-ctx-item.rte-danger:hover { background: #fff1f2; }
      .rte-ctx-item.rte-danger:hover .rte-ctx-item-label { color: #dc2626; }
      .rte-ctx-item.rte-danger:hover svg { color: #dc2626; }
      .rte-ctx-separator { height: 1px; background: #f1f5f9; margin: 3px 0; }

      /* ── EDITOR CONTENT ── */
      .rte-editor {
        min-height: var(--rte-editor-min-height); padding: 16px 18px;
        outline: none; font-family: var(--rte-font); font-size: 15px; line-height: 1.7;
        color: #1e293b; caret-color: #2563eb; word-break: break-word;
        overflow-wrap: break-word; position: relative;
      }
      .rte-editor p { margin: 0 0 0.8em; }
      .rte-editor p:last-child { margin-bottom: 0; }
      .rte-editor h1 { font-size: 1.8em; font-weight: 800; margin: 0 0 0.5em; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2; }
      .rte-editor h2 { font-size: 1.45em; font-weight: 700; margin: 0 0 0.5em; color: #0f172a; letter-spacing: -0.015em; line-height: 1.3; }
      .rte-editor h3 { font-size: 1.15em; font-weight: 600; margin: 0 0 0.5em; color: #0f172a; }
      .rte-editor ul, .rte-editor ol { margin: 0 0 0.8em 1.5em; padding: 0; }
      .rte-editor li { margin-bottom: 0.3em; }
      .rte-editor a { color: #2563eb; text-decoration: underline; }
      .rte-editor a:hover { color: #1d4ed8; }
      .rte-editor blockquote {
        margin: 1em 0; padding: 12px 16px;
        border-left: 3px solid var(--rte-blockquote-border);
        background: var(--rte-blockquote-bg); border-radius: 0 8px 8px 0;
        color: #334155; font-style: italic;
      }
      .rte-editor pre {
        margin: 1em 0; padding: 16px 18px; background: var(--rte-code-bg);
        color: var(--rte-code-color); border-radius: 10px; font-family: var(--rte-mono);
        font-size: 13px; line-height: 1.65; overflow-x: auto; white-space: pre-wrap;
      }
      .rte-editor code {
        background: #f1f5f9; color: #0f766e; border-radius: 4px; padding: 2px 5px;
        font-family: var(--rte-mono); font-size: 0.875em;
      }
      .rte-editor pre code { background: transparent; color: inherit; padding: 0; font-size: inherit; }
      .rte-editor hr { border: none; border-top: 2px solid var(--rte-divider); margin: 1.5em 0; }
      .rte-editor img {
        max-width: 100%; height: auto; border-radius: 8px; display: block;
        margin: 0.8em 0; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        cursor: pointer; transition: box-shadow 0.15s;
      }
      .rte-editor img:hover { box-shadow: 0 2px 12px rgba(37,99,235,0.18); }
      .rte-editor img.rte-img-selected {
        outline: 2px solid #2563eb; outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
      }

      /* ── PLACEHOLDER ── */
      .rte-editor[data-placeholder]:empty::before,
      .rte-editor.rte-placeholder::before {
        content: attr(data-placeholder); color: #94a3b8; pointer-events: none; display: block;
      }

      /* ── TABLES ── */
      .rte-editor table {
        width: 100%; border-collapse: collapse; margin: 1em 0;
        border-radius: 8px; overflow: hidden;
        box-shadow: 0 0 0 1px var(--rte-table-border); font-size: 14px;
      }
      .rte-editor table thead { background: var(--rte-table-head-bg); }
      .rte-editor table th {
        padding: 10px 14px; text-align: left; font-weight: 700;
        font-size: 12px; color: #374151; text-transform: uppercase;
        letter-spacing: 0.05em; border-bottom: 2px solid var(--rte-table-border);
      }
      .rte-editor table td {
        padding: 10px 14px; border-bottom: 1px solid #f1f5f9;
        color: #1e293b; vertical-align: top;
      }
      .rte-editor table tbody tr:nth-child(even) td { background: var(--rte-table-alt-bg); }
      .rte-editor table tbody tr:last-child td { border-bottom: none; }
      .rte-editor table th:not(:last-child),
      .rte-editor table td:not(:last-child) { border-right: 1px solid #f1f5f9; }
      .rte-editor table td:focus,
      .rte-editor table th:focus {
        outline: 2px solid #2563eb; outline-offset: -2px; border-radius: 2px;
      }

      /* ── IMAGE RESIZE ── */
      .rte-img-overlay { position: absolute; pointer-events: none; z-index: 50; }
      .rte-img-handle {
        position: absolute; width: var(--rte-img-handle-size); height: var(--rte-img-handle-size);
        background: #fff; border: 2px solid var(--rte-img-handle-color);
        border-radius: 3px; pointer-events: all; cursor: se-resize; transition: transform 0.1s;
      }
      .rte-img-handle:hover { transform: scale(1.3); }
      .rte-img-handle[data-pos="br"] { bottom: -5px; right: -5px; cursor: se-resize; }
      .rte-img-handle[data-pos="bl"] { bottom: -5px; left: -5px; cursor: sw-resize; }
      .rte-img-handle[data-pos="tr"] { top: -5px; right: -5px; cursor: ne-resize; }
      .rte-img-handle[data-pos="tl"] { top: -5px; left: -5px; cursor: nw-resize; }
      .rte-img-align-bar {
        position: absolute; top: -38px; left: 50%; transform: translateX(-50%);
        background: #1e293b; border-radius: 8px; padding: 5px 8px;
        display: flex; gap: 4px; pointer-events: all;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25); z-index: 60;
      }
      .rte-img-align-btn {
        width: 26px; height: 26px; border: 1px solid rgba(255,255,255,0.15);
        border-radius: 5px; background: transparent; color: #94a3b8;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.1s, color 0.1s;
      }
      .rte-img-align-btn:hover, .rte-img-align-btn.rte-active {
        background: rgba(255,255,255,0.15); color: #fff;
      }
      .rte-img-align-btn svg {
        width: 13px; height: 13px; fill: none; stroke: currentColor;
        stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; pointer-events: none;
      }
      .rte-resize-glass { position: fixed; inset: 0; z-index: 99998; cursor: se-resize; background: transparent; }

      /* ── FOOTER ── */
      .rte-footer {
        display: flex; justify-content: flex-end; padding: 4px 12px 5px;
        border-top: 1px solid var(--rte-toolbar-border);
        background: var(--rte-toolbar-bg);
        border-radius: 0 0 var(--rte-radius) var(--rte-radius);
      }
      .rte-char-count { font-size: 11px; color: #94a3b8; font-family: var(--rte-font); user-select: none; }
      .rte-char-count.rte-char-warn { color: #f59e0b; }
      .rte-char-count.rte-char-over { color: #ef4444; font-weight: 700; }

      /* ── ANIMATIONS ── */
      @keyframes rte-in {
        from { opacity: 0; transform: translateY(-5px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 2: SVG ICON LIBRARY
  ═══════════════════════════════════════════════════════════════════ */
  const SVG = {
    bold:        `<svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg>`,
    italic:      `<svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    underline:   `<svg viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
    strike:      `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6a4 4 0 0 0-8 0c0 1.6 1 2.8 3 3.5"/><path d="M8 18a4 4 0 0 0 8 0c0-1.6-1-2.8-3-3.5"/></svg>`,
    textColor:   `<svg viewBox="0 0 24 24"><path d="M4 20h16"/><path d="M8 16 12 4l4 12"/><path d="M10 12h4"/></svg>`,
    bgColor:     `<svg viewBox="0 0 24 24"><path d="M19 11l-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11z"/><path d="M20 16.2A2 2 0 1 1 23 18"/></svg>`,
    alignLeft:   `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`,
    alignCenter: `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
    alignRight:  `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>`,
    alignJust:   `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    ul:          `<svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" class="rte-filled"/><circle cx="4" cy="12" r="1.5" class="rte-filled"/><circle cx="4" cy="18" r="1.5" class="rte-filled"/></svg>`,
    ol:          `<svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1V3M4 11.5c0-1 1.5-1.5 1.5-.5S4 12.5 3.5 14H6M4.5 17H6v1l-1.5 1.5H6v1H4"/></svg>`,
    blockquote:  `<svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
    codeBlock:   `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 9 6 12 9 15"/><polyline points="15 9 18 12 15 15"/></svg>`,
    hr:          `<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="7" y2="6"/><line x1="3" y1="18" x2="7" y2="18"/></svg>`,
    table:       `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    link:        `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    unlink:      `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
    image:       `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    undo:        `<svg viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M3 13C5.5 8.5 10 6 15 6a9 9 0 0 1 6 15"/></svg>`,
    redo:        `<svg viewBox="0 0 24 24"><path d="M21 7v6h-6"/><path d="M21 13C18.5 8.5 14 6 9 6a9 9 0 0 0-6 15"/></svg>`,
    close:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    imgLeft:     `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="9" height="9" rx="1"/><line x1="15" y1="6" x2="21" y2="6"/><line x1="15" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="3" y1="19" x2="21" y2="19"/></svg>`,
    imgCenter:   `<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="10" rx="1"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/></svg>`,
    imgRight:    `<svg viewBox="0 0 24 24"><rect x="12" y="3" width="9" height="9" rx="1"/><line x1="3" y1="6" x2="9" y2="6"/><line x1="3" y1="9" x2="9" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="3" y1="19" x2="21" y2="19"/></svg>`,
    pasteNoFormat: `<svg viewBox="0 0 24 24"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
    clearFormat: `<svg viewBox="0 0 24 24"><path d="M5 5h9l-1 3"/><path d="M9.5 8 7 19"/><line x1="11" y1="19" x2="17" y2="19"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
    h1:          `<svg viewBox="0 0 24 24"><path d="M4 6v12M11 6v12M4 12h7"/><path d="M15 9.5c.5-1 1.5-1.5 2.5-1.5 1.5 0 2.5 1 2.5 2.2 0 1.1-.6 1.8-1.8 3L15 18h5.5"/></svg>`,
    h2:          `<svg viewBox="0 0 24 24"><path d="M4 6v12M11 6v12M4 12h7"/><path d="M15 9.3c.4-.9 1.3-1.3 2.3-1.3 1.4 0 2.5.9 2.5 2.1 0 2.1-4.8 3-4.8 5.9h5"/></svg>`,
    paragraph:   `<svg viewBox="0 0 24 24"><path d="M12 4v16M12 4H9.5a3.5 3.5 0 1 1 0-7H12"/><path d="M16 4v16"/></svg>`,
    bulletList:  `<svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" class="rte-filled"/><circle cx="4" cy="12" r="1.5" class="rte-filled"/><circle cx="4" cy="18" r="1.5" class="rte-filled"/></svg>`,
    orderedList: `<svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1V3M4 11.5c0-1 1.5-1.5 1.5-.5S4 12.5 3.5 14H6M4.5 17H6v1l-1.5 1.5H6v1H4"/></svg>`,
    rowAbove:    `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="1"/><line x1="12" y1="3" x2="12" y2="8"/><polyline points="9 5 12 2 15 5"/></svg>`,
    rowBelow:    `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="6" rx="1"/><line x1="12" y1="16" x2="12" y2="21"/><polyline points="9 19 12 22 15 19"/></svg>`,
    colLeft:     `<svg viewBox="0 0 24 24"><rect x="11" y="3" width="6" height="18" rx="1"/><line x1="3" y1="12" x2="8" y2="12"/><polyline points="5 9 2 12 5 15"/></svg>`,
    colRight:    `<svg viewBox="0 0 24 24"><rect x="7" y="3" width="6" height="18" rx="1"/><line x1="16" y1="12" x2="21" y2="12"/><polyline points="19 9 22 12 19 15"/></svg>`,
    trash:       `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    tableMenu:   `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><circle cx="19" cy="19" r="3" fill="currentColor" stroke="none" class="rte-filled"/></svg>`,
  };

  function makeBtn(tip, svgKey, opts = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-tip', tip);
    btn.setAttribute('aria-label', tip);
    btn.innerHTML = SVG[svgKey] || '';
    if (opts.cmd)    btn.dataset.cmd    = opts.cmd;
    if (opts.action) btn.dataset.action = opts.action;
    if (opts.className) btn.className = opts.className;
    return btn;
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 3: COLOR PALETTE DATA
  ═══════════════════════════════════════════════════════════════════ */
  const COLOR_PALETTE_SOLID = [
    '#000000','#1e293b','#334155','#475569','#64748b','#94a3b8','#cbd5e1','#e2e8f0','#f1f5f9',
    '#7f1d1d','#991b1b','#b91c1c','#dc2626','#ef4444','#f87171','#fca5a5','#fecaca','#fff5f5',
    '#78350f','#92400e','#b45309','#d97706','#f59e0b','#fbbf24','#fcd34d','#fde68a','#fffbeb',
    '#14532d','#166534','#15803d','#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#f0fdf4',
    '#1e3a5f','#1e40af','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#eff6ff',
    '#3b0764','#6b21a8','#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe','#faf5ff',
  ];

  const COLOR_PALETTE_HIGHLIGHTS = [
    'transparent',
    '#fef9c3','#fef08a','#fde047',
    '#dcfce7','#bbf7d0','#86efac',
    '#dbeafe','#bfdbfe','#93c5fd',
    '#fce7f3','#fbcfe8','#f9a8d4',
    '#ffe4e6','#fecdd3','#fda4af',
    '#e0f2fe','#bae6fd','#7dd3fc',
    '#f3e8ff','#e9d5ff','#d8b4fe',
    '#fff7ed','#fed7aa','#fdba74',
  ];


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 4: UTILITIES
  ═══════════════════════════════════════════════════════════════════ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  }

  // Find the nearest ancestor block element of a node, bounded by the editor root
  function closestBlock(node, editorRoot) {
    let el = node.nodeType === 3 ? node.parentElement : node;
    const blockTags = new Set(['P','H1','H2','H3','LI','BLOCKQUOTE','PRE','TD','TH','DIV']);
    while (el && el !== editorRoot) {
      if (blockTags.has(el.tagName)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function placeCaretAtStart(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAtEnd(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAfter(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStartAfter(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function unwrapFullySelectedBlockquote(editorRoot) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);
  const startBlockquote = range.startContainer.nodeType === 3
    ? range.startContainer.parentElement?.closest('blockquote')
    : range.startContainer.closest?.('blockquote');
  const endBlockquote = range.endContainer.nodeType === 3
    ? range.endContainer.parentElement?.closest('blockquote')
    : range.endContainer.closest?.('blockquote');

  if (!startBlockquote || startBlockquote !== endBlockquote) return null;
  if (!editorRoot.contains(startBlockquote)) return null;

  const selectedText = range.toString().replace(/\s+/g, ' ').trim();
  const fullText = startBlockquote.textContent.replace(/\s+/g, ' ').trim();
  if (!fullText || selectedText !== fullText) return null;

  const p = document.createElement('p');
  p.innerHTML = startBlockquote.innerHTML;
  startBlockquote.replaceWith(p);

  const newRange = document.createRange();
  newRange.selectNodeContents(p);
  sel.removeAllRanges();
  sel.addRange(newRange);

  return p;
}

  /* ═══════════════════════════════════════════════════════════════════
     SECTION 5: SANITIZER (web-ready, semantic HTML output)
  ═══════════════════════════════════════════════════════════════════ */
  const ALLOWED_TAGS = new Set([
    'P','BR','B','STRONG','I','EM','U','S','DEL','SPAN',
    'UL','OL','LI',
    'A',
    'H1','H2','H3',
    'BLOCKQUOTE','PRE','CODE',
    'IMG','HR',
    'DIV',
    'TABLE','THEAD','TBODY','TR','TH','TD',
  ]);

  const ALLOWED_STYLE_PROPS = new Set([
    'color','background-color','text-align','float','margin','margin-left',
    'margin-right','margin-top','margin-bottom','width','height','max-width',
  ]);

  const ALLOWED_ATTRS = {
    A:     ['href','target','rel'],
    IMG:   ['src','alt','width','style'],
    SPAN:  ['style'],
    P:     ['style'],
    DIV:   ['style'],
    H1:    ['style'], H2: ['style'], H3: ['style'],
    TH:    ['style','colspan','rowspan'],
    TD:    ['style','colspan','rowspan'],
    TABLE: ['style'],
  };

  function sanitizeStyle(styleAttr) {
    if (!styleAttr) return '';
    const safe = [];
    styleAttr.split(';').forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) return;
      const prop = part.slice(0, colonIdx).trim().toLowerCase();
      const val  = part.slice(colonIdx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return;
      if (/javascript|expression|url\s*\(/i.test(val)) return;
      safe.push(`${prop}: ${val}`);
    });
    return safe.join('; ');
  }

  /**
   * Strips all editor-internal UI/tracking artifacts (slash menu remnants,
   * resize handles, context menus, contenteditable markers, empty/orphan
   * wrapper divs) and produces clean, semantic, web-safe HTML — entirely
   * self-contained and free of layout-breaking inline hacks.
   */
  function sanitizeRichTextHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');

    // Strip all editor UI artifacts before walking
    doc.body.querySelectorAll(
      '.rte-img-overlay, .rte-img-handle, .rte-img-align-bar, .rte-resize-glass, ' +
      '.rte-slash-menu, .rte-ctx-menu, [data-rte-ui]'
    ).forEach(el => el.remove());

    const walk = (node) => {
      [...node.children].forEach((child) => {
        const tag = child.tagName;

        if (!ALLOWED_TAGS.has(tag)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          return;
        }

        const keepAttrs = ALLOWED_ATTRS[tag] || [];
        [...child.attributes].forEach((a) => {
          const name = a.name.toLowerCase();
          // Always strip editor-internal tracking attributes regardless of tag
          if (name === 'contenteditable' || name.startsWith('data-rte') || name === 'spellcheck') {
            child.removeAttribute(a.name);
            return;
          }
          if (!keepAttrs.includes(name)) {
            child.removeAttribute(a.name);
            return;
          }
          if (name === 'style') {
            const sanitized = sanitizeStyle(a.value);
            if (sanitized) child.setAttribute('style', sanitized);
            else child.removeAttribute('style');
          }
        });

        if (tag === 'A') {
          const href = child.getAttribute('href') || '';
          if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) {
            child.removeAttribute('href');
          } else {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          }
        }

        if (tag === 'IMG') {
          const src = child.getAttribute('src') || '';
          if (!/^https?:\/\//i.test(src) && !/^data:image\//i.test(src)) {
            child.remove();
            return;
          }
          const existingStyle = child.getAttribute('style') || '';
          if (!existingStyle.includes('max-width')) {
            const combined = (existingStyle + '; max-width: 100%; height: auto').replace(/^;\s*/, '');
            child.setAttribute('style', combined);
          }
        }

        walk(child);
      });
    };

    walk(doc.body);

    // Remove empty, non-semantic DIV wrappers left over from execCommand quirks
    // (but never touch table/list/structural containers)
    let changed = true;
    while (changed) {
      changed = false;
      doc.body.querySelectorAll('div').forEach(div => {
        const onlyWhitespace = !div.innerHTML.replace(/&nbsp;|\s/g, '').length;
        if (onlyWhitespace && !div.querySelector('img, table, hr')) {
          div.remove();
          changed = true;
        } else if (!div.attributes.length && div.children.length) {
          // Unwrap attribute-less DIVs (execCommand sometimes wraps lines in DIVs)
          const frag = document.createDocumentFragment();
          while (div.firstChild) frag.appendChild(div.firstChild);
          div.replaceWith(frag);
          changed = true;
        }
      });
    }

    // Strip empty block-level elements (but preserve images/breaks/table cells)
    doc.body.querySelectorAll('p, h1, h2, h3, blockquote, li').forEach(el => {
      const content = el.innerHTML.replace(/&nbsp;|\s/g, '');
      if (!content && !el.querySelector('img, br')) el.remove();
    });

    // Collapse consecutive redundant <br> at block boundaries
    doc.body.querySelectorAll('br + br').forEach(br => br.remove());

    // Ensure table cells never retain stray contenteditable remnants (defense in depth)
    doc.body.querySelectorAll('td, th').forEach(cell => cell.removeAttribute('contenteditable'));

    return doc.body.innerHTML.trim();
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 6: POPOVER SYSTEM (Link & Image — zero native prompt() calls)
  ═══════════════════════════════════════════════════════════════════ */
  function createPopoverSystem(wrapper) {
    const popover = document.createElement('div');
    popover.className = 'rte-popover';
    popover.style.position = 'fixed';
    document.body.appendChild(popover);

    let _onSubmit = null;
    let _savedRange = null;

    function positionNear(refEl) {
      const rect = refEl.getBoundingClientRect();
      const popW = 320;
      let left = rect.left;
      let top  = rect.bottom + 8;
      if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
      if (left < 12) left = 12;
      if (top + 220 > window.innerHeight - 12) top = rect.top - 220;
      popover.style.left = left + 'px';
      popover.style.top  = top + 'px';
    }

    function saveSelection() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) _savedRange = sel.getRangeAt(0).cloneRange();
    }

    function restoreSelection() {
      if (!_savedRange) return;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(_savedRange);
    }

    function close() {
      popover.classList.remove('rte-open');
      popover.innerHTML = '';
      _onSubmit = null;
    }

    function open(config, refEl) {
      saveSelection();
      popover.innerHTML = '';
      popover.classList.add('rte-open');

      const titleEl = document.createElement('p');
      titleEl.className = 'rte-popover-title';
      titleEl.textContent = config.title;
      popover.appendChild(titleEl);

      const closeBtnEl = document.createElement('button');
      closeBtnEl.className = 'rte-popover-close';
      closeBtnEl.type = 'button';
      closeBtnEl.innerHTML = SVG.close;
      closeBtnEl.addEventListener('click', close);
      popover.appendChild(closeBtnEl);

      const inputs = {};
      config.fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'rte-popover-field';
        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', 'rte-popover-' + field.id);
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.id = 'rte-popover-' + field.id;
        input.placeholder = field.placeholder || '';
        if (field.value) input.value = field.value;
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); doSubmit(); }
          if (e.key === 'Escape') { e.preventDefault(); close(); }
        });
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        popover.appendChild(fieldDiv);
        inputs[field.id] = input;
      });

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'rte-popover-actions';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'rte-popover-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', close);
      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'rte-popover-submit';
      submitBtn.textContent = config.submitLabel || 'Insert';
      submitBtn.addEventListener('click', doSubmit);
      actionsDiv.appendChild(cancelBtn);
      actionsDiv.appendChild(submitBtn);
      popover.appendChild(actionsDiv);

      function doSubmit() {
        const values = {};
        let valid = true;
        config.fields.forEach(field => {
          const input = inputs[field.id];
          const val = input.value.trim();
          input.classList.remove('rte-input-error');
          if (field.required && !val) { input.classList.add('rte-input-error'); valid = false; }
          if (field.validate && !field.validate(val)) { input.classList.add('rte-input-error'); valid = false; }
          values[field.id] = val;
        });
        if (!valid) return;
        close();
        restoreSelection();
        if (_onSubmit) _onSubmit(values);
      }

      _onSubmit = config.onSubmit;
      positionNear(refEl);
      const firstInput = Object.values(inputs)[0];
      if (firstInput) setTimeout(() => firstInput.focus(), 30);
      return { close };
    }

    document.addEventListener('mousedown', (e) => {
      if (popover.classList.contains('rte-open') && !popover.contains(e.target)) close();
    });

    return { open, close, saveSelection, restoreSelection };
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 7: COLOR PALETTE DROPDOWN
  ═══════════════════════════════════════════════════════════════════ */
  function createPaletteDropdown(type, onSelect) {
    const wrap = document.createElement('div');
    wrap.className = 'rte-palette-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rte-palette-btn';
    btn.setAttribute('data-tip', type === 'text' ? 'Text Color' : 'Highlight Color');
    btn.setAttribute('aria-label', type === 'text' ? 'Text Color' : 'Highlight Color');
    btn.innerHTML = type === 'text' ? SVG.textColor : SVG.bgColor;

    const bar = document.createElement('span');
    bar.className = 'rte-color-bar';
    bar.style.backgroundColor = type === 'text' ? '#1e293b' : '#fef08a';
    btn.appendChild(bar);

    const dropdown = document.createElement('div');
    dropdown.className = 'rte-palette-dropdown';
    dropdown.setAttribute('data-rte-ui', '');

    const solidTitle = document.createElement('div');
    solidTitle.className = 'rte-palette-title';
    solidTitle.textContent = type === 'text' ? 'Text Colors' : 'Highlight Colors';
    dropdown.appendChild(solidTitle);

    const solidGrid = document.createElement('div');
    solidGrid.className = 'rte-palette-grid';
    const palette = type === 'text' ? COLOR_PALETTE_SOLID : COLOR_PALETTE_HIGHLIGHTS;
    palette.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'rte-palette-swatch';
      swatch.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
      if (color === 'transparent') {
        swatch.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)';
        swatch.style.backgroundSize = '6px 6px';
        swatch.style.backgroundPosition = '0 0, 3px 3px';
      }
      swatch.title = color;
      swatch.addEventListener('mousedown', (e) => {
        e.preventDefault();
        bar.style.backgroundColor = color === 'transparent' ? '' : color;
        onSelect(color);
        dropdown.classList.remove('rte-open');
      });
      solidGrid.appendChild(swatch);
    });
    dropdown.appendChild(solidGrid);
    wrap.appendChild(btn);
    wrap.appendChild(dropdown);

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = dropdown.classList.contains('rte-open');
      closeAllDropdowns();
      if (!wasOpen) dropdown.classList.add('rte-open');
    });

    return wrap;
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.rte-palette-dropdown.rte-open, .rte-table-panel.rte-open').forEach(el => {
      el.classList.remove('rte-open');
    });
  }

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.rte-palette-wrap') && !e.target.closest('.rte-table-wrap')) {
      closeAllDropdowns();
    }
  });


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 8: TABLE GRID PICKER (toolbar insert)
  ═══════════════════════════════════════════════════════════════════ */
  function createTablePicker(onInsert) {
    const wrap = document.createElement('div');
    wrap.className = 'rte-table-wrap';

    const btn = makeBtn('Insert Table', 'table');
    wrap.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'rte-table-panel';
    panel.setAttribute('data-rte-ui', '');

    const grid = document.createElement('div');
    grid.className = 'rte-table-grid';

    const label = document.createElement('div');
    label.className = 'rte-table-label';
    label.textContent = 'Select table size';

    let hoverCol = 0, hoverRow = 0;
    const cells = [];

    for (let r = 0; r < 5; r++) {
      cells[r] = [];
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.className = 'rte-table-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cells[r][c] = cell;
        grid.appendChild(cell);
      }
    }

    grid.addEventListener('mousemove', (e) => {
      const target = e.target.closest('.rte-table-cell');
      if (!target) return;
      hoverRow = parseInt(target.dataset.row, 10);
      hoverCol = parseInt(target.dataset.col, 10);
      label.textContent = `${hoverRow + 1} × ${hoverCol + 1} Table`;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          cells[r][c].classList.toggle('rte-hovered', r <= hoverRow && c <= hoverCol);
        }
      }
    });

    grid.addEventListener('mouseleave', () => {
      label.textContent = 'Select table size';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) cells[r][c].classList.remove('rte-hovered');
    });

    grid.addEventListener('click', (e) => {
      const target = e.target.closest('.rte-table-cell');
      if (!target) return;
      const rows = parseInt(target.dataset.row, 10) + 1;
      const cols = parseInt(target.dataset.col, 10) + 1;
      panel.classList.remove('rte-open');
      onInsert(rows, cols);
    });

    panel.appendChild(grid);
    panel.appendChild(label);
    wrap.appendChild(panel);

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const wasOpen = panel.classList.contains('rte-open');
      closeAllDropdowns();
      if (!wasOpen) panel.classList.add('rte-open');
    });

    return wrap;
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 9: IMAGE RESIZE & ALIGNMENT SYSTEM
  ═══════════════════════════════════════════════════════════════════ */
  function createImageResizeSystem(editor, onChange) {
    let activeImg = null;
    let overlay   = null;

    function clearSelection() {
      if (activeImg) {
        activeImg.classList.remove('rte-img-selected');
        activeImg = null;
      }
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        overlay = null;
      }
    }

    function positionOverlay(img) {
      const editorRect = editor.getBoundingClientRect();
      const imgRect    = img.getBoundingClientRect();
      overlay.style.left   = (imgRect.left - editorRect.left + editor.scrollLeft) + 'px';
      overlay.style.top    = (imgRect.top  - editorRect.top  + editor.scrollTop)  + 'px';
      overlay.style.width  = imgRect.width  + 'px';
      overlay.style.height = imgRect.height + 'px';
    }

    function attachOverlay(img) {
      clearSelection();
      activeImg = img;
      img.classList.add('rte-img-selected');

      overlay = document.createElement('div');
      overlay.className = 'rte-img-overlay';
      overlay.setAttribute('data-rte-ui', '');

      ['tl','tr','bl','br'].forEach(pos => {
        const handle = document.createElement('div');
        handle.className = 'rte-img-handle';
        handle.setAttribute('data-pos', pos);
        handle.setAttribute('data-rte-ui', '');
        handle.setAttribute('contenteditable', 'false');

        let startX, startY, startW, startH;
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startX = e.clientX;
          startY = e.clientY;
          startW = img.getBoundingClientRect().width;
          startH = img.getBoundingClientRect().height;

          const glass = document.createElement('div');
          glass.className = 'rte-resize-glass';
          glass.setAttribute('data-rte-ui', '');
          const isLeft = pos.includes('l');
          const isTop  = pos.includes('t');
          document.body.appendChild(glass);
          glass.style.cursor = (pos === 'br' || pos === 'tl') ? 'nwse-resize' :
                               (pos === 'bl' || pos === 'tr') ? 'nesw-resize' : 'se-resize';

          const onMousemove = (me) => {
            const dx = me.clientX - startX;
            const dy = me.clientY - startY;
            let newW = isLeft ? Math.max(40, startW - dx) : Math.max(40, startW + dx);
            let newH = isTop  ? Math.max(30, startH - dy) : Math.max(30, startH + dy);
            img.style.width  = Math.round(newW) + 'px';
            img.style.height = Math.round(newH) + 'px';
            positionOverlay(img);
          };

          const onMouseup = () => {
            document.removeEventListener('mousemove', onMousemove);
            document.removeEventListener('mouseup', onMouseup);
            if (glass.parentNode) document.body.removeChild(glass);
            onChange();
          };

          document.addEventListener('mousemove', onMousemove);
          document.addEventListener('mouseup', onMouseup);
        });

        overlay.appendChild(handle);
      });

      const alignBar = document.createElement('div');
      alignBar.className = 'rte-img-align-bar';
      alignBar.setAttribute('data-rte-ui', '');

      const alignConfigs = [
        { label: 'Float Left',  svgKey: 'imgLeft',   apply: () => {
          img.style.float = 'left'; img.style.marginRight = '16px';
          img.style.marginLeft = '0'; img.style.display = ''; img.style.marginTop = '4px';
        }},
        { label: 'Center',      svgKey: 'imgCenter',  apply: () => {
          img.style.float = 'none'; img.style.display = 'block';
          img.style.marginLeft = 'auto'; img.style.marginRight = 'auto';
        }},
        { label: 'Float Right', svgKey: 'imgRight',   apply: () => {
          img.style.float = 'right'; img.style.marginLeft = '16px';
          img.style.marginRight = '0'; img.style.display = ''; img.style.marginTop = '4px';
        }},
      ];

      alignConfigs.forEach(cfg => {
        const alignBtn = document.createElement('button');
        alignBtn.type = 'button';
        alignBtn.className = 'rte-img-align-btn';
        alignBtn.setAttribute('data-rte-ui', '');
        alignBtn.title = cfg.label;
        alignBtn.innerHTML = SVG[cfg.svgKey] || '';
        alignBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          alignBar.querySelectorAll('.rte-img-align-btn').forEach(b => b.classList.remove('rte-active'));
          alignBtn.classList.add('rte-active');
          cfg.apply();
          positionOverlay(img);
          onChange();
        });
        alignBar.appendChild(alignBtn);
      });

      overlay.appendChild(alignBar);
      editor.style.position = 'relative';
      editor.appendChild(overlay);
      positionOverlay(img);
    }

    editor.addEventListener('click', (e) => {
      const img = e.target.closest('img');
      if (img && editor.contains(img)) {
        e.preventDefault();
        e.stopPropagation();
        attachOverlay(img);
        return;
      }
      if (!e.target.closest('[data-rte-ui]')) clearSelection();
    });

    editor.addEventListener('scroll', () => { if (activeImg && overlay) positionOverlay(activeImg); });
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => { if (activeImg && overlay) positionOverlay(activeImg); })
      : null;
    if (resizeObserver) resizeObserver.observe(editor);

    return { clearSelection };
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 10: TABLE CONTEXT MENU
     (Insert Row Above/Below, Insert Column Left/Right, Delete Table)
  ═══════════════════════════════════════════════════════════════════ */
  function createTableContextMenu(editor, onChange) {
    const ctxMenu = document.createElement('div');
    ctxMenu.className = 'rte-ctx-menu';
    ctxMenu.setAttribute('data-rte-ui', '');
    document.body.appendChild(ctxMenu);

    let activeCell = null;

    function close() {
      ctxMenu.classList.remove('rte-open');
      ctxMenu.innerHTML = '';
    }

    function buildItem(label, svgKey, onClick, danger) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'rte-ctx-item' + (danger ? ' rte-danger' : '');
      item.innerHTML = `${SVG[svgKey] || ''}<span class="rte-ctx-item-label">${escapeHtml(label)}</span>`;
      item.addEventListener('click', () => { close(); onClick(); });
      return item;
    }

    function insertRow(cell, position) {
      const table = cell.closest('table');
      const row   = cell.closest('tr');
      const isHeaderRow = row.parentElement.tagName === 'THEAD';
      const cols  = row.children.length;
      const newRow = document.createElement('tr');
      for (let i = 0; i < cols; i++) {
        const td = document.createElement('td');
        td.setAttribute('contenteditable', 'true');
        td.innerHTML = '\u00a0';
        newRow.appendChild(td);
      }
      if (isHeaderRow) {
        // Inserting adjacent to header row always lands in tbody
        const tbody = table.querySelector('tbody');
        if (position === 'above') {
          tbody.insertBefore(newRow, tbody.firstChild);
        } else {
          tbody.insertBefore(newRow, tbody.firstChild);
        }
      } else {
        if (position === 'above') row.parentElement.insertBefore(newRow, row);
        else row.parentElement.insertBefore(newRow, row.nextSibling);
      }
      onChange();
    }

    function insertColumn(cell, position) {
      const table = cell.closest('table');
      const cellIndex = [...cell.parentElement.children].indexOf(cell);
      table.querySelectorAll('tr').forEach(tr => {
        const refCell = tr.children[cellIndex];
        const isHeader = refCell.tagName === 'TH';
        const newCell = document.createElement(isHeader ? 'th' : 'td');
        newCell.setAttribute('contenteditable', 'true');
        newCell.innerHTML = isHeader ? 'Header' : '\u00a0';
        if (position === 'left') tr.insertBefore(newCell, refCell);
        else tr.insertBefore(newCell, refCell.nextSibling);
      });
      onChange();
    }

    function deleteTable(cell) {
      const table = cell.closest('table');
      if (table && table.parentNode) {
        table.parentNode.removeChild(table);
        onChange();
      }
    }

    function open(cell, x, y) {
      activeCell = cell;
      ctxMenu.innerHTML = '';
      ctxMenu.appendChild(buildItem('Insert Row Above', 'rowAbove', () => insertRow(activeCell, 'above')));
      ctxMenu.appendChild(buildItem('Insert Row Below', 'rowBelow', () => insertRow(activeCell, 'below')));
      const sep1 = document.createElement('div');
      sep1.className = 'rte-ctx-separator';
      ctxMenu.appendChild(sep1);
      ctxMenu.appendChild(buildItem('Insert Column Left',  'colLeft',  () => insertColumn(activeCell, 'left')));
      ctxMenu.appendChild(buildItem('Insert Column Right', 'colRight', () => insertColumn(activeCell, 'right')));
      const sep2 = document.createElement('div');
      sep2.className = 'rte-ctx-separator';
      ctxMenu.appendChild(sep2);
      ctxMenu.appendChild(buildItem('Delete Table', 'trash', () => deleteTable(activeCell), true));

      ctxMenu.classList.add('rte-open');
      const menuW = 200;
      let left = x, top = y;
      if (left + menuW > window.innerWidth - 12) left = window.innerWidth - menuW - 12;
      if (top + 180 > window.innerHeight - 12) top = window.innerHeight - 180 - 12;
      ctxMenu.style.left = left + 'px';
      ctxMenu.style.top  = top  + 'px';
    }

    // Right-click inside a table cell opens the context menu
    editor.addEventListener('contextmenu', (e) => {
      const cell = e.target.closest('td, th');
      if (!cell || !editor.contains(cell)) return;
      e.preventDefault();
      open(cell, e.clientX, e.clientY);
    });

    document.addEventListener('mousedown', (e) => {
      if (ctxMenu.classList.contains('rte-open') && !ctxMenu.contains(e.target)) close();
    });

    return { open, close };
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 11: SLASH COMMAND MENU ("/" — Notion-style block picker)
  ═══════════════════════════════════════════════════════════════════ */
  function createSlashCommandSystem(editor, onChange, runBlockTool) {
    const menu = document.createElement('div');
    menu.className = 'rte-slash-menu';
    menu.setAttribute('data-rte-ui', '');
    document.body.appendChild(menu);

    const COMMANDS = [
      { id: 'h1',          label: 'Heading 1',     desc: 'Big section heading',      svgKey: 'h1',          keywords: ['h1','heading1','title'] },
      { id: 'h2',          label: 'Heading 2',     desc: 'Medium section heading',   svgKey: 'h2',          keywords: ['h2','heading2','subtitle'] },
      { id: 'paragraph',   label: 'Paragraph',     desc: 'Plain text block',         svgKey: 'paragraph',   keywords: ['p','text','paragraph'] },
      { id: 'bulletList',  label: 'Bullet List',   desc: 'Unordered list of items',  svgKey: 'bulletList',  keywords: ['ul','bullet','list'] },
      { id: 'orderedList', label: 'Numbered List', desc: 'Ordered list of items',    svgKey: 'orderedList', keywords: ['ol','number','ordered'] },
      { id: 'blockquote',  label: 'Quote',         desc: 'Blockquote callout',       svgKey: 'blockquote',  keywords: ['quote','blockquote'] },
      { id: 'codeBlock',   label: 'Code Block',    desc: 'Monospace code snippet',   svgKey: 'codeBlock',   keywords: ['code','pre','snippet'] },
      { id: 'table',       label: 'Table',         desc: 'Insert a 3×3 table',       svgKey: 'table',       keywords: ['table','grid'] },
      { id: 'image',       label: 'Image',         desc: 'Embed an image by URL',    svgKey: 'image',       keywords: ['image','img','picture'] },
      { id: 'hr',          label: 'Divider',       desc: 'Horizontal rule',          svgKey: 'hr',          keywords: ['hr','divider','rule'] },
      { id: 'link',        label: 'Link',          desc: 'Insert a hyperlink',       svgKey: 'link',        keywords: ['link','url','a'] },
    ];

    let open = false;
    let anchorNode  = null;   // the text node containing "/"
    let slashIndex  = -1;     // offset of "/" within anchorNode
    let filterText  = '';
    let selectedIdx = 0;
    let filtered    = COMMANDS;

    function render() {
      menu.innerHTML = '';
      const header = document.createElement('div');
      header.className = 'rte-slash-header';
      header.textContent = 'Insert Block';
      menu.appendChild(header);

      const list = document.createElement('div');
      list.className = 'rte-slash-list';

      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'rte-slash-empty';
        empty.textContent = `No blocks match "${filterText}"`;
        list.appendChild(empty);
      } else {
        filtered.forEach((cmd, i) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'rte-slash-item' + (i === selectedIdx ? ' rte-selected' : '');
          item.innerHTML = `
            <span class="rte-slash-item-icon">${SVG[cmd.svgKey] || ''}</span>
            <span class="rte-slash-item-text">
              <span class="rte-slash-item-label">${escapeHtml(cmd.label)}</span>
              <span class="rte-slash-item-desc">${escapeHtml(cmd.desc)}</span>
            </span>`;
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selectCommand(cmd);
          });
          item.addEventListener('mousemove', () => {
            selectedIdx = i;
            updateSelectedClasses();
          });
          list.appendChild(item);
        });
      }
      menu.appendChild(list);
    }

    function updateSelectedClasses() {
      [...menu.querySelectorAll('.rte-slash-item')].forEach((el, i) => {
        el.classList.toggle('rte-selected', i === selectedIdx);
      });
    }

    function position() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getClientRects()[0] || range.getBoundingClientRect();
      const menuW = 260, menuH = 320;
      let left = rect.left;
      let top  = rect.bottom + 6;
      if (left + menuW > window.innerWidth - 12) left = window.innerWidth - menuW - 12;
      if (top + menuH > window.innerHeight - 12) top = rect.top - menuH - 6;
      menu.style.left = Math.max(12, left) + 'px';
      menu.style.top  = Math.max(12, top)  + 'px';
    }

    function openMenu(node, idx) {
      anchorNode  = node;
      slashIndex  = idx;
      filterText  = '';
      filtered    = COMMANDS;
      selectedIdx = 0;
      open = true;
      menu.classList.add('rte-open');
      render();
      position();
    }

    function closeMenu() {
      open = false;
      anchorNode = null;
      slashIndex = -1;
      filterText = '';
      menu.classList.remove('rte-open');
    }

    function updateFilter(text) {
      filterText = text;
      const lower = text.toLowerCase();
      filtered = !lower
        ? COMMANDS
        : COMMANDS.filter(c =>
            c.label.toLowerCase().includes(lower) ||
            c.keywords.some(k => k.includes(lower))
          );
      selectedIdx = 0;
      render();
      position();
    }

    function removeSlashTrigger() {
      // Remove the "/" plus any typed filter text from the DOM
      if (!anchorNode || !anchorNode.isConnected) return;
      const text = anchorNode.textContent || '';
      const before = text.slice(0, slashIndex);
      const sel = window.getSelection();
      const caretOffset = sel && sel.rangeCount ? sel.getRangeAt(0).startOffset : text.length;
      const after = text.slice(caretOffset);
      anchorNode.textContent = before + after;
      const range = document.createRange();
      range.setStart(anchorNode, before.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function selectCommand(cmd) {
      removeSlashTrigger();
      closeMenu();
      runBlockTool(cmd.id);
      onChange();
    }

    // Track typing inside the editor to detect "/" triggers and live filtering
    editor.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = Math.min(selectedIdx + 1, Math.max(filtered.length - 1, 0));
        updateSelectedClasses();
        scrollSelectedIntoView();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = Math.max(selectedIdx - 1, 0);
        updateSelectedClasses();
        scrollSelectedIntoView();
      } else if (e.key === 'Enter') {
        if (filtered[selectedIdx]) {
          e.preventDefault();
          selectCommand(filtered[selectedIdx]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        removeSlashTrigger();
        closeMenu();
      } else if (e.key === 'Backspace') {
        // Let it through; input handler will re-evaluate filter text
      }
    });

    function scrollSelectedIntoView() {
      const el = menu.querySelector('.rte-slash-item.rte-selected');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    editor.addEventListener('input', () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const node  = range.startContainer;

      if (!open) {
        // Detect a fresh "/" trigger at the start of a block, or after whitespace
        if (node.nodeType === 3) {
          const text = node.textContent || '';
          const offset = range.startOffset;
          if (offset > 0 && text[offset - 1] === '/') {
            const charBefore = text[offset - 2];
            const atLineStart = offset === 1 || charBefore === undefined || /\s/.test(charBefore);
            if (atLineStart) openMenu(node, offset - 1);
          }
        }
        return;
      }

      // Menu is open — recompute filter text from anchorNode to caret
      if (!anchorNode || !anchorNode.isConnected || node !== anchorNode) {
        closeMenu();
        return;
      }
      const text = anchorNode.textContent || '';
      const caretOffset = range.startOffset;
      if (caretOffset <= slashIndex || text[slashIndex] !== '/') {
        closeMenu();
        return;
      }
      const newFilter = text.slice(slashIndex + 1, caretOffset);
      if (/\s/.test(newFilter)) { closeMenu(); return; }
      updateFilter(newFilter);
    });

    document.addEventListener('mousedown', (e) => {
      if (open && !menu.contains(e.target)) closeMenu();
    });

    return { closeMenu, isOpen: () => open };
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 12: INLINE MARKDOWN AUTOCOMPLETE
     (#, ##, *, -, 1., `code` — triggered on spacebar / backtick)
  ═══════════════════════════════════════════════════════════════════ */
  function createMarkdownAutocomplete(editor, onChange) {

    function getCurrentBlockAndText() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      const block = closestBlock(range.startContainer, editor);
      if (!block) return null;
      return { sel, range, block };
    }

    // Converts "# " / "## " at line start into H1 / H2
    function tryHeadingShorthand(block, sel) {
      const text = block.textContent || '';
      const match = text.match(/^(#{1,2})\s$/);
      if (!match) return false;
      const level = match[1].length === 1 ? 'H1' : 'H2';
      const newEl = document.createElement(level);
      newEl.innerHTML = '<br>';
      block.replaceWith(newEl);
      placeCaretAtStart(newEl);
      return true;
    }

    // Converts "* " / "- " at line start into a bullet list item
    function tryBulletShorthand(block) {
      const text = block.textContent || '';
      if (!/^[*-]\s$/.test(text)) return false;
      const ul = document.createElement('ul');
      const li = document.createElement('li');
      li.innerHTML = '<br>';
      ul.appendChild(li);
      block.replaceWith(ul);
      placeCaretAtStart(li);
      return true;
    }

    // Converts "1. " at line start into an ordered list item
    function tryOrderedShorthand(block) {
      const text = block.textContent || '';
      if (!/^1\.\s$/.test(text)) return false;
      const ol = document.createElement('ol');
      const li = document.createElement('li');
      li.innerHTML = '<br>';
      ol.appendChild(li);
      block.replaceWith(ol);
      placeCaretAtStart(li);
      return true;
    }

    // Converts `code` immediately preceding the caret into <code>code</code>
    function tryInlineCodeShorthand(block, range) {
      if (range.startContainer.nodeType !== 3) return false;
      const textNode = range.startContainer;
      const text = textNode.textContent || '';
      const caret = range.startOffset;
      const before = text.slice(0, caret);
      const m = before.match(/`([^`]+)`$/);
      if (!m) return false;

      const matchStart = caret - m[0].length;
      const codeEl = document.createElement('code');
      codeEl.textContent = m[1];

      const afterText = text.slice(caret);
      const beforeText = text.slice(0, matchStart);

      const parent = textNode.parentNode;
      const frag = document.createDocumentFragment();
      if (beforeText) frag.appendChild(document.createTextNode(beforeText));
      frag.appendChild(codeEl);
      const trailingSpace = document.createTextNode('\u00a0' + afterText);
      frag.appendChild(trailingSpace);

      parent.replaceChild(frag, textNode);

      const sel = window.getSelection();
      const newRange = document.createRange();
      newRange.setStart(trailingSpace, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      return true;
    }

    editor.addEventListener('keydown', (e) => {
      if (e.key !== ' ') return;
      const ctx = getCurrentBlockAndText();
      if (!ctx) return;
      const { block, range } = ctx;

      // Block-level shorthands only apply at true line start (block holds only the trigger text)
      if (block && (tryHeadingShorthand(block, ctx.sel) ||
                    tryBulletShorthand(block) ||
                    tryOrderedShorthand(block))) {
        e.preventDefault();
        onChange();
        return;
      }

      // Inline code shorthand can trigger anywhere in a line
      if (tryInlineCodeShorthand(block, range)) {
        e.preventDefault();
        onChange();
      }
    });
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 13: SMART CARET ESCAPE
     Fixes the classic contentEditable trap: pressing Enter twice inside
     a <blockquote> or at the end of a <pre><code> block should escape
     the block and drop a clean empty <p> below it.
  ═══════════════════════════════════════════════════════════════════ */
  function createCaretEscapeHandler(editor, onChange) {
    let lastEnterInEmptyLine = false;

    function isLastLineEmpty(block, range) {
      // Heuristic: caret is at the end of the block and the immediately
      // preceding content on this "line" is empty (just trailing <br> or whitespace)
      const text = block.textContent || '';
      return text.trim().length === 0 ||
             /\n\s*$/.test(text) ||
             (range.startContainer.nodeType === 3 && !range.startContainer.textContent.slice(range.startOffset).trim());
    }

    editor.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') { lastEnterInEmptyLine = false; return; }

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);

      const blockquote = range.startContainer.nodeType === 3
        ? range.startContainer.parentElement?.closest('blockquote')
        : range.startContainer.closest?.('blockquote');

      const preBlock = range.startContainer.nodeType === 3
        ? range.startContainer.parentElement?.closest('pre')
        : range.startContainer.closest?.('pre');

      const trapBlock = blockquote || preBlock;
      if (!trapBlock || !editor.contains(trapBlock)) { lastEnterInEmptyLine = false; return; }

      // Determine if caret sits at the very end of the trap block with no
      // trailing text on the current line (i.e. user just hit Enter once already)
      const atEnd = isCaretAtBlockEnd(trapBlock, range);

      if (atEnd && lastEnterInEmptyLine) {
        // Second consecutive Enter on an empty trailing line — escape the block
        e.preventDefault();
        const newP = document.createElement('p');
        newP.innerHTML = '<br>';
        trapBlock.insertAdjacentElement('afterend', newP);

        // Remove the now-superfluous empty trailing line inside the trap block
        trimTrailingEmptyLine(trapBlock);

        placeCaretAtStart(newP);
        lastEnterInEmptyLine = false;
        onChange();
        return;
      }

      if (atEnd) {
        // First Enter on what appears to be an empty trailing line: let browser
        // insert the break as usual, but arm the escape for the next Enter.
        lastEnterInEmptyLine = true;
      } else {
        lastEnterInEmptyLine = false;
      }
    });

    function isCaretAtBlockEnd(block, range) {
      const r = range.cloneRange();
      r.selectNodeContents(block);
      r.setStart(range.endContainer, range.endOffset);
      return r.toString().trim().length === 0;
    }

    function trimTrailingEmptyLine(block) {
      // Remove a single trailing empty text node / <br> that represents
      // the now-redundant blank line left behind after escaping.
      let last = block.lastChild;
      if (last && last.nodeType === 3 && !last.textContent.trim()) {
        block.removeChild(last);
        last = block.lastChild;
      }
      if (last && last.tagName === 'BR') {
        block.removeChild(last);
      }
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 14: JSON HYDRATION & EXPORT ENGINE
     getJson() parses the editor DOM into clean block objects.
     setJson(data) regenerates semantic HTML from those block objects.
  ═══════════════════════════════════════════════════════════════════ */
  function domToJsonBlocks(editorRoot) {
    const blocks = [];

    [...editorRoot.children].forEach(node => {
      const tag = node.tagName;

      if (tag === 'P') {
        blocks.push({ type: 'paragraph', content: node.innerHTML.trim() });
      } else if (tag === 'H1') {
        blocks.push({ type: 'heading', level: 1, content: node.innerHTML.trim() });
      } else if (tag === 'H2') {
        blocks.push({ type: 'heading', level: 2, content: node.innerHTML.trim() });
      } else if (tag === 'H3') {
        blocks.push({ type: 'heading', level: 3, content: node.innerHTML.trim() });
      } else if (tag === 'UL' || tag === 'OL') {
        blocks.push({
          type: tag === 'UL' ? 'bulletList' : 'orderedList',
          items: [...node.children].map(li => li.innerHTML.trim()),
        });
      } else if (tag === 'BLOCKQUOTE') {
        blocks.push({ type: 'blockquote', content: node.innerHTML.trim() });
      } else if (tag === 'PRE') {
        const codeEl = node.querySelector('code');
        blocks.push({ type: 'codeBlock', content: (codeEl ? codeEl.textContent : node.textContent) || '' });
      } else if (tag === 'IMG') {
        blocks.push({
          type: 'image',
          src: node.getAttribute('src') || '',
          alt: node.getAttribute('alt') || '',
          style: node.getAttribute('style') || '',
        });
      } else if (tag === 'HR') {
        blocks.push({ type: 'divider' });
      } else if (tag === 'TABLE') {
        const rows = [];
        let hasHeader = false;
        const thead = node.querySelector('thead');
        if (thead) {
          hasHeader = true;
          rows.push([...thead.querySelectorAll('th,td')].map(c => c.innerHTML.trim()));
        }
        const tbody = node.querySelector('tbody') || node;
        [...tbody.querySelectorAll('tr')].forEach(tr => {
          rows.push([...tr.children].map(c => c.innerHTML.trim()));
        });
        blocks.push({ type: 'table', hasHeader, rows });
      } else if (tag === 'DIV') {
        // Defensive: treat stray DIVs as paragraphs of their text content
        if (node.textContent.trim()) {
          blocks.push({ type: 'paragraph', content: node.innerHTML.trim() });
        }
      }
      // Unknown / unsupported tags are intentionally skipped to keep JSON clean
    });

    return blocks;
  }

  function jsonBlocksToHtml(blocks) {
    if (!Array.isArray(blocks)) return '';
    const parts = [];

    blocks.forEach(block => {
      if (!block || typeof block !== 'object') return;
      switch (block.type) {
        case 'paragraph':
          parts.push(`<p>${block.content || '<br>'}</p>`);
          break;
        case 'heading': {
          const level = [1, 2, 3].includes(block.level) ? block.level : 1;
          parts.push(`<h${level}>${block.content || ''}</h${level}>`);
          break;
        }
        case 'bulletList':
          parts.push(`<ul>${(block.items || []).map(i => `<li>${i}</li>`).join('')}</ul>`);
          break;
        case 'orderedList':
          parts.push(`<ol>${(block.items || []).map(i => `<li>${i}</li>`).join('')}</ol>`);
          break;
        case 'blockquote':
          parts.push(`<blockquote>${block.content || ''}</blockquote>`);
          break;
        case 'codeBlock':
          parts.push(`<pre><code>${escapeHtml(block.content || '')}</code></pre>`);
          break;
        case 'image': {
          const style = block.style || 'max-width:100%;height:auto;display:block;margin:0.8em 0;';
          parts.push(`<img src="${escapeAttr(block.src || '')}" alt="${escapeAttr(block.alt || '')}" style="${escapeAttr(style)}">`);
          break;
        }
        case 'divider':
          parts.push('<hr>');
          break;
        case 'table': {
          const rows = Array.isArray(block.rows) ? block.rows : [];
          let html = '<table>';
          if (block.hasHeader && rows.length) {
            html += `<thead><tr>${rows[0].map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
            html += '<tbody>';
            rows.slice(1).forEach(row => {
              html += `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
            });
            html += '</tbody>';
          } else {
            html += '<tbody>';
            rows.forEach(row => {
              html += `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
            });
            html += '</tbody>';
          }
          html += '</table>';
          parts.push(html);
          break;
        }
        default:
          // Unknown block types are skipped silently to avoid corrupting output
          break;
      }
    });

    return parts.join('');
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 15: TOOLBAR FACTORY
     Includes the persistent No-Format Paste toggle (default OFF).
  ═══════════════════════════════════════════════════════════════════ */
  function createToolbar(editor, onChange, options, popoverSystem, pasteState) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Formatting toolbar');

    const grp = (...children) => {
      const g = document.createElement('div');
      g.className = 'rte-toolbar-group';
      children.forEach(c => g.appendChild(c));
      return g;
    };
    const sep = () => {
      const s = document.createElement('div');
      s.className = 'rte-separator';
      s.setAttribute('role', 'separator');
      return s;
    };

    /* ── Format select ── */
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Text style');
    [['Paragraph', 'P'], ['Heading 1', 'H1'], ['Heading 2', 'H2'], ['Heading 3', 'H3']]
      .forEach(([lbl, val]) => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = lbl;
        select.appendChild(opt);
      });

    /* ── Inline format buttons ── */
    const btnBold      = makeBtn('Bold (Ctrl+B)', 'bold', { cmd: 'bold' });
    const btnItalic    = makeBtn('Italic (Ctrl+I)', 'italic', { cmd: 'italic' });
    const btnUnderline = makeBtn('Underline (Ctrl+U)', 'underline', { cmd: 'underline' });
    const btnStrike    = makeBtn('Strikethrough', 'strike', { cmd: 'strikeThrough' });

    /* ── Color palette dropdowns ── */
    const textColorWrap = createPaletteDropdown('text', (color) => {
      editor.focus();
      if (color === 'transparent') document.execCommand('removeFormat', false, null);
      else document.execCommand('foreColor', false, color);
      onChange();
    });
    const bgColorWrap = createPaletteDropdown('bg', (color) => {
      editor.focus();
      document.execCommand('hiliteColor', false, color === 'transparent' ? 'transparent' : color);
      onChange();
    });

    /* ── Alignment ── */
    const btnAlignL = makeBtn('Align Left',   'alignLeft',   { cmd: 'justifyLeft' });
    const btnAlignC = makeBtn('Align Center', 'alignCenter', { cmd: 'justifyCenter' });
    const btnAlignR = makeBtn('Align Right',  'alignRight',  { cmd: 'justifyRight' });
    const btnAlignJ = makeBtn('Justify',      'alignJust',   { cmd: 'justifyFull' });

    /* ── Lists ── */
    const btnUL = makeBtn('Bullet List',  'ul', { cmd: 'insertUnorderedList' });
    const btnOL = makeBtn('Ordered List', 'ol', { cmd: 'insertOrderedList' });

    /* ── Block elements ── */
    const btnBlockquote = makeBtn('Blockquote', 'blockquote', { action: 'blockquote' });
    const btnCodeBlock  = makeBtn('Code Block', 'codeBlock',  { action: 'codeBlock' });
    const btnHR         = makeBtn('Horizontal Rule', 'hr',    { action: 'hr' });

    /* ── Table picker ── */
    const tablePicker = createTablePicker((rows, cols) => {
      editor.focus();
      document.execCommand('insertHTML', false, buildTableHtml(rows, cols));
      setTimeout(() => {
        editor.querySelectorAll('table td, table th').forEach(cell => cell.setAttribute('contenteditable', 'true'));
        onChange();
      }, 0);
    });

    /* ── Link / Image ── */
    const btnLink   = makeBtn('Insert Link (Ctrl+K)', 'link',  { action: 'link' });
    const btnUnlink = makeBtn('Remove Link', 'unlink', { cmd: 'unlink' });
    const btnImage  = makeBtn('Insert Image', 'image', { action: 'image' });

    /* ── No-Format Paste toggle (default OFF) ── */
    const btnPasteToggle = document.createElement('button');
    btnPasteToggle.type = 'button';
    btnPasteToggle.className = 'rte-paste-toggle';
    btnPasteToggle.setAttribute('data-tip', 'Toggle No-Format Paste');
    btnPasteToggle.setAttribute('aria-label', 'Toggle No-Format Paste');
    btnPasteToggle.setAttribute('aria-pressed', 'false');
    btnPasteToggle.innerHTML = `${SVG.pasteNoFormat}<span>TXT</span>`;
    btnPasteToggle.addEventListener('click', () => {
      pasteState.noFormat = !pasteState.noFormat;
      btnPasteToggle.classList.toggle('rte-active', pasteState.noFormat);
      btnPasteToggle.setAttribute('aria-pressed', String(pasteState.noFormat));
      editor.focus();
    });

    /* ── Clear Formatting ── */
    const btnClearFormat = makeBtn('Clear Formatting', 'clearFormat', { action: 'clearFormat' });

    /* ── Undo / Redo ── */
    const btnUndo = makeBtn('Undo (Ctrl+Z)', 'undo', { cmd: 'undo' });
    const btnRedo = makeBtn('Redo (Ctrl+Y)', 'redo', { cmd: 'redo' });

    /* ── Assemble ── */
    toolbar.appendChild(grp(select));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnBold, btnItalic, btnUnderline, btnStrike));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(textColorWrap, bgColorWrap));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnAlignL, btnAlignC, btnAlignR, btnAlignJ));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnUL, btnOL));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnBlockquote, btnCodeBlock, btnHR));
    toolbar.appendChild(sep());
    toolbar.appendChild(tablePicker);
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnLink, btnUnlink, btnImage));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnClearFormat));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnPasteToggle));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnUndo, btnRedo));

    /* ── Prevent blur on toolbar click ── */
    toolbar.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.rte-palette-btn, .rte-palette-dropdown, .rte-table-wrap, .rte-paste-toggle')) {
        e.preventDefault();
      }
    });

    /* ── Main click dispatcher ── */
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cmd], button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const cmd    = btn.dataset.cmd;
      editor.focus();

      if (action === 'link') {
        const sel = window.getSelection();
        const existingLink = sel && sel.rangeCount > 0
          ? sel.getRangeAt(0).commonAncestorContainer.parentElement?.closest('a')
          : null;
        const existingHref = existingLink ? existingLink.getAttribute('href') : '';
        const existingText = sel && sel.toString() ? sel.toString() : '';

        popoverSystem.open({
          title: 'Insert Link',
          submitLabel: 'Insert',
          fields: [
            { id: 'url', label: 'URL', placeholder: 'https://example.com', required: true,
              value: existingHref,
              validate: (v) => /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v) },
            { id: 'text', label: 'Link Text (optional)',
              placeholder: existingText || 'Leave blank to use selection',
              required: false, value: existingText },
          ],
          onSubmit: ({ url, text }) => {
            popoverSystem.restoreSelection();
            const sel2 = window.getSelection();
            const isEmpty = !sel2 || !sel2.toString().trim();
            if (isEmpty) {
              const label = text || url;
              document.execCommand('insertHTML', false,
                `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
            } else {
              document.execCommand('createLink', false, url);
            }
            onChange();
          },
        }, btn);

      } else if (action === 'image') {
        popoverSystem.open({
          title: 'Insert Image',
          submitLabel: 'Insert',
          fields: [
            { id: 'src', label: 'Image URL', placeholder: 'https://example.com/image.jpg',
              required: true, validate: (v) => /^https?:\/\//i.test(v) },
            { id: 'alt', label: 'Alt Text (for accessibility)', placeholder: 'Describe the image...', required: false },
          ],
          onSubmit: ({ src, alt }) => {
            popoverSystem.restoreSelection();
            const altText = alt || 'Image';
            document.execCommand('insertHTML', false,
              `<img src="${escapeAttr(src)}" alt="${escapeAttr(altText)}" style="max-width:100%;height:auto;display:block;margin:0.8em 0;">`);
            onChange();
          },
        }, btn);

      } else if (action === 'blockquote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
        onChange();
      } else if (action === 'codeBlock') {
        const sel = window.getSelection();
        const text = sel && sel.rangeCount > 0 ? sel.toString() : '';
        document.execCommand('insertHTML', false,
          `<pre><code>${escapeHtml(text) || 'Enter code here'}</code></pre><p><br></p>`);
        onChange();
      } else if (action === 'clearFormat') {
          const sel = window.getSelection();
          const hasSelection = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
          if (hasSelection) {
            unwrapFullySelectedBlockquote(editor);
            document.execCommand('removeFormat', false, null);
            document.execCommand('hiliteColor', false, 'transparent');
            onChange();
          }
      }
        // No selection: intentionally do nothing
      } else if (action === 'hr') {
        document.execCommand('insertHorizontalRule', false, null);
        onChange();
      } else if (cmd) {
        document.execCommand(cmd, false, null);
        onChange();
      }

      requestAnimationFrame(updateActiveStates);
    });

    /* ── Select handler ── */
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('change', () => {
      editor.focus();
      document.execCommand('formatBlock', false, select.value);
      onChange();
    });

    /* ── Active states ── */
    function updateActiveStates() {
      const cmdMap = [
        [btnBold, 'bold'], [btnItalic, 'italic'], [btnUnderline, 'underline'], [btnStrike, 'strikeThrough'],
        [btnAlignL, 'justifyLeft'], [btnAlignC, 'justifyCenter'], [btnAlignR, 'justifyRight'], [btnAlignJ, 'justifyFull'],
        [btnUL, 'insertUnorderedList'], [btnOL, 'insertOrderedList'],
      ];
      cmdMap.forEach(([el, cmd]) => {
        try { el.classList.toggle('rte-active', document.queryCommandState(cmd)); } catch (e) {}
      });
    }

    editor.addEventListener('keyup',           updateActiveStates);
    editor.addEventListener('mouseup',         updateActiveStates);
    editor.addEventListener('selectionchange', updateActiveStates);

    return { toolbar, select };
  }

  function buildTableHtml(rows, cols) {
    const tHead = `<thead><tr>${Array.from({length: cols}, (_, i) =>
      `<th contenteditable="false">Header ${i + 1}</th>`).join('')}</tr></thead>`;
    const tBody = `<tbody>${Array.from({length: Math.max(rows - 1, 1)}, () =>
      `<tr>${Array.from({length: cols}, () => `<td contenteditable="false">\u00a0</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${tHead}${tBody}</table><p><br></p>`;
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 16: BLOCK TOOL DISPATCHER
     Shared execution path used by both the toolbar and the slash menu,
     so "/table" and clicking the table button behave identically.
  ═══════════════════════════════════════════════════════════════════ */
  function makeBlockToolRunner(editor, onChange, popoverSystem) {
    return function runBlockTool(id) {
      editor.focus();
      switch (id) {
        case 'h1':
          document.execCommand('formatBlock', false, 'H1');
          break;
        case 'h2':
          document.execCommand('formatBlock', false, 'H2');
          break;
        case 'paragraph':
          document.execCommand('formatBlock', false, 'P');
          break;
        case 'bulletList':
          document.execCommand('insertUnorderedList', false, null);
          break;
        case 'orderedList':
          document.execCommand('insertOrderedList', false, null);
          break;
        case 'blockquote':
          document.execCommand('formatBlock', false, 'BLOCKQUOTE');
          break;
        case 'codeBlock':
          document.execCommand('insertHTML', false, '<pre><code>Enter code here</code></pre><p><br></p>');
          break;
        case 'table':
          document.execCommand('insertHTML', false, buildTableHtml(3, 3));
          setTimeout(() => {
            editor.querySelectorAll('table td, table th').forEach(cell => cell.setAttribute('contenteditable', 'true'));
            onChange();
          }, 0);
          break;
        case 'hr':
          document.execCommand('insertHorizontalRule', false, null);
          break;
        case 'image':
          popoverSystem.open({
            title: 'Insert Image',
            submitLabel: 'Insert',
            fields: [
              { id: 'src', label: 'Image URL', placeholder: 'https://example.com/image.jpg',
                required: true, validate: (v) => /^https?:\/\//i.test(v) },
              { id: 'alt', label: 'Alt Text (for accessibility)', placeholder: 'Describe the image...', required: false },
            ],
            onSubmit: ({ src, alt }) => {
              popoverSystem.restoreSelection();
              document.execCommand('insertHTML', false,
                `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt || 'Image')}" style="max-width:100%;height:auto;display:block;margin:0.8em 0;">`);
              onChange();
            },
          }, editor);
          break;
        case 'link':
          popoverSystem.open({
            title: 'Insert Link',
            submitLabel: 'Insert',
            fields: [
              { id: 'url', label: 'URL', placeholder: 'https://example.com', required: true,
                validate: (v) => /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v) },
              { id: 'text', label: 'Link Text', placeholder: 'Link text', required: false },
            ],
            onSubmit: ({ url, text }) => {
              popoverSystem.restoreSelection();
              document.execCommand('insertHTML', false,
                `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text || url)}</a>`);
              onChange();
            },
          }, editor);
          break;
        default:
          break;
      }
    };
  }


  /* ═══════════════════════════════════════════════════════════════════
     SECTION 17: MOUNT
  ═══════════════════════════════════════════════════════════════════ */
  function mount(options = {}) {
    ensureStyles();

    const input = document.getElementById(options.inputId);
    if (!input) { console.warn(`RichTextEditor: No element found with id "${options.inputId}"`); return null; }

    /* Wrapper */
    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrap';

    /* Editor region */
    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-label', options.label || 'Rich text editor');
    editor.setAttribute('spellcheck', 'true');
    if (options.placeholder) editor.dataset.placeholder = options.placeholder;

    editor.innerHTML = sanitizeRichTextHtml(input.value || '');

    const maxLength = options.maxLength || null;

    /* Pending Sync's mutable state for the No-Format Paste toggle.
       Defaults to OFF per spec, can be pre-seeded via options.noFormatPaste */
    const pasteState = { noFormat: !!options.noFormatPaste };

    /* Sync hidden input — always producing clean, semantic, web-ready HTML */
    const sync = () => {
      const clean = sanitizeRichTextHtml(editor.innerHTML);
      input.value = clean;
      if (options.onChange) options.onChange(clean, stripHtml(clean));
      updatePlaceholder();
      updateCharCount();
    };

    const updatePlaceholder = () => {
      if (options.placeholder) {
        const empty = !editor.textContent.trim() && !editor.querySelector('img, table');
        editor.classList.toggle('rte-placeholder', empty);
      }
    };

    /* Footer */
    const footer = document.createElement('div');
    footer.className = 'rte-footer';
    const charCount = document.createElement('span');
    charCount.className = 'rte-char-count';
    footer.appendChild(charCount);

    const updateCharCount = () => {
      if (!maxLength) { charCount.textContent = ''; return; }
      const len = stripHtml(editor.innerHTML).length;
      charCount.textContent = `${len} / ${maxLength}`;
      charCount.classList.toggle('rte-char-warn', len > maxLength * 0.85 && len <= maxLength);
      charCount.classList.toggle('rte-char-over',  len > maxLength);
    };

    /* Popover system (shared by toolbar, slash menu, and block-tool runner) */
    const popoverSystem = createPopoverSystem(wrapper);

    /* Block tool dispatcher — shared between toolbar buttons and slash commands */
    const runBlockTool = makeBlockToolRunner(editor, sync, popoverSystem);

    /* Toolbar (includes the No-Format Paste toggle) */
    const { toolbar } = createToolbar(editor, sync, options, popoverSystem, pasteState);

    /* Image resize & alignment system */
    const imgResizeSystem = createImageResizeSystem(editor, sync);

    /* Table right-click context menu */
    createTableContextMenu(editor, sync);

    /* Slash command menu */
    createSlashCommandSystem(editor, sync, runBlockTool);

    /* Inline markdown autocomplete (#, ##, *, -, 1., `code`) */
    createMarkdownAutocomplete(editor, sync);

    /* Smart caret escape for blockquote / code block traps */
    createCaretEscapeHandler(editor, sync);

    /* DOM assembly */
    input.style.display = 'none';
    input.insertAdjacentElement('beforebegin', wrapper);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(editor);
    if (maxLength) wrapper.appendChild(footer);

    /* Core input sync */
    editor.addEventListener('input', sync);

    /* ── Paste handling: respects the No-Format Paste toggle ──
       OFF (default): normal rich-text paste behavior is preserved.
       ON: forcefully strips all HTML tags, styles, and attributes,
           inserting absolute plain text only. */
    editor.addEventListener('paste', (e) => {
      if (pasteState.noFormat) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      } else if (options.plainPaste) {
        // Backward-compatible static option from v3, independent of the toggle
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      }
      requestAnimationFrame(sync);
    });

    /* ── Keyboard shortcuts ── */
    editor.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        popoverSystem.saveSelection();
        runBlockTool('link');
        return;
      }
      if (['b', 'i', 'u', 'z', 'y'].includes(key)) {
        requestAnimationFrame(sync);
      }
    });

    /* ── Tab navigation inside table cells ── */
    editor.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const cell = e.target.closest('td, th');
      if (!cell) return;
      e.preventDefault();
      const table = cell.closest('table');
      const cells = [...table.querySelectorAll('td, th')];
      const idx   = cells.indexOf(cell);
      if (e.shiftKey) {
        if (idx > 0) cells[idx - 1].focus();
      } else if (idx < cells.length - 1) {
        cells[idx + 1].focus();
      } else {
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const cols = cell.closest('tr').children.length;
          const newRow = document.createElement('tr');
          for (let i = 0; i < cols; i++) {
            const td = document.createElement('td');
            td.setAttribute('contenteditable', 'true');
            td.innerHTML = '\u00a0';
            newRow.appendChild(td);
          }
          tbody.appendChild(newRow);
          newRow.querySelector('td').focus();
          sync();
        }
      }
    });

    // Initial state
    updatePlaceholder();
    updateCharCount();

    return {
      /* HTML API */
      getHtml:    () => sanitizeRichTextHtml(editor.innerHTML),
      getText:    () => stripHtml(editor.innerHTML),
      setHtml:    (html) => { editor.innerHTML = sanitizeRichTextHtml(html || ''); sync(); },

      /* JSON API */
      getJson:    () => domToJsonBlocks(editor),
      setJson:    (data) => {
        const html = jsonBlocksToHtml(Array.isArray(data) ? data : []);
        editor.innerHTML = sanitizeRichTextHtml(html);
        editor.querySelectorAll('table td, table th').forEach(cell => cell.setAttribute('contenteditable', 'true'));
        sync();
      },

      /* No-Format Paste toggle API (programmatic control) */
      getNoFormatPaste: () => pasteState.noFormat,
      setNoFormatPaste: (val) => {
        pasteState.noFormat = !!val;
        const btn = toolbar.querySelector('.rte-paste-toggle');
        if (btn) {
          btn.classList.toggle('rte-active', pasteState.noFormat);
          btn.setAttribute('aria-pressed', String(pasteState.noFormat));
        }
      },

      /* Lifecycle / utility */
      focus:      () => editor.focus(),
      clear:      () => { editor.innerHTML = ''; imgResizeSystem.clearSelection(); sync(); },
      getElement: () => editor,
      destroy:    () => {
        imgResizeSystem.clearSelection();
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        input.style.display = '';
        document.querySelectorAll('.rte-popover, .rte-slash-menu, .rte-ctx-menu').forEach(p => p.remove());
      },
    };
  }


  /* ═══════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════ */
  window.RichTextEditor = {
    mount,
    sanitizeRichTextHtml,
    stripHtml,
    domToJsonBlocks,
    jsonBlocksToHtml,
  };

})();
