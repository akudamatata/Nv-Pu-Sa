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
  const syncProgressBox = document.getElementById('sync-progress-box');
  const syncProgressStatusText = document.getElementById('sync-progress-status-text');
  const syncProgressCountText = document.getElementById('sync-progress-count-text');
  const syncProgressFill = document.getElementById('sync-progress-fill');
  const terminalLogContainer = document.getElementById('terminal-log-container');
  const terminalLogOutput = document.getElementById('terminal-log-output');

  // GitHub Actions & Cloud Tasks
  const btnTriggerGhFullSync = document.getElementById('btn-trigger-gh-full-sync');
  const btnTriggerGhRefollow = document.getElementById('btn-trigger-gh-refollow');

  // Backup & Restore
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnResetD1 = document.getElementById('btn-reset-d1');
  const fileInputBackup = document.getElementById('file-input-backup');
  const toastContainer = document.getElementById('toast-container');

  // Top HUD Ribbon Elements
  const hudValCred = document.getElementById('hud-val-cred');
  const hudDotCred = document.getElementById('hud-dot-cred');
  const hudValCount = document.getElementById('hud-val-count');
  const hudR2Status = document.getElementById('hud-r2-status');
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

      if (hudR2Status) {
        if (json.r2_bound) {
          hudR2Status.className = 'hud-latency-pill fast';
          hudR2Status.textContent = json.r2_count > 0 ? `${json.r2_count} 图已归档` : '10GB 就绪';
        } else {
          hudR2Status.className = 'hud-latency-pill normal';
          hudR2Status.textContent = '待绑定';
        }
      }

      if (hudD1Latency) {
        if (latencyMs < 120) {
          hudD1Latency.className = 'hud-latency-pill fast';
        } else if (latencyMs < 350) {
          hudD1Latency.className = 'hud-latency-pill normal';
        } else {
          hudD1Latency.className = 'hud-latency-pill slow';
        }
        hudD1Latency.textContent = `${latencyMs}ms`;
      }
    } catch (e) {
      if (hudD1Latency) {
        hudD1Latency.className = 'hud-latency-pill error';
        hudD1Latency.textContent = '离线';
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
        loadBloggerVault();
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
        loadBloggerVault();
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
        setCredStatus(true, '已保存登录凭据');
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

  function resolveMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('/api/media') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    if (url.includes('twimg.com')) {
      return `/api/media?url=${encodeURIComponent(url)}`;
    }
    return url;
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
          xAccountAvatar.src = resolveMediaUrl(json.user.avatar_url);
        }

        xCookieAccountBox.classList.remove('hidden');
        cookieFormWrapper.classList.add('hidden');

        if (chkRememberCred.checked) {
          localStorage.setItem('x_archive_ct0', ct0);
          localStorage.setItem('x_archive_auth_token', authToken);
        }

        if (showNotification) {
          showToast(`成功连接 X 账号: @${json.user.screen_name}`);
        }
      } else {
        setCredStatus(false, 'Cookie 已失效');
        xCookieAccountBox.classList.add('hidden');
        cookieFormWrapper.classList.remove('hidden');
        if (showNotification) {
          showToast('Cookie 凭据无效或已过期');
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
      showToast('请先配置并登录 X Cookie 凭据');
      return;
    }

    btnTriggerSync.disabled = true;
    syncProgressStatusText.textContent = '正在连接 X 接口并增量同步...';
    syncProgressCountText.textContent = '请求中';
    syncProgressFill.style.width = '35%';
    terminalLogOutput.innerHTML = `> [${new Date().toLocaleTimeString()}] 启动智能增量同步任务...\n`;

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
            logTerminal(`[CHECK] 触发智能增量中断：已扫描核对连续 3 位在库博主 (${checkedNames})`);
            logTerminal(`[SUCCESS] 增量核对完成：无新增关注博主，D1 数据库数据已是最新！(库中总计 ${totalDbCount} 人)`);
            syncProgressStatusText.textContent = `增量核对完成！数据已最新，库中总计 ${totalDbCount} 人`;
            syncProgressCountText.textContent = `新增 0 人`;
            showToast(`智能增量核对完成，无新增博主 (库中总计 ${totalDbCount} 人)`);
          } else {
            const newUsers = json.new_users || json.following;
            if (newUsers.length > 0) {
              newUsers.forEach(u => {
                const isR2Stored = u.avatar_url && u.avatar_url.includes('/api/media');
                const r2Tag = isR2Stored ? ' [R2 头像+封面已落库]' : '';
                logTerminal(`[NEW] 抓取到新增博主: @${u.screen_name} (${u.name}) · 粉丝: ${u.followers_count}${r2Tag}`);
              });
            }
            if (json.r2_bound) {
              logTerminal(`[R2] Cloudflare R2 对象存储已成功同步归档 ${json.r2_uploaded_count || (newUsers.length * 2)} 张高清图片 (avatars/ 与 covers/)`);
            } else {
              logTerminal(`[WARN] 未检测到 R2 存储桶绑定 (BUCKET)，图片链接已写入 D1。如需永久冷备请在 Pages 后台添加 R2 绑定: BUCKET`);
            }
            if (json.is_incremental_stop) {
              logTerminal(`[CHECK] 遇到已在库中的博主，已安全触发智能增量中断。`);
            }
            logTerminal(`[SUCCESS] Cloudflare D1 & R2 双轨同步完成！本次新增 ${newUsers.length} 人 (R2 图片 ${json.r2_uploaded_count || 0} 张)，数据库当前总计 ${totalDbCount} 人。`);
            syncProgressStatusText.textContent = `同步完成！本次新增 ${newUsers.length} 位关注博主 (R2 图片 ${json.r2_uploaded_count || 0} 张)`;
            syncProgressCountText.textContent = `新增 ${newUsers.length} 人`;
            showToast(`同步完成！新增 ${newUsers.length} 位博主 (总计 ${totalDbCount} 人)`);
          }
          updateHudArchiveCount();
          return;
        }

        // 模式 B: Node.js 本地后台长轮询任务模式
        showToast('增量同步任务已在后台启动');
        startPollingSyncStatus();
      } else {
        btnTriggerSync.disabled = false;
        showToast(`同步失败: ${json.error}`);
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
            showToast(`同步中断: ${status.error}`);
          } else {
            syncProgressStatusText.textContent = `同步完成！新增 ${status.newFetched || 0} 位博主，当前总计 ${status.total || 0} 位`;
            syncProgressCountText.textContent = `${status.total || 0} 总数`;
            logTerminal(`[SUCCESS] 增量同步结束！本次抓取新增 ${status.newFetched || 0} 人，数据库总计 ${status.total || 0} 人。`);
            showToast(`同步完成！新增 ${status.newFetched || 0} 位博主`);
            updateHudArchiveCount();
            loadBloggerVault();
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
    } else if (safe.includes('[R2]')) {
      lineHtml = `<span class="terminal-line-r2">${safe}</span>`;
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
        showToast(`已导出 ${json.data.length} 条博主归档数据`);
      }
    } catch (e) {
      showToast('导出备份失败');
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
          showToast('备份文件格式错误，需为 JSON 数组');
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
          showToast(`成功导入并还原 ${data.length} 条博主数据`);
          updateHudArchiveCount();
          loadBloggerVault();
        } else {
          showToast(`导入失败: ${resJson.error}`);
        }
      } catch (err) {
        showToast('解析备份 JSON 失败');
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
        logTerminal('[RESET] 博主归档数据已成功清空');
        showToast('博主归档数据已成功清空！');
        updateHudArchiveCount();
        loadBloggerVault();
      } else {
        logTerminal(`[RESET ERROR] 清理失败: ${json.error}`);
        showToast(`清理失败: ${json.error}`);
      }
    } catch (e) {
      logTerminal(`[RESET ERROR] 请求异常: ${e.message}`);
      showToast('清理请求异常');
    }
  });

  // ==================== 6.3 GitHub Actions Cloud Dispatch Handlers ====================
  async function triggerGhAction(actionType, btnEl, originalHtml) {
    if (!adminSessionToken) {
      showToast('请先登录 Admin 授权');
      return;
    }

    const taskName = actionType === 'refollow' ? '超慢速拟人回关 (防封)' : '全量数据深度刷新';
    btnEl.disabled = true;
    const spinnerHtml = `<div class="btn-task-content"><div class="btn-task-title-row"><div class="skeleton-spinner" style="width:13px;height:13px;border-width:1.8px;"></div><span>正在派发云端任务...</span></div></div>`;
    btnEl.innerHTML = spinnerHtml;

    logTerminal(`[GITHUB ACTIONS] 正在向 GitHub 发起【${taskName}】工作流调度请求...`);

    try {
      const res = await fetch('/api/admin/trigger-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminSessionToken
        },
        body: JSON.stringify({ action: actionType })
      });
      const json = await res.json();

      if (json.success) {
        logTerminal(`[SUCCESS] 🚀 ${json.message}`);
        logTerminal(`[GITHUB ACTIONS] 任务已在 GitHub 云端后台开始执行，您可以立即安全关闭网页。`);
        logTerminal(`[GITHUB ACTIONS] 实时运行日志: ${json.actions_url}`);
        showToast(json.message);
      } else {
        logTerminal(`[ERROR] 派发失败: ${json.error}`);
        showToast(`派发失败: ${json.error}`);
      }
    } catch (err) {
      logTerminal(`[ERROR] 派发异常: ${err.message}`);
      showToast('网络请求异常');
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = originalHtml;
    }
  }

  btnTriggerGhFullSync?.addEventListener('click', (e) => {
    triggerClickSpark(e);
    const originalHtml = btnTriggerGhFullSync.innerHTML;
    triggerGhAction('full_sync', btnTriggerGhFullSync, originalHtml);
  });

  btnTriggerGhRefollow?.addEventListener('click', (e) => {
    triggerClickSpark(e);
    const originalHtml = btnTriggerGhRefollow.innerHTML;
    triggerGhAction('refollow', btnTriggerGhRefollow, originalHtml);
  });

  // ==================== 6.5 Blogger Vault Management & Shield Controller (React Bits Motion) ====================
  const panelBloggers = document.getElementById('panel-bloggers');
  const bloggerSearchInput = document.getElementById('blogger-search-input');
  const btnClearBloggerSearch = document.getElementById('btn-clear-blogger-search');
  const filterTabBtns = document.querySelectorAll('.filter-tab-btn');
  const tabCountAll = document.getElementById('tab-count-all');
  const tabCountActive = document.getElementById('tab-count-active');
  const tabCountBlocked = document.getElementById('tab-count-blocked');
  const bloggerSortSelect = document.getElementById('blogger-sort-select');
  const bloggerListContainer = document.getElementById('blogger-list-container');
  const bloggerPaginationInfo = document.getElementById('blogger-pagination-info');
  const bloggerPageIndicator = document.getElementById('blogger-page-indicator');
  const btnPagePrev = document.getElementById('btn-page-prev');
  const btnPageNext = document.getElementById('btn-page-next');
  const btnRefreshBloggers = document.getElementById('btn-refresh-bloggers');
  const btnExportHandles = document.getElementById('btn-export-handles');
  const modalExportHandles = document.getElementById('modal-export-handles');
  const exportHandlesTextarea = document.getElementById('export-handles-textarea');
  const btnCopyExportHandles = document.getElementById('btn-copy-export-handles');

  let bvCurrentKeyword = '';
  let bvCurrentStatus = 'all';
  let bvCurrentSort = 'backed_up_at_desc';
  let bvCurrentPage = 1;
  let bvCurrentLimit = 30;
  let bvTotalPages = 1;
  let bvSearchDebounceTimer = null;
  let bvIsLoading = false;

  // React Bits SpotlightCard Pointer Motion
  panelBloggers?.addEventListener('mousemove', (e) => {
    const rect = panelBloggers.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    panelBloggers.style.setProperty('--spotlight-x', `${x}px`);
    panelBloggers.style.setProperty('--spotlight-y', `${y}px`);
    panelBloggers.classList.add('spotlight-active');
  });

  panelBloggers?.addEventListener('mouseleave', () => {
    panelBloggers.classList.remove('spotlight-active');
  });

  // React Bits CountUp Animation (EaseOutExpo)
  function animateCountUp(element, targetVal, duration = 400) {
    if (!element) return;
    const startVal = parseInt(element.textContent.replace(/,/g, '') || '0', 10) || 0;
    if (startVal === targetVal) {
      element.textContent = targetVal.toLocaleString();
      return;
    }
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startVal + (targetVal - startVal) * easeProgress);
      element.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = targetVal.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  // React Bits ClickSpark Particle Burst
  function triggerClickSpark(e) {
    const x = e.clientX;
    const y = e.clientY;
    const colors = ['#38bdf8', '#f59e0b', '#10b981', '#a855f7', '#ec4899'];
    for (let i = 0; i < 6; i++) {
      const spark = document.createElement('div');
      spark.className = 'click-spark-particle';
      const angle = (Math.PI * 2 / 6) * i + (Math.random() - 0.5);
      const distance = 18 + Math.random() * 16;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);
      spark.style.background = colors[i % colors.length];
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 400);
    }
  }

  function formatFollowersCount(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(num);
  }

  function resolveMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('/api/media') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    if (url.includes('twimg.com')) {
      return `/api/media?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  async function loadBloggerVault() {
    if (!adminSessionToken || bvIsLoading) return;
    bvIsLoading = true;

    if (bloggerListContainer) {
      bloggerListContainer.innerHTML = `
        <div class="blogger-list-loading">
          <div class="skeleton-spinner"></div>
          <span>正在检索博主资产数据...</span>
        </div>
      `;
    }

    try {
      const params = new URLSearchParams({
        keyword: bvCurrentKeyword,
        status: bvCurrentStatus,
        sort: bvCurrentSort,
        page: bvCurrentPage,
        limit: bvCurrentLimit
      });

      const res = await fetch(`/api/admin/bloggers?${params.toString()}`, {
        headers: { 'x-admin-token': adminSessionToken }
      });
      const json = await res.json();

      if (json.success) {
        // 更新统计计数（React Bits CountUp）
        if (json.stats) {
          animateCountUp(tabCountAll, json.stats.total);
          animateCountUp(tabCountActive, json.stats.active);
          animateCountUp(tabCountBlocked, json.stats.blocked);
        }

        bvTotalPages = json.totalPages || 1;
        renderBloggerRows(json.data || []);
        renderPagination(json.total || 0, json.page, json.limit);
      } else {
        bloggerListContainer.innerHTML = `
          <div class="blogger-list-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>加载失败: ${escapeHtml(json.error)}</span>
          </div>
        `;
      }
    } catch (e) {
      bloggerListContainer.innerHTML = `
        <div class="blogger-list-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>网络请求异常，请刷新重试</span>
        </div>
      `;
    } finally {
      bvIsLoading = false;
    }
  }

  function renderBloggerRows(users) {
    if (!bloggerListContainer) return;
    if (!Array.isArray(users) || users.length === 0) {
      bloggerListContainer.innerHTML = `
        <div class="blogger-list-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>未检索到匹配的博主档案</span>
        </div>
      `;
      return;
    }

    const defaultFallbackAvatar = '/api/media?url=' + encodeURIComponent('https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png');

    bloggerListContainer.innerHTML = users.map((u, idx) => {
      const isBlocked = u.is_blocked === 1;
      const avatarSrc = resolveMediaUrl(u.avatar_url) || defaultFallbackAvatar;
      const backupDate = u.backed_up_at ? new Date(u.backed_up_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '未记录';
      const staggerDelay = (idx * 0.02).toFixed(2);

      return `
        <div class="blogger-row ${isBlocked ? 'is-blocked' : ''}" id="blogger-row-${escapeHtml(u.screen_name)}" style="animation-delay: ${staggerDelay}s;">
          <div class="blogger-row-left">
            <div class="blogger-row-avatar-box">
              <img class="blogger-row-avatar" src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(u.name)}" loading="lazy" onerror="this.onerror=null; this.src='${escapeHtml(defaultFallbackAvatar)}'">
            </div>
            <div class="blogger-row-info">
              <div class="blogger-name-line">
                <span class="blogger-row-name">${escapeHtml(u.name)}</span>
                ${u.verified ? `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" title="X 官方认证"><path d="M12 2l2.4 2.4 3.4-.4 1.2 3.2 3 1.6-1 3.2 1 3.2-3 1.6-1.2 3.2-3.4-.4L12 22l-2.4-2.4-3.4.4-1.2-3.2-3-1.6 1-3.2-1-3.2 3-1.6 1.2-3.2 3.4.4L12 2z"/><path d="m9 12 2 2 4-4"/></svg>
                ` : ''}
                <span class="blogger-row-handle">@${escapeHtml(u.screen_name)}</span>
                ${isBlocked ? `
                  <span class="badge-blocked-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span>已在画廊屏蔽</span>
                  </span>
                ` : ''}
              </div>
              <div class="blogger-row-bio" title="${escapeHtml(u.description || '')}">${escapeHtml(u.description || '暂无个人简介')}</div>
            </div>
          </div>

          <div class="blogger-row-right">
            <div class="blogger-row-meta">
              <span class="blogger-followers-pill">${formatFollowersCount(u.followers_count)} 粉丝</span>
              <span class="blogger-backup-date">归档于 ${backupDate}</span>
            </div>

            <div class="blogger-row-actions">
              <a href="https://x.com/${escapeHtml(u.screen_name)}" target="_blank" rel="noopener noreferrer" class="btn-action-icon" title="在 X 中打开个人主页">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>

              <button type="button" class="btn-action-icon btn-copy-handle" data-handle="${escapeHtml(u.screen_name)}" title="复制 @${escapeHtml(u.screen_name)}">
                <svg class="icon-copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <svg class="icon-check hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>

              <button type="button" class="btn-action-block ${isBlocked ? 'to-unblock' : 'to-block'}" data-handle="${escapeHtml(u.screen_name)}" data-blocked="${isBlocked ? '1' : '0'}" title="${isBlocked ? '恢复在公开画廊中展示' : '在公开画廊中屏蔽此博主'}">
                ${isBlocked ? `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>恢复展示</span>
                ` : `
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  <span>屏蔽</span>
                `}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 绑定行内按钮事件
    bloggerListContainer.querySelectorAll('.btn-copy-handle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const handle = btn.getAttribute('data-handle');
        if (!handle) return;
        navigator.clipboard.writeText(`@${handle}`);
        triggerClickSpark(e);

        const iconCopy = btn.querySelector('.icon-copy');
        const iconCheck = btn.querySelector('.icon-check');
        iconCopy?.classList.add('hidden');
        iconCheck?.classList.remove('hidden');

        showToast(`已复制 @${handle} 到剪贴板`);
        setTimeout(() => {
          iconCopy?.classList.remove('hidden');
          iconCheck?.classList.add('hidden');
        }, 1800);
      });
    });

    bloggerListContainer.querySelectorAll('.btn-action-block').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const handle = btn.getAttribute('data-handle');
        const currentBlocked = btn.getAttribute('data-blocked') === '1';
        const targetBlocked = !currentBlocked;

        triggerClickSpark(e);

        // 如果在特定状态视图下操作，触发 React Bits Collapse Exit 动画
        const targetRow = document.getElementById(`blogger-row-${handle}`);
        if (targetRow && ((bvCurrentStatus === 'active' && targetBlocked) || (bvCurrentStatus === 'blocked' && !targetBlocked))) {
          targetRow.classList.add('is-collapsing');
        }

        try {
          const res = await fetch('/api/admin/bloggers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminSessionToken
            },
            body: JSON.stringify({
              screen_name: handle,
              is_blocked: targetBlocked ? 1 : 0
            })
          });
          const json = await res.json();

          if (json.success) {
            showToast(json.message || (targetBlocked ? `已屏蔽 @${handle}` : `已恢复 @${handle}`));
            // 短暂延迟后刷新列表以保持准确性
            setTimeout(() => {
              loadBloggerVault();
              updateHudArchiveCount();
            }, 300);
          } else {
            targetRow?.classList.remove('is-collapsing');
            showToast(`操作失败: ${json.error}`);
          }
        } catch (err) {
          targetRow?.classList.remove('is-collapsing');
          showToast(`请求异常: ${err.message}`);
        }
      });
    });
  }

  function renderPagination(total, page, limit) {
    if (!bloggerPaginationInfo || !bloggerPageIndicator) return;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    bloggerPaginationInfo.textContent = `显示 ${start} - ${end} / 共 ${total} 位博主`;
    bloggerPageIndicator.textContent = `第 ${page} / ${bvTotalPages} 页`;

    if (btnPagePrev) btnPagePrev.disabled = page <= 1;
    if (btnPageNext) btnPageNext.disabled = page >= bvTotalPages;
  }

  // 搜索防抖监听 (250ms)
  bloggerSearchInput?.addEventListener('input', (e) => {
    bvCurrentKeyword = e.target.value.trim();
    if (bvCurrentKeyword) {
      btnClearBloggerSearch?.classList.remove('hidden');
    } else {
      btnClearBloggerSearch?.classList.add('hidden');
    }

    clearTimeout(bvSearchDebounceTimer);
    bvSearchDebounceTimer = setTimeout(() => {
      bvCurrentPage = 1;
      loadBloggerVault();
    }, 250);
  });

  btnClearBloggerSearch?.addEventListener('click', () => {
    if (bloggerSearchInput) bloggerSearchInput.value = '';
    bvCurrentKeyword = '';
    btnClearBloggerSearch.classList.add('hidden');
    bvCurrentPage = 1;
    loadBloggerVault();
  });

  // 状态筛选 Tab 切换
  filterTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bvCurrentStatus = btn.getAttribute('data-status') || 'all';
      bvCurrentPage = 1;
      loadBloggerVault();
    });
  });

  // 排序下拉切换
  bloggerSortSelect?.addEventListener('change', (e) => {
    bvCurrentSort = e.target.value;
    bvCurrentPage = 1;
    loadBloggerVault();
  });

  // 分页按钮
  btnPagePrev?.addEventListener('click', () => {
    if (bvCurrentPage > 1) {
      bvCurrentPage--;
      loadBloggerVault();
    }
  });

  btnPageNext?.addEventListener('click', () => {
    if (bvCurrentPage < bvTotalPages) {
      bvCurrentPage++;
      loadBloggerVault();
    }
  });

  btnRefreshBloggers?.addEventListener('click', (e) => {
    triggerClickSpark(e);
    loadBloggerVault();
    updateHudArchiveCount();
    showToast('已刷新博主档案列表');
  });

  // 导出 Handle 清单 Modal
  btnExportHandles?.addEventListener('click', async (e) => {
    triggerClickSpark(e);
    if (!modalExportHandles || !exportHandlesTextarea) return;

    exportHandlesTextarea.value = '正在提取博主 Handle 列表...';
    modalExportHandles.classList.remove('hidden');

    try {
      // 提取全部满足当前筛选条件的 handle
      const params = new URLSearchParams({
        keyword: bvCurrentKeyword,
        status: bvCurrentStatus,
        sort: bvCurrentSort,
        page: 1,
        limit: 1000
      });
      const res = await fetch(`/api/admin/bloggers?${params.toString()}`, {
        headers: { 'x-admin-token': adminSessionToken }
      });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const handles = json.data.map(u => u.screen_name).filter(Boolean);
        exportHandlesTextarea.value = handles.join('\n');
      } else {
        exportHandlesTextarea.value = '提取失败：' + (json.error || '未知错误');
      }
    } catch (err) {
      exportHandlesTextarea.value = '提取异常：' + err.message;
    }
  });

  btnCopyExportHandles?.addEventListener('click', (e) => {
    if (!exportHandlesTextarea) return;
    triggerClickSpark(e);
    navigator.clipboard.writeText(exportHandlesTextarea.value);
    showToast('已复制全部 Handle 清单到剪贴板');
  });

  // Modal Universal Close Handler
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modalExportHandles?.classList.add('hidden');
    });
  });

  // ==================== 8. Toast Notifications ====================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <span class="toast-svg-icon" style="display: flex; align-items: center; color: var(--accent-primary);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
      </span>
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
