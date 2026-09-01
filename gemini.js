// Gemini (https://gemini.google.com/app) 側の Content Script

(function () {
  // URLハッシュからプロンプトを取得
  function getPrompt() {
    const hash = window.location.hash;
    if (hash && hash.includes('prompt=')) {
      const match = hash.match(/prompt=([^&]+)/);
      if (match && match[1]) {
        const prompt = decodeURIComponent(match[1]);
        // URLハッシュをクリーンアップ
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return prompt;
      }
    }
    return null;
  }

  // Geminiの入力欄を探してプロンプトを貼り付け、自動送信する
  function pasteAndSubmitPrompt(promptText) {
    let attempts = 0;
    const maxAttempts = 50; // 最大25秒間待機

    const timer = setInterval(() => {
      attempts++;

      // Geminiの入力欄セレクタ
      const editor = document.querySelector(
        'rich-textarea .ql-editor, div[contenteditable="true"][role="textbox"], rich-textarea textarea, textarea'
      );

      if (editor) {
        clearInterval(timer);
        editor.focus();

        if (editor.isContentEditable) {
          // contenteditable 要素の場合
          editor.innerHTML = `<p>${escapeHtml(promptText)}</p>`;

          // 入力イベントを発火させてステートを更新
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));

          // カーソルを末尾に移動
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editor);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          // 通常の textarea の場合
          editor.value = promptText;
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 入力反映と送信ボタンの活性化を待って自動送信を実行
        triggerSubmit(editor);
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn('[yt-summary-ext] Gemini editor element not found.');
      }
    }, 500);
  }

  // 送信処理（送信ボタンクリックまたはEnterキー押下）
  function triggerSubmit(editor) {
    let sendAttempts = 0;
    const sendTimer = setInterval(() => {
      sendAttempts++;

      // 送信ボタンの各種セレクタ（多言語・新旧UI対応）
      const sendButton = document.querySelector(
        'button.send-button, button[aria-label*="送信"], button[aria-label*="Send"], button[aria-label*="プロンプト"], .send-button-container button, rich-textarea ~ button, button.send-button-container'
      );

      const isButtonEnabled =
        sendButton &&
        !sendButton.disabled &&
        sendButton.getAttribute('aria-disabled') !== 'true';

      if (isButtonEnabled) {
        clearInterval(sendTimer);
        sendButton.click();
      } else if (sendAttempts >= 10) {
        // ボタンが見つからない・活性化しない場合はEnterキー押下をシミュレート
        clearInterval(sendTimer);
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        });
        editor.dispatchEvent(enterEvent);
      }
    }, 300);
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const initialPrompt = getPrompt();
  if (initialPrompt) {
    pasteAndSubmitPrompt(initialPrompt);
  }
})();
