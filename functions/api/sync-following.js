/**
 * Cloudflare Pages Functions - Sync Following API (Edge Serverless Engine)
 */
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

    const queryId = 'qGZZDF3mp91q7X22s3HxpA';
    const fetchedUsers = [];
    let cursor = null;
    let hasMore = true;

    // 分页拉取关注列表
    while (hasMore && fetchedUsers.length < 200) {
      const variables = {
        count: 20,
        includePromotedContent: false,
        cursor: cursor
      };

      const url = `https://x.com/i/api/graphql/${queryId}/Following?variables=${encodeURIComponent(JSON.stringify(variables))}`;
      
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
                    id: resObj.rest_id || screen_name,
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

    // 保存存入 Cloudflare D1 数据库
    if (env.DB && fetchedUsers.length > 0) {
      const stmt = env.DB.prepare(`
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

      await env.DB.batch(batch);
    }

    return Response.json({
      success: true,
      count: fetchedUsers.length,
      following: fetchedUsers,
      message: `同步成功！已备份 ${fetchedUsers.length} 位关注博主`
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
