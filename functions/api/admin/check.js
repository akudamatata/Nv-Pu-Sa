/**
 * Cloudflare Pages Functions - Admin Session Check & Profile Persistence
 */
export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get('x-admin-token');
    if (!token) {
      return Response.json({ authenticated: false });
    }

    if (env.DB) {
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
