/**
 * Streak community module — VidSrc
 *
 * Playwright scrape lives on the host (/api/extract).
 * This file is the installable source module.
 *
 * Install:
 *   /modules/community/vidsrc.js
 */

const PROVIDERS = [
  'https://vidsrc2.ru',
  'https://vidsrc.ir',
  'https://vidsrcme.ru',
  'https://vidsrcme.su',
  'https://vidsrc-me.ru',
  'https://vidsrc.me',
  'https://vidsrc.io',
  'https://vidsrc.tw',
]

function firstHls(data) {
  if (!data?.results) return { url: null, subs: [] }
  const order = PROVIDERS.filter((d) => data.results[d])
  const rest = Object.keys(data.results).filter((d) => !order.includes(d))
  for (const domain of order.concat(rest)) {
    const result = data.results[domain]
    if (result?.hls_url) {
      return { url: result.hls_url, subs: result.subtitles || [] }
    }
  }
  return { url: null, subs: [] }
}

function proxy(url, referer) {
  const q = new URLSearchParams({ url })
  if (referer) q.set('referer', referer)
  return '/api/hls-proxy?' + q.toString()
}

async function extract(params, ctx) {
  const progress = (p) => ctx?.onProgress?.(p)
  progress({ phase: 'start', message: 'Contacting VidSrc…', pct: 15 })
  const q = new URLSearchParams(params)
  q.set('first', '1')
  progress({ phase: 'fetch', message: 'Scraping providers…', pct: 40 })
  const res = await fetch('/api/extract?' + q.toString())
  progress({ phase: 'parse', message: 'Reading stream…', pct: 75 })
  const data = await res.json()
  const { url, subs } = firstHls(data)
  if (!url) throw new Error(data.error || 'No HLS stream')
  const origin = (() => {
    try {
      return new URL(url).origin + '/'
    } catch {
      return ''
    }
  })()
  progress({ phase: 'ready', message: 'Stream ready', pct: 95 })
  return {
    type: 'hls',
    url: proxy(url, origin),
    subtitles: (subs || []).map((s, i) => ({
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
  version: '2.2.0',
  icon: '/icon.png',
  labels: ['community', 'hls', 'movies', 'tv'],
  description: 'VidSrc HLS via host /api/extract (Playwright scrape)',

  async getMovieStream(id, ctx) {
    return extract({ tmdb_id: String(id), type: 'movie' }, ctx)
  },

  async getTvStream(id, season, episode, ctx) {
    return extract(
      {
        tmdb_id: String(id),
        type: 'tv',
        season: String(season),
        episode: String(episode),
      },
      ctx
    )
  },

  async getSubtitles(ctx) {
    return ctx?.subtitles || []
  },
}

return MODULE
