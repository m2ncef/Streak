/**
 * Streak community module — VidSrc
 *
 * Prefers host /api/extract (HLS) when present.
 * Falls back to a client iframe embed — no scrape in the browser.
 *
 * Install: /modules/community/vidsrc.js
 */

const EMBEDS = [
  'https://vidsrcme.ru/embed',
  'https://vidsrc.ir/embed',
  'https://vidsrc2.ru/embed',
  'https://vidsrcme.su/embed',
  'https://vidsrc-me.ru/embed',
  'https://vidsrc.me/embed',
  'https://vidsrc.io/embed',
  'https://vidsrc.tw/embed',
]

function firstHls(data) {
  if (!data?.results) return { url: null, subs: [] }
  for (const result of Object.values(data.results)) {
    if (result?.hls_url) return { url: result.hls_url, subs: result.subtitles || [] }
  }
  return { url: null, subs: [] }
}

function proxy(url, referer) {
  const q = new URLSearchParams({ url })
  if (referer) q.set('referer', referer)
  return '/api/hls-proxy?' + q.toString()
}

function iframe(kind, id, season, episode) {
  const host = EMBEDS[0]
  const url =
    kind === 'tv'
      ? `${host}/tv/${id}/${season}/${episode}`
      : `${host}/movie/${id}`
  return { type: 'iframe', url }
}

async function extract(kind, id, season, episode, ctx) {
  const progress = (p) => ctx?.onProgress?.(p)
  progress({ message: 'Extracting stream…', pct: 25 })
  const q = new URLSearchParams({ tmdb_id: String(id), type: kind, first: '1' })
  if (kind === 'tv') {
    q.set('season', String(season))
    q.set('episode', String(episode))
  }
  try {
    const res = await fetch('/api/extract?' + q.toString())
    if (res.ok) {
      const data = await res.json()
      const { url, subs } = firstHls(data)
      if (url) {
        let origin = ''
        try {
          origin = new URL(url).origin + '/'
        } catch {
          /* ignore */
        }
        progress({ message: 'Stream ready', pct: 90 })
        return {
          type: 'hls',
          url: proxy(url, origin),
          subtitles: (subs || []).map((s, i) => ({
            label: 'Caption ' + (i + 1),
            lang: 'en',
            url: typeof s === 'string' ? s : s.url,
          })),
        }
      }
    }
  } catch {
    /* host extract missing — iframe */
  }
  progress({ message: 'Opening embed…', pct: 70 })
  return iframe(kind, id, season, episode)
}

const MODULE = {
  id: 'vidsrc',
  name: 'VidSrc',
  author: 'Streak',
  version: '3.1.0',
  icon: '/icon.png',
  labels: ['community', 'hls', 'iframe', 'movies', 'tv'],
  description: 'VidSrc HLS via extract, iframe fallback',

  async getMovieStream(id, ctx) {
    return extract('movie', id, null, null, ctx)
  },

  async getTvStream(id, season, episode, ctx) {
    return extract('tv', id, season, episode, ctx)
  },
}

return MODULE
