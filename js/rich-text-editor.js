(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     FONTS
  ───────────────────────────────────────────────────────────── */
  function loadFonts() {
    const id = 'rte-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap';
    document.head.appendChild(link);
  }

  /* ─────────────────────────────────────────────────────────────
     CSS
  ───────────────────────────────────────────────────────────── */
  const CSS = `
    .rte-wrap {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 0 0 1.5px #d1d5db, 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.05);
      transition: box-shadow .2s ease;
      font-family: 'DM Mono', ui-monospace, 'Cascadia Code', monospace;
    }
    .rte-wrap:focus-within {
      box-shadow: 0 0 0 2px #6366f1, 0 6px 28px rgba(99,102,241,.14), 0 1px 4px rgba(0,0,0,.06);
    }

    /* ── Toolbar ── */
    .rte-toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 7px 10px;
      background: #0f172a;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='.04'/%3E%3C/svg%3E");
      flex-wrap: wrap;
      min-height: 48px;
      gap: 2px;
    }
    .rte-group {
      display: flex;
      align-items: center;
      gap: 1px;
    }
    .rte-sep {
      width: 1px;
      height: 18px;
      background: linear-gradient(to bottom, transparent, #334155 30%, #334155 70%, transparent);
      margin: 0 5px;
      flex-shrink: 0;
    }
    .rte-spacer { flex: 1; }

    /* ── Toolbar buttons ── */
    .rte-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 7px;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: background .14s ease, color .14s ease, transform .08s ease;
      font-size: 12px;
      font-family: 'DM Mono', ui-monospace, monospace;
      padding: 0;
      line-height: 1;
      outline: none;
      -webkit-user-select: none;
      user-select: none;
    }
    .rte-btn:hover {
      background: rgba(255,255,255,.07);
      color: #e2e8f0;
    }
    .rte-btn:active { transform: scale(.88); }
    .rte-btn.rte-active {
      background: #6366f1;
      color: #fff;
    }
    .rte-btn.rte-active:hover { background: #4f46e5; }

    /* ── Tooltips (CSS-only, above button) ── */
    .rte-btn[data-tip]::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 9px);
      left: 50%;
      transform: translateX(-50%) translateY(3px);
      white-space: nowrap;
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s ease, transform .15s ease;
      z-index: 2000;
      letter-spacing: .03em;
      font-family: 'DM Mono', ui-monospace, monospace;
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }
    .rte-btn[data-tip]:hover::after {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* ── Format select ── */
    .rte-format-select {
      height: 30px;
      padding: 0 24px 0 8px;
      border: 1px solid #1e3a5f;
      border-radius: 7px;
      background: #1e293b;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 7px center;
      -webkit-appearance: none;
      appearance: none;
      color: #94a3b8;
      font-size: 11px;
      font-family: 'DM Mono', ui-monospace, monospace;
      cursor: pointer;
      outline: none;
      transition: border-color .15s ease, color .15s ease;
      letter-spacing: .02em;
    }
    .rte-format-select:hover { border-color: #6366f1; color: #e2e8f0; }
    .rte-format-select:focus { border-color: #6366f1; color: #e2e8f0; }
    .rte-format-select option { background: #1e293b; color: #e2e8f0; }

    /* ── Editor area ── */
    .rte-editor {
      position: relative;
      min-height: 200px;
      padding: 22px 26px 18px;
      outline: none;
      color: #111827;
      line-height: 1.8;
      font-family: 'Lora', Georgia, 'Times New Roman', serif;
      font-size: 16px;
      caret-color: #6366f1;
      background: #fff;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .rte-editor.rte-empty::before {
      content: attr(data-placeholder);
      position: absolute;
      top: 22px;
      left: 26px;
      color: #94a3b8;
      font-style: italic;
      pointer-events: none;
      font-family: 'Lora', Georgia, serif;
      font-size: 16px;
      line-height: 1.8;
    }
    .rte-editor > *:first-child { margin-top: 0; }
    .rte-editor > *:last-child { margin-bottom: 0; }
    .rte-editor p { margin: 0 0 13px; }
    .rte-editor h3 {
      font-size: 1.35rem;
      font-weight: 600;
      margin: 22px 0 10px;
      line-height: 1.3;
      color: #0f172a;
      font-family: 'Lora', Georgia, serif;
      letter-spacing: -.01em;
    }
    .rte-editor h3:first-child { margin-top: 0; }
    .rte-editor ul, .rte-editor ol {
      margin: 0 0 13px;
      padding-left: 22px;
    }
    .rte-editor li { margin-bottom: 3px; line-height: 1.7; }
    .rte-editor ul li::marker { color: #6366f1; }
    .rte-editor ol li::marker { color: #6366f1; font-weight: 600; }
    .rte-editor a {
      color: #6366f1;
      text-decoration: underline;
      text-decoration-color: rgba(99,102,241,.35);
      text-underline-offset: 3px;
      transition: text-decoration-color .15s;
    }
    .rte-editor a:hover { text-decoration-color: #6366f1; }
    .rte-editor code {
      font-family: 'DM Mono', ui-monospace, monospace;
      font-size: .865em;
      background: #f1f5f9;
      color: #db2777;
      padding: 2px 6px;
      border-radius: 5px;
      border: 1px solid #e2e8f0;
    }
    .rte-editor strong, .rte-editor b { font-weight: 700; }
    .rte-editor em, .rte-editor i { font-style: italic; }
    .rte-editor u { text-decoration: underline; text-underline-offset: 2px; }
    .rte-editor s, .rte-editor strike, .rte-editor del {
      text-decoration: line-through;
      color: #64748b;
    }

    /* ── Status bar ── */
    .rte-status {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      padding: 5px 14px 6px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
      font-size: 10px;
      color: #94a3b8;
      font-family: 'DM Mono', ui-monospace, monospace;
      letter-spacing: .04em;
      -webkit-user-select: none;
      user-select: none;
    }
    .rte-stat-val {
      color: #475569;
      font-weight: 500;
    }

    /* ── Link modal ── */
    .rte-link-modal {
      position: absolute;
      left: 50%;
      transform: translateX(-50%) translateY(-6px);
      z-index: 500;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 11px;
      padding: 13px 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.25);
      display: flex;
      flex-direction: column;
      gap: 9px;
      min-width: 310px;
      opacity: 0;
      pointer-events: none;
      transition: opacity .17s ease, transform .17s ease;
    }
    .rte-link-modal.rte-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }
    .rte-link-label {
      color: #475569;
      font-size: 9px;
      font-family: 'DM Mono', ui-monospace, monospace;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .rte-link-input {
      height: 36px;
      padding: 0 10px;
      border: 1px solid #1e3a5f;
      border-radius: 7px;
      background: #1e293b;
      color: #e2e8f0;
      font-size: 12px;
      font-family: 'DM Mono', ui-monospace, monospace;
      outline: none;
      transition: border-color .15s ease, box-shadow .15s ease;
      width: 100%;
      box-sizing: border-box;
    }
    .rte-link-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,.18);
    }
    .rte-link-input::placeholder { color: #334155; }
    .rte-link-btns {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .rte-link-btns button {
      height: 30px;
      padding: 0 13px;
      border: none;
      border-radius: 7px;
      font-size: 11px;
      font-family: 'DM Mono', ui-monospace, monospace;
      cursor: pointer;
      transition: background .12s ease;
      font-weight: 500;
      letter-spacing: .02em;
    }
    .rte-link-confirm-btn {
      background: #6366f1;
      color: #fff;
    }
    .rte-link-confirm-btn:hover { background: #4f46e5; }
    .rte-link-cancel-btn {
      background: #1e293b;
      color: #64748b;
    }
    .rte-link-cancel-btn:hover { background: #334155; color: #94a3b8; }
  `;

  function ensureStyles() {
    if (document.getElementById('rte-shared-styles')) return;
    loadFonts();
    const el = document.createElement('style');
    el.id = 'rte-shared-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────
     UTILS
  ───────────────────────────────────────────────────────────── */
  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || d.innerText || '').trim();
  }

  function escapeAttr(val) {
    return val.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function saveRange() {
    const sel = window.getSelection();
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  }

  function restoreRange(range) {
    if (!range) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ─────────────────────────────────────────────────────────────
     SANITIZER  (serialiser-based — no DOM mutation during walk)
  ───────────────────────────────────────────────────────────── */
  const ALLOWED_TAGS = new Set([
    'P','BR','B','STRONG','I','EM','U','S','STRIKE','DEL',
    'CODE','UL','OL','LI','A','H3'
  ]);
  const ALLOWED_ATTRS = {
    A:  ['href'],
    P:  ['style'],
    H3: ['style'],
  };
  const ALIGN_RE = /text-align\s*:\s*(left|center|right|justify)/i;

  function serializeNode(node) {
    // Text node
    if (node.nodeType === 3) {
      return node.textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    if (node.nodeType !== 1) return '';

    const tag = node.tagName;

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: serialize children only
      return [...node.childNodes].map(serializeNode).join('');
    }

    // Self-closing
    if (tag === 'BR') return '<br>';

    // Build attributes
    let attrs = '';
    const allowed = ALLOWED_ATTRS[tag] || [];
    allowed.forEach((name) => {
      const val = node.getAttribute(name);
      if (val === null) return;
      if (name === 'style') {
        const m = val.match(ALIGN_RE);
        if (m) attrs += ` style="text-align:${m[1]}"`;
      } else if (name === 'href') {
        const clean = (val || '').trim();
        if (/^https?:\/\//i.test(clean) || /^mailto:/i.test(clean) || /^tel:/i.test(clean)) {
          attrs += ` href="${escapeAttr(clean)}" target="_blank" rel="noopener noreferrer"`;
        }
      }
    });

    const tagLower = tag.toLowerCase();
    const inner = [...node.childNodes].map(serializeNode).join('');
    return `<${tagLower}${attrs}>${inner}</${tagLower}>`;
  }

  function sanitizeRichTextHtml(html) {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    return [...doc.body.firstChild.childNodes].map(serializeNode).join('');
  }

  /* ─────────────────────────────────────────────────────────────
     INLINE CODE TOGGLE
  ───────────────────────────────────────────────────────────── */
  function toggleInlineCode(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Check if inside CODE
    let node = sel.anchorNode;
    let codeEl = null;
    while (node && node !== editor) {
      if (node.nodeType === 1 && node.tagName === 'CODE') { codeEl = node; break; }
      node = node.parentNode;
    }

    if (codeEl) {
      const frag = document.createDocumentFragment();
      while (codeEl.firstChild) frag.appendChild(codeEl.firstChild);
      codeEl.parentNode.replaceChild(frag, codeEl);
    } else if (!sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const code = document.createElement('code');
      try {
        range.surroundContents(code);
      } catch {
        const frag = range.extractContents();
        code.appendChild(frag);
        range.insertNode(code);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
     ICONS
  ───────────────────────────────────────────────────────────── */
  const IC = {
    bold:        `<b style="font-size:13px;font-family:Georgia,serif;letter-spacing:-.3px">B</b>`,
    italic:      `<i style="font-size:13px;font-family:Georgia,serif">I</i>`,
    underline:   `<span style="font-size:12px;text-decoration:underline;text-underline-offset:2px">U</span>`,
    strike:      `<span style="font-size:12px;text-decoration:line-through">S</span>`,
    code:        `<span style="font-size:10px;letter-spacing:-.3px">&lt;/&gt;</span>`,
    alignLeft:   `<svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2" rx="1"/><rect x="0" y="5" width="9" height="2" rx="1"/><rect x="0" y="10" width="11.5" height="2" rx="1"/></svg>`,
    alignCenter: `<svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2" rx="1"/><rect x="2.5" y="5" width="9" height="2" rx="1"/><rect x="1.25" y="10" width="11.5" height="2" rx="1"/></svg>`,
    alignRight:  `<svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="0" width="14" height="2" rx="1"/><rect x="5" y="5" width="9" height="2" rx="1"/><rect x="2.5" y="10" width="11.5" height="2" rx="1"/></svg>`,
    ul:          `<svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><circle cx="1.5" cy="2" r="1.5"/><rect x="4" y="1" width="10" height="2" rx="1"/><circle cx="1.5" cy="6" r="1.5"/><rect x="4" y="5" width="10" height="2" rx="1"/><circle cx="1.5" cy="10" r="1.5"/><rect x="4" y="9" width="10" height="2" rx="1"/></svg>`,
    ol:          `<span style="font-size:10px;font-weight:700;letter-spacing:-.4px;font-family:ui-sans-serif,sans-serif">1.</span>`,
    link:        `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5a4 4 0 0 0 5.66.14l1.5-1.5A4 4 0 0 0 8 2.5l-.98.98"/><path d="M9.5 6.5a4 4 0 0 0-5.66-.14l-1.5 1.5A4 4 0 0 0 8 13.5l.98-.98"/></svg>`,
    unlink:      `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5a4 4 0 0 0 5.66.14l1.5-1.5A4 4 0 0 0 8 2.5l-.98.98"/><path d="M9.5 6.5a4 4 0 0 0-5.66-.14l-1.5 1.5A4 4 0 0 0 8 13.5l.98-.98"/><line x1="3" y1="3" x2="13" y2="13" stroke-width="1.5"/></svg>`,
    clearFmt:    `<span style="font-size:10px;font-weight:500;letter-spacing:-.2px;font-family:ui-sans-serif,sans-serif">Tx</span>`,
    undo:        `<span style="font-size:15px;line-height:1">↺</span>`,
    redo:        `<span style="font-size:15px;line-height:1">↻</span>`,
  };

  /* ─────────────────────────────────────────────────────────────
     TOOLBAR DOM HELPERS
  ───────────────────────────────────────────────────────────── */
  function mkBtn(icon, tip, data) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rte-btn';
    b.innerHTML = icon;
    if (tip) b.dataset.tip = tip;
    if (data) Object.assign(b.dataset, data);
    return b;
  }

  function mkSep() {
    const d = document.createElement('div');
    d.className = 'rte-sep';
    return d;
  }

  function mkGroup(...children) {
    const g = document.createElement('div');
    g.className = 'rte-group';
    children.forEach(c => g.appendChild(c));
    return g;
  }

  /* ─────────────────────────────────────────────────────────────
     MOUNT
  ───────────────────────────────────────────────────────────── */
  function mount(options) {
    ensureStyles();

    const input = document.getElementById(options.inputId);
    if (!input) return null;

    /* ── DOM skeleton ─────────────────────────────────────── */
    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrap';

    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    editor.setAttribute('spellcheck', 'true');
    editor.dataset.placeholder = options.placeholder || 'Start writing…';
    if (options.minHeight) editor.style.minHeight = options.minHeight;

    /* ── Toolbar ──────────────────────────────────────────── */
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';

    const fmtSelect = document.createElement('select');
    fmtSelect.className = 'rte-format-select';
    fmtSelect.innerHTML = `<option value="p">Paragraph</option><option value="h3">Heading 3</option>`;

    const boldBtn      = mkBtn(IC.bold,        'Bold (Ctrl+B)',               { cmd: 'bold' });
    const italicBtn    = mkBtn(IC.italic,      'Italic (Ctrl+I)',             { cmd: 'italic' });
    const underlineBtn = mkBtn(IC.underline,   'Underline (Ctrl+U)',          { cmd: 'underline' });
    const strikeBtn    = mkBtn(IC.strike,      'Strikethrough (Ctrl+Shift+S)',{ cmd: 'strikeThrough' });
    const codeBtn      = mkBtn(IC.code,        'Inline Code (Ctrl+E)',        { action: 'code' });
    const alignLBtn    = mkBtn(IC.alignLeft,   'Align Left (Ctrl+Shift+L)',   { cmd: 'justifyLeft' });
    const alignCBtn    = mkBtn(IC.alignCenter, 'Align Center (Ctrl+Shift+E)', { cmd: 'justifyCenter' });
    const alignRBtn    = mkBtn(IC.alignRight,  'Align Right (Ctrl+Shift+R)',  { cmd: 'justifyRight' });
    const ulBtn        = mkBtn(IC.ul,          'Bullet List',                 { cmd: 'insertUnorderedList' });
    const olBtn        = mkBtn(IC.ol,          'Numbered List',               { cmd: 'insertOrderedList' });
    const linkBtn      = mkBtn(IC.link,        'Insert Link (Ctrl+K)',        { action: 'link' });
    const unlinkBtn    = mkBtn(IC.unlink,      'Remove Link',                 { cmd: 'unlink' });
    const clearBtn     = mkBtn(IC.clearFmt,    'Clear Formatting (Ctrl+\\)',  { cmd: 'removeFormat' });
    const undoBtn      = mkBtn(IC.undo,        'Undo (Ctrl+Z)',               { cmd: 'undo' });
    const redoBtn      = mkBtn(IC.redo,        'Redo (Ctrl+Y)',               { cmd: 'redo' });

    const spacer = document.createElement('div');
    spacer.className = 'rte-spacer';

    toolbar.appendChild(mkGroup(fmtSelect));
    toolbar.appendChild(mkSep());
    toolbar.appendChild(mkGroup(boldBtn, italicBtn, underlineBtn, strikeBtn, codeBtn));
    toolbar.appendChild(mkSep());
    toolbar.appendChild(mkGroup(alignLBtn, alignCBtn, alignRBtn));
    toolbar.appendChild(mkSep());
    toolbar.appendChild(mkGroup(ulBtn, olBtn));
    toolbar.appendChild(mkSep());
    toolbar.appendChild(mkGroup(linkBtn, unlinkBtn));
    toolbar.appendChild(mkSep());
    toolbar.appendChild(mkGroup(clearBtn));
    toolbar.appendChild(spacer);
    toolbar.appendChild(mkGroup(undoBtn, redoBtn));

    /* ── Link modal ───────────────────────────────────────── */
    const linkModal = document.createElement('div');
    linkModal.className = 'rte-link-modal';
    linkModal.innerHTML = `
      <div class="rte-link-label">Insert Link</div>
      <input type="url" class="rte-link-input" placeholder="https://example.com" autocomplete="url" />
      <div class="rte-link-btns">
        <button type="button" class="rte-link-cancel-btn">Cancel</button>
        <button type="button" class="rte-link-confirm-btn">Apply</button>
      </div>
    `;

    /* ── Status bar ───────────────────────────────────────── */
    const statusBar = document.createElement('div');
    statusBar.className = 'rte-status';
    statusBar.innerHTML = `
      <span><span class="rte-word-count rte-stat-val">0</span>&nbsp;words</span>
      <span><span class="rte-char-count rte-stat-val">0</span>&nbsp;chars</span>
    `;

    /* ── Assemble ─────────────────────────────────────────── */
    input.style.display = 'none';
    input.insertAdjacentElement('beforebegin', wrapper);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(editor);
    wrapper.appendChild(linkModal);
    wrapper.appendChild(statusBar);

    editor.innerHTML = sanitizeRichTextHtml(input.value || '');

    /* ── Internal state ───────────────────────────────────── */
    let savedRange = null;
    const linkInput  = linkModal.querySelector('.rte-link-input');

    /* ── sync: write back to hidden input & update status ─── */
    function sync() {
      const clean = sanitizeRichTextHtml(editor.innerHTML);
      input.value = clean;
      const text = stripHtml(clean);
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.replace(/\s/g, '').length;
      statusBar.querySelector('.rte-word-count').textContent = words;
      statusBar.querySelector('.rte-char-count').textContent = chars;
      // Placeholder visibility
      editor.classList.toggle('rte-empty', !text);
      if (options.onChange) options.onChange(clean, text);
    }

    /* ── Update toolbar active states ─────────────────────── */
    function updateState() {
      const stateMap = {
        bold:                boldBtn,
        italic:              italicBtn,
        underline:           underlineBtn,
        strikeThrough:       strikeBtn,
        justifyLeft:         alignLBtn,
        justifyCenter:       alignCBtn,
        justifyRight:        alignRBtn,
        insertUnorderedList: ulBtn,
        insertOrderedList:   olBtn,
      };
      Object.entries(stateMap).forEach(([cmd, btn]) => {
        try { btn.classList.toggle('rte-active', document.queryCommandState(cmd)); } catch (_) {}
      });

      // Code button: check if selection is inside <code>
      const sel = window.getSelection();
      let inCode = false;
      if (sel && sel.anchorNode) {
        let n = sel.anchorNode;
        while (n && n !== editor) {
          if (n.nodeType === 1 && n.tagName === 'CODE') { inCode = true; break; }
          n = n.parentNode;
        }
      }
      codeBtn.classList.toggle('rte-active', inCode);

      // Format select
      try {
        const fmt = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '').trim();
        fmtSelect.value = fmt === 'h3' ? 'h3' : 'p';
      } catch (_) {}
    }

    /* ── Link modal helpers ───────────────────────────────── */
    function positionModal() {
      linkModal.style.top = (toolbar.offsetHeight + 6) + 'px';
    }

    function showLink() {
      savedRange = saveRange();

      // Detect existing href if cursor is on a link
      let existingHref = '';
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let n = sel.anchorNode;
        while (n && n !== editor) {
          if (n.nodeType === 1 && n.tagName === 'A') {
            existingHref = n.getAttribute('href') || '';
            break;
          }
          n = n.parentNode;
        }
      }

      positionModal();
      linkInput.value = existingHref;
      linkModal.classList.add('rte-visible');
      requestAnimationFrame(() => { linkInput.focus(); linkInput.select(); });
    }

    function hideLink() {
      linkModal.classList.remove('rte-visible');
      editor.focus();
    }

    function applyLink() {
      const url = linkInput.value.trim();
      hideLink();
      restoreRange(savedRange);
      if (url) {
        document.execCommand('createLink', false, url);
        // Ensure target/rel on all links
        editor.querySelectorAll('a[href]').forEach(a => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });
      }
      sync();
      updateState();
    }

    linkModal.querySelector('.rte-link-confirm-btn').addEventListener('click', applyLink);
    linkModal.querySelector('.rte-link-cancel-btn').addEventListener('click', hideLink);
    linkInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); applyLink(); }
      if (e.key === 'Escape') { e.preventDefault(); hideLink(); }
    });

    // Clicking outside modal closes it
    document.addEventListener('mousedown', (e) => {
      if (linkModal.classList.contains('rte-visible') &&
          !linkModal.contains(e.target) &&
          e.target !== linkBtn) {
        hideLink();
      }
    });

    /* ── Toolbar: keep editor focused on btn clicks ───────── */
    toolbar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.rte-btn')) e.preventDefault();
    });

    /* ── Toolbar: click dispatch ──────────────────────────── */
    toolbar.addEventListener('click', (e) => {
      const b = e.target.closest('.rte-btn');
      if (!b) return;
      const { cmd, action } = b.dataset;

      if (action === 'link')  { showLink(); return; }
      if (action === 'code')  { editor.focus(); toggleInlineCode(editor); sync(); updateState(); return; }
      if (cmd) { editor.focus(); document.execCommand(cmd, false, null); sync(); updateState(); }
    });

    /* ── Format select ────────────────────────────────────── */
    fmtSelect.addEventListener('change', () => {
      editor.focus();
      // Use angle-bracket syntax for cross-browser support (Firefox requires it)
      document.execCommand('formatBlock', false, `<${fmtSelect.value}>`);
      sync();
      updateState();
    });

    /* ── Editor input & selection events ──────────────────── */
    editor.addEventListener('input',    () => { sync(); updateState(); });
    editor.addEventListener('keyup',    updateState);
    editor.addEventListener('mouseup',  updateState);
    editor.addEventListener('focus',    updateState);

    /* ── Keyboard shortcuts ───────────────────────────────── */
    editor.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (!e.shiftKey) {
        switch (e.key) {
          case 'b': e.preventDefault(); document.execCommand('bold', false, null);      sync(); updateState(); break;
          case 'i': e.preventDefault(); document.execCommand('italic', false, null);    sync(); updateState(); break;
          case 'u': e.preventDefault(); document.execCommand('underline', false, null); sync(); updateState(); break;
          case 'z': e.preventDefault(); document.execCommand('undo', false, null);      sync(); updateState(); break;
          case 'y': e.preventDefault(); document.execCommand('redo', false, null);      sync(); updateState(); break;
          case 'k': e.preventDefault(); showLink(); break;
          case 'e': e.preventDefault(); toggleInlineCode(editor); sync(); updateState(); break;
          case '\\': e.preventDefault(); document.execCommand('removeFormat', false, null); sync(); updateState(); break;
        }
      } else {
        // Shift combos
        switch (e.key) {
          case 'Z': e.preventDefault(); document.execCommand('redo', false, null);          sync(); updateState(); break;
          case 'S': e.preventDefault(); document.execCommand('strikeThrough', false, null); sync(); updateState(); break;
          case 'L': e.preventDefault(); document.execCommand('justifyLeft', false, null);   sync(); updateState(); break;
          case 'E': e.preventDefault(); document.execCommand('justifyCenter', false, null); sync(); updateState(); break;
          case 'R': e.preventDefault(); document.execCommand('justifyRight', false, null);  sync(); updateState(); break;
        }
      }
    });

    /* ── Paste: sanitize pasted content ───────────────────── */
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      if (html) {
        document.execCommand('insertHTML', false, sanitizeRichTextHtml(html));
      } else {
        const text = e.clipboardData.getData('text/plain');
        // Convert double-newlines to paragraphs, single newlines to <br>
        const paras = text.split(/\n\n+/).filter(Boolean);
        const converted = paras.length > 1
          ? paras.map(p => `<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br>')}</p>`).join('')
          : text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, converted || '');
      }
      sync();
      updateState();
    });

    /* ── Initial state ────────────────────────────────────── */
    sync();

    /* ── Public API ───────────────────────────────────────── */
    return {
      getHtml() { return sanitizeRichTextHtml(editor.innerHTML); },
      getText() { return stripHtml(editor.innerHTML); },
      setHtml(html) {
        editor.innerHTML = sanitizeRichTextHtml(html || '');
        sync();
        updateState();
      },
      focus()   { editor.focus(); },
      clear()   { editor.innerHTML = ''; sync(); },
      destroy() { wrapper.remove(); input.style.display = ''; },
    };
  }

  /* ─────────────────────────────────────────────────────────────
     EXPORT
  ───────────────────────────────────────────────────────────── */
  window.RichTextEditor = { mount, sanitizeRichTextHtml, stripHtml };
})();
