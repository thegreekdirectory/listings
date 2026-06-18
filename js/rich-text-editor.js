(function () {

  /* ─────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────── */
  function ensureStyles() {
    if (document.getElementById('rte-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'rte-shared-styles';
    style.textContent = `
      :root {
        --rte-bg: #ffffff;
        --rte-border: #e2e8f0;
        --rte-toolbar-bg: #f8fafc;
        --rte-toolbar-border: #e2e8f0;
        --rte-btn-bg: transparent;
        --rte-btn-hover-bg: #e8edf5;
        --rte-btn-active-bg: #dde4f0;
        --rte-btn-active-color: #2563eb;
        --rte-btn-color: #374151;
        --rte-btn-border: #d1d5db;
        --rte-radius: 0.625rem;
        --rte-editor-min-height: 160px;
        --rte-focus-ring: 0 0 0 3px rgba(37,99,235,0.15);
        --rte-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
        --rte-divider: #e2e8f0;
        --rte-blockquote-border: #2563eb;
        --rte-blockquote-bg: #f0f4ff;
        --rte-code-bg: #1e293b;
        --rte-code-color: #e2e8f0;
        --rte-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --rte-transition: 0.13s ease;
        --rte-tooltip-bg: #1e293b;
        --rte-tooltip-color: #f8fafc;
        --rte-select-bg: #ffffff;
        --rte-separator-color: #d1d5db;
      }

      .rte-wrap {
        border: 1px solid var(--rte-border);
        border-radius: var(--rte-radius);
        background: var(--rte-bg);
        box-shadow: var(--rte-shadow);
        font-family: var(--rte-font);
        overflow: visible;
        position: relative;
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
        padding: 6px 8px;
        border-bottom: 1px solid var(--rte-toolbar-border);
        background: var(--rte-toolbar-bg);
        border-radius: var(--rte-radius) var(--rte-radius) 0 0;
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(8px);
      }

      .rte-toolbar-group {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .rte-separator {
        width: 1px;
        height: 20px;
        background: var(--rte-separator-color);
        margin: 0 4px;
        flex-shrink: 0;
      }

      /* ── BUTTONS ── */
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
        transition: background var(--rte-transition), border-color var(--rte-transition), color var(--rte-transition), transform 0.08s;
        outline: none;
        flex-shrink: 0;
      }

      .rte-toolbar button:hover {
        background: var(--rte-btn-hover-bg);
        border-color: var(--rte-btn-border);
      }

      .rte-toolbar button:active {
        transform: scale(0.92);
        background: var(--rte-btn-active-bg);
      }

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
      }

      .rte-toolbar button svg.rte-filled {
        fill: currentColor;
        stroke: none;
      }

      /* ── TOOLTIPS ── */
      .rte-toolbar button[title]::after {
        content: attr(title);
        position: absolute;
        bottom: calc(100% + 7px);
        left: 50%;
        transform: translateX(-50%) scale(0.85);
        background: var(--rte-tooltip-bg);
        color: var(--rte-tooltip-color);
        font-size: 11px;
        font-family: var(--rte-font);
        white-space: nowrap;
        padding: 3px 7px;
        border-radius: 5px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s, transform 0.15s;
        z-index: 100;
      }

      .rte-toolbar button[title]:hover::after {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }

      /* ── SELECT ── */
      .rte-toolbar select {
        height: 30px;
        padding: 0 6px;
        border: 1px solid var(--rte-btn-border);
        border-radius: 6px;
        background: var(--rte-select-bg);
        color: var(--rte-btn-color);
        font-family: var(--rte-font);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: border-color var(--rte-transition);
        flex-shrink: 0;
      }

      .rte-toolbar select:hover,
      .rte-toolbar select:focus {
        border-color: #93b4f5;
      }

      /* ── COLOR PICKERS ── */
      .rte-color-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        flex-shrink: 0;
      }

      .rte-color-wrap button {
        width: 30px !important;
        height: 30px !important;
        flex-direction: column;
        gap: 2px;
      }

      .rte-color-swatch {
        display: block;
        width: 12px;
        height: 3px;
        border-radius: 2px;
        background: currentColor;
        margin-top: 1px;
      }

      .rte-color-wrap input[type="color"] {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        border: none;
        padding: 0;
      }

      /* ── EDITOR CONTENT AREA ── */
      .rte-editor {
        min-height: var(--rte-editor-min-height);
        padding: 14px 16px;
        outline: none;
        font-family: var(--rte-font);
        font-size: 15px;
        line-height: 1.65;
        color: #1e293b;
        caret-color: #2563eb;
        border-radius: 0 0 var(--rte-radius) var(--rte-radius);
        word-break: break-word;
        overflow-wrap: break-word;
      }

      .rte-editor p { margin: 0 0 0.75em; }
      .rte-editor p:last-child { margin-bottom: 0; }

      .rte-editor h1 { font-size: 1.75em; font-weight: 700; margin: 0 0 0.5em; color: #0f172a; }
      .rte-editor h2 { font-size: 1.4em;  font-weight: 700; margin: 0 0 0.5em; color: #0f172a; }
      .rte-editor h3 { font-size: 1.15em; font-weight: 600; margin: 0 0 0.5em; color: #0f172a; }

      .rte-editor ul,
      .rte-editor ol { margin: 0 0 0.75em 1.5em; padding: 0; }
      .rte-editor li { margin-bottom: 0.25em; }

      .rte-editor a { color: #2563eb; text-decoration: underline; }
      .rte-editor a:hover { color: #1d4ed8; }

      .rte-editor blockquote {
        margin: 0.75em 0;
        padding: 10px 14px 10px 16px;
        border-left: 3px solid var(--rte-blockquote-border);
        background: var(--rte-blockquote-bg);
        border-radius: 0 6px 6px 0;
        color: #334155;
        font-style: italic;
      }

      .rte-editor pre {
        margin: 0.75em 0;
        padding: 14px 16px;
        background: var(--rte-code-bg);
        color: var(--rte-code-color);
        border-radius: 8px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        font-size: 13px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
      }

      .rte-editor code {
        background: #f1f5f9;
        color: #0f766e;
        border-radius: 4px;
        padding: 1px 5px;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.88em;
      }

      .rte-editor pre code {
        background: transparent;
        color: inherit;
        padding: 0;
        font-size: inherit;
      }

      .rte-editor hr {
        border: none;
        border-top: 2px solid var(--rte-divider);
        margin: 1.25em 0;
      }

      .rte-editor img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        display: block;
        margin: 0.75em 0;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      }

      /* ── PLACEHOLDER ── */
      .rte-editor:empty::before,
      .rte-editor.rte-placeholder::before {
        content: attr(data-placeholder);
        color: #94a3b8;
        pointer-events: none;
        display: block;
      }

      /* ── CHAR COUNTER ── */
      .rte-footer {
        display: flex;
        justify-content: flex-end;
        padding: 4px 10px 5px;
        border-top: 1px solid var(--rte-toolbar-border);
        background: var(--rte-toolbar-bg);
        border-radius: 0 0 var(--rte-radius) var(--rte-radius);
      }

      .rte-char-count {
        font-size: 11px;
        color: #94a3b8;
        font-family: var(--rte-font);
        user-select: none;
      }

      .rte-char-count.rte-char-warn { color: #f59e0b; }
      .rte-char-count.rte-char-over  { color: #ef4444; }
    `;
    document.head.appendChild(style);
  }


  /* ─────────────────────────────────────────────
     SVG ICONS
  ───────────────────────────────────────────── */
  const SVG = {
    bold:        `<svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg>`,
    italic:      `<svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    underline:   `<svg viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
    strike:      `<svg viewBox="0 0 24 24"><path d="M17.3 12H6.7"/><path d="M10 5.5C10 4.1 11.1 3 12.5 3S15 4.1 15 5.5c0 1.5-2 3-3 3.5"/><path d="M10 18.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-1.5-2-3-3-3.5"/></svg>`,
    textColor:   `<svg viewBox="0 0 24 24"><path d="M4 20h16"/><path d="M9 16L12 4l3 12"/><path d="M10.5 12h3"/></svg>`,
    bgColor:     `<svg viewBox="0 0 24 24"><path d="M20 13.5A8 8 0 1 1 7 4.5"/><path d="M20 4L8.5 15.5l-3.5 3.5"/><path d="M15 10l2.5 2.5"/></svg>`,
    alignLeft:   `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`,
    alignCenter: `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
    alignRight:  `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>`,
    alignJust:   `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    ul:          `<svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" class="rte-filled"/><circle cx="4" cy="12" r="1.5" class="rte-filled"/><circle cx="4" cy="18" r="1.5" class="rte-filled"/></svg>`,
    ol:          `<svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1V3"/><path d="M4 11.5c0-1 1.5-1.5 1.5-.5S4 12.5 3.5 14H6"/><path d="M4.5 17H6v1l-1.5 1.5H6v1H4"/></svg>`,
    blockquote:  `<svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
    code:        `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    codeBlock:   `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 9 6 12 9 15"/><polyline points="15 9 18 12 15 15"/></svg>`,
    hr:          `<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="6" y2="6"/><line x1="3" y1="18" x2="6" y2="18"/></svg>`,
    link:        `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    unlink:      `<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
    image:       `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    undo:        `<svg viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M3 13C5.5 8.5 10 6 15 6a9 9 0 0 1 6 15"/></svg>`,
    redo:        `<svg viewBox="0 0 24 24"><path d="M21 7v6h-6"/><path d="M21 13C18.5 8.5 14 6 9 6a9 9 0 0 0-6 15"/></svg>`,
  };

  function makeBtn(title, svgKey, opts = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = SVG[svgKey] || '';
    if (opts.cmd) btn.dataset.cmd = opts.cmd;
    if (opts.action) btn.dataset.action = opts.action;
    return btn;
  }


  /* ─────────────────────────────────────────────
     SANITIZER
  ───────────────────────────────────────────── */
  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  }

  const ALLOWED_TAGS = new Set([
    'P','BR','B','STRONG','I','EM','U','S','DEL',
    'UL','OL','LI',
    'A',
    'H1','H2','H3',
    'SPAN',
    'BLOCKQUOTE',
    'PRE','CODE',
    'IMG',
    'HR',
    'DIV',
  ]);

  // Only allow safe CSS properties for inline color/bg/align
  const ALLOWED_STYLE_PROPS = new Set([
    'color', 'background-color', 'text-align',
  ]);

  function sanitizeStyle(styleAttr) {
    if (!styleAttr) return '';
    const safe = [];
    styleAttr.split(';').forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) return;
      const prop = part.slice(0, colonIdx).trim().toLowerCase();
      const val  = part.slice(colonIdx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return;
      // Block javascript: / expression() in values
      if (/javascript|expression|url\s*\(/i.test(val)) return;
      safe.push(`${prop}: ${val}`);
    });
    return safe.join('; ');
  }

  const ALLOWED_ATTRS = {
    A:    ['href', 'target', 'rel'],
    IMG:  ['src', 'alt', 'style'],
    SPAN: ['style'],
    P:    ['style'],
    DIV:  ['style'],
    H1:   ['style'], H2: ['style'], H3: ['style'],
  };

  function sanitizeRichTextHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');

    const walk = (node) => {
      [...node.children].forEach((child) => {
        const tag = child.tagName;

        if (!ALLOWED_TAGS.has(tag)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          return;
        }

        // Process attributes
        const keep = ALLOWED_ATTRS[tag] || [];
        [...child.attributes].forEach((a) => {
          if (!keep.includes(a.name.toLowerCase())) {
            child.removeAttribute(a.name);
            return;
          }
          // Sanitize style attributes
          if (a.name.toLowerCase() === 'style') {
            const sanitized = sanitizeStyle(a.value);
            if (sanitized) {
              child.setAttribute('style', sanitized);
            } else {
              child.removeAttribute('style');
            }
          }
        });

        // Link-specific: validate href + force safe target
        if (tag === 'A') {
          const href = child.getAttribute('href') || '';
          if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) {
            child.removeAttribute('href');
          } else {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          }
        }

        // Image-specific: validate src, sanitize style, add safe defaults
        if (tag === 'IMG') {
          const src = child.getAttribute('src') || '';
          if (!/^https?:\/\//i.test(src) && !/^data:image\//i.test(src)) {
            child.remove();
            return;
          }
          // Enforce max-width for safety
          const existingStyle = child.getAttribute('style') || '';
          if (!existingStyle.includes('max-width')) {
            child.setAttribute('style', (existingStyle + '; max-width: 100%; height: auto').replace(/^;\s*/, ''));
          }
        }

        walk(child);
      });
    };

    walk(doc.body);

    // Strip empty block-level tags
    doc.body.querySelectorAll('p, h1, h2, h3, blockquote, li').forEach(el => {
      if (!el.innerHTML.replace(/&nbsp;|\s/g, '').length && !el.querySelector('img, br')) {
        el.remove();
      }
    });

    return doc.body.innerHTML;
  }


  /* ─────────────────────────────────────────────
     TOOLBAR FACTORY
  ───────────────────────────────────────────── */
  function createToolbar(editor, onChange, options) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Text formatting');

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

    /* Format select */
    const select = document.createElement('select');
    select.title = 'Text style';
    select.setAttribute('aria-label', 'Text style');
    [
      ['Paragraph', 'P'],
      ['Heading 1', 'H1'],
      ['Heading 2', 'H2'],
      ['Heading 3', 'H3'],
    ].forEach(([label, val]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      select.appendChild(opt);
    });

    /* Color buttons */
    function colorWrap(label, svgKey, cmdFn) {
      const wrap = document.createElement('div');
      wrap.className = 'rte-color-wrap';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.innerHTML = SVG[svgKey] || '';
      const swatch = document.createElement('span');
      swatch.className = 'rte-color-swatch';
      btn.appendChild(swatch);
      const input = document.createElement('input');
      input.type = 'color';
      input.value = svgKey === 'textColor' ? '#1e293b' : '#fef08a';
      input.setAttribute('aria-hidden', 'true');
      input.addEventListener('change', () => {
        swatch.style.backgroundColor = input.value;
        editor.focus();
        cmdFn(input.value);
        onChange();
      });
      // Update swatch to match initial
      swatch.style.backgroundColor = input.value;
      wrap.appendChild(btn);
      wrap.appendChild(input);
      return wrap;
    }

    const textColorWrap = colorWrap('Text Color', 'textColor', (c) => {
      document.execCommand('foreColor', false, c);
    });

    const bgColorWrap = colorWrap('Highlight Color', 'bgColor', (c) => {
      document.execCommand('hiliteColor', false, c);
    });

    /* Buttons */
    const btnBold      = makeBtn('Bold (Ctrl+B)', 'bold', { cmd: 'bold' });
    const btnItalic    = makeBtn('Italic (Ctrl+I)', 'italic', { cmd: 'italic' });
    const btnUnderline = makeBtn('Underline (Ctrl+U)', 'underline', { cmd: 'underline' });
    const btnStrike    = makeBtn('Strikethrough', 'strike', { cmd: 'strikeThrough' });

    const btnAlignL    = makeBtn('Align Left', 'alignLeft', { cmd: 'justifyLeft' });
    const btnAlignC    = makeBtn('Align Center', 'alignCenter', { cmd: 'justifyCenter' });
    const btnAlignR    = makeBtn('Align Right', 'alignRight', { cmd: 'justifyRight' });
    const btnAlignJ    = makeBtn('Justify', 'alignJust', { cmd: 'justifyFull' });

    const btnUL        = makeBtn('Bullet List', 'ul', { cmd: 'insertUnorderedList' });
    const btnOL        = makeBtn('Ordered List', 'ol', { cmd: 'insertOrderedList' });

    const btnBlockquote = makeBtn('Blockquote', 'blockquote', { action: 'blockquote' });
    const btnCodeBlock  = makeBtn('Code Block', 'codeBlock', { action: 'codeBlock' });
    const btnHR         = makeBtn('Horizontal Rule', 'hr', { action: 'hr' });

    const btnLink       = makeBtn('Insert Link (Ctrl+K)', 'link', { action: 'link' });
    const btnUnlink     = makeBtn('Remove Link', 'unlink', { cmd: 'unlink' });
    const btnImage      = makeBtn('Insert Image', 'image', { action: 'image' });

    const btnUndo       = makeBtn('Undo (Ctrl+Z)', 'undo', { cmd: 'undo' });
    const btnRedo       = makeBtn('Redo (Ctrl+Y)', 'redo', { cmd: 'redo' });

    /* Assemble toolbar */
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
    toolbar.appendChild(grp(btnLink, btnUnlink, btnImage));
    toolbar.appendChild(sep());
    toolbar.appendChild(grp(btnUndo, btnRedo));

    /* ── Click handler ── */
    toolbar.addEventListener('mousedown', (e) => {
      // Prevent the editor from losing focus on toolbar interaction
      if (e.target.type !== 'color') e.preventDefault();
    });

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const cmd    = btn.dataset.cmd;
      editor.focus();

      if (action === 'link') {
        const sel = window.getSelection();
        const url = prompt('Enter URL (https://...)');
        if (url && url.trim()) document.execCommand('createLink', false, url.trim());
      } else if (action === 'image') {
        const url = prompt('Enter image URL (https://...)');
        if (url && /^https?:\/\//i.test(url.trim())) {
          document.execCommand('insertHTML', false,
            `<img src="${encodeURI(url.trim())}" alt="Inserted image" style="max-width:100%;height:auto;">`
          );
        }
      } else if (action === 'blockquote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      } else if (action === 'codeBlock') {
        const sel = window.getSelection();
        const text = sel && sel.toString() ? sel.toString() : '';
        document.execCommand('insertHTML', false,
          `<pre><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'code here'}</code></pre>`
        );
      } else if (action === 'hr') {
        document.execCommand('insertHorizontalRule', false, null);
      } else if (cmd) {
        document.execCommand(cmd, false, null);
      }

      onChange();
      updateActiveStates();
    });

    /* ── Select handler ── */
    select.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    select.addEventListener('change', () => {
      editor.focus();
      document.execCommand('formatBlock', false, select.value);
      onChange();
    });

    /* ── Active states ── */
    function updateActiveStates() {
      const cmds = [
        [btnBold,      'bold'],
        [btnItalic,    'italic'],
        [btnUnderline, 'underline'],
        [btnStrike,    'strikeThrough'],
        [btnAlignL,    'justifyLeft'],
        [btnAlignC,    'justifyCenter'],
        [btnAlignR,    'justifyRight'],
        [btnAlignJ,    'justifyFull'],
        [btnUL,        'insertUnorderedList'],
        [btnOL,        'insertOrderedList'],
      ];
      cmds.forEach(([el, cmd]) => {
        el.classList.toggle('rte-active', document.queryCommandState(cmd));
      });
    }

    editor.addEventListener('keyup', updateActiveStates);
    editor.addEventListener('mouseup', updateActiveStates);
    editor.addEventListener('selectionchange', updateActiveStates);

    return toolbar;
  }


  /* ─────────────────────────────────────────────
     MOUNT
  ───────────────────────────────────────────── */
  function mount(options = {}) {
    ensureStyles();

    const input = document.getElementById(options.inputId);
    if (!input) return null;

    /* Wrapper */
    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrap';

    /* Editor */
    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    editor.setAttribute('aria-label', options.label || 'Rich text editor');
    editor.setAttribute('spellcheck', 'true');
    if (options.placeholder) {
      editor.dataset.placeholder = options.placeholder;
    }
    editor.innerHTML = sanitizeRichTextHtml(input.value || '');

    const maxLength = options.maxLength || null;

    /* Sync */
    const sync = () => {
      const clean = sanitizeRichTextHtml(editor.innerHTML);
      input.value = clean;
      if (options.onChange) options.onChange(clean, stripHtml(clean));
      updatePlaceholder();
      updateCharCount();
    };

    const updatePlaceholder = () => {
      if (options.placeholder) {
        const empty = !editor.textContent.trim() && !editor.querySelector('img');
        editor.classList.toggle('rte-placeholder', empty);
      }
    };

    /* Footer / char counter */
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

    /* Toolbar */
    const toolbar = createToolbar(editor, sync, options);

    /* DOM assembly */
    input.style.display = 'none';
    input.insertAdjacentElement('beforebegin', wrapper);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(editor);
    if (maxLength) wrapper.appendChild(footer);

    /* Events */
    editor.addEventListener('input', sync);
    editor.addEventListener('paste', (e) => {
      // Strip formatting from plain-text paste if desired
      if (options.plainPaste) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      }
      sync();
    });

    /* ── Keyboard shortcuts ── */
    editor.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const shortcuts = {
        b: 'bold',
        i: 'italic',
        u: 'underline',
        z: 'undo',
        y: 'redo',
      };

      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        const url = prompt('Enter URL (https://...)');
        if (url && url.trim()) document.execCommand('createLink', false, url.trim());
        sync();
        return;
      }

      if (shortcuts[key]) {
        // Let native browser handle bold/italic/underline/undo/redo
        // but sync after
        requestAnimationFrame(sync);
      }
    });

    // Initial state
    updatePlaceholder();
    updateCharCount();

    return {
      getHtml:  () => sanitizeRichTextHtml(editor.innerHTML),
      getText:  () => stripHtml(editor.innerHTML),
      setHtml:  (html) => {
        editor.innerHTML = sanitizeRichTextHtml(html || '');
        sync();
      },
      focus:    () => editor.focus(),
      clear:    () => { editor.innerHTML = ''; sync(); },
      getElement: () => editor,
    };
  }


  /* ─────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────── */
  window.RichTextEditor = { mount, sanitizeRichTextHtml, stripHtml };

})();
