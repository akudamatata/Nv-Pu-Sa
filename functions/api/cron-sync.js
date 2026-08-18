/**
 * Cloudflare Pages Functions - Automated Cron Trigger Sync Endpoint
 * 纯静默自动触发入口（自动创表与平滑列升级防护 + 从 D1 读取保存的 Cookie 凭据与 user_id）
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestGet({ request, env }) {
  try {
    const db = getD1(env);
    if (!db) {
      return Response.json({ success: false, error: 'D1 数据库未绑定' }, { status: 400 });
    }

    const reqUrl = new URL(request.url);
    const mode = reqUrl.searchParams.get('mode') || 'incremental';
    const isFullMode = mode === 'full';
    let queryCursor = reqUrl.searchParams.get('cursor') || null;

    // 自动建表与平滑列升级保护
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          ct0 TEXT NOT NULL,
          auth_token TEXT NOT NULL,
          user_id TEXT,
          updated_at TEXT
        )
      `).run();
      await db.prepare(`ALTER TABLE admin_credentials ADD COLUMN user_id TEXT`).run();
    } catch (e) {}

    // 自动从 D1 读取上次凭据与预先解密好的 user_id
    const cred = await db.prepare(`
      SELECT * FROM admin_credentials WHERE id = 1
    `).first();

    if (!cred || !cred.ct0 || !cred.auth_token) {
      return Response.json({ success: false, error: '尚未在后台配置并保存 X Cookie 凭据。请先在 /admin 页面登录并保存凭据。' }, { status: 400 });
    }

    const cleanCt0 = String(cred.ct0).trim();
    const cleanAuth = String(cred.auth_token).trim();

    const apiHeaders = {
      'cookie': `auth_token=${cleanAuth}; ct0=${cleanCt0};`,
      'x-csrf-token': cleanCt0,
      'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'zh-cn',
      'accept': '*/*',
      'referer': 'https://x.com/'
    };

    let userId = cred.user_id ? String(cred.user_id).trim() : '';

    if (!userId) {
      try {
        const uRes = await fetch('https://x.com/i/api/1.1/account/verify_credentials.json', {
          headers: apiHeaders,
          signal: AbortSignal.timeout(10000)
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData && (uData.id_str || uData.id)) {
            userId = String(uData.id_str || uData.id);
          }
        }
      } catch (e) {}
    }

    if (!userId) {
      return Response.json({ success: false, error: '保存的 Cookie 已失效，无法解析 userId' }, { status: 401 });
    }

    const queryId = 'qGZZDF3mp91q7X22s3HxpA';
    const features = {
      "rweb_video_screen_enabled": true,
      "rweb_cashtags_enabled": true,
      "profile_label_improvements_pcf_label_in_post_enabled": true,
      "responsive_web_profile_redirect_enabled": true,
      "rweb_tipjar_consumption_enabled": true,
      "verified_phone_label_enabled": false,
      "creator_subscriptions_tweet_preview_api_enabled": true,
      "responsive_web_graphql_timeline_navigation_enabled": true,
      "premium_content_api_read_enabled": false,
      "communities_web_enable_tweet_community_results_fetch": true,
      "c9s_tweet_anatomy_moderator_badge_enabled": true,
      "responsive_web_graphql_exclude_directive_enabled": true,
      "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
      "tweetypie_unmention_optimization_enabled": true,
      "responsive_web_edit_tweet_api_enabled": true,
      "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
      "view_counts_everywhere_api_enabled": true,
      "longform_notetweets_consumption_enabled": true,
      "responsive_web_twitter_article_tweet_consumption_enabled": true,
      "tweet_awards_web_tipping_enabled": false,
      "freedom_of_speech_not_reach_fetch_enabled": true,
      "standardized_nudges_misinfo": true,
      "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
      "rweb_video_timestamps_enabled": true,
      "longform_notetweets_rich_text_read_enabled": true,
      "longform_notetweets_inline_media_enabled": true,
      "responsive_web_media_download_video_enabled": false,
      "responsive_web_enhance_cards_enabled": false
    };

    // 从 D1 读取已有博主列表
    const existingMap = new Map();
    try {
      const existingRows = await db.prepare(`SELECT screen_name, backed_up_at FROM bloggers`).all();
      if (existingRows?.results) {
        for (const row of existingRows.results) {
          if (row.screen_name) {
            existingMap.set(row.screen_name.toLowerCase(), row.backed_up_at || true);
          }
        }
      }
    } catch (e) {}

    let incrementalHitCount = 0;
    let isIncrementalStop = false;

    const fetchedUsers = [];
    const suspendedUsers = [];
    let nextCursorVal = null;
    let cursor = queryCursor;
    let hasMore = true;

    // 全量模式单次请求拉取 1 页 (由 Actions 慢速安全循环调度)；增量模式最多跑 4 页 (命中已有即停)
    const maxPageLoops = isFullMode ? 1 : 4;
    let loops = 0;

    while (hasMore && loops < maxPageLoops && !isIncrementalStop) {
      loops++;
      const variables = { userId, count: 50, includePromotedContent: false };
      if (cursor) variables.cursor = cursor;

      const params = new URLSearchParams({
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      });

      const url = `https://x.com/i/api/graphql/${queryId}/Following?${params.toString()}`;
      const res = await fetch(url, { headers: apiHeaders, signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        if (res.status === 429) {
          return Response.json({ success: false, error: '429 Rate limit exceeded', is_rate_limit: true }, { status: 429 });
        }
        break;
      }

      const json = await res.json();
      const instructions = json.data?.user?.result?.timeline?.timeline?.instructions || [];
      let foundEntries = false;

      for (const inst of instructions) {
        if (inst.type === 'TimelineAddEntries' && Array.isArray(inst.entries)) {
          for (const entry of inst.entries) {
            if (entry.entryId?.startsWith('user-')) {
              foundEntries = true;
              const resObj = entry.content?.itemContent?.user_results?.result;
              if (resObj) {
                // 1. 识别账号异常状态 (封号 / 注销)
                if (resObj.__typename === 'UserUnavailable') {
                  const isSuspended = resObj.reason === 'Suspended' ? 1 : 2;
                  const targetId = String(resObj.rest_id || entry.entryId?.replace('user-', '') || '');
                  if (targetId) {
                    suspendedUsers.push({ id: targetId, is_suspended: isSuspended });
                  }
                  continue;
                }

                // 2. 正常存活账号提取最新完整资料
                const screen_name = resObj.core?.screen_name || resObj.legacy?.screen_name || '';
                const name = resObj.core?.name || resObj.legacy?.name || screen_name;
                const avatar_url = (resObj.avatar?.image_url || resObj.legacy?.profile_image_url_https || '').replace('_normal', '_400x400');
                let cover_url = resObj.banner?.image_url || resObj.legacy?.profile_banner_url || '';
                if (cover_url && !cover_url.endsWith('/600x200') && !cover_url.endsWith('/1500x500')) {
                  cover_url = cover_url.replace(/\/+$/, '') + '/600x200';
                }
                const followers_count = resObj.relationship_counts?.followers || resObj.legacy?.followers_count || 0;
                
                let bio = resObj.profile_bio?.description || resObj.legacy?.description || '';
                const website = resObj.profile_bio?.entities?.url?.urls?.[0]?.expanded_url || resObj.legacy?.url || '';
                if (website) bio += `\n🔗 网址: ${website}`;
                const location = resObj.location?.location || resObj.legacy?.location;
                if (location) bio += `\n📍 位置: ${location}`;

                const sLower = screen_name.toLowerCase();
                const isExisting = existingMap.has(sLower);
                const existingTime = isExisting && typeof existingMap.get(sLower) === 'string' ? existingMap.get(sLower) : null;

                if (screen_name) {
                  fetchedUsers.push({
                    id: String(resObj.rest_id || screen_name),
                    screen_name,
                    name,
                    avatar_url,
                    cover_url,
                    followers_count,
                    description: bio,
                    verified: resObj.is_blue_verified || resObj.legacy?.verified ? 1 : 0,
                    backed_up_at: existingTime || new Date().toISOString()
                  });
                }

                // 仅在增量模式下进行命中已有即停判断；全量模式下持续扫描
                if (!isFullMode) {
                  if (screen_name && isExisting) {
                    incrementalHitCount++;
                    if (incrementalHitCount >= 3) {
                      isIncrementalStop = true;
                      break;
                    }
                  } else {
                    incrementalHitCount = 0;
                  }
                }
              }
            } else if (entry.entryId?.startsWith('cursor-bottom-')) {
              const nextCursor = entry.content?.value;
              if (nextCursor && nextCursor !== cursor) {
                nextCursorVal = nextCursor;
                cursor = nextCursor;
              } else {
                hasMore = false;
              }
            }
          }
        }
      }

      if (isIncrementalStop) break;
      if (!foundEntries || !nextCursorVal) hasMore = false;
    }

    const newUsers = fetchedUsers.filter(u => !existingMap.has(u.screen_name.toLowerCase()));

    if (fetchedUsers.length > 0) {
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
        INSERT INTO bloggers (
          id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at, is_blocked, is_suspended
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
        ON CONFLICT(screen_name) DO UPDATE SET
          name = excluded.name,
          avatar_url = CASE WHEN excluded.avatar_url != '' THEN excluded.avatar_url ELSE bloggers.avatar_url END,
          cover_url = CASE WHEN excluded.cover_url != '' THEN excluded.cover_url ELSE bloggers.cover_url END,
          followers_count = excluded.followers_count,
          description = excluded.description,
          verified = excluded.verified,
          is_blocked = COALESCE(bloggers.is_blocked, 0),
          is_suspended = 0,
          backed_up_at = CASE 
            WHEN bloggers.backed_up_at IS NOT NULL AND bloggers.backed_up_at != '' 
            THEN bloggers.backed_up_at 
            ELSE excluded.backed_up_at 
          END
      `);

      const batch = fetchedUsers.map(item => {
        return stmt.bind(
          item.id,
          item.screen_name,
          item.name,
          item.avatar_url,
          item.cover_url,
          item.followers_count,
          item.description,
          item.verified,
          item.backed_up_at
        );
      });

      await db.batch(batch);
    }

    // 批量更新封号/注销状态
    if (suspendedUsers.length > 0) {
      try {
        const susStmt = db.prepare(`UPDATE bloggers SET is_suspended = ? WHERE id = ? OR screen_name = ?`);
        const susBatch = suspendedUsers.map(s => susStmt.bind(s.is_suspended, s.id, s.id));
        await db.batch(susBatch);
      } catch (e) {}
    }

    let totalDbCount = 0;
    try {
      const countRes = await db.prepare(`SELECT COUNT(*) as total FROM bloggers`).first();
      if (countRes) totalDbCount = countRes.total || 0;
    } catch (e) {}

    const suspendedCount = suspendedUsers.filter(s => s.is_suspended === 1).length;
    const deletedCount = suspendedUsers.filter(s => s.is_suspended === 2).length;

    return Response.json({
      cron_status: 'success',
      mode: isFullMode ? 'full' : 'incremental',
      timestamp: new Date().toISOString(),
      scanned_count: fetchedUsers.length,
      updated_count: fetchedUsers.length,
      new_count: newUsers.length,
      suspended_count: suspendedCount,
      not_found_count: deletedCount,
      next_cursor: nextCursorVal,
      has_more: !!nextCursorVal && !isIncrementalStop,
      total_db_count: totalDbCount,
      message: isFullMode
        ? `全量单页刷新完成：深度更新 ${fetchedUsers.length} 位博主全套资料，封号 ${suspendedCount} 人，注销 ${deletedCount} 人`
        : (isIncrementalStop && newUsers.length === 0
          ? `自动 Cron 增量核对完成！数据已是最新，无新增博主。(库中总计 ${totalDbCount} 人)`
          : `自动 Cron 定时同步成功！成功增量备份 ${newUsers.length} 位新关注博主。(库中总计 ${totalDbCount} 人)`)
    });

  } catch (err) {
    return Response.json({ cron_status: 'error', error: err.message }, { status: 500 });
  }
}
