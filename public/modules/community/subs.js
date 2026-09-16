/**
 * Streak community module — Subtitles
 * Client-only. No host API.
 *
 * Install: /modules/community/subs.js
 *
 * Return: [{ label, lang, url }]  url may be https or blob:
 */

const TMDB_KEY = '84120436235fe71398e95a662f44db8b'
const TMDB = 'https://api.themoviedb.org/3'

const LANG = {
  eng: 'en', spa: 'es', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de',
  ita: 'it', por: 'pt', ara: 'ar', tur: 'tr', rus: 'ru', jpn: 'ja',
  kor: 'ko', chi: 'zh', zho: 'zh', cze: 'cs', ces: 'cs', dut: 'nl',
  pol: 'pl', hun: 'hu', rum: 'ro', ron: 'ro', gre: 'el', hrv: 'hr',
}

function progress(ctx, p) {
  try {
    ctx?.onProgress?.(p)
  } catch {
    /* ignore */
  }
}

function normLang(code) {
  const c = String(code || '').toLowerCase()
  if (LANG[c]) return LANG[c]
  if (c.length > 2) return c.slice(0, 2)
  return c || 'und'
}

function bestByLang(tracks) {
  const by = new Map()
  for (const t of tracks) {
    if (!t?.url) continue
    const lang = normLang(t.lang)
    const prev = by.get(lang)
    const score = Number(t.downloads || 0)
    if (!prev || score > Number(prev.downloads || 0)) by.set(lang, { ...t, lang })
  }
  return [...by.values()].sort((a, b) => {
    if (a.lang === 'en') return -1
    if (b.lang === 'en') return 1
    return a.lang.localeCompare(b.lang)
  })
}

async function imdbId(kind, id) {
  const res = await fetch(`${TMDB}/${kind}/${id}/external_ids?api_key=${TMDB_KEY}`)
  const data = await res.json()
  return data.imdb_id || null
}

async function stremio(imdb, kind, season, episode) {
  if (!imdb) return []
  const type = kind === 'tv' ? 'series' : 'movie'
  const sid = kind === 'tv' ? `${imdb}:${season}:${episode}` : imdb
  const urls = [
    `https://opensubtitles-v3.strem.io/subtitles/${type}/${sid}.json`,
    `https://opensubtitles.strem.io/subtitles/${type}/${sid}.json`,
  ]
  const out = []
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const list = data.subtitles || data.streams || []
      for (const r of list) {
        if (!r?.url) continue
        out.push({
          label: r.lang || r.language || r.title,
          lang: r.lang || r.language,
          url: r.url,
          downloads: 0,
        })
      }
    } catch {
      /* next */
    }
  }
  return out
}

async function opensubtitles(imdb, season, episode) {
  if (!imdb) return []
  const num = String(imdb).replace(/^tt/i, '')
  let path = `https://rest.opensubtitles.org/search/imdbid-${num}`
  if (season && episode) {
    path = `https://rest.opensubtitles.org/search/episode-${episode}/imdbid-${num}/season-${season}`
  }
  try {
    const res = await fetch(path, { headers: { 'X-User-Agent': 'VLSub 0.10.2' } })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data
      .map((row) => {
        let url = row.SubDownloadLink || ''
        if (url) {
          url = url.replace('download/', 'download/subencoding-utf8/').replace(/\.gz$/i, '')
        }
        return {
          label: row.LanguageName || row.SubLanguageID,
          lang: row.ISO639 || row.SubLanguageID,
          url,
          downloads: Number(row.SubDownloadsCnt || 0),
        }
      })
      .filter((t) => t.url)
  } catch {
    return []
  }
}

async function wyzie(kind, id, season, episode) {
  const q = new URLSearchParams({ id: String(id), format: 'srt,vtt' })
  if (kind === 'tv' && season && episode) {
    q.set('season', String(season))
    q.set('episode', String(episode))
  }
  for (const host of ['https://sub.wyzie.io/search?', 'https://subs.wyzie.ru/search?']) {
    try {
      const res = await fetch(host + q.toString())
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data)) continue
      return data.filter((r) => r?.url).map((r) => ({
        label: r.display || r.language,
        lang: r.language,
        url: r.url,
        downloads: 0,
      }))
    } catch {
      /* next */
    }
  }
  return []
}

const MODULE = {
  id: 'subs',
  name: 'Community Subs',
  author: 'Streak',
  version: '2.0.0',
  icon: '/icon.png',
  labels: ['community', 'subtitles'],
  description: 'Client-side OpenSubtitles + Wyzie — every language',

  async getSubtitles(ctx) {
    const kind = ctx?.kind === 'tv' ? 'tv' : 'movie'
    const id = ctx?.id
    if (!id) return []
    progress(ctx, { message: 'Searching subtitles…', pct: 40 })
    try {
      const q = new URLSearchParams({ kind, id: String(id) })
      if (kind === 'tv' && ctx.season && ctx.episode) {
        q.set('season', String(ctx.season))
        q.set('episode', String(ctx.episode))
      }
      const host = await fetch('/api/subtitles/search?' + q.toString())
      if (host.ok) {
        const data = await host.json()
        if (data.tracks?.length) {
          progress(ctx, { message: `${data.tracks.length} languages`, pct: 80 })
          return data.tracks
        }
      }
    } catch {
      /* no host search */
    }
    const imdb = await imdbId(kind, id)
    const [os, st, wz] = await Promise.all([
      opensubtitles(imdb, ctx.season, ctx.episode),
      stremio(imdb, kind, ctx.season, ctx.episode),
      wyzie(kind, id, ctx.season, ctx.episode),
    ])
    const tracks = bestByLang([...os, ...st, ...wz])
    progress(ctx, {
      message: tracks.length ? `${tracks.length} languages` : 'No subtitles found',
      pct: 80,
    })
    return tracks
  },
}

return MODULE
