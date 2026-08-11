/**
 * Cloudflare Pages Functions - Sync Following API (Edge Serverless Engine)
 * 全自动兼容 Auto-Table Creation & D1 数据库持久落库
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestPost({ request, env }) {
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
      'referer': 'https://x.com/'
    };

    let userId = '';

    // 1. 优先从官方验证 API 提取 id_str (userId)
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

    // 2. 降级备用：从 HTML 中读取
    if (!userId) {
      const pageHeaders = {
        'cookie': `auth_token=${cleanAuth}; ct0=${cleanCt0};`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'referer': 'https://x.com/'
      };

      const mainRes = await fetch('https://x.com', { headers: pageHeaders, signal: AbortSignal.timeout(10000) });
      if (mainRes.ok) {
        const html = await mainRes.text();
        const matches = html.match(/"rest_id":"(\d+)"/) || html.match(/"user_id":"(\d+)"/);
        if (matches && matches[1]) {
          userId = matches[1];
        }
      }
    }

    if (!userId) {
      return Response.json({ success: false, error: '无法解析当前账号 ID，请检查 Cookie 是否有效并包含 ct0 与 auth_token' }, { status: 401 });
    }

    const db = getD1(env);

    // 顺便自动保存有效的 Cookie 与 user_id 到 D1 数据表中供定时任务无门槛调用
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

        await db.prepare(`
          INSERT OR REPLACE INTO admin_credentials (id, ct0, auth_token, user_id, updated_at)
          VALUES (1, ?, ?, ?, ?)
        `).bind(cleanCt0, cleanAuth, userId, new Date().toISOString()).run();
      } catch (e) {}
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

    const fetchedUsers = [];
    let cursor = null;
    let hasMore = true;

    // 分页拉取关注列表
    while (hasMore && fetchedUsers.length < 200) {
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

      const url = `https://x.com/i/api/graphql/${queryId}/Following?${params.toString()}`;
      
      const res = await fetch(url, { headers: apiHeaders, signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        throw new Error(`X API 请求失败 (HTTP ${res.status})`);
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
                const screen_name = resObj.core?.screen_name || resObj.legacy?.screen_name || '';
                const name = resObj.core?.name || resObj.legacy?.name || screen_name;
                const avatar_url = (resObj.avatar?.image_url || resObj.legacy?.profile_image_url_https || '').replace('_normal', '_400x400');
                const cover_url = resObj.legacy?.profile_banner_url || '';
                const followers_count = resObj.relationship_counts?.followers || resObj.legacy?.followers_count || 0;
                
                // 解析完整 Bio
                let bio = resObj.profile_bio?.description || resObj.legacy?.description || '';
                const website = resObj.profile_bio?.entities?.url?.urls?.[0]?.expanded_url || resObj.legacy?.url || '';
                if (website) bio += `\n🔗 网址: ${website}`;
                const location = resObj.location?.location || resObj.legacy?.location;
                if (location) bio += `\n📍 位置: ${location}`;

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
                    backed_up_at: new Date().toISOString()
                  });
                }
              }
            } else if (entry.entryId?.startsWith('cursor-bottom-')) {
              const nextCursor = entry.content?.value;
              if (nextCursor && nextCursor !== cursor) {
                cursor = nextCursor;
              } else {
                hasMore = false;
              }
            }
          }
        }
      }

      if (!foundEntries) {
        hasMore = false;
      }
    }

    let dbSuccess = false;

    // 存入 Cloudflare D1 数据库
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
            backed_up_at TEXT
          )
        `).run();

        const stmt = db.prepare(`
          INSERT OR REPLACE INTO bloggers (
            id, screen_name, name, avatar_url, cover_url, followers_count, description, verified, backed_up_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        dbSuccess = true;
      } catch (e) {}
    }

    return Response.json({
      success: true,
      count: fetchedUsers.length,
      following: fetchedUsers,
      db_saved: dbSuccess,
      message: `同步成功！已备份 ${fetchedUsers.length} 位关注博主`
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
