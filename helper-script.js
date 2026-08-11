/**
 * X (Twitter) 关注列表一键提取与备份助手脚本
 * 
 * 使用说明：
 * 1. 登录 x.com 并在浏览器中打开你的关注列表页面：https://x.com/following (或个人主页的 Following 标签页)
 * 2. 按 F12 打开开发者工具 (Developer Tools)，切换到 Console (控制台) 选项卡。
 * 3. 复制本文件所有代码，粘贴到 Console 中并按 Enter 回车。
 * 4. 页面右下角会出现一个浮动面板【X 关注备份助手】。
 * 5. 手动向下滚动页面（或开启自动滚动），面板会实时显示已抓取的博主数量。
 * 6. 滚动完成后，点击【导出 JSON 备份】按钮，将文件导入到你的 X-Follow-Archive Web 中！
 */

(function () {
  if (window.__X_ARCHIVE_EXTRACTOR_LOADED__) {
    alert("【X 关注备份助手】已经加载！请查看右下角面板。");
    return;
  }
  window.__X_ARCHIVE_EXTRACTOR_LOADED__ = true;

  const accountsMap = new Map(); // id -> user Object

  // 尝试从 GraphQL 响应中解析用户数据
  function extractUsersFromGraphQL(data) {
    try {
      let countBefore = accountsMap.size;
      const findUsersRecursive = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        // X GraphQL User Results standard format
        if (obj.__typename === 'User' || (obj.rest_id && obj.legacy)) {
          const legacy = obj.legacy || obj;
          const screenName = legacy.screen_name || obj.screen_name;
          if (screenName) {
            const userId = obj.rest_id || legacy.id_str || screenName;
            let avatarUrl = legacy.profile_image_url_https || obj.avatar_url || '';
            // 提升头像画质 (original / 400x400)
            if (avatarUrl) avatarUrl = avatarUrl.replace('_normal.', '_400x400.');

            accountsMap.set(userId.toLowerCase(), {
              id: userId,
              screen_name: screenName,
              name: legacy.name || screenName,
              avatar_url: avatarUrl,
              followers_count: legacy.followers_count || 0,
              description: legacy.description || '',
              verified: !!(legacy.verified || obj.is_blue_verified),
              backed_up_at: new Date().toISOString()
            });
          }
        }

        // 递归搜索
        if (Array.isArray(obj)) {
          obj.forEach(findUsersRecursive);
        } else {
          Object.values(obj).forEach(findUsersRecursive);
        }
      };

      findUsersRecursive(data);
      let countAfter = accountsMap.size;
      if (countAfter > countBefore) {
        updateUIState();
      }
    } catch (e) {
      console.warn('[X-Archive Helper] GraphQL parse warning:', e);
    }
  }

  // 1. Hook XMLHttpRequest & Fetch 来拦截 API 数据
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      if (url.includes('Following') || url.includes('Followers') || url.includes('graphql')) {
        const clone = response.clone();
        clone.json().then(data => extractUsersFromGraphQL(data)).catch(() => {});
      }
    } catch (err) {}
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener('load', function () {
      try {
        const url = args[1] || '';
        if (url.includes('Following') || url.includes('Followers') || url.includes('graphql')) {
          const data = JSON.parse(this.responseText);
          extractUsersFromGraphQL(data);
        }
      } catch (err) {}
    });
    return originalOpen.apply(this, args);
  };

  // 2. DOM 解析备用方案 (定时抓取页面已渲染节点)
  function parseDOMUserCells() {
    const userCells = document.querySelectorAll('[data-testid="UserCell"]');
    userCells.forEach(cell => {
      try {
        const links = cell.querySelectorAll('a[href^="/"]');
        let handle = '';
        let name = '';
        let avatarUrl = '';
        let bio = '';
        let verified = false;

        const img = cell.querySelector('img[src*="profile_images"]');
        if (img) avatarUrl = img.src.replace('_normal.', '_400x400.');

        links.forEach(a => {
          const href = a.getAttribute('href');
          if (href && !href.includes('/status/') && href !== '/explore' && href !== '/home') {
            const text = a.textContent.trim();
            if (text.startsWith('@')) {
              handle = text.replace('@', '');
            } else if (text && !name) {
              name = text;
            }
          }
        });

        // 试图抓取 Bio 简介
        const textElements = cell.querySelectorAll('[dir="auto"]');
        if (textElements.length > 2) {
          bio = textElements[textElements.length - 1].textContent.trim();
        }

        if (cell.querySelector('[data-testid="icon-verified"]')) {
          verified = true;
        }

        if (handle) {
          const key = handle.toLowerCase();
          if (!accountsMap.has(key)) {
            accountsMap.set(key, {
              id: handle,
              screen_name: handle,
              name: name || handle,
              avatar_url: avatarUrl,
              followers_count: 0,
              description: bio,
              verified: verified,
              backed_up_at: new Date().toISOString()
            });
            updateUIState();
          }
        }
      } catch (e) {}
    });
  }

  // 自动循环扫 DOM
  setInterval(parseDOMUserCells, 1500);

  // 3. UI 浮动控制面板
  const panel = document.createElement('div');
  panel.id = 'x-archive-helper-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.2);
    border-radius: 16px;
    padding: 20px;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    width: 320px;
    transition: all 0.3s ease;
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⚡</span>
        <strong style="font-size: 15px; font-weight: 700; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">X 关注备份助手</strong>
      </div>
      <button id="x-helper-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px;">✕</button>
    </div>
    
    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; margin-bottom: 14px; text-align: center;">
      <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">已抓取博主数量</div>
      <div id="x-helper-count" style="font-size: 28px; font-weight: 800; color: #38bdf8;">0</div>
    </div>

    <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 14px; line-height: 1.4;">
      💡 <strong>提示：</strong> 请向下滑动关注列表页面以自动积累更多博主。完成后点击导出。
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="x-helper-scroll" style="
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      ">📜 自动慢慢向下滚动</button>

      <button id="x-helper-export" style="
        background: linear-gradient(135deg, #0284c7, #4f46e5);
        border: none;
        color: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
      ">📥 导出 JSON 备份文件</button>
    </div>
  `;

  document.body.appendChild(panel);

  const countEl = document.getElementById('x-helper-count');
  function updateUIState() {
    if (countEl) countEl.textContent = accountsMap.size;
  }

  // 关闭面板
  document.getElementById('x-helper-close').onclick = () => panel.remove();

  // 自动滚动控制
  let autoScrollTimer = null;
  const scrollBtn = document.getElementById('x-helper-scroll');
  scrollBtn.onclick = () => {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
      scrollBtn.textContent = '📜 自动慢慢向下滚动';
      scrollBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    } else {
      scrollBtn.textContent = '⏸️ 暂停自动滚动';
      scrollBtn.style.background = 'rgba(239, 68, 68, 0.4)';
      autoScrollTimer = setInterval(() => {
        window.scrollBy(0, 600);
      }, 1200);
    }
  };

  // 导出 JSON 文件
  document.getElementById('x-helper-export').onclick = () => {
    const list = Array.from(accountsMap.values());
    if (list.length === 0) {
      alert("还没有抓取到任何博主数据，请先滑动关注列表！");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `x_following_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    alert(`🎉 成功导出 ${list.length} 位关注博主的备份文件！请打开你的 X-Follow-Archive Web 导入查看。`);
  };

  console.log('✅ 【X 关注备份助手】载入成功！已就绪。');
})();
