/**
 * Cloudflare Pages Functions - Admin D1 Database Reset API
 * 支持一键清理 Cloudflare D1 中的 bloggers 归档表与相关数据
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get('x-admin-token');
    if (!token) {
      return Response.json({ success: false, error: '未授权：缺少 Admin Token' }, { status: 401 });
    }

    const db = getD1(env);
    if (!db) {
      return Response.json({ 
        success: false, 
        error: '未检测到绑定的 Cloudflare D1 数据库 (请确认 Pages 后台已添加 D1 绑定: nv_pu_sa_db)' 
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const clearCredentials = !!body.clearCredentials;

    // 1. 清空 bloggers 归档博主表
    try {
      await db.prepare(`DELETE FROM bloggers`).run();
    } catch (e) {
      // 若表尚未建立，自动创建结构表
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS bloggers (
          id TEXT PRIMARY KEY,
          screen_name TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          cover_url TEXT,
          followers_count INTEGER DEFAULT 0,
          description TEXT,
          verified INTEGER DEFAULT 0,
          backed_up_at TEXT
        )
      `).run();
    }

    // 2. 若选择连同凭据一并清理
    if (clearCredentials) {
      try {
        await db.prepare(`DELETE FROM admin_credentials`).run();
      } catch (e) {}
    }

    return Response.json({
      success: true,
      message: 'Cloudflare D1 数据库已成功清理重置！',
      cleared: {
        bloggers: true,
        credentials: clearCredentials
      }
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
