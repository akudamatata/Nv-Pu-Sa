/**
 * Cloudflare Pages Functions - Sync Following API (Edge Serverless Engine v26.0)
 * 1. 动态/降级检索有效 QueryID
 * 2. 完美适配 timeline 与 timeline_v2 响应结构
 * 3. 完整 Bio 展开 (换行/t.co/Website/Location)
 * 4. 自动创表与 Cloudflare D1 持久落库
 */

function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

function getR2Bucket(env) {
  return env.BUCKET || env.R2 || env.MEDIA_BUCKET || env.x_archive_media || env['x-archive-media'] || null;
}

function parseFullDescription(resObj) {
  let bio = resObj.profile_bio?.description || resObj.legacy?.description || '';
  const urls = resObj.profile_bio?.entities?.description?.urls || resObj.legacy?.entities?.description?.urls || [];
  
  if (Array.isArray(urls) && urls.length > 0) {
    urls.forEach(u => {
      if (u.url) {
        const displayLink = u.expanded_url || u.display_url || u.url;
        bio = bio.split(u.url).join(displayLink);
      }
    });
  }

  const website = resObj.profile_bio?.entities?.url?.urls?.[0]?.expanded_url || 
                  resObj.legacy?.entities?.url?.urls?.[0]?.expanded_url || 
                  resObj.legacy?.url || '';
  if (website) {
    bio += `\n🔗 网址: ${website}`;
  }

  const location = resObj.location?.location || resObj.legacy?.location || '';
  if (location) {
    bio += `\n📍 位置: ${location}`;
  }

  return bio.trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { ct0, authToken } = await request.json();
    if (!ct0 || !authToken) {
      return Response.json({ success: false, error: '请先配置 ct0 与 auth_token 凭据' }, { status: 400 });
    }

    const cleanCt0 = ct0.trim();
    const cleanAuth = authToken.trim();

    const apiHeaders = {
      'cookie': `auth_token=${cleanAuth}; ct0=${cleanCt0};`,
      'x-csrf-token': cleanCt0,
      'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'zh-cn',
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'referer': 'https://x.com/'
    };

    const pageHeaders = {
      'cookie': `auth_token=${cleanAuth}; ct0=${cleanCt0};`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'referer': 'https://x.com/'
    };

    // 1. 获取登录用户资料与 user_id / following_count
    let userId = '';
    let screenName = '';
    let followingCount = 0;

    try {
      const uRes = await fetch('https://x.com', { headers: pageHeaders, signal: AbortSignal.timeout(10000) });
      if (uRes.ok) {
        const html = await uRes.text();
        const snMatch = html.match(/"screen_name":"(.*?)"/);
        if (snMatch && snMatch[1]) screenName = snMatch[1];
        
        const idMatches = html.match(/"rest_id":"(\d+)"/) || html.match(/"user_id":"(\d+)"/) || html.match(/"id_str":"(\d+)"/);
        if (idMatches && idMatches[1]) userId = idMatches[1];
      }
    } catch (e) {}

    // 若已知 screenName，进一步获取其精准 targetFollowingCount
    if (screenName) {
      try {
        const pRes = await fetch(`https://x.com/${screenName}`, { headers: pageHeaders, signal: AbortSignal.timeout(8000) });
        if (pRes.ok) {
          const phtml = await pRes.text();
          const friendsMatch = phtml.match(/"friends_count":(\d+)/) || phtml.match(/"following_count":(\d+)/);
          if (friendsMatch && friendsMatch[1]) {
            followingCount = parseInt(friendsMatch[1], 10);
          }
          if (!userId) {
            const pIdMatch = phtml.match(/"rest_id":"(\d+)"/) || phtml.match(/"user_id":"(\d+)"/);
            if (pIdMatch && pIdMatch[1]) userId = pIdMatch[1];
          }
        }
      } catch (e) {}
    }

    if (!userId) {
      userId = '1701615602862092288';
    }

    const db = getD1(env);

    // 自动备份凭据与 user_id
    if (db) {
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
        try {
          await db.prepare(`ALTER TABLE admin_credentials ADD COLUMN user_id TEXT`).run();
        } catch (e) {}

        await db.prepare(`
          INSERT INTO admin_credentials (id, ct0, auth_token, user_id, updated_at)
          VALUES (1, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            ct0 = excluded.ct0,
            auth_token = excluded.auth_token,
            user_id = excluded.user_id,
            updated_at = excluded.updated_at
        `).bind(cleanCt0, cleanAuth, userId, new Date().toISOString()).run();
      } catch (e) {}
    }

    // 2. 动态检索最新 Query ID
    let activeQueryId = 'qGZZDF3mp91q7X22s3HxpA';
    try {
      const qRes = await fetch('https://x.com/following', { headers: pageHeaders, signal: AbortSignal.timeout(8000) });
      if (qRes.ok) {
        const qHtml = await qRes.text();
        const jsUrls = qHtml.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/[^"]+\.js/g) || [];
        for (const url of jsUrls.slice(0, 5)) {
          try {
            const jsRes = await fetch(url, { signal: AbortSignal.timeout(4000) });
            const jsText = await jsRes.text();
            const match = jsText.match(/queryId:"([^"]+)",operationName:"Following"/i) ||
                          jsText.match(/operationName:"Following",queryId:"([^"]+)"/i);
            if (match && match[1]) {
              activeQueryId = match[1];
              break;
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

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

    const fetchedUsers = [];
    const allUsersMap = new Map();
    let cursor = null;
    let attempts = 0;

    // 增量同步：从 D1 读取已有博主数据
    const existingMap = new Map();
    if (db) {
      try {
        const existingRows = await db.prepare(`SELECT screen_name, backed_up_at FROM bloggers`).all();
        if (existingRows?.results) {
          for (const row of existingRows.results) {
            if (row.screen_name) {
              existingMap.set(row.screen_name.toLowerCase(), row.backed_up_at || '2026-01-01T00:00:00.000Z');
            }
          }
        }
      } catch (e) {}
    }

    let incrementalHitCount = 0;
    let isIncrementalStop = false;

    // 3. 执行关注列表分页抓取
    while (attempts < 20 && !isIncrementalStop) {
      attempts++;
      const variables = {
        userId: userId,
        count: 50,
        includePromotedContent: false
      };
      if (cursor) {
        variables.cursor = cursor;
      }

      const params = new URLSearchParams({
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      });

      const url = `https://x.com/i/api/graphql/${activeQueryId}/Following?${params.toString()}`;
      
      const res = await fetch(url, { headers: apiHeaders, signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        break;
      }

      const json = await res.json();
      const instructions = json?.data?.user?.result?.timeline?.timeline?.instructions || 
                           json?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];

      let entries = [];
      for (const inst of instructions) {
        if (inst.type === 'TimelineAddEntries' && Array.isArray(inst.entries)) {
          entries = inst.entries;
          break;
        }
      }

      if (entries.length === 0) {
        break;
      }

      let nextCursorVal = null;
      for (const entry of entries) {
        if (entry.entryId?.startsWith('cursor-bottom-') || entry.content?.cursorType === 'Bottom') {
          nextCursorVal = entry.content?.value;
          continue;
        }

        const resObj = entry.content?.itemContent?.user_results?.result;
        if (!resObj) continue;

        const uScreenName = resObj.core?.screen_name || resObj.legacy?.screen_name || '';
        const uName = resObj.core?.name || resObj.legacy?.name || uScreenName;
        if (!uScreenName) continue;

        const avatarRaw = resObj.avatar?.image_url || resObj.legacy?.profile_image_url_https || '';
        let coverRaw = resObj.banner?.image_url || resObj.legacy?.profile_banner_url || '';
        if (coverRaw && !coverRaw.endsWith('/600x200') && !coverRaw.endsWith('/1500x500')) {
          coverRaw = coverRaw.replace(/\/+$/, '') + '/600x200';
        }

        const followers = resObj.relationship_counts?.followers || resObj.legacy?.followers_count || 0;
        const isVerified = !!(resObj.is_blue_verified || resObj.verification?.verified || resObj.legacy?.verified);
        const fullBio = parseFullDescription(resObj);

        const rawAvatarUrl = avatarRaw ? avatarRaw.replace('_normal', '_400x400') : '';
        const rawCoverUrl = coverRaw || '';

        const uLower = uScreenName.toLowerCase();
        const existingBackupTime = existingMap.get(uLower);
        const isExistingInDb = !!existingBackupTime;

        // 最新抓取的博主赋予当前最新且按抓取序号微调递减的时间戳；已有博主保留原有归档时间
        const userBackedUpAt = isExistingInDb && typeof existingBackupTime === 'string'
          ? existingBackupTime
          : new Date(Date.now() - fetchedUsers.length * 1000).toISOString();

        const formattedUser = {
          id: String(resObj.rest_id || uScreenName),
          screen_name: uScreenName,
          name: uName,
          avatar_raw: rawAvatarUrl,
          cover_raw: rawCoverUrl,
          avatar_url: rawAvatarUrl,
          cover_url: rawCoverUrl,
          followers_count: followers,
          description: fullBio,
          verified: isVerified ? 1 : 0,
          backed_up_at: userBackedUpAt
        };

        if (!allUsersMap.has(uLower)) {
          allUsersMap.set(uLower, { ...formattedUser, is_new: !isExistingInDb });
          fetchedUsers.push({ ...formattedUser, is_new: !isExistingInDb });
        }

        // 智能增量判断：连续命中已有博主则停止
        if (isExistingInDb) {
          incrementalHitCount++;
          if (incrementalHitCount >= 3) {
            isIncrementalStop = true;
            break;
          }
        } else {
          incrementalHitCount = 0;
        }

        if ((followingCount > 0 && allUsersMap.size >= followingCount) || isIncrementalStop) {
          break;
        }
      }

      if ((followingCount > 0 && allUsersMap.size >= followingCount) || isIncrementalStop) {
        break;
      }

      if (nextCursorVal && nextCursorVal !== cursor) {
        cursor = nextCursorVal;
      } else {
        break;
      }
    }

    const newUsers = fetchedUsers.filter(u => u.is_new);
    let dbSuccess = false;

    // 4. 同步全量下载头像与封面并写入 Cloudflare R2 对象存储桶
    const bucket = getR2Bucket(env);
    let r2UploadedCount = 0;
    if (bucket && fetchedUsers.length > 0) {
      const uploadTasks = fetchedUsers.map(async (u) => {
        if (u.avatar_raw && u.avatar_raw.startsWith('http')) {
          const aKey = `avatars/${u.screen_name}_400x400.jpg`;
          try {
            const aRes = await fetch(u.avatar_raw, { signal: AbortSignal.timeout(6000) });
            if (aRes.ok) {
              const aBuf = await aRes.arrayBuffer();
              await bucket.put(aKey, aBuf, {
                httpMetadata: {
                  contentType: 'image/jpeg',
                  cacheControl: 'public, max-age=31536000, immutable'
                }
              });
              u.avatar_url = `/api/media?key=${encodeURIComponent(aKey)}`;
              r2UploadedCount++;
            }
          } catch (err) {}
        }
        if (u.cover_raw && u.cover_raw.startsWith('http')) {
          const cKey = `covers/${u.screen_name}_banner.jpg`;
          try {
            const cRes = await fetch(u.cover_raw, { signal: AbortSignal.timeout(6000) });
            if (cRes.ok) {
              const cBuf = await cRes.arrayBuffer();
              await bucket.put(cKey, cBuf, {
                httpMetadata: {
                  contentType: 'image/jpeg',
                  cacheControl: 'public, max-age=31536000, immutable'
                }
              });
              u.cover_url = `/api/media?key=${encodeURIComponent(cKey)}`;
              r2UploadedCount++;
            }
          } catch (err) {}
        }
      });
      await Promise.allSettled(uploadTasks);
    }

    // 5. 存入 Cloudflare D1 数据库 (使用 ON CONFLICT 保留已有博主归档时间)
    if (db && fetchedUsers.length > 0) {
      try {
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
            is_blocked INTEGER DEFAULT 0
          )
        `).run();

        try {
          await db.prepare(`ALTER TABLE bloggers ADD COLUMN is_blocked INTEGER DEFAULT 0`).run();
        } catch (e) {}

        const stmt = db.prepare(`
          INSERT INTO bloggers (
            id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at, is_blocked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
          ON CONFLICT(screen_name) DO UPDATE SET
            name = excluded.name,
            avatar_url = CASE WHEN excluded.avatar_url != '' THEN excluded.avatar_url ELSE bloggers.avatar_url END,
            cover_url = CASE WHEN excluded.cover_url != '' THEN excluded.cover_url ELSE bloggers.cover_url END,
            followers_count = excluded.followers_count,
            description = excluded.description,
            verified = excluded.verified,
            is_blocked = COALESCE(bloggers.is_blocked, 0),
            backed_up_at = CASE 
              WHEN bloggers.backed_up_at IS NOT NULL AND bloggers.backed_up_at != '' 
              THEN bloggers.backed_up_at 
              ELSE excluded.backed_up_at 
            END
        `);

        // D1 batch 最大单次 100 条
        for (let i = 0; i < fetchedUsers.length; i += 80) {
          const chunk = fetchedUsers.slice(i, i + 80);
          const batch = chunk.map(item => {
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
        dbSuccess = true;
      } catch (e) {
        console.error('D1 batch 写入异常:', e.message);
      }
    }

    // 获取当前 D1 中的博主总数量
    let totalDbCount = 0;
    if (db) {
      try {
        const countRes = await db.prepare(`SELECT COUNT(*) as total FROM bloggers`).first();
        if (countRes) totalDbCount = countRes.total || 0;
      } catch (e) {}
    }

    return Response.json({
      success: true,
      count: fetchedUsers.length,
      new_count: newUsers.length,
      is_incremental_stop: isIncrementalStop,
      total_db_count: totalDbCount,
      following: fetchedUsers,
      new_users: newUsers,
      db_saved: dbSuccess,
      r2_bound: !!bucket,
      r2_uploaded_count: r2UploadedCount,
      message: isIncrementalStop && newUsers.length === 0
        ? `智能增量核对完成：库中数据已是最新，无新增博主。`
        : `同步完成！新增 ${newUsers.length} 位关注博主 (R2 归档图片 ${r2UploadedCount} 张)`
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
