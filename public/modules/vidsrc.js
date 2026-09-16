/**
 * Streak module — VidSrc (HLS via /api/extract)
 *
 * Install with:
 *   /modules/vidsrc.js
 */

function firstHls(data) {
  if (!data?.results) return { url: null, subs: [] }
  for (const result of Object.values(data.results)) {
    if (result?.hls_url) {
      return { url: result.hls_url, subs: result.subtitles || [] }
    }
  }
  return { url: null, subs: [] }
}

async function extract(params) {
  const q = new URLSearchParams(params)
  q.set('first', '1')
  const res = await fetch('/api/extract?' + q.toString())
  const data = await res.json()
  const { url, subs } = firstHls(data)
  if (!url) throw new Error(data.error || 'No HLS stream')
  return {
    type: 'hls',
    url: '/api/hls-proxy?url=' + encodeURIComponent(url),
    subtitles: subs.map((s, i) => ({
      label: 'Caption ' + (i + 1),
      lang: 'en',
      url: s,
    })),
  }
}

const MODULE = {
  id: 'vidsrc',
  name: 'VidSrc',
  author: 'Streak',
  version: '2.0.0',
  icon: '/icon.png',
  labels: ['hls', 'movies', 'tv'],
  description: 'HLS movie and TV streams via VidSrc scraper',

  async getMovieStream(id) {
    return extract({ tmdb_id: String(id), type: 'movie' })
  },

  async getTvStream(id, season, episode) {
    return extract({
      tmdb_id: String(id),
      type: 'tv',
      season: String(season),
      episode: String(episode),
    })
  },

  async getSubtitles(ctx) {
    return ctx?.subtitles || []
  },
}

return MODULE
