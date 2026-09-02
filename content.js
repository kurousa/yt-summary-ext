// 直前にメニューボタンがクリックされた動画カードのURLを保持
let targetVideoUrl = null;

// キャプチャフェーズでメニューボタン等のクリック元から動画URLを特定
document.addEventListener(
  'click',
  (e) => {
    // 動画カードコンテナ（新旧UIの各種セレクタに対応）
    const videoCard = e.target.closest(
      'ytd-rich-item-renderer, yt-lockup-view-model, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer'
    );

    if (videoCard) {
      // カード内の動画URL（/watch?v=... や /shorts/...）を持つリンクを取得
      const linkEl = videoCard.querySelector(
        'a[href*="/watch?v="], a[href*="/shorts/"], a#thumbnail, a.ytLockupViewModelTitle, a.ytLockupViewModelContentImage'
      );
      if (linkEl) {
        const href = linkEl.getAttribute('href');
        if (href) {
          targetVideoUrl = new URL(href, window.location.origin).href;
        }
      }
    }
  },
  true
);

// クリップボードにテキストをコピーする関数
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, falling back to execCommand', err);
  }

  // フォールバック処理
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.error('Fallback copy failed', e);
    return false;
  }
}

const observeMenu = () => {
  const container = document.querySelector('ytd-popup-container');
  if (!container) {
    setTimeout(observeMenu, 500);
    return;
  }

  const observer = new MutationObserver(() => {
    // メニューのリストを取得（新UI: yt-list-view-model / [role="menu"]、旧UI: tp-yt-paper-listbox / ytd-menu-popup-renderer #items）
    const menuList = container.querySelector(
      'yt-list-view-model, [role="menu"], tp-yt-paper-listbox, ytd-menu-popup-renderer #items'
    );

    if (menuList && !menuList.querySelector('.my-custom-menu-item')) {
      injectCustomMenuItem(menuList);
    }
  });

  observer.observe(container, { childList: true, subtree: true });
};

function injectCustomMenuItem(menuList) {
  const isNewViewModel =
    menuList.tagName.toLowerCase() === 'yt-list-view-model' ||
    menuList.getAttribute('role') === 'menu';

  const item = document.createElement(isNewViewModel ? 'yt-list-item-view-model' : 'div');
  item.className = isNewViewModel
    ? 'ytListItemViewModelHost my-custom-menu-item'
    : 'my-custom-menu-item';

  if (isNewViewModel) {
    item.setAttribute('role', 'presentation');
    item.innerHTML = `
      <div class="ytListItemViewModelLayoutWrapper ytListItemViewModelContainer ytListItemViewModelCompact ytListItemViewModelTappable ytListItemViewModelInPopup ytListItemViewModelNoTrailingText">
        <div class="ytListItemViewModelMainContainer">
          <div aria-hidden="true" class="ytListItemViewModelImageContainer ytListItemViewModelLeading">
            <span class="ytIconWrapperHost ytListItemViewModelAccessory ytListItemViewModelImage" role="img" aria-hidden="true">
              <span class="yt-icon-shape ytSpecIconShapeHost">
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                  ✨
                </div>
              </span>
            </span>
          </div>
          <button class="ytButtonOrAnchorHost ytButtonOrAnchorButton ytListItemViewModelButtonOrAnchor ytListItemViewModelTextWrapper" role="menuitem">
            <div>
              <div class="ytListItemViewModelTitleWrapper">
                <span class="ytAttributedStringHost ytListItemViewModelTitle ytAttributedStringWhiteSpacePreWrap" role="text">要約を実行</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    `;
  } else {
    item.style.cssText = `
      padding: 10px 16px;
      cursor: pointer;
      font-size: 1.4rem;
      color: var(--yt-spec-text-primary, #fff);
      display: flex;
      align-items: center;
    `;
    item.innerHTML = `<span>✨ 要約を実行</span>`;
  }

  item.addEventListener('click', async (e) => {
    // 対象の動画URLを取得（カードから取得したURL、または現在閲覧中の動画ページURL）
    let videoUrl = targetVideoUrl;
    if (
      !videoUrl &&
      (window.location.pathname.includes('/watch') ||
        window.location.pathname.includes('/shorts/'))
    ) {
      videoUrl = window.location.href;
    }

    // YouTube のメニューポップアップ（ドロップダウン）を明示的に閉じてスクロールロックを解除
    try {
      const dropdown = item.closest('tp-yt-iron-dropdown, iron-dropdown');
      if (dropdown && typeof dropdown.close === 'function') {
        dropdown.close();
      }
      // Escキーや背景クリックをシミュレートしてオーバーレイを完全に閉じる
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    } catch (err) {
      console.warn('Failed to close dropdown overlay', err);
    }

    if (videoUrl) {
      const promptText = `以下の動画を要約: ${videoUrl}`;
      await copyToClipboard(promptText);

      // Chrome 純正 Side Panel を開く
      chrome.runtime.sendMessage({
        type: 'OPEN_SIDE_PANEL',
        prompt: promptText
      }).catch((err) => {
        console.warn('Failed to open side panel via message', err);
      });
    } else {
      alert('動画URLの取得に失敗しました。');
    }
  });

  menuList.appendChild(item);
}

observeMenu();