(function () {
  const ICONS = {
    bold: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>',
    italic: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
    underline: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    ul: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    ol: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    unlink: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m18.84 12.25 1.72-1.71h-.01a5.001 5.001 0 0 0-7.07-7.07l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.001 5.001 0 0 0 7.07 7.07l1.71-1.71"/><line x1="8" y1="8" x2="16" y2="16"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    redo: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>'
  };

  function ensureStyles() {
    if (document.getElementById('rte-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'rte-shared-styles';
    style.textContent = `
      .rte-wrap {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .rte-wrap:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
      }
      .rte-toolbar {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
        padding: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        align-items: center;
      }
      .rte-toolbar-divider {
        width: 1px;
        height: 1.25rem;
        background: #d1d5db;
        margin: 0 0.25rem;
      }
      .rte-toolbar button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 0.25rem;
        background: transparent;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .rte-toolbar button:hover {
        background: #e5e7eb;
        color: #111827;
      }
      .rte-toolbar button.is-active {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .rte-select {
        font-size: 0.875rem;
        padding: 0.25rem 1.5rem 0.25rem 0.5rem;
        border: 1px solid transparent;
        border-radius: 0.25rem;
        background-color: transparent;
        color: #4b5563;
        cursor: pointer;
        outline: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.25rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
      }
      .rte-select:hover {
        background-color: #e5e7eb;
      }
      .rte-select:focus {
        border-color: #d1d5db;
        background-color: #ffffff;
      }
      .rte-editor {
        min-height: 180px;
        padding: 1rem;
        outline: none;
        color: #1f2937;
        line-height: 1.6;
        font-size: 1rem;
        overflow-y: auto;
      }
      .rte-editor p { margin: 0 0 1rem; }
      .rte-editor p:last-child { margin-bottom: 0; }
      .rte-editor h3 {
        margin: 1.5rem 0 0.75rem;
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.3;
        color: #111827;
      }
      .rte-editor h3:first-child { margin-top: 0; }
      .rte-editor ul, .rte-editor ol { margin: 0 0 1rem; padding-left: 1.5rem; }
      .rte-editor li { margin-bottom: 0.25rem; }
      .rte-editor a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
      .rte-editor a:hover { color: #1d4ed8; }
      .rte-editor[data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
        display: block; /* For Firefox */
      }
    `;
    document.head.appendChild(style);
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').trim();
  }

  function sanitizeRichTextHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
    
    // Strict block allowance: Only P and H3
    const allowed = new Set(['P','BR','B','STRONG','I','EM','U','UL','OL','LI','A','H3']);
    const attrs = { A: ['href','target','rel'] };

    const walk = (node) => {
      [...node.children].forEach((child) => {
        let tag = child.tagName;

        // Semantic upgrades
        if (tag === 'B') {
          const strong = document.createElement('strong');
          strong.innerHTML = child.innerHTML;
          child.replaceWith(strong);
          child = strong;
          tag = 'STRONG';
        } else if (tag === 'I') {
          const em = document.createElement('em');
          em.innerHTML = child.innerHTML;
          child.replaceWith(em);
          child = em;
          tag = 'EM';
        } else if (['H1','H2','H4','H5','H6'].includes(tag)) {
          // Downgrade unauthorized headings to H3
          const h3 = document.createElement('h3');
          h3.innerHTML = child.innerHTML;
          child.replaceWith(h3);
          child = h3;
          tag = 'H3';
        }

        if (!allowed.has(tag)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          return; // The children are now siblings of where `child` was, they'll be processed by outer loop's next iterations
        }

        [...child.attributes].forEach((a) => {
          const keep = (attrs[tag] || []).includes(a.name.toLowerCase());
          if (!keep) child.removeAttribute(a.name);
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

        walk(child);
      });
    };

    walk(doc.body);
    
    // Final cleanup of empty paragraphs
    [...doc.body.querySelectorAll('p')].forEach(p => {
      if (!p.textContent.trim() && !p.querySelector('br')) {
        p.remove();
      }
    });

    return doc.body.innerHTML;
  }

  function createToolbar(editor, onChange) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    toolbar.innerHTML = `
      <select data-cmd="formatBlock" class="rte-select" title="Text format">
        <option value="P">Paragraph</option>
        <option value="H3">Heading 3</option>
      </select>
      <div class="rte-toolbar-divider"></div>
      <button type="button" data-cmd="bold" title="Bold">${ICONS.bold}</button>
      <button type="button" data-cmd="italic" title="Italic">${ICONS.italic}</button>
      <button type="button" data-cmd="underline" title="Underline">${ICONS.underline}</button>
      <div class="rte-toolbar-divider"></div>
      <button type="button" data-cmd="insertUnorderedList" title="Bullet List">${ICONS.ul}</button>
      <button type="button" data-cmd="insertOrderedList" title="Numbered List">${ICONS.ol}</button>
      <div class="rte-toolbar-divider"></div>
      <button type="button" data-action="link" title="Insert Link">${ICONS.link}</button>
      <button type="button" data-cmd="unlink" title="Remove Link">${ICONS.unlink}</button>
      <div class="rte-toolbar-divider"></div>
      <button type="button" data-cmd="undo" title="Undo">${ICONS.undo}</button>
      <button type="button" data-cmd="redo" title="Redo">${ICONS.redo}</button>
    `;

    // Prevent focus loss when clicking toolbar buttons
    toolbar.addEventListener('mousedown', (e) => {
      const target = e.target.closest('button, select');
      if (target && target.tagName !== 'SELECT') {
        e.preventDefault();
      }
    });

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const cmd = btn.dataset.cmd;
      
      if (action === 'link') {
        const selection = window.getSelection();
        // Fallback for no text selected
        if (selection.toString().length === 0) {
            alert('Please highlight some text first to create a link.');
            return;
        }
        const url = prompt('Enter URL (https://...)');
        if (url) document.execCommand('createLink', false, url.trim());
      } else if (cmd) {
        document.execCommand(cmd, false, null);
      }
      
      updateState();
      onChange();
    });

    const select = toolbar.querySelector('select[data-cmd="formatBlock"]');
    select.addEventListener('change', () => {
      editor.focus();
      document.execCommand('formatBlock', false, select.value);
      updateState();
      onChange();
    });

    // Sync UI state with active text styling
    const updateState = () => {
      const cmds = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
      cmds.forEach(cmd => {
        const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`);
        if (btn) {
          if (document.queryCommandState(cmd)) btn.classList.add('is-active');
          else btn.classList.remove('is-active');
        }
      });

      // Update block format dropdown
      let format = document.queryCommandValue('formatBlock') || 'p';
      if (format.toLowerCase() === 'h3') {
        select.value = 'H3';
      } else {
        select.value = 'P';
      }
    };

    // Listen to editor events to update toolbar state
    editor.addEventListener('keyup', updateState);
    editor.addEventListener('mouseup', updateState);
    editor.addEventListener('focus', updateState);

    return { toolbarEl: toolbar, updateState };
  }

  function mount(options) {
    ensureStyles();
    const input = document.getElementById(options.inputId);
    if (!input) {
        console.error(`RichTextEditor: Input with id '${options.inputId}' not found.`);
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrap';
    
    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    if (options.placeholder) editor.setAttribute('data-placeholder', options.placeholder);
    
    // Initial HTML Setup
    let initialHtml = input.value || '';
    if (initialHtml && !initialHtml.startsWith('<')) {
        initialHtml = `<p>${initialHtml}</p>`; // Wrap raw text
    }
    editor.innerHTML = sanitizeRichTextHtml(initialHtml);

    const sync = () => {
      input.value = sanitizeRichTextHtml(editor.innerHTML);
      if (options.onChange) options.onChange(input.value, stripHtml(input.value));
    };

    const { toolbarEl } = createToolbar(editor, sync);
    input.style.display = 'none';
    input.insertAdjacentElement('beforebegin', wrapper);
    wrapper.appendChild(toolbarEl);
    wrapper.appendChild(editor);

    // Make sure 'Enter' key makes a <p> tag instead of <div>
    editor.addEventListener('focus', () => {
        document.execCommand('defaultParagraphSeparator', false, 'p');
    }, { once: true });

    // Handle Paste: Clean up external styles/HTML
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        let pastedData = (e.originalEvent || e).clipboardData;
        let html = pastedData.getData('text/html');
        let text = pastedData.getData('text/plain');

        if (html) {
            const cleanHtml = sanitizeRichTextHtml(html);
            document.execCommand('insertHTML', false, cleanHtml);
        } else if (text) {
            // Convert plain text newlines to paragraphs
            const textHtml = text.split(/\r?\n/).filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
            document.execCommand('insertHTML', false, textHtml || `<p>${text}</p>`);
        }
        sync();
    });

    editor.addEventListener('input', sync);

    return {
      getHtml: () => sanitizeRichTextHtml(editor.innerHTML),
      getText: () => stripHtml(editor.innerHTML),
      setHtml: (html) => {
        editor.innerHTML = sanitizeRichTextHtml(html || '');
        sync();
      }
    };
  }

  window.RichTextEditor = { mount, sanitizeRichTextHtml, stripHtml };
})();
