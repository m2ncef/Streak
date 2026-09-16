'use client'
import { useCallback, useEffect, useState } from 'react'
import { resolveStreaming, resolveSubtitles } from '../modules'
import StreamPlayer from './StreamPlayer'

export default function WatchPlayer({
  kind,
  id,
  season,
  episode,
  title,
  next,
  runtime,
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
      const extraSubs = await resolveSubtitles(ctx)
      if (cancelled) return
      if (stream?.url) {
        const subtitles = [...(stream.subtitles || []), ...(extraSubs || [])]
        setSource({ ...stream, subtitles })
      }
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
      if ((e.key === 'n' || e.key === 'N') && next && offerNext) onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNext, next, offerNext])

  const onTime = useCallback(
    ({ current, duration }) => {
      if (!next || !duration || duration < 20) return
      const remain = duration - current
      const tail = Math.min(30, Math.max(15, duration * 0.045))
      const listed = runtime > 0 ? runtime * 60 : 0
      const inCredits =
        listed && duration > listed + 20 && current >= Math.max(0, listed - 10)
      setOfferNext(remain <= tail || inCredits)
    },
    [next, runtime]
  )

  const label =
    kind === 'tv' && season && episode ? `S${season} E${episode}` : title

  return (
    <div
      className={`watchPlayer ${chrome ? 'is-chrome' : ''}`}
      onMouseMove={() => setChrome(true)}
      onClick={() => setChrome(true)}
    >
      <div className="watchBar">
        <button
          type="button"
          className="watchClose"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose?.()
          }}
          aria-label="Close"
        >
          <i className="fa fa-chevron-left" aria-hidden="true" />
        </button>
        <div className="watchTop">
          <p>{label}</p>
          <span>
            {kind === 'tv' && title ? `${title} · ` : ''}
            {source?.module?.name || ''}
          </span>
        </div>
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
          <StreamPlayer
            url={source.url}
            title={label}
            subtitles={source.subtitles}
            next={next}
            onNext={onNext}
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

      {next && source && offerNext && (
        <button
          type="button"
          className="watchNext is-offer"
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
