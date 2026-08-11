/**
 * Twitter / X Spider Engine v26.0
 * 1. 动态在线检索最新 QueryID 引擎
 * 2. 100% 还原完整 Bio (原汁原味换行 + t.co 短链展开 + 主页外部网址 Website + 位置 Location + 注册时间 Joined)
 * 3. 🎯 真实关注总数精确对齐控制：先识别账号关注数 (following_count)，抓满数量后秒级精准自动停止！
 */

class TwitterSpider {
  constructor(authToken, ct0) {
    this.authToken = authToken ? authToken.trim() : '';
    this.ct0 = ct0 ? ct0.trim() : '';
    this.cachedQueryId = null;
  }

  getApiHeaders() {
    return {
      'cookie': `auth_token=${this.authToken}; ct0=${this.ct0};`,
      'x-csrf-token': this.ct0,
      'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'zh-cn',
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'referer': 'https://x.com/'
    };
  }

  getPageHeaders() {
    return {
      'cookie': `auth_token=${this.authToken}; ct0=${this.ct0};`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'referer': 'https://x.com/'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 💡 自动从 X 官方最新打包构建文件中动态检索当前有效 Query ID
   */
  async fetchLatestQueryId() {
    if (this.cachedQueryId) return this.cachedQueryId;

    console.log('🔍 正在自动检索 X 官方最新 Following Query ID...');
    try {
      const res = await fetch('https://x.com/following', {
        headers: this.getPageHeaders(),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const html = await res.text();
        const jsUrls = html.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/[^"]+\.js/g) || [];

        for (const url of jsUrls.slice(0, 10)) {
          try {
            const jsRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
            const jsText = await jsRes.text();
            
            const match = jsText.match(/queryId:"([^"]+)",operationName:"Following"/i) ||
                          jsText.match(/operationName:"Following",queryId:"([^"]+)"/i);

            if (match && match[1]) {
              this.cachedQueryId = match[1];
              console.log(`✨ 成功检索到最新 Query ID: "${this.cachedQueryId}"`);
              return this.cachedQueryId;
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('动态检索 Query ID 异常，降级使用锁定 Hash:', e.message);
    }

    this.cachedQueryId = 'qGZZDF3mp91q7X22s3HxpA';
    return this.cachedQueryId;
  }

  /**
   * 💡 100% 还原完整 Bio (原汁原味换行 + t.co 短链展开 + 主页外部网址 Website + 位置 Location + 注册时间 Joined)
   */
  parseFullDescription(resObj) {
    let bio = resObj.profile_bio?.description || resObj.legacy?.description || '';
    const urls = resObj.profile_bio?.entities?.description?.urls || resObj.legacy?.entities?.description?.urls || [];
    
    // A. 展开描述文本里的所有 t.co 链接
    if (Array.isArray(urls) && urls.length > 0) {
      urls.forEach(u => {
        if (u.url) {
          const displayLink = u.expanded_url || u.display_url || u.url;
          bio = bio.split(u.url).join(displayLink);
        }
      });
    }

    // B. 提取主页右侧外部网址 (Website Link, 例如 telegram.me/afukadou)
    let websiteLink = '';
    const siteEntities = resObj.profile_bio?.entities?.url?.urls || resObj.legacy?.entities?.url?.urls || [];
    if (Array.isArray(siteEntities) && siteEntities.length > 0) {
      websiteLink = siteEntities[0].expanded_url || siteEntities[0].display_url || siteEntities[0].url || '';
    } else if (resObj.website?.url || resObj.legacy?.url) {
      websiteLink = resObj.website?.url || resObj.legacy?.url;
    }

    if (websiteLink) {
      bio += `\n🔗 网址: ${websiteLink}`;
    }

    // C. 提取位置 (Location, 例如 防失联预览)
    const location = resObj.location?.location || resObj.legacy?.location;
    if (location && location.trim()) {
      bio += `\n📍 位置: ${location.trim()}`;
    }

    // D. 提取注册时间 (Joined Date)
    const createdAt = resObj.core?.created_at || resObj.legacy?.created_at;
    if (createdAt) {
      const yearMonth = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      bio += `\n📅 注册于 ${yearMonth}`;
    }

    return bio.trim();
  }

  /**
   * 1. 验证 Cookie 凭据并精准识别主体（包含关注总数 following_count）
   */
  async verifyCredentials() {
    if (!this.authToken || !this.ct0) {
      throw new Error('未提供完整的 auth_token 与 ct0！');
    }

    try {
      const res = await fetch('https://x.com', {
        headers: this.getPageHeaders(),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        throw new Error(`X 主页响应状态码: HTTP ${res.status}`);
      }

      const html = await res.text();
      const screenNameMatch = html.match(/"screen_name":"(.*?)"/);
      const avatarMatch = html.match(/"profile_image_url_https":"(.*?)"/);
      const restIdMatch = html.match(/"rest_id":"(.*?)"/);

      if (!screenNameMatch || !screenNameMatch[1]) {
        throw new Error('未能从 X 响应中匹配到账号，可能 Cookie 已过期。');
      }

      const screenName = screenNameMatch[1];
      let avatarUrl = avatarMatch ? avatarMatch[1].replace(/\\/g, '').replace('_normal', '_400x400') : '';
      let realName = screenName;
      let followingCount = 1; // 默认

      // 通过用户个人页提取精细化统计信息 (包含 friends_count / following_count)
      try {
        const pRes = await fetch(`https://x.com/${screenName}`, {
          headers: this.getPageHeaders(),
          signal: AbortSignal.timeout(8000)
        });
        if (pRes.ok) {
          const phtml = await pRes.text();
          const nameMatch = phtml.match(/"name":"(.*?)"/);
          if (nameMatch && nameMatch[1]) {
            realName = nameMatch[1];
          }
          if (!avatarUrl) {
            const pAvatar = phtml.match(/"profile_image_url_https":"(.*?)"/);
            if (pAvatar && pAvatar[1]) {
              avatarUrl = pAvatar[1].replace(/\\/g, '').replace('_normal', '_400x400');
            }
          }
          const friendsMatch = phtml.match(/"friends_count":(\d+)/);
          if (friendsMatch && friendsMatch[1]) {
            followingCount = parseInt(friendsMatch[1], 10);
          }
        }
      } catch (e) {}

      if (!avatarUrl) {
        avatarUrl = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      }

      return {
        id: restIdMatch ? restIdMatch[1] : '1701615602862092288',
        screen_name: screenName,
        name: realName,
        avatar_url: avatarUrl,
        following_count: followingCount
      };

    } catch (err) {
      console.error('verifyCredentials 异常:', err.message);
      throw new Error(`登录失败: ${err.message}`);
    }
  }

  /**
   * 2. 🎯 精准数字对齐打断：识别关注总数 (targetCount)，达到数字即刻自动安全打断！
   */
  async fetchAllFollowing(existingList = [], progressCallback, forceFull = false) {
    console.log('🔍 正在在线校验 X 账号身份与关注总数...');
    const myAccount = await this.verifyCredentials();
    const userId = myAccount.id || '1701615602862092288';
    const targetCount = myAccount.following_count || 1;
    console.log(`✅ 已校验登录主体: @${myAccount.screen_name} (${myAccount.name}) | 目标关注总数: ${targetCount} 人`);

    const activeQueryId = await this.fetchLatestQueryId();

    let cursor = null;
    let allUsersMap = new Map();
    let incrementalHitCount = 0;
    let isIncrementalStop = false;
    let attempts = 0;

    const existingMap = new Map();
    if (Array.isArray(existingList)) {
      existingList.forEach(u => {
        if (u && u.screen_name) {
          existingMap.set(u.screen_name.toLowerCase(), u);
        }
      });
    }

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

    while (attempts < 100 && !isIncrementalStop) {
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

      const endpoint = `https://x.com/i/api/graphql/${activeQueryId}/Following?${params.toString()}`;

      try {
        const res = await fetch(endpoint, { headers: this.getApiHeaders() });

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error(`X API 频率限流 (HTTP 429 Too Many Requests)，请等待 15 分钟后再试。`);
          }
          throw new Error(`GraphQL API 返回 HTTP ${res.status}`);
        }

        const json = await res.json();

        const instructions = json?.data?.user?.result?.timeline?.timeline?.instructions || 
                             json?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];

        let entries = [];
        for (const inst of instructions) {
          if (inst.type === 'TimelineAddEntries') {
            entries = inst.entries || [];
            break;
          }
        }

        if (entries.length === 0) {
          console.log('🏁 已无更多关注博主数据');
          break;
        }

        let nextCursorVal = null;
        let fetchedUsersInBatch = [];

        for (const entry of entries) {
          if (entry.entryId?.startsWith('cursor-bottom-') || entry.content?.cursorType === 'Bottom') {
            nextCursorVal = entry.content?.value;
            continue;
          }

          const resObj = entry.content?.itemContent?.user_results?.result;
          if (!resObj) continue;

          const screenName = resObj.core?.screen_name || resObj.legacy?.screen_name;
          const name = resObj.core?.name || resObj.legacy?.name;
          if (!screenName || !name) continue;

          const screenNameLower = screenName.toLowerCase();
          const avatarRaw = resObj.avatar?.image_url || resObj.legacy?.profile_image_url_https || '';
          const bannerRaw = resObj.banner?.image_url || resObj.legacy?.profile_banner_url || '';
          const followers = resObj.relationship_counts?.followers || resObj.legacy?.followers_count || 0;
          const isVerified = !!(resObj.is_blue_verified || resObj.verification?.verified || resObj.legacy?.verified);
          const fullBio = this.parseFullDescription(resObj);

          const formattedUser = {
            id: resObj.rest_id || resObj.id_str || entry.entryId?.replace('user-', ''),
            screen_name: screenName,
            name: name,
            avatar_url: avatarRaw ? avatarRaw.replace('_normal', '_400x400') : '',
            cover_url: bannerRaw || '',
            followers_count: followers,
            description: fullBio,
            verified: isVerified,
            backed_up_at: new Date().toISOString()
          };

          fetchedUsersInBatch.push(formattedUser);
          allUsersMap.set(screenNameLower, formattedUser);

          // 🎯 判定条件 A: 达到了真实的关注总数 (例如 1人)，精准立刻安全停止！
          if (allUsersMap.size >= targetCount) {
            console.log(`🎯 精确数量判定触发：已抓满账号关注总额 (${allUsersMap.size}/${targetCount} 人)，自动停止抓取！`);
            isIncrementalStop = true;
            break;
          }

          // 🎯 判定条件 B: 智能增量遇到已归档命中
          if (!forceFull && existingMap.has(screenNameLower)) {
            incrementalHitCount++;
            if (incrementalHitCount >= 3) {
              console.log(`✅ 智能增量打断触发：遇到连续归档博主 (@${screenName})，抓取完毕！`);
              isIncrementalStop = true;
              break;
            }
          } else {
            incrementalHitCount = 0;
          }
        }

        cursor = nextCursorVal;

        if (progressCallback) {
          const lastAdded = fetchedUsersInBatch.length > 0 ? fetchedUsersInBatch[fetchedUsersInBatch.length - 1] : null;
          progressCallback(allUsersMap.size, lastAdded, isIncrementalStop);
        }

        if (!cursor || isIncrementalStop) {
          break;
        }

        await this.sleep(1200 + Math.random() * 800);

      } catch (err) {
        console.error('抓取页发生错误:', err.message);
        throw err;
      }
    }

    return Array.from(allUsersMap.values());
  }
}

module.exports = TwitterSpider;
