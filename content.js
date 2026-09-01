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

// Gemini サイドパネルを開く / プロンプトを渡す
function openGeminiSidebar(promptText) {
  let container = document.getElementById('yt-gemini-sidebar-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'yt-gemini-sidebar-container';
    container.innerHTML = `
      <div class="yt-gemini-sidebar-header">
        <div class="yt-gemini-sidebar-title">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span>Gemini 要約アシスタント</span>
        </div>
        <div class="yt-gemini-sidebar-actions">
          <button class="yt-gemini-sidebar-btn" id="yt-gemini-close-btn" title="閉じる">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="yt-gemini-sidebar-body">
        <div class="yt-gemini-sidebar-loader" id="yt-gemini-loader">
          <div class="yt-gemini-spinner"></div>
          <span>Gemini を読み込み中...</span>
        </div>
        <iframe id="yt-gemini-iframe" allow="clipboard-read; clipboard-write"></iframe>
      </div>
    `;

    document.body.appendChild(container);

    // 閉じるボタン
    const closeBtn = container.querySelector('#yt-gemini-close-btn');
    closeBtn.addEventListener('click', () => {
      container.classList.remove('open');
    });

    // iframe ロード完了時
    const iframe = container.querySelector('#yt-gemini-iframe');
    const loader = container.querySelector('#yt-gemini-loader');
    iframe.addEventListener('load', () => {
      if (loader) loader.style.display = 'none';
    });
  }

  const iframe = container.querySelector('#yt-gemini-iframe');
  const loader = container.querySelector('#yt-gemini-loader');
  if (loader) loader.style.display = 'flex';

  // iframe の URL を更新して開く
  const geminiUrl = `https://gemini.google.com/app#prompt=${encodeURIComponent(promptText)}`;
  iframe.src = geminiUrl;

  container.classList.add('open');
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
    e.stopPropagation();

    // 対象の動画URLを取得（カードから取得したURL、または現在閲覧中の動画ページURL）
    let videoUrl = targetVideoUrl;
    if (
      !videoUrl &&
      (window.location.pathname.includes('/watch') ||
        window.location.pathname.includes('/shorts/'))
    ) {
      videoUrl = window.location.href;
    }

    if (videoUrl) {
      const promptText = `以下の動画を要約: ${videoUrl}`;
      await copyToClipboard(promptText);

      // YouTubeタブ内のサイドパネルにGeminiを表示
      openGeminiSidebar(promptText);
    } else {
      alert('動画URLの取得に失敗しました。');
    }
  });

  menuList.appendChild(item);
}

observeMenu();