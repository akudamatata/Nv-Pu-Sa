/**
 * Cloudflare Pages Functions - Archive API (D1 Database Backend & Auto Schema Init)
 */
export async function onRequestGet({ env }) {
  try {
    if (env.DB) {
      // 自动建表保护
      await env.DB.prepare(`
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

      const { results } = await env.DB.prepare(`
        SELECT * FROM bloggers ORDER BY followers_count DESC
      `).all();
      return Response.json({ success: true, count: results.length, data: results });
    }
    return Response.json({ success: true, count: 0, data: [] });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    if (!Array.isArray(data)) {
      return Response.json({ success: false, error: '数据必须为 JSON 数组' }, { status: 400 });
    }

    if (env.DB) {
      await env.DB.prepare(`
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

      const stmt = env.DB.prepare(`
        INSERT OR REPLACE INTO bloggers (
          id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const batch = data.map(item => {
        return stmt.bind(
          item.id || item.screen_name,
          item.screen_name,
          item.name || item.screen_name,
          item.avatar_url || '',
          item.cover_url || '',
          item.followers_count || 0,
          item.description || '',
          item.verified ? 1 : 0,
          item.backed_up_at || new Date().toISOString()
        );
      });

      if (batch.length > 0) {
        await env.DB.batch(batch);
      }
    }

    return Response.json({ success: true, count: data.length });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete({ env }) {
  try {
    if (env.DB) {
      await env.DB.prepare(`DELETE FROM bloggers`).run();
    }
    return Response.json({ success: true, message: '数据库已清空' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
