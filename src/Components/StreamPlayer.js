'use client'
import { useEffect, useRef } from 'react'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

function HlsCtor() {
  if (typeof Hls?.isSupported === 'function') return Hls
  if (typeof Hls?.default?.isSupported === 'function') return Hls.default
  return null
}

function srtToVtt(raw) {
  let text = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
  if (!text) return ''
  if (text.startsWith('WEBVTT')) return text
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
  return `WEBVTT\n\n${text}\n`
}

async function fetchText(url) {
  try {
    const r = await fetch(url)
    if (r.ok) return r.text()
  } catch {
    /* cors */
  }
  for (const p of [
    'https://corsproxy.io/?' + encodeURIComponent(url),
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
  ]) {
    try {
      const r = await fetch(p)
      if (r.ok) return r.text()
    } catch {
      /* next */
    }
  }
  return null
}

async function loadSub(url) {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url
  const text = await fetchText(url)
  if (!text) return url
  const vtt = srtToVtt(text)
  return URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }))
}

const LANG_NAME = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ar: 'Arabic', tr: 'Turkish', ru: 'Russian', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese', cs: 'Czech', nl: 'Dutch', pl: 'Polish',
  hu: 'Hungarian', ro: 'Romanian', el: 'Greek', hr: 'Croatian', sr: 'Serbian',
  sl: 'Slovenian', sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish',
  is: 'Icelandic', he: 'Hebrew', fa: 'Persian', hi: 'Hindi', ta: 'Tamil',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', uk: 'Ukrainian',
  bg: 'Bulgarian', sq: 'Albanian', mk: 'Macedonian', ka: 'Georgian',
  hy: 'Armenian', eu: 'Basque', ca: 'Catalan', gl: 'Galician', sk: 'Slovak',
  lt: 'Lithuanian', lv: 'Latvian', et: 'Estonian',
}

function trackLabel(s, i) {
  const code = String(s.lang || '').toLowerCase()
  const named = LANG_NAME[code]
  if (named) return named
  if (s.label && s.label.length > 3) return s.label
  return s.label || s.lang || `Caption ${i + 1}`
}

export default function StreamPlayer({
  url,
  title,
  subtitles = [],
  next,
  onNext,
  onEnded,
  onTime,
}) {
  const el = useRef(null)

  useEffect(() => {
    if (!el.current || !url) return
    const Ctor = HlsCtor()
    let hls
    let art
    let dead = false
    const blobs = []

    async function boot() {
      const raw = (subtitles || []).filter((s) => s?.url && !/\.zip(\?|$)/i.test(s.url))
      const tracks = []
      for (let i = 0; i < raw.length; i++) {
        if (dead) return
        const href = await loadSub(raw[i].url)
        if (href && href.startsWith('blob:')) blobs.push(href)
        tracks.push({ html: trackLabel(raw[i], i), url: href, type: 'vtt' })
      }
      if (dead || !el.current) return
      const english = tracks.find((t) => /english/i.test(t.html)) || tracks[0]
      const isHls = /\.m3u8(\?|$)/i.test(url) || url.includes('m3u8')

      art = new Artplayer({
      container: el.current,
      url,
      type: isHls ? 'm3u8' : undefined,
      title: title || '',
      autoplay: true,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: false,
      pip: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      airplay: true,
      theme: '#ffffff',
      lang: 'en',
      volume: 1,
      hotkey: true,
      moreVideoAttr: { playsInline: true },
      subtitle: english
        ? {
            url: english.url,
            type: 'vtt',
            encoding: 'utf-8',
            escape: false,
            style: {
              color: '#fff',
              'font-size': '20px',
              'text-shadow': '0 2px 8px #000',
            },
          }
        : {},
      subtitleOffset: true,
      settings: tracks.length
        ? [
            {
              width: 280,
              html: 'Subtitles',
              tooltip: english ? english.html : 'Off',
              selector: [
                { html: 'Off', url: '' },
                ...tracks.map((t) => ({ ...t, default: english && t.url === english.url })),
              ],
              onSelect(item) {
                if (!item.url) {
                  art.subtitle.show = false
                  return 'Off'
                }
                art.subtitle.show = true
                art.subtitle.switch(item.url, { name: item.html, type: 'vtt' })
                return item.html
              },
            },
          ]
        : [],
      customType: {
        m3u8(video, src) {
          if (Ctor?.isSupported()) {
            hls = new Ctor({
              enableWorker: false,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              fragLoadingMaxRetry: 6,
            })
            hls.loadSource(src)
            hls.attachMedia(video)
            hls.on(Ctor.Events.MANIFEST_PARSED, () => {
              if (dead) return
              const levels = (hls.levels || [])
                .map((l, i) => ({
                  html: l.height ? `${l.height}p` : l.bitrate ? `${Math.round(l.bitrate / 1000)}kbps` : `Q${i + 1}`,
                  level: i,
                }))
                .reverse()
              if (!levels.length) return
              art.setting.update({
                name: 'quality',
                html: 'Quality',
                tooltip: 'Auto',
                width: 200,
                selector: [{ html: 'Auto', level: -1, default: true }, ...levels],
                onSelect(item) {
                  hls.currentLevel = item.level
                  return item.html
                },
              })
              video.play().catch(() => {})
            })
            hls.on(Ctor.Events.ERROR, (_e, data) => {
              if (dead || !data?.fatal) return
              if (data.type === Ctor.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
              else if (data.type === Ctor.ErrorTypes.NETWORK_ERROR) hls.startLoad()
            })
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src
          } else {
            art.notice.show = 'HLS is not supported'
          }
        },
      },
    })

    art.on('ready', () => {
      if (english) art.subtitle.show = true
    })
    art.on('video:timeupdate', () => {
      if (!art.duration) return
      onTime?.({ current: art.currentTime, duration: art.duration })
    })
    art.on('video:ended', () => onEnded?.())
    }

    boot()

    return () => {
      dead = true
      try {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => {})
        }
        const video = art?.video
        if (video) {
          video.pause()
          video.removeAttribute('src')
          video.load()
        }
        hls?.stopLoad?.()
        hls?.detachMedia?.()
        hls?.destroy()
        hls = null
        art?.destroy(true)
      } catch {
        try {
          art?.destroy(true)
        } catch {
          /* already gone */
        }
      }
      blobs.forEach((b) => URL.revokeObjectURL(b))
    }
  }, [url])

  return <div ref={el} className="streamPlayer" />
}
