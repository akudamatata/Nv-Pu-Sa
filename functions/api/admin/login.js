/**
 * Cloudflare Pages Functions - Admin Login & D1 Session Persistence
 * 自动建表 + 持久化 token 至 D1
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    const validUser = String(env.ADMIN_USER || 'admin').trim();
    const validPass = String(env.ADMIN_PASS || 'admin123').trim();

    if (username === validUser && password === validPass) {
      const token = crypto.randomUUID();
      // 30 天持久化 token
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (env.DB) {
        try {
          // 自动建表，确保 admin_sessions 表存在
          await env.DB.prepare(`
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

          await env.DB.prepare(`
            INSERT INTO admin_sessions (token, username, expires_at)
            VALUES (?, ?, ?)
          `).bind(token, username, expiresAt).run();
        } catch (e) {
          console.error('D1 admin_sessions 写入异常:', e.message);
        }
      }

      return Response.json({ success: true, token });
    }

    return Response.json({ success: false, error: '账号或密码错误' }, { status: 401 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
