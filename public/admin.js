/**
 * Nv-Pu-Sa (X-Archive) v2 - Admin Console & Vault Controller
 * Reactive Session Gate · X Credentials · Smart Sync Engine · JSON Backup
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== 1. Canvas Starfield Particles Background ====================
  function initCanvasParticles() {
    const canvas = document.getElementById('bg-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const numParticles = Math.min(Math.floor((width * height) / 24000), 45);
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 100) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(render);
    }

    render();
  }

  initCanvasParticles();

  // ==================== 2. DOM Elements ====================
  const authGateScreen = document.getElementById('auth-gate-screen');
  const authCardBox = document.getElementById('auth-card-box');
  const adminDashboardScreen = document.getElementById('admin-dashboard-screen');
  const adminLoginForm = document.getElementById('admin-login-form');
  const loginUser = document.getElementById('login-user');
  const loginPass = document.getElementById('login-pass');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const btnAdminLogout = document.getElementById('btn-admin-logout');

  // X Account Card & Form & Loading Skeleton
  const credLoadingSkeleton = document.getElementById('cred-loading-skeleton');
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
  const btnClearCred = document.getElementById('btn-clear-cred');
  const btnSaveCred = document.getElementById('btn-save-cred');
  const credFormMsg = document.getElementById('cred-form-msg');

  // Sync Engine
  const btnTriggerSync = document.getElementById('btn-trigger-sync');
  const btnShowConsoleHelper = document.getElementById('btn-show-console-helper');
  const syncProgressBox = document.getElementById('sync-progress-box');
  const syncProgressStatusText = document.getElementById('sync-progress-status-text');
  const syncProgressCountText = document.getElementById('sync-progress-count-text');
  const syncProgressFill = document.getElementById('sync-progress-fill');
  const terminalLogContainer = document.getElementById('terminal-log-container');
  const terminalLogOutput = document.getElementById('terminal-log-output');

  // Backup & Restore
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnResetD1 = document.getElementById('btn-reset-d1');
  const fileInputBackup = document.getElementById('file-input-backup');

  // Modal
  const modalScript = document.getElementById('modal-script');
  const modalScriptCode = document.getElementById('modal-script-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const toastContainer = document.getElementById('toast-container');

  // Top HUD Ribbon Elements
  const hudValCred = document.getElementById('hud-val-cred');
  const hudDotCred = document.getElementById('hud-dot-cred');
  const hudValCount = document.getElementById('hud-val-count');
  const hudD1Latency = document.getElementById('hud-d1-latency');

  let adminSessionToken = localStorage.getItem('x_archive_admin_token') || '';
  let syncPollingInterval = null;

  async function updateHudArchiveCount() {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/archive');
      const latencyMs = Math.round(performance.now() - startTime);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        if (hudValCount) hudValCount.textContent = `${json.data.length} 位博主`;
      }

      if (hudD1Latency) {
        if (latencyMs < 120) {
          hudD1Latency.className = 'hud-latency-pill fast';
        } else if (latencyMs < 350) {
          hudD1Latency.className = 'hud-latency-pill normal';
        } else {
          hudD1Latency.className = 'hud-latency-pill slow';
        }
        hudD1Latency.textContent = `⚡ ${latencyMs}ms`;
      }
    } catch (e) {
      if (hudD1Latency) {
        hudD1Latency.className = 'hud-latency-pill error';
        hudD1Latency.textContent = '⚡ 离线';
      }
    }
  }

  // ==================== 3. Admin Auth & Session Gate ====================
  async function checkAdminSession() {
    if (!adminSessionToken) {
      showGate(true);
      return;
    }

    // 乐观渲染：token 存在时先直接显示 dashboard，避免登录界面闪烁
    showGate(false);
    btnAdminLogout.classList.remove('hidden');
    updateHudArchiveCount();

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
        initCredentials();
      } else {
        performLogout();
      }
    } catch (e) {
      performLogout();
    }
  }

  function showGate(isLocked) {
    if (isLocked) {
      authGateScreen.classList.remove('hidden');
      adminDashboardScreen.classList.add('hidden');
      btnAdminLogout?.classList.add('hidden');
    } else {
      authGateScreen.classList.add('hidden');
      adminDashboardScreen.classList.remove('hidden');
      btnAdminLogout?.classList.remove('hidden');
      updateHudArchiveCount();
    }
  }

  adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUser.value.trim();
    const password = loginPass.value.trim();

    if (!username || !password) return;

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.querySelector('span').textContent = '正在解密...';
    loginErrorMsg.classList.add('hidden');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();

      if (json.success && json.token) {
        adminSessionToken = json.token;
        localStorage.setItem('x_archive_admin_token', adminSessionToken);
        showGate(false);
        btnAdminLogout.classList.remove('hidden');
        showToast('🔓 通行鉴权成功，已进入控制台');
        initCredentials();
        updateHudArchiveCount();
      } else {
        authCardBox.classList.add('shake-error');
        setTimeout(() => authCardBox.classList.remove('shake-error'), 500);
        loginErrorMsg.textContent = json.error || '账号或通行密码错误';
        loginErrorMsg.classList.remove('hidden');
      }
    } catch (err) {
      loginErrorMsg.textContent = '网络错误，请稍后重试';
      loginErrorMsg.classList.remove('hidden');
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.querySelector('span').textContent = '解密并进入控制台';
    }
  });

  function performLogout() {
    adminSessionToken = '';
    localStorage.removeItem('x_archive_admin_token');
    showGate(true);
    showToast('已安全退出管理控制台');
  }

  btnAdminLogout?.addEventListener('click', performLogout);

  // ==================== 4. X Cookie Credentials Management ====================
  async function initCredentials() {
    // 隐藏状态和表单，展示质感加载骨架屏遮罩
    credLoadingSkeleton?.classList.remove('hidden');
    xCookieAccountBox?.classList.add('hidden');
    cookieFormWrapper?.classList.add('hidden');

    try {
      const res = await fetch('/api/admin/credentials', {
        headers: { 'x-admin-token': adminSessionToken }
      });
      const json = await res.json();

      if (json.success && json.hasCredentials) {
        inputCt0.value = json.ct0 || '';
        inputAuthToken.value = json.authToken || '';
        setCredStatus(true, '已保存 Cookie 凭据');
        await verifyAndShowUser(json.ct0, json.authToken, false);
      } else {
        // Fallback to local storage if remembered
        const localCt0 = localStorage.getItem('x_archive_ct0');
        const localAuth = localStorage.getItem('x_archive_auth_token');
        if (localCt0 && localAuth) {
          inputCt0.value = localCt0;
          inputAuthToken.value = localAuth;
          await verifyAndShowUser(localCt0, localAuth, false);
        } else {
          setCredStatus(false, '未登录 X 账号');
          credLoadingSkeleton?.classList.add('hidden');
          cookieFormWrapper?.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn('获取已存凭据错误:', e);
      credLoadingSkeleton?.classList.add('hidden');
      cookieFormWrapper?.classList.remove('hidden');
    }
  }

  function setCredStatus(isActive, text, handle = '') {
    if (credStatusIndicator) {
      credStatusIndicator.className = `status-tag ${isActive ? 'active' : 'inactive'}`;
    }
    if (credStatusText) credStatusText.textContent = text;

    if (hudValCred) {
      hudValCred.textContent = isActive ? (handle ? `@${handle} · 凭据就绪` : '已连接 X 账号') : '未登录 X 账号';
    }
    if (hudDotCred) {
      hudDotCred.className = `hud-badge-dot ${isActive ? 'active' : 'inactive'}`;
    }
  }

  async function verifyAndShowUser(ct0, authToken, showNotification = true) {
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

      credLoadingSkeleton?.classList.add('hidden');

      if (json.success && json.user) {
        setCredStatus(true, 'X 账号验证成功', json.user.screen_name);
        xAccountName.textContent = json.user.name || '已登录 X 账号';
        xAccountHandle.textContent = `@${json.user.screen_name || 'user'}`;
        if (json.user.avatar_url) {
          xAccountAvatar.src = json.user.avatar_url;
        }

        xCookieAccountBox.classList.remove('hidden');
        cookieFormWrapper.classList.add('hidden');

        if (chkRememberCred.checked) {
          localStorage.setItem('x_archive_ct0', ct0);
          localStorage.setItem('x_archive_auth_token', authToken);
        }

        if (showNotification) {
          showToast(`✅ 成功连接 X 账号: @${json.user.screen_name}`);
        }
      } else {
        setCredStatus(false, 'Cookie 已失效');
        xCookieAccountBox.classList.add('hidden');
        cookieFormWrapper.classList.remove('hidden');
        if (showNotification) {
          showToast('❌ Cookie 凭据无效或已过期');
        }
      }
    } catch (err) {
      credLoadingSkeleton?.classList.add('hidden');
      setCredStatus(false, '验证失败');
      cookieFormWrapper.classList.remove('hidden');
    }
  }

  btnSaveCred?.addEventListener('click', async () => {
    const ct0 = inputCt0.value.trim();
    const authToken = inputAuthToken.value.trim();

    if (!ct0 || !authToken) {
      showCredError('请填写完整 ct0 与 auth_token');
      return;
    }

    btnSaveCred.disabled = true;
    btnSaveCred.textContent = '校验中...';
    credFormMsg.classList.add('hidden');

    await verifyAndShowUser(ct0, authToken, true);

    btnSaveCred.disabled = false;
    btnSaveCred.textContent = '校验并登录 X';
  });

  function showCredError(msg) {
    credFormMsg.textContent = msg;
    credFormMsg.classList.remove('hidden');
  }

  btnLogoutXAccount?.addEventListener('click', () => {
    inputCt0.value = '';
    inputAuthToken.value = '';
    localStorage.removeItem('x_archive_ct0');
    localStorage.removeItem('x_archive_auth_token');
    xCookieAccountBox.classList.add('hidden');
    cookieFormWrapper.classList.remove('hidden');
    setCredStatus(false, '未登录 X 账号');
    showToast('已登出 X 账号凭据');
  });

  btnClearCred?.addEventListener('click', () => {
    inputCt0.value = '';
    inputAuthToken.value = '';
    localStorage.removeItem('x_archive_ct0');
    localStorage.removeItem('x_archive_auth_token');
    credFormMsg.classList.add('hidden');
    showToast('已清空凭据表单');
  });

  // ==================== 5. Smart Sync Engine ====================
  btnTriggerSync?.addEventListener('click', async () => {
    const ct0 = inputCt0.value.trim() || localStorage.getItem('x_archive_ct0');
    const authToken = inputAuthToken.value.trim() || localStorage.getItem('x_archive_auth_token');

    if (!ct0 || !authToken) {
      showToast('⚠️ 请先配置并登录 X Cookie 凭据');
      return;
    }

    btnTriggerSync.disabled = true;
    syncProgressBox.classList.remove('hidden');
    terminalLogContainer.classList.remove('hidden');
    terminalLogOutput.innerHTML = `> [${new Date().toLocaleTimeString()}] 🚀 启动智能增量同步任务...\n`;

    try {
      const res = await fetch('/api/sync-following', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ ct0, authToken })
      });
      const json = await res.json();

      if (json.success) {
        // 模式 A: Cloudflare Pages Edge 模式 (直接返回抓取到的关注博主数组)
        if (Array.isArray(json.following)) {
          btnTriggerSync.disabled = false;
          syncProgressFill.style.width = '100%';

          const totalDbCount = json.total_db_count || json.count || 0;
          const newCount = typeof json.new_count === 'number' ? json.new_count : (json.new_users ? json.new_users.length : 0);

          if (json.is_incremental_stop && newCount === 0) {
            const checkedNames = json.following.slice(0, 3).map(u => `@${u.screen_name}`).join(', ');
            logTerminal(`[CHECK] 🔍 触发智能增量中断：已扫描核对连续 3 位在库博主 (${checkedNames})`);
            logTerminal(`[SUCCESS] ✅ 增量核对完成：无新增关注博主，D1 数据库数据已是最新！(库中总计 ${totalDbCount} 人)`);
            syncProgressStatusText.textContent = `✅ 增量核对完成！数据已最新，库中总计 ${totalDbCount} 人`;
            syncProgressCountText.textContent = `新增 0 人`;
            showToast(`✅ 智能增量核对完成，无新增博主 (库中总计 ${totalDbCount} 人)`);
          } else {
            const newUsers = json.new_users || json.following;
            if (newUsers.length > 0) {
              newUsers.forEach(u => {
                logTerminal(`[NEW] ✨ 抓取到新增博主: @${u.screen_name} (${u.name}) · 粉丝: ${u.followers_count}`);
              });
            }
            if (json.is_incremental_stop) {
              logTerminal(`[CHECK] 🔍 遇到已在库中的博主，已安全触发智能增量中断。`);
            }
            logTerminal(`[SUCCESS] ✅ Cloudflare D1 同步完成！本次新增 ${newUsers.length} 人，数据库当前总计 ${totalDbCount} 人。`);
            syncProgressStatusText.textContent = `✅ 同步完成！本次新增 ${newUsers.length} 位关注博主`;
            syncProgressCountText.textContent = `新增 ${newUsers.length} 人`;
            showToast(`✅ 同步完成！新增 ${newUsers.length} 位博主 (总计 ${totalDbCount} 人)`);
          }
          updateHudArchiveCount();
          return;
        }

        // 模式 B: Node.js 本地后台长轮询任务模式
        showToast('🚀 增量同步任务已在后台启动');
        startPollingSyncStatus();
      } else {
        btnTriggerSync.disabled = false;
        showToast(`❌ 同步失败: ${json.error}`);
        logTerminal(`[ERROR] ${json.error}`);
      }
    } catch (err) {
      btnTriggerSync.disabled = false;
      showToast('网络异常，无法连接同步服务');
    }
  });

  function startPollingSyncStatus() {
    if (syncPollingInterval) clearInterval(syncPollingInterval);

    syncPollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync-status', {
          headers: { 'x-admin-token': adminSessionToken }
        });
        const status = await res.json();

        if (status.running) {
          syncProgressStatusText.textContent = '抓取中 (遇到已存博主自动智能停止)...';
          syncProgressCountText.textContent = `${status.current} 已抓取`;
          syncProgressFill.style.width = '65%';

          if (status.lastItem) {
            logTerminal(`[FETCH] 抓取到: @${status.lastItem.screen_name} (${status.lastItem.name}) · 粉丝: ${status.lastItem.followers_count}`);
          }
        } else {
          clearInterval(syncPollingInterval);
          btnTriggerSync.disabled = false;
          syncProgressFill.style.width = '100%';

          if (status.error) {
            syncProgressStatusText.textContent = `同步异常中断: ${status.error}`;
            logTerminal(`[ERROR] 任务失败: ${status.error}`);
            showToast(`❌ 同步中断: ${status.error}`);
          } else {
            syncProgressStatusText.textContent = `✅ 同步完成！新增 ${status.newFetched || 0} 位博主，当前总计 ${status.total || 0} 位`;
            syncProgressCountText.textContent = `${status.total || 0} 总数`;
            logTerminal(`[SUCCESS] 增量同步结束！本次抓取新增 ${status.newFetched || 0} 人，数据库总计 ${status.total || 0} 人。`);
            showToast(`✅ 同步完成！新增 ${status.newFetched || 0} 位博主`);
            updateHudArchiveCount();
          }
        }
      } catch (err) {
        clearInterval(syncPollingInterval);
        btnTriggerSync.disabled = false;
      }
    }, 1500);
  }

  function logTerminal(msg) {
    const safe = escapeHtml(msg);
    let lineHtml = safe;
    if (safe.includes('[SUCCESS]')) {
      lineHtml = `<span class="terminal-line-success">${safe}</span>`;
    } else if (safe.includes('[ERROR]') || safe.includes('[RESET ERROR]')) {
      lineHtml = `<span class="terminal-line-error">${safe}</span>`;
    } else if (safe.includes('[WARN]')) {
      lineHtml = `<span class="terminal-line-warn">${safe}</span>`;
    } else if (safe.includes('[NEW]') || safe.includes('[CHECK]')) {
      lineHtml = `<span class="terminal-line-info">${safe}</span>`;
    } else if (safe.includes('[FETCH]')) {
      lineHtml = `<span class="terminal-line-fetch">${safe}</span>`;
    }
    terminalLogOutput.innerHTML += `> ${lineHtml}\n`;
    terminalLogOutput.scrollTop = terminalLogOutput.scrollHeight;
  }

  // ==================== 6. Backup Export, Restore & Reset ====================
  btnExportJson?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/archive');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `x_archive_backup_${timestamp}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast(`✅ 已导出 ${json.data.length} 条博主归档数据`);
      }
    } catch (e) {
      showToast('❌ 导出备份失败');
    }
  });

  btnImportJson?.addEventListener('click', () => {
    fileInputBackup.click();
  });

  fileInputBackup?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          showToast('❌ 备份文件格式错误，需为 JSON 数组');
          return;
        }

        const confirmRestore = confirm(`确认从备份文件导入 ${data.length} 位博主数据并覆盖当前数据库吗？`);
        if (!confirmRestore) return;

        const res = await fetch('/api/archive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminSessionToken
          },
          body: JSON.stringify({ data })
        });
        const resJson = await res.json();

        if (resJson.success) {
          showToast(`✅ 成功导入并还原 ${data.length} 条博主数据`);
          updateHudArchiveCount();
        } else {
          showToast(`❌ 导入失败: ${resJson.error}`);
        }
      } catch (err) {
        showToast('❌ 解析备份 JSON 失败');
      }
    };
    reader.readAsText(file);
  });

  // 清空博主归档数据（仅清理博主，保留 X 登录凭据）
  btnResetD1?.addEventListener('click', async () => {
    const confirmed = confirm('确认清空所有已归档的博主数据吗？\n\n此操作不会影响已保存的 X 登录凭据。');
    if (!confirmed) return;

    try {
      logTerminal('[RESET] 正在清空博主归档数据...');
      const res = await fetch('/api/admin/reset-d1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ clearCredentials: false })
      });
      const json = await res.json();

      if (json.success) {
        logTerminal('[RESET] ✅ 博主归档数据已清空');
        showToast('✅ 博主归档数据已成功清空！');
        updateHudArchiveCount();
      } else {
        logTerminal(`[RESET ERROR] ❌ 清理失败: ${json.error}`);
        showToast(`❌ 清理失败: ${json.error}`);
      }
    } catch (e) {
      logTerminal(`[RESET ERROR] ❌ 请求异常: ${e.message}`);
      showToast('❌ 清理请求异常');
    }
  });

  // ==================== 7. Console Helper Script Modal ====================
  const helperScriptCode = `(async function() {
  console.log("🚀 开始抓取关注博主数据...");
  // 提取当前页面博主
  const users = [];
  document.querySelectorAll('[data-testid="UserCell"]').forEach(cell => {
    const nameEl = cell.querySelector('div[dir="ltr"] span');
    const handleEl = cell.querySelector('a[href^="/"]');
    if (nameEl && handleEl) {
      users.push({
        name: nameEl.textContent,
        screen_name: handleEl.getAttribute('href').replace('/', '')
      });
    }
  });
  console.log("✅ 抓取到 " + users.length + " 位博主");
  console.save(users, "x_followings.json");
})();`;

  btnShowConsoleHelper?.addEventListener('click', () => {
    modalScriptCode.textContent = helperScriptCode;
    modalScript.classList.remove('hidden');
  });

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => modalScript.classList.add('hidden'));
  });

  btnCopyCode?.addEventListener('click', () => {
    navigator.clipboard.writeText(helperScriptCode);
    showToast('📋 已复制助手脚本到剪贴板');
  });

  // ==================== 8. Toast Notifications ====================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <span style="color: var(--accent-primary);">✦</span>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // Initialize Admin Session & Realtime Latency Heartbeat
  checkAdminSession();
  setInterval(() => {
    if (adminSessionToken && !adminDashboardScreen.classList.contains('hidden')) {
      updateHudArchiveCount();
    }
  }, 15000);

});
