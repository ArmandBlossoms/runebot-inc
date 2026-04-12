import { mount } from 'svelte';
import './app.css';

// Error display helper
function showError(msg: string) {
  const el = document.getElementById('app');
  if (el) el.innerHTML = `<pre style="color:#ff4444;padding:20px;font-family:monospace;background:#1a1009;height:100vh;white-space:pre-wrap;overflow:auto">${msg}</pre>`;
}

window.addEventListener('error', (e) => showError(`JS Error:\n${e.message}\n\nFile: ${e.filename}:${e.lineno}\n\nStack:\n${e.error?.stack ?? 'no stack'}`));
window.addEventListener('unhandledrejection', (e) => showError(`Unhandled Promise Rejection:\n${e.reason}\n\n${e.reason?.stack ?? ''}`));

async function init() {
  try {
    const { default: App } = await import('./App.svelte');
    mount(App, { target: document.getElementById('app')! });
  } catch (e) {
    showError(`Mount Error:\n${String(e)}\n\nStack:\n${(e as Error)?.stack ?? 'no stack'}`);
  }
}

init();
