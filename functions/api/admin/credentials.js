/**
 * Cloudflare Pages Functions - Get Stored Credentials from D1
 * 自动建表 + 从 D1 拉取已保存的 X Cookie 凭据
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestGet({ request, env }) {
  try {
    const token = request.headers.get('x-admin-token');
    if (!token) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const db = getD1(env);
    if (db) {
      // 自动建表，确保 admin_sessions 表存在
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS admin_sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            x_name TEXT,
            x_screen_name TEXT,
            x_avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
          )
        `).run();
      } catch (e) {}

      // 鉴权 admin session
      const session = await db.prepare(`
        SELECT * FROM admin_sessions 
        WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
      `).bind(token).first();

      if (!session) {
        return Response.json({ success: false, error: 'Session 已过期或无效' }, { status: 401 });
      }

      // 自动建表，确保 admin_credentials 表存在
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS admin_credentials (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            ct0 TEXT NOT NULL,
            auth_token TEXT NOT NULL,
            user_id TEXT,
            updated_at TEXT
          )
        `).run();
      } catch (e) {}

      // 从 D1 读取保存的凭据
      try {
        const cred = await db.prepare(`
          SELECT * FROM admin_credentials WHERE id = 1
        `).first();

        if (cred && cred.ct0 && cred.auth_token) {
          return Response.json({
            success: true,
            hasCredentials: true,
            ct0: cred.ct0,
            authToken: cred.auth_token,
            user_id: cred.user_id || ''
          });
        }
      } catch (e) {}
    }

    return Response.json({ success: true, hasCredentials: false });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
