/**
 * Cloudflare Pages Functions - Admin Login & D1 Session Persistence
 */
export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    const validUser = env.ADMIN_USER || 'admin';
    const validPass = env.ADMIN_PASS || 'admin123';

    if (username === validUser && password === validPass) {
      const token = crypto.randomUUID();
      // 30 天持久化 token
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (env.DB) {
        await env.DB.prepare(`
          INSERT INTO admin_sessions (token, username, expires_at)
          VALUES (?, ?, ?)
        `).bind(token, username, expiresAt).run();
      }

      return Response.json({ success: true, token });
    }

    return Response.json({ success: false, error: '账号或密码错误' }, { status: 401 });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
