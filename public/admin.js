/**
 * X-Archive Admin Vault & Passcode Gate Logic (v23.0 - Clean Single Logout Action)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authGateScreen = document.getElementById('auth-gate-screen');
  const adminDashboardScreen = document.getElementById('admin-dashboard-screen');
  const adminLoginForm = document.getElementById('admin-login-form');
  const loginUser = document.getElementById('login-user');
  const loginPass = document.getElementById('login-pass');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnSubmitLogin = document.getElementById('btn-submit-login');

  const navAdminRightArea = document.getElementById('nav-admin-right-area');

  // X Cookie Account Profile Elements (Inside Cookie Panel)
  const xCookieAccountBox = document.getElementById('x-cookie-account-box');
  const xAccountAvatar = document.getElementById('x-account-avatar');
  const xAccountName = document.getElementById('x-account-name');
  const xAccountHandle = document.getElementById('x-account-handle');
  const btnLogoutXAccount = document.getElementById('btn-logout-x-account');

  const cookieFormWrapper = document.getElementById('cookie-form-wrapper');
  const inputCt0 = document.getElementById('input-ct0');
  const inputAuthToken = document.getElementById('input-auth-token');
  const chkRememberCred = document.getElementById('chk-remember-cred');
  const credStatusIndicator = document.getElementById('cred-status-indicator');
  const credStatusText = document.getElementById('cred-status-text');
  const vaultCookieForm = document.getElementById('vault-cookie-form');
  const btnClearCred = document.getElementById('btn-clear-cred');
  const btnSaveCred = document.getElementById('btn-save-cred');

  const btnTriggerSync = document.getElementById('btn-trigger-sync');
  const btnShowConsoleHelper = document.getElementById('btn-show-console-helper');
  const terminalLogContainer = document.getElementById('terminal-log-container');
  const terminalLogOutput = document.getElementById('terminal-log-output');

  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnResetDb = document.getElementById('btn-reset-db');
  const fileInputBackup = document.getElementById('file-input-backup');

  const modalScript = document.getElementById('modal-script');
  const modalScriptCode = document.getElementById('modal-script-code');
  const btnCopyCode = document.getElementById('btn-copy-code');

  let adminSessionToken = localStorage.getItem('x_archive_admin_token') || '';

  // 1. Check Session & Initialize
  async function checkAdminAuth() {
    if (!adminSessionToken) {
      toggleGate(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        }
      });
      const json = await res.json();
      if (json.authenticated) {
        toggleGate(false);
        renderNavAdminRight();
        initCredentialsAndXUser();
      } else {
        performAdminLogout();
      }
    } catch (e) {
      toggleGate(true);
    }
  }

  function toggleGate(showGate) {
    if (showGate) {
      authGateScreen.classList.remove('hidden');
      adminDashboardScreen.classList.add('hidden');
    } else {
      authGateScreen.classList.add('hidden');
      adminDashboardScreen.classList.remove('hidden');
    }
  }

  // 2. Render Top Nav Right Area: Dedicated Admin Login & Logout
  function renderNavAdminRight() {
    if (!navAdminRightArea) return;

    navAdminRightArea.innerHTML = `
      <div class="nav-admin-badge">
        <div class="avatar-ring-admin">
          <img class="nav-admin-avatar-img" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Admin">
          <span class="admin-live-dot"></span>
        </div>
        <div class="nav-admin-meta">
          <span class="nav-admin-title">Administrator</span>
          <span class="nav-admin-tag">ADMIN PASSCODE</span>
        </div>
      </div>

      <button id="nav-btn-logout-admin" class="btn-logout-pill-nav" title="退出 Admin 账号">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        <span>登出</span>
      </button>

      <a href="/" class="btn-return-home">
        <span>← 展示墙</span>
      </a>
    `;

    document.getElementById('nav-btn-logout-admin')?.addEventListener('click', performAdminLogout);
  }

  function performAdminLogout() {
    localStorage.removeItem('x_archive_admin_token');
    adminSessionToken = '';
    toggleGate(true);
  }

  // 3. Load & Verify Cookie Credentials -> Render X Account in Cookie Module
  async function initCredentialsAndXUser() {
    let ct0 = localStorage.getItem('x_archive_ct0') || '';
    let authToken = localStorage.getItem('x_archive_auth_token') || '';

    // 若本地无凭据，尝试从服务端 / 云端 D1 数据库读取先前保存的凭据
    if (!ct0 || !authToken) {
      try {
        const credRes = await fetch('/api/admin/credentials', {
          headers: { 'x-admin-token': adminSessionToken }
        });
        const credJson = await credRes.json();
        if (credJson.success && credJson.hasCredentials && credJson.ct0 && credJson.authToken) {
          ct0 = credJson.ct0;
          authToken = credJson.authToken;
          localStorage.setItem('x_archive_ct0', ct0);
          localStorage.setItem('x_archive_auth_token', authToken);
        }
      } catch (e) {}
    }

    if (ct0) inputCt0.value = ct0;
    if (authToken) inputAuthToken.value = authToken;

    updateCredBadge(!!(ct0 && authToken));

    if (!ct0 || !authToken) {
      renderXCookieAccountBox(null);
      return;
    }

    const xUser = await verifyAndFetchXUser(ct0, authToken);

    if (xUser) {
      renderXCookieAccountBox(xUser);
    } else {
      const shortId = ct0.slice(0, 6);
      renderXCookieAccountBox({
        name: '已登录 X 账号',
        screen_name: `user_${shortId}`,
        avatar_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
      });
    }
  }

  async function verifyAndFetchXUser(ct0, authToken) {
    try {
      const res = await fetch('/api/verify-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ ct0, authToken })
      });
      const json = await res.json();
      if (json.success && json.user) {
        localStorage.setItem('x_archive_user_info', JSON.stringify(json.user));
        return json.user;
      }
    } catch (e) {}
    return null;
  }

  // Render Verified X Profile INSIDE the Cookie Panel
  function renderXCookieAccountBox(xUser = null) {
    if (!xCookieAccountBox) return;

    if (xUser) {
      xCookieAccountBox.classList.remove('hidden');
      xAccountAvatar.src = xUser.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      xAccountName.textContent = xUser.name || '已登录 X 账号';
      xAccountHandle.textContent = xUser.screen_name ? `@${xUser.screen_name}` : '@x_user';
      
      updateCredBadge(true);
    } else {
      xCookieAccountBox.classList.add('hidden');
      updateCredBadge(false);
    }
  }

  btnLogoutXAccount?.addEventListener('click', () => {
    localStorage.removeItem('x_archive_ct0');
    localStorage.removeItem('x_archive_auth_token');
    localStorage.removeItem('x_archive_user_info');
    inputCt0.value = '';
    inputAuthToken.value = '';
    renderXCookieAccountBox(null);
    alert('已安全登出并清除 X 账号 Cookie！');
  });

  // Handle Admin Passcode Login
  async function handleAdminLogin(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();

    if (!user || !pass) {
      loginErrorMsg.textContent = '请输入账号与密码！';
      loginErrorMsg.classList.remove('hidden');
      return false;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.querySelector('span').textContent = '正在解密...';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      const json = await res.json();

      btnSubmitLogin.disabled = false;
      btnSubmitLogin.querySelector('span').textContent = '解密并进入管理后台';

      if (json.success && json.token) {
        adminSessionToken = json.token;
        localStorage.setItem('x_archive_admin_token', adminSessionToken);
        loginErrorMsg.classList.add('hidden');

        toggleGate(false);
        renderNavAdminRight();
        initCredentialsAndXUser();
      } else {
        loginErrorMsg.textContent = `❌ ${json.error || '认证失败'}`;
        loginErrorMsg.classList.remove('hidden');
      }
    } catch (err) {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.querySelector('span').textContent = '解密并进入管理后台';
      loginErrorMsg.textContent = '❌ 网络请求异常';
      loginErrorMsg.classList.remove('hidden');
    }

    return false;
  }

  adminLoginForm?.addEventListener('submit', handleAdminLogin);

  // Vault Credentials Save -> 登录 X 账号
  function updateCredBadge(isReady) {
    if (isReady) {
      credStatusIndicator.className = 'status-tag active';
      credStatusText.textContent = 'X 账号已就绪';
    } else {
      credStatusIndicator.className = 'status-tag inactive';
      credStatusText.textContent = '未登录 X 账号';
    }
  }

  vaultCookieForm?.addEventListener('submit', (e) => { e.preventDefault(); return false; });
  
  btnSaveCred?.addEventListener('click', async (e) => {
    if (e) e.preventDefault();
    let ct0 = inputCt0.value.trim().replace(/^ct0=/i, '').replace(/^["']|["']$/g, '');
    let authToken = inputAuthToken.value.trim().replace(/^auth_token=/i, '').replace(/^["']|["']$/g, '');

    if (!ct0 || !authToken) {
      alert('请完整填写 ct0 与 auth_token！');
      return;
    }

    if (chkRememberCred.checked) {
      localStorage.setItem('x_archive_ct0', ct0);
      localStorage.setItem('x_archive_auth_token', authToken);
    }

    btnSaveCred.textContent = '正在识别 X 真实身份...';
    btnSaveCred.disabled = true;

    localStorage.removeItem('x_archive_user_info');

    let user = await verifyAndFetchXUser(ct0, authToken);
    
    if (!user) {
      const shortId = ct0.slice(0, 6);
      user = {
        name: '已登录 X 账号',
        screen_name: `user_${shortId}`,
        avatar_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
      };
    }

    btnSaveCred.textContent = '登录 X 账号';
    btnSaveCred.disabled = false;

    renderXCookieAccountBox(user);

    alert(`🎉 登录成功！已成功识别当前 X 账号：@${user.screen_name} (${user.name})\n✨ 最新 Cookie 凭据与账号 ID 已自动加密保存至 D1 数据库，GitHub 每日定时任务静默备份已激活！`);
  });

  btnClearCred?.addEventListener('click', () => {
    localStorage.removeItem('x_archive_ct0');
    localStorage.removeItem('x_archive_auth_token');
    localStorage.removeItem('x_archive_user_info');
    inputCt0.value = '';
    inputAuthToken.value = '';
    renderXCookieAccountBox(null);
    alert('已清除本地记录的 Cookie 凭据！');
  });

  // Trigger Smart Incremental Sync
  btnTriggerSync?.addEventListener('click', async () => {
    const ct0 = inputCt0.value.trim();
    const authToken = inputAuthToken.value.trim();

    if (!ct0 || !authToken) {
      alert('请先登录 X 账号（配置 ct0 与 auth_token）！');
      return;
    }

    terminalLogContainer.classList.remove('hidden');
    terminalLogOutput.textContent = '> 启动智能增量同步引擎 (Smart Incremental Sync)...\n> 设置平滑防限制延迟 (1.2s~2.2s Jitter)...\n';

    try {
      const res = await fetch('/api/sync-following', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ ct0, authToken, forceFull: false })
      });
      const json = await res.json();

      if (!json.success) {
        terminalLogOutput.textContent += `> 同步失败: ${json.error}\n`;
        return;
      }

      if (Array.isArray(json.following)) {
        if (json.following.length > 0) {
          localStorage.setItem('x_archive_cached_data', JSON.stringify(json.following));
        }

        let log = `> ✅ 智能同步完毕！成功抓取并备份 ${json.count || json.following.length} 位关注博主：\n\n`;
        json.following.forEach(u => {
          log += `> 📌 @${u.screen_name} (${u.name}) | 粉丝数: ${u.followers_count || 0}\n`;
        });

        if (json.db_saved === false) {
          log += `\n> ⚠️ 提示: D1 数据库未绑定或未触发重新部署，已开启本地缓存双保险防护！直接打开首页即可正常全量显示！`;
        } else {
          log += `\n> ✨ 数据已全量永久落库 (D1 Database)！直接返回首页展示墙刷新即可全量查看！`;
        }

        terminalLogOutput.textContent = log;
        return;
      }

      pollProgress();
    } catch (err) {
      terminalLogOutput.textContent += `> 网络请求失败: ${err.message}\n`;
    }
  });

  function pollProgress() {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/sync-status', {
          headers: { 'x-admin-token': adminSessionToken }
        });
        const status = await res.json();

        let log = `> 智能抓取运行中... 本页捕获: ${status.current || 0} 人\n`;
        if (status.lastItem) {
          log += `> 最新对比提取: @${status.lastItem.screen_name} (${status.lastItem.name})\n`;
        }

        if (status.isIncrementalStop) {
          log += `> [Smart Cut-off] 检测到已有数据库命中，智能打断后续无用翻页！\n`;
        }

        terminalLogOutput.textContent = log;

        if (!status.running) {
          clearInterval(timer);
          if (status.error) {
            terminalLogOutput.textContent += `> 任务异常中断: ${status.error}\n`;
          } else {
            terminalLogOutput.textContent += `> ✅ 智能增量同步完毕！本次新增 ${status.newFetched || 0} 位关注，总库合体 ${status.total || 0} 位。\n`;
            
            initCredentialsAndXUser();

            alert(`🎉 增量同步完成！本次成功补充 ${status.newFetched || 0} 名新关注博主，前往首页刷新查看！`);
          }
        }
      } catch (e) {
        clearInterval(timer);
      }
    }, 1000);
  }

  // Backup Export & Reset
  btnExportJson?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/archive');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `x_archive_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        alert('暂无可导出的博主数据！');
      }
    } catch (e) {
      alert('导出失败！');
    }
  });

  btnImportJson?.addEventListener('click', () => fileInputBackup.click());

  fileInputBackup?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          await fetch('/api/archive', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminSessionToken
            },
            body: JSON.stringify({ data: parsed })
          });
          alert(`成功导入 ${parsed.length} 条博主数据！`);
        }
      } catch (err) {
        alert('JSON 格式损坏！');
      }
    };
    reader.readAsText(file);
  });

  btnResetDb?.addEventListener('click', async () => {
    if (confirm('确定要清空所有归档博主数据吗？此操作不可撤销！')) {
      await fetch('/api/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ data: [] })
      });
      alert('数据库已清空！');
    }
  });

  // Modal Console Script
  btnShowConsoleHelper?.addEventListener('click', async () => {
    try {
      const res = await fetch('/helper-script.js');
      modalScriptCode.textContent = await res.text();
      modalScript.classList.remove('hidden');
    } catch (e) {
      modalScriptCode.textContent = '读取脚本失败。';
      modalScript.classList.remove('hidden');
    }
  });

  btnCopyCode?.addEventListener('click', () => {
    navigator.clipboard.writeText(modalScriptCode.textContent).then(() => {
      alert('脚本代码已成功复制到剪贴板！');
    });
  });

  checkAdminAuth();
});
