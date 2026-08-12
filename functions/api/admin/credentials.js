/**
 * Cloudflare Pages Functions - Get Stored Credentials from D1
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
      // 鉴权 admin session
      const session = await db.prepare(`
        SELECT * FROM admin_sessions 
        WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
      `).bind(token).first();

      if (!session) {
        return Response.json({ success: false, error: 'Session 已过期或无效' }, { status: 401 });
      }

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
      } catch (e) {
        // 表若尚未建立或没有记录
      }
    }

    return Response.json({ success: true, hasCredentials: false });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
