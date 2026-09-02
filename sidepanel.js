// Side Panel Script
const iframe = document.getElementById('gemini-frame');

function loadGemini(promptText) {
  const url = promptText
    ? `https://gemini.google.com/app#prompt=${encodeURIComponent(promptText)}`
    : 'https://gemini.google.com/app';

  if (!iframe.src || iframe.src === 'about:blank') {
    iframe.src = url;
  } else {
    // 既に開いている場合は postMessage または URL 更新
    try {
      iframe.contentWindow?.postMessage({ type: 'SEND_PROMPT', prompt: promptText }, '*');
    } catch (e) {}
    iframe.src = url;
  }
}

// バックグラウンドから最新プロンプトを取得
chrome.runtime.sendMessage({ type: 'GET_LATEST_PROMPT' }, (response) => {
  if (response && response.prompt) {
    loadGemini(response.prompt);
  } else if (!iframe.src || iframe.src === 'about:blank') {
    loadGemini(null);
  }
});

// 後続のプロンプト更新メッセージを受信
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_PROMPT' && message.prompt) {
    loadGemini(message.prompt);
  }
});
