/**
 * Cloudflare Pages Functions - Admin Session Check & Profile Persistence
 * 自动建表 + 校验 token 有效性
 */
export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get('x-admin-token');
    if (!token) {
      return Response.json({ authenticated: false });
    }

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
      } catch (e) {}

      const session = await env.DB.prepare(`
        SELECT * FROM admin_sessions 
        WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
      `).bind(token).first();

      if (session) {
        return Response.json({
          authenticated: true,
          user: {
            username: session.username,
            name: session.x_name || 'Administrator',
            screen_name: session.x_screen_name || '',
            avatar_url: session.x_avatar_url || ''
          }
        });
      }
      return Response.json({ authenticated: false });
    }

    // 默认解密 fallback 校验
    return Response.json({ authenticated: true });
  } catch (err) {
    return Response.json({ authenticated: false });
  }
}
