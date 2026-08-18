/**
 * Cloudflare Pages Functions - Archive API (D1 Database Backend & Multi-Binding Compatible)
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestGet({ env }) {
  try {
    const db = getD1(env);
    if (db) {
      // 自动创表保护与 is_blocked / is_suspended 兼容升级
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
          backed_up_at TEXT,
          is_blocked INTEGER DEFAULT 0,
          is_suspended INTEGER DEFAULT 0
        )
      `).run();

      try {
        await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_blocked INTEGER DEFAULT 0`).run();
      } catch (e) {}
      try {
        await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_suspended INTEGER DEFAULT 0`).run();
      } catch (e) {}

      const { results = [] } = await db.prepare(`
        SELECT * FROM bloggers 
        WHERE COALESCE(is_blocked, 0) = 0 
        ORDER BY followers_count DESC
      `).all();

      const bucket = env.BUCKET || env.R2 || env.MEDIA_BUCKET || env.x_archive_media || env['x-archive-media'] || null;
      let r2ImageCount = 0;
      if (bucket) {
        try {
          const listed = await bucket.list({ limit: 1000 });
          r2ImageCount = listed.objects ? listed.objects.length : 0;
        } catch (e) {
          console.warn('R2 list error:', e);
        }
      }

      return Response.json({
        success: true,
        count: results.length,
        data: results,
        db_bound: true,
        r2_bound: !!bucket,
        r2_count: r2ImageCount
      });
    }
    return Response.json({ success: true, count: 0, data: [], db_bound: false, r2_bound: false, note: 'D1 database not bound' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { data } = await request.json();
    if (!Array.isArray(data)) {
      return Response.json({ success: false, error: 'Data must be an array' }, { status: 400 });
    }

    const db = getD1(env);
    if (db) {
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
          backed_up_at TEXT,
          is_blocked INTEGER DEFAULT 0,
          is_suspended INTEGER DEFAULT 0
        )
      `).run();

      try {
        await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_blocked INTEGER DEFAULT 0`).run();
      } catch (e) {}
      try {
        await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_suspended INTEGER DEFAULT 0`).run();
      } catch (e) {}

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bloggers (
          id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at, is_blocked, is_suspended
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          item.backed_up_at || new Date().toISOString(),
          item.is_blocked ? 1 : 0,
          item.is_suspended || 0
        );
      });

      if (batch.length > 0) {
        await db.batch(batch);
      }
    }

    return Response.json({ success: true, count: data.length });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete({ env }) {
  try {
    const db = getD1(env);
    if (db) {
      await db.prepare(`DELETE FROM bloggers`).run();
    }
    return Response.json({ success: true, message: '数据库已清空' });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
