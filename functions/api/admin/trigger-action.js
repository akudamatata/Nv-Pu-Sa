/**
 * Cloudflare Pages Functions - Trigger GitHub Actions Endpoint
 * 1. 鉴权校验 (x-admin-token)
 * 2. 从 env 读取 GITHUB_TOKEN (PAT)
 * 3. 派发 GitHub Actions 工作流 (auto-sync.yml / re-follow.yml)
 */

function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

async function verifyAdminSession(request, db) {
  const token = request.headers.get('x-admin-token');
  if (!token) return null;
  if (!db) return null;

  try {
    const session = await db.prepare(`
      SELECT * FROM admin_sessions 
      WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
    `).bind(token).first();
    return session;
  } catch (e) {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = getD1(env);
    if (!db) {
      return Response.json({ success: false, error: 'D1 数据库未绑定' }, { status: 500 });
    }

    const session = await verifyAdminSession(request, db);
    if (!session) {
      return Response.json({ success: false, error: '未授权或登录已过期' }, { status: 401 });
    }

    const ghToken = env.GITHUB_TOKEN || env.GH_PAT || env.PAT || env.GH_TOKEN || null;
    if (!ghToken) {
      return Response.json({
        success: false,
        error: '未配置 GitHub PAT Token。请在 Cloudflare Pages 项目后台【设置 ➔ 环境变量】中添加 GITHUB_TOKEN 变量（需具备 Actions 写入权限）。'
      }, { status: 400 });
    }

    const body = await request.json();
    const actionType = body.action || 'full_sync'; // 'full_sync' | 'refollow'

    const repoOwner = 'akudamatata';
    const repoName = 'Nv-Pu-Sa';
    const workflowFile = actionType === 'refollow' ? 're-follow.yml' : 'full-sync.yml';

    const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

    const ghRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${ghToken.trim()}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Nv-Pu-Sa-Admin-Agent'
      },
      body: JSON.stringify({
        ref: 'main'
      })
    });

    if (ghRes.status === 204) {
      const taskName = actionType === 'refollow' ? '极慢速拟人回关 (防封)' : '全量数据深度刷新';
      return Response.json({
        success: true,
        message: `🚀 已成功向 GitHub 派发【${taskName}】离线任务！`,
        action: actionType,
        actions_url: `https://github.com/${repoOwner}/${repoName}/actions`
      });
    }

    const errText = await ghRes.text();
    return Response.json({
      success: false,
      error: `GitHub 响应异常 (HTTP ${ghRes.status}): ${errText || '请检查 GITHUB_TOKEN 权限'}`
    }, { status: 502 });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
