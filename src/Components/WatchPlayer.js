'use client'
import { useCallback, useEffect, useState } from 'react'
import { resolveStreaming, resolveSubtitles } from '../modules'
import HlsPlayer from './HlsPlayer'

export default function WatchPlayer({
  kind,
  id,
  season,
  episode,
  title,
  next,
  onClose,
  onNext,
}) {
  const [progress, setProgress] = useState({ message: 'Starting…', pct: 8, module: '' })
  const [source, setSource] = useState(null)
  const [error, setError] = useState('')
  const [chrome, setChrome] = useState(true)
  const [offerNext, setOfferNext] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setSource(null)
      setError('')
      setOfferNext(false)
      setProgress({ message: 'Starting…', pct: 8, module: '' })
      const ctx = {
        kind,
        id,
        season,
        episode,
        onProgress: (p) => {
          if (!cancelled) setProgress((prev) => ({ ...prev, ...p }))
        },
      }
      const stream = await resolveStreaming(ctx)
      await resolveSubtitles(ctx)
      if (cancelled) return
      if (stream?.url) setSource(stream)
      else setError('No enabled module returned a stream.')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kind, id, season, episode])

  useEffect(() => {
    if (!chrome) return
    const t = setTimeout(() => setChrome(false), 2800)
    return () => clearTimeout(t)
  }, [chrome, source])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'n' || e.key === 'N') next && onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, next])

  const onTime = useCallback(
    ({ current, duration }) => {
      if (!next || !duration) return
      setOfferNext(duration - current <= 12)
    },
    [next]
  )

  const label =
    kind === 'tv' && season && episode ? `S${season} E${episode}` : title

  return (
    <div
      className={`watchPlayer ${chrome ? 'is-chrome' : ''}`}
      onMouseMove={() => setChrome(true)}
      onClick={() => setChrome(true)}
    >
      <button type="button" className="watchClose" onClick={onClose} aria-label="Close">
        <i className="fa fa-chevron-left" aria-hidden="true" />
      </button>

      <div className="watchTop">
        <p>{label}</p>
        {title && kind === 'tv' ? <span>{title}</span> : null}
        {source?.module?.name ? <em>{source.module.name}</em> : null}
      </div>

      {!source && !error && (
        <div className="watchLoad">
          <div className="watchLoadBar">
            <span style={{ width: `${Math.min(100, progress.pct || 8)}%` }} />
          </div>
          <p>{progress.message || 'Loading…'}</p>
          {progress.module ? <span>{progress.module}</span> : null}
        </div>
      )}

      {error && (
        <div className="watchLoad">
          <p>{error}</p>
          <button type="button" className="watchNext" onClick={onClose}>
            Back
          </button>
        </div>
      )}

      {source &&
        (source.type === 'hls' ||
        /\.m3u8(\?|$)/i.test(source.url) ||
        source.url.includes('/api/hls-proxy') ? (
          <HlsPlayer
            url={source.url}
            muted={false}
            onEnded={() => next && onNext?.()}
            onTime={onTime}
          />
        ) : (
          <iframe
            src={source.url}
            title={source.module?.name || 'stream'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ))}

      {next && source && (
        <button
          type="button"
          className={`watchNext ${offerNext ? 'is-offer' : ''}`}
          onClick={onNext}
        >
          Next episode
          <small>
            S{next.s} E{next.e}
          </small>
        </button>
      )}
    </div>
  )
}
