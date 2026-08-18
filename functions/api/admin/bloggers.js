/**
 * Cloudflare Pages Functions - Admin Blogger Vault Management API
 * 1. 鉴权校验 (x-admin-token)
 * 2. 多维搜索 (Keyword in name/screen_name/description)
 * 3. 状态筛选 (all / active / blocked)
 * 4. 排序与分页
 * 5. 一键切换屏蔽状态 (Toggle Block)
 */

function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

async function verifyAdminSession(request, db) {
  const token = request.headers.get('x-admin-token');
  if (!token) return null;
  if (!db) return null;

  try {
    const session = await db.prepare(`
      SELECT * FROM admin_sessions 
      WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
    `).bind(token).first();
    return session;
  } catch (e) {
    return null;
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const db = getD1(env);
    if (!db) {
      return Response.json({ success: false, error: 'D1 数据库未绑定' }, { status: 500 });
    }

    const session = await verifyAdminSession(request, db);
    if (!session) {
      return Response.json({ success: false, error: '未授权或登录已过期' }, { status: 401 });
    }

    // 确保字段兼容存在
    try {
      await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_blocked INTEGER DEFAULT 0`).run();
    } catch (e) {}
    try {
      await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_suspended INTEGER DEFAULT 0`).run();
    } catch (e) {}

    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') || '').trim();
    const status = url.searchParams.get('status') || 'all'; // all, active, blocked
    const sort = url.searchParams.get('sort') || 'backed_up_at_desc';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') || '30', 10)));
    const offset = (page - 1) * limit;

    // 1. 统计总体指标 (Stats)
    const statsRow = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN COALESCE(is_blocked, 0) = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN COALESCE(is_blocked, 0) = 1 THEN 1 ELSE 0 END) as blocked
      FROM bloggers
    `).first();

    const stats = {
      total: statsRow?.total || 0,
      active: statsRow?.active || 0,
      blocked: statsRow?.blocked || 0
    };

    // 2. 构造查询条件
    const conditions = [];
    const bindings = [];

    if (status === 'active') {
      conditions.push(`COALESCE(is_blocked, 0) = 0`);
    } else if (status === 'blocked') {
      conditions.push(`COALESCE(is_blocked, 0) = 1`);
    }

    if (keyword) {
      const cleanKw = `%${keyword.toLowerCase()}%`;
      conditions.push(`(
        LOWER(screen_name) LIKE ? OR 
        LOWER(name) LIKE ? OR 
        LOWER(COALESCE(description, '')) LIKE ?
      )`);
      bindings.push(cleanKw, cleanKw, cleanKw);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 排序策略
    let orderClause = 'ORDER BY backed_up_at DESC';
    if (sort === 'backed_up_at_asc') {
      orderClause = 'ORDER BY backed_up_at ASC';
    } else if (sort === 'followers_desc') {
      orderClause = 'ORDER BY followers_count DESC, backed_up_at DESC';
    } else if (sort === 'followers_asc') {
      orderClause = 'ORDER BY followers_count ASC, backed_up_at DESC';
    } else if (sort === 'name_asc') {
      orderClause = 'ORDER BY name ASC';
    }

    // 3. 统计当前筛选条件下的总数
    const countSql = `SELECT COUNT(*) as filtered_count FROM bloggers ${whereClause}`;
    const countStmt = bindings.length > 0 ? db.prepare(countSql).bind(...bindings) : db.prepare(countSql);
    const countRes = await countStmt.first();
    const filteredCount = countRes?.filtered_count || 0;
    const totalPages = Math.ceil(filteredCount / limit) || 1;

    // 4. 分页获取数据
    const querySql = `
      SELECT id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at, COALESCE(is_blocked, 0) as is_blocked
      FROM bloggers
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const queryBindings = [...bindings, limit, offset];
    const { results = [] } = await db.prepare(querySql).bind(...queryBindings).all();

    return Response.json({
      success: true,
      data: results,
      total: filteredCount,
      page,
      limit,
      totalPages,
      stats
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = getD1(env);
    if (!db) {
      return Response.json({ success: false, error: 'D1 数据库未绑定' }, { status: 500 });
    }

    const session = await verifyAdminSession(request, db);
    if (!session) {
      return Response.json({ success: false, error: '未授权或登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { screen_name, is_blocked } = body;

    if (!screen_name) {
      return Response.json({ success: false, error: '缺少 screen_name 参数' }, { status: 400 });
    }

    const targetBlocked = is_blocked ? 1 : 0;

    await db.prepare(`
      UPDATE bloggers 
      SET is_blocked = ? 
      WHERE screen_name = ?
    `).bind(targetBlocked, screen_name).run();

    return Response.json({
      success: true,
      message: targetBlocked === 1 ? `已屏蔽 @${screen_name}（画廊已隐藏）` : `已恢复 @${screen_name} 画廊展示`,
      screen_name,
      is_blocked: targetBlocked
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
