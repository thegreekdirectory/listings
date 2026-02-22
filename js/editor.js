const TOOLBAR_ACTIONS = [
  ['bold', 'Bold'],
  ['italic', 'Italic'],
  ['underline', 'Underline'],
  ['strikeThrough', 'Strikethrough'],
  ['createLink', 'Link'],
  ['formatBlock', 'H1', 'H1'],
  ['formatBlock', 'H2', 'H2'],
  ['formatBlock', 'H3', 'H3'],
  ['formatBlock', 'P', 'P']
];

export function initRichTextEditor({ editorId, toolbarId, draftStorageKey }) {
  const editor = document.getElementById(editorId);
  const toolbar = document.getElementById(toolbarId);
  if (!editor || !toolbar) return;

  toolbar.innerHTML = TOOLBAR_ACTIONS.map((action) => {
    const [cmd, label, value] = action;
    return `<button type="button" class="px-3 py-1 text-sm border rounded" data-cmd="${cmd}" data-value="${value || ''}">${label}</button>`;
  }).join('');

  const draft = localStorage.getItem(draftStorageKey);
  if (draft) editor.innerHTML = draft;

  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-cmd]');
    if (!button) return;
    const cmd = button.dataset.cmd;
    const value = cmd === 'createLink' ? prompt('Enter URL') : button.dataset.value;
    document.execCommand(cmd, false, value || null);
    editor.focus();
  });

  const autoSave = () => localStorage.setItem(draftStorageKey, editor.innerHTML);
  editor.addEventListener('input', autoSave);
  setInterval(autoSave, 3000);
}
