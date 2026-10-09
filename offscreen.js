// Offscreen documents can't focus, so navigator.clipboard is unavailable; execCommand still works here
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen' || message.type !== 'copy') {
    return;
  }

  const textarea = document.getElementById('clipboard');
  textarea.value = message.text;
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.value = '';
  sendResponse(ok ? { ok: true } : { ok: false, error: 'execCommand copy returned false' });
});
