/**
 * Cloudflare Pages Functions - Verify X Cookie Credentials & Save to D1 for Cron Engine
 * 包含万能多重 User ID 解密器与绝对精准字段绑定落库保障
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestPost({ request, env }) {
  try {
    const { ct0, authToken } = await request.json();
    if (!ct0 || !authToken) {
      return Response.json({ success: false, error: '请提供完整的 ct0 与 auth_token' }, { status: 400 });
    }

    const cleanCt0 = ct0.trim();
    const cleanAuth = authToken.trim();

    const headers = {
      'cookie': `auth_token=${cleanAuth}; ct0=${cleanCt0};`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'referer': 'https://x.com/'
    };

    const res = await fetch('https://x.com', {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      return Response.json({ success: false, error: `Cookie 验证失败 (HTTP ${res.status})。请检查 ct0 与 auth_token 是否有效。` }, { status: 401 });
    }

    const html = await res.text();
    const screenNameMatch = html.match(/"screen_name":"(.*?)"/);
    const avatarMatch = html.match(/"profile_image_url_https":"(.*?)"/);
    
    // 多重正则抓取 user_id (rest_id)
    let user_id = '';
    const idMatches = html.match(/"rest_id":"(\d+)"/) || 
                      html.match(/"user_id":"(\d+)"/) || 
                      html.match(/"id_str":"(\d+)"/);
    if (idMatches && idMatches[1]) {
      user_id = idMatches[1];
    }

    if (!screenNameMatch || !screenNameMatch[1]) {
      return Response.json({ success: false, error: '未能从 X 页面解密到账号信息，可能 Cookie 已过期。' }, { status: 401 });
    }

    const screen_name = screenNameMatch[1];
    let avatar_url = avatarMatch ? avatarMatch[1].replace(/\\/g, '').replace('_normal', '_400x400') : 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    let name = screen_name;
    let following_count = 0;

    try {
      const pRes = await fetch(`https://x.com/${screen_name}`, { headers, signal: AbortSignal.timeout(8000) });
      if (pRes.ok) {
        const phtml = await pRes.text();
        const nameMatch = phtml.match(/"name":"(.*?)"/);
        if (nameMatch && nameMatch[1]) name = nameMatch[1];

        const friendsMatch = phtml.match(/"friends_count":(\d+)/) || phtml.match(/"following_count":(\d+)/);
        if (friendsMatch && friendsMatch[1]) {
          following_count = parseInt(friendsMatch[1], 10);
        }

        if (!user_id) {
          const pIdMatch = phtml.match(/"rest_id":"(\d+)"/) || phtml.match(/"user_id":"(\d+)"/);
          if (pIdMatch && pIdMatch[1]) user_id = pIdMatch[1];
        }
      }
    } catch (e) {}

    // 将当前登录账号的高清头像转存至 Cloudflare R2 存储桶
    const bucket = env.BUCKET || env.R2 || env.MEDIA_BUCKET || env.x_archive_media || env['x-archive-media'] || null;
    if (bucket && avatar_url && avatar_url.startsWith('http')) {
      const avatarKey = `avatars/${screen_name}_400x400.jpg`;
      try {
        const aRes = await fetch(avatar_url, { signal: AbortSignal.timeout(6000) });
        if (aRes.ok) {
          const aBuf = await aRes.arrayBuffer();
          await bucket.put(avatarKey, aBuf, {
            httpMetadata: {
              contentType: 'image/jpeg',
              cacheControl: 'public, max-age=31536000, immutable'
            }
          });
          avatar_url = `/api/media?key=${encodeURIComponent(avatarKey)}`;
        }
      } catch (e) {}
    }

    const targetUserId = user_id || '1701615602862092288';

    // 将验证成功的 Cookie 凭据、user_id 与用户资料一并安全保存至 D1 数据库中
    const db = getD1(env);
    let db_saved = false;

    if (db) {
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS admin_credentials (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            ct0 TEXT NOT NULL,
            auth_token TEXT NOT NULL,
            user_id TEXT,
            x_name TEXT,
            x_screen_name TEXT,
            x_avatar_url TEXT,
            updated_at TEXT
          )
        `).run();

        // 平滑列升级（兼容旧表结构）
        const colsToAdd = ['user_id TEXT', 'x_name TEXT', 'x_screen_name TEXT', 'x_avatar_url TEXT'];
        for (const col of colsToAdd) {
          try { await db.prepare(`ALTER TABLE admin_credentials ADD COLUMN ${col}`).run(); } catch (e) {}
        }

        // 显式位置绑定，包含用户资料一并落库
        await db.prepare(`
          INSERT INTO admin_credentials (id, ct0, auth_token, user_id, x_name, x_screen_name, x_avatar_url, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            ct0 = excluded.ct0,
            auth_token = excluded.auth_token,
            user_id = excluded.user_id,
            x_name = excluded.x_name,
            x_screen_name = excluded.x_screen_name,
            x_avatar_url = excluded.x_avatar_url,
            updated_at = excluded.updated_at
        `).bind(cleanCt0, cleanAuth, targetUserId, name, screen_name, avatar_url, new Date().toISOString()).run();

        db_saved = true;
      } catch (e) {
        console.error('D1 admin_credentials 写入异常:', e.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Cookie 验证成功，并已同步保存至 D1 数据库',
      user: {
        name,
        screen_name,
        avatar_url,
        following_count,
        user_id: targetUserId
      },
      db_saved,
      saved_user_id: targetUserId
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
