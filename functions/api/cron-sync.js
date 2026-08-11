/**
 * Cloudflare Pages Functions - Automated Cron Trigger Sync Endpoint
 * 纯静默自动触发入口（自动创表防护 + 从 D1 读取保存的 Cookie 凭据与 user_id）
 */
function getD1(env) {
  return env.DB || env.nv_pu_sa_db || env.DB_BINDING || env.D1 || env.DATABASE || null;
}

export async function onRequestGet({ env }) {
  try {
    const db = getD1(env);
    if (!db) {
      return Response.json({ success: false, error: 'D1 数据库未绑定' }, { status: 400 });
    }

    // 自动建表保护
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        ct0 TEXT NOT NULL,
        auth_token TEXT NOT NULL,
        user_id TEXT,
        updated_at TEXT
      )
    `).run();

    // 自动从 D1 读取上次凭据与预先解密好的 user_id
    const cred = await db.prepare(`
      SELECT ct0, auth_token, user_id FROM admin_credentials WHERE id = 1
    `).first();

    if (!cred || !cred.ct0 || !cred.auth_token) {
      return Response.json({ success: false, error: '尚未在后台配置并保存 X Cookie 凭据。请先登录 /admin 页面点击一次“一键同步全量关注”。' }, { status: 400 });
    }

    const cleanCt0 = cred.ct0.trim();
    const cleanAuth = cred.auth_token.trim();

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

    let userId = cred.user_id || '';

    // 若未预存 user_id，尝试动态在线提取
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

    const fetchedUsers = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore && fetchedUsers.length < 200) {
      const variables = { userId, count: 50, includePromotedContent: false };
      if (cursor) variables.cursor = cursor;

      const params = new URLSearchParams({
        variables: JSON.stringify(variables),
        features: JSON.stringify(features)
      });

      const url = `https://x.com/i/api/graphql/${queryId}/Following?${params.toString()}`;
      const res = await fetch(url, { headers: apiHeaders, signal: AbortSignal.timeout(12000) });
      if (!res.ok) break;

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

      if (!foundEntries) hasMore = false;
    }

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
    }

    return Response.json({
      cron_status: 'success',
      timestamp: new Date().toISOString(),
      count: fetchedUsers.length,
      message: `自动 Cron 定时同步成功！已自动更新备份 ${fetchedUsers.length} 位关注博主`
    });

  } catch (err) {
    return Response.json({ cron_status: 'error', error: err.message }, { status: 500 });
  }
}
