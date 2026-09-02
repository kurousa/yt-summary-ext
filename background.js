// Background Service Worker for Chrome Side Panel

let latestPrompt = null;

// Content Script からのサイドパネルオープン要求を処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    latestPrompt = message.prompt;

    // クリックイベントに起因するサイドパネルオープン
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch((err) => {
        // windowId でフォールバック
        if (sender.tab.windowId) {
          chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(console.error);
        }
      });
    }

    // すでに開いているサイドパネルへプロンプトを通知
    chrome.runtime.sendMessage({ type: 'UPDATE_PROMPT', prompt: message.prompt }).catch(() => {});

    sendResponse({ success: true });
  } else if (message.type === 'GET_LATEST_PROMPT') {
    sendResponse({ prompt: latestPrompt });
    latestPrompt = null; // 取得後にリセット
  }
  return true;
});
