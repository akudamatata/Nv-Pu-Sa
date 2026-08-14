/**
/**
 * Cloudflare Pages Functions - Edge Media Proxy & R2 Persistent Object Storage
 * Zero-VPN Image Accelerator + Permanent Avatar/Cover Storage Engine
 */

function getR2Bucket(env) {
  return env.BUCKET || env.R2 || env.MEDIA_BUCKET || env.x_archive_media || null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get('url');
  let key = urlObj.searchParams.get('key');

  if (!targetUrl && !key) {
    return new Response('Missing url or key parameter', { status: 400 });
  }

  // 1. Generate clean R2 storage key
  if (!key && targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      const cleanPath = parsed.pathname.replace(/^\/+/, '').replace(/\//g, '_');
      if (targetUrl.includes('profile_images')) {
        key = `avatars/${cleanPath}`;
      } else if (targetUrl.includes('profile_banners')) {
        key = `covers/${cleanPath}`;
      } else {
        key = `media/${cleanPath}`;
      }
    } catch (e) {
      key = `media/img_${Date.now()}`;
    }
  }

  const bucket = getR2Bucket(env);

  // 2. Check R2 Cache first (Instant Cloudflare Edge Cache Hit)
  if (bucket && key) {
    try {
      const r2Object = await bucket.get(key);
      if (r2Object) {
        const headers = new Headers();
        r2Object.writeHttpMetadata(headers);
        headers.set('ETag', r2Object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('X-Storage-Hit', 'Cloudflare-R2');
        return new Response(r2Object.body, { headers });
      }
    } catch (err) {
      console.warn('R2 read error:', err);
    }
  }

  // 3. If not in R2 (or R2 not bound), Edge fetches from Twitter overseas CDN
  if (!targetUrl) {
    return new Response('Object not found in R2 and no source URL provided', { status: 404 });
  }

  try {
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Referer': 'https://x.com/'
    };

    const imgRes = await fetch(targetUrl, {
      headers: fetchHeaders,
      signal: AbortSignal.timeout(10000)
    });

    if (!imgRes.ok) {
      return Response.redirect('https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png', 302);
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();

    // 4. Save to Cloudflare R2 asynchronously in background
    if (bucket && key) {
      context.waitUntil(
        bucket.put(key, buffer, {
          httpMetadata: {
            contentType: contentType,
            cacheControl: 'public, max-age=31536000, immutable'
          }
        }).catch(err => console.warn('R2 put background error:', err))
      );
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Storage-Hit': 'Edge-Proxy-Cached'
      }
    });

  } catch (err) {
    return Response.redirect('https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png', 302);
  }
}
