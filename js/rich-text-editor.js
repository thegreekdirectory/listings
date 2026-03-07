(function () {

  function ensureStyles() {
    if (document.getElementById('rte-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'rte-shared-styles';
    style.textContent = `.rte-wrap{border:1px solid #d1d5db;border-radius:.5rem;overflow:hidden;background:#fff}.rte-toolbar{display:flex;gap:.25rem;flex-wrap:wrap;padding:.5rem;border-bottom:1px solid #e5e7eb;background:#f9fafb}.rte-toolbar button,.rte-toolbar select{font-size:.8rem;padding:.3rem .5rem;border:1px solid #d1d5db;border-radius:.35rem;background:#fff}.rte-editor{min-height:140px;padding:.75rem;outline:none}.rte-editor p{margin:0 0 .75rem}`;
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
    const allowed = new Set(['P','BR','B','STRONG','I','EM','U','UL','OL','LI','A','H1','H2','H3','H4','H5','H6']);
    const attrs = { A: ['href','target','rel'] };

    const walk = (node) => {
      [...node.children].forEach((child) => {
        const tag = child.tagName;
        if (!allowed.has(tag)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
          return;
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
    return doc.body.innerHTML;
  }

  function createToolbar(editor, onChange) {
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-toolbar';
    toolbar.innerHTML = `
      <select data-cmd="formatBlock" class="rte-select">
        <option value="P">Paragraph</option>
        <option value="H1">Heading 1</option>
        <option value="H2">Heading 2</option>
        <option value="H3">Heading 3</option>
        <option value="H4">Heading 4</option>
        <option value="H5">Heading 5</option>
        <option value="H6">Heading 6</option>
      </select>
      <button type="button" data-cmd="bold"><b>B</b></button>
      <button type="button" data-cmd="italic"><i>I</i></button>
      <button type="button" data-cmd="underline"><u>U</u></button>
      <button type="button" data-cmd="insertUnorderedList">• List</button>
      <button type="button" data-cmd="insertOrderedList">1. List</button>
      <button type="button" data-action="link">Link</button>
      <button type="button" data-cmd="unlink">Unlink</button>
      <button type="button" data-cmd="undo">Undo</button>
      <button type="button" data-cmd="redo">Redo</button>
    `;

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const cmd = btn.dataset.cmd;
      editor.focus();
      if (action === 'link') {
        const url = prompt('Enter URL (https://...)');
        if (url) document.execCommand('createLink', false, url.trim());
      } else if (cmd) {
        document.execCommand(cmd, false, null);
      }
      onChange();
    });

    const select = toolbar.querySelector('select[data-cmd="formatBlock"]');
    select.addEventListener('change', () => {
      editor.focus();
      document.execCommand('formatBlock', false, select.value);
      onChange();
    });

    return toolbar;
  }

  function mount(options) {
    ensureStyles();
    const input = document.getElementById(options.inputId);
    if (!input) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrap';
    const editor = document.createElement('div');
    editor.className = 'rte-editor';
    editor.contentEditable = 'true';
    editor.innerHTML = sanitizeRichTextHtml(input.value || '');

    const sync = () => {
      input.value = sanitizeRichTextHtml(editor.innerHTML);
      if (options.onChange) options.onChange(input.value, stripHtml(input.value));
    };

    const toolbar = createToolbar(editor, sync);
    input.style.display = 'none';
    input.insertAdjacentElement('beforebegin', wrapper);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(editor);

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
