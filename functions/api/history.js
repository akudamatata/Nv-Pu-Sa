/**
 * Cloudflare Pages Functions - Profile Mutation Timeline API
 * 查询指定博主的历次变迁历史档案 (头像、昵称、Handle、简介、Banner 演变)
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const idStr = url.searchParams.get('id') || url.searchParams.get('id_str') || '';
    const screenName = url.searchParams.get('screen_name') || '';

    if (!idStr && !screenName) {
      return Response.json({ success: false, error: '缺少 id 或 screen_name 参数' }, { status: 400 });
    }

    const db = getD1(env);
    if (!db) {
      return Response.json({ success: true, data: [], source: 'offline' });
    }

    // 自动建表保护
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS blogger_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_str TEXT NOT NULL,
        field TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let queryId = idStr;
    if (!queryId && screenName) {
      const blogger = await db.prepare(`
        SELECT id, screen_name FROM bloggers WHERE LOWER(screen_name) = LOWER(?)
      `).bind(screenName).first();
      if (blogger) {
        queryId = blogger.id;
      }
    }

    if (!queryId) {
      return Response.json({ success: true, data: [] });
    }

    const { results = [] } = await db.prepare(`
      SELECT id, id_str, field, old_value, new_value, changed_at 
      FROM blogger_history 
      WHERE id_str = ? 
      ORDER BY changed_at DESC, id DESC 
      LIMIT 50
    `).bind(String(queryId)).all();

    return Response.json({
      success: true,
      data: results
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('History API error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
