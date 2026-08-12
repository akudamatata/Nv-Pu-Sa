const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const TwitterSpider = require('./twitter-spider');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudflare Pages / Local Env Configuration
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_SECRET_SESSION = 'sess_' + Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 路由：Admin 管理后台页面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const DATA_DIR = path.join(__dirname, 'data');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archive.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const DEMO_FILE = path.join(__dirname, 'demo-data.json');

// 保证数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 工具函数：获取与保存凭据
function getSavedCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    } catch (e) {}
  }
  return null;
}

function saveCredentials(cred) {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(cred, null, 2), 'utf8');
}

// 缓存与状态管理
let currentSyncTask = {
  running: false,
  total: 0,
  current: 0,
  newFetched: 0,
  lastItem: null,
  isIncrementalStop: false,
  error: null
};

// 工具函数：获取归档数据
function getArchivedData() {
  if (fs.existsSync(ARCHIVE_FILE)) {
    try {
      const raw = fs.readFileSync(ARCHIVE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {}
  }
  if (fs.existsSync(DEMO_FILE)) {
    try {
      const raw = fs.readFileSync(DEMO_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {}
  }
  return [];
}

// 工具函数：保存归档数据
function saveArchivedData(data) {
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ==================== 1. 公开 API (首页访问) ====================

// 获取公开归档博主列表
app.get('/api/archive', (req, res) => {
  const data = getArchivedData();
  res.json({ success: true, count: data.length, data });
});

// ==================== 2. ADMIN 鉴权 API ====================

// Admin 登录鉴权 (读取 CF Pages 环境变量或默认配置)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ 
      success: true, 
      token: ADMIN_SECRET_SESSION,
      message: '鉴权成功' 
    });
  }
  return res.status(401).json({ success: false, error: '用户名或密码错误' });
});

// Admin 检查 Session 状态
app.post('/api/admin/check', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_SECRET_SESSION) {
    return res.json({ success: true, authenticated: true });
  }
  return res.json({ success: true, authenticated: false });
});

// 中间件：校验 Admin 权限
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_SECRET_SESSION) {
    return next();
  }
  return res.status(403).json({ success: false, error: '未授权：请先登录 Admin 管理账号' });
}

// ==================== 3. 私密 Admin 操作 API ====================

// 获取已保存的凭据 (受保护)
app.get('/api/admin/credentials', requireAdmin, (req, res) => {
  const cred = getSavedCredentials();
  if (cred && cred.ct0 && cred.authToken) {
    return res.json({
      success: true,
      hasCredentials: true,
      ct0: cred.ct0,
      authToken: cred.authToken,
      user_id: cred.user_id || ''
    });
  }
  return res.json({ success: true, hasCredentials: false });
});

// 覆盖/重置保存本地数据库 (受保护)
app.post('/api/archive', requireAdmin, (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ success: false, error: '数据格式无效' });
  }
  saveArchivedData(data);
  res.json({ success: true, count: data.length });
});

// 校验 Cookie 是否有效 (受保护)
app.post('/api/verify-cookie', requireAdmin, async (req, res) => {
  const { authToken, ct0 } = req.body;
  if (!authToken || !ct0) {
    return res.status(400).json({ success: false, error: '缺少 authToken 或 ct0' });
  }

  try {
    const spider = new TwitterSpider(authToken, ct0);
    const userInfo = await spider.verifyCredentials();
    saveCredentials({ ct0, authToken, user_id: userInfo.user_id || '' });
    res.json({ success: true, user: userInfo });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 一键智能增量同步关注列表 (受保护)
app.post('/api/sync-following', requireAdmin, async (req, res) => {
  const { authToken, ct0, forceFull = false } = req.body;
  if (!authToken || !ct0) {
    return res.status(400).json({ success: false, error: '请提供 auth_token 与 ct0' });
  }

  if (currentSyncTask.running) {
    return res.status(409).json({ success: false, error: '同步任务正在运行中...' });
  }

  currentSyncTask = {
    running: true,
    total: 0,
    current: 0,
    newFetched: 0,
    lastItem: null,
    isIncrementalStop: false,
    error: null
  };

  res.json({ success: true, message: '智能增量同步任务已启动' });

  // 后台进行增量爬取
  (async () => {
    try {
      const existingData = getArchivedData();
      const spider = new TwitterSpider(authToken, ct0);

      const fetchedUsers = await spider.fetchAllFollowing(
        existingData, 
        (count, lastUser, isIncrementalStop) => {
          currentSyncTask.current = count;
          currentSyncTask.lastItem = lastUser;
          currentSyncTask.isIncrementalStop = isIncrementalStop;
        }, 
        forceFull
      );

      const existingMap = new Map(existingData.map(u => [u.screen_name.toLowerCase(), u]));
      let newFetchedCount = 0;

      if (Array.isArray(fetchedUsers)) {
        fetchedUsers.forEach(u => {
          if (!existingMap.has(u.screen_name.toLowerCase())) {
            newFetchedCount++;
          }
          existingMap.set(u.screen_name.toLowerCase(), u);
        });
      }

      const mergedList = Array.from(existingMap.values());
      saveArchivedData(mergedList);

      currentSyncTask.running = false;
      currentSyncTask.total = mergedList.length;
      currentSyncTask.newFetched = newFetchedCount;
      console.log(`✅ 智能增量同步完成！本次抓取新增 ${newFetchedCount} 人，当前数据库总计 ${mergedList.length} 人。`);
    } catch (err) {
      console.error('❌ 同步过程中发生错误:', err);
      currentSyncTask.running = false;
      currentSyncTask.error = err.message;
    }
  })();
});

// 查询当前同步进度 (受保护)
app.get('/api/sync-status', requireAdmin, (req, res) => {
  res.json(currentSyncTask);
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 X-Archive v6.0 (Smart Incremental Sync Enabled) 运行中！`);
  console.log(`👉 首页展示墙: http://localhost:${PORT}`);
  console.log(`🔒 私密后台: http://localhost:${PORT}/admin`);
  console.log(`🔑 默认 Admin 登录: USER=${ADMIN_USER}, PASS=${ADMIN_PASS}`);
  console.log(`=================================================`);
});
