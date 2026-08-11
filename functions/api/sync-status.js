/**
 * Cloudflare Pages Functions - Sync Status API
 */
export async function onRequestGet() {
  return Response.json({
    running: false,
    current: 0,
    total: 0,
    newFetched: 0,
    lastItem: null,
    error: null
  });
}
