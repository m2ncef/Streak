'use client'
import { useEffect, useState } from 'react'
import { resolveStreaming, resolveSubtitles } from '../modules'
import HlsPlayer from './HlsPlayer'

export default function ShowScraper(props) {
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      const ctx = {
        kind: 'tv',
        id: props.id,
        season: props.s,
        episode: props.e,
      }
      const stream = await resolveStreaming(ctx)
      await resolveSubtitles(ctx)
      if (cancelled) return
      if (stream?.url) {
        setSource(stream)
      } else {
        setError('No enabled streaming module returned a source.')
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [props.id, props.s, props.e])

  if (loading) {
    return (
      <div className="scraperStatus">
        <p>sbr chwiya sahbi...</p>
      </div>
    )
  }

  if (error || !source) {
    return (
      <div className="scraperStatus">
        Source Not Found m9drtch nelgah, smhli hbb hhhh
      </div>
    )
  }

  if (source.type === 'hls' || /\.m3u8(\?|$)/i.test(source.url) || source.url.includes('/api/hls-proxy')) {
    return (
      <div className="scraperFrame">
        <HlsPlayer url={source.url} style={{ width: '100%', height: '100%' }} />
      </div>
    )
  }

  return (
    <div className="scraperFrame">
      <iframe
        width="100%"
        height="100%"
        src={source.url}
        title={source.module?.name || 'stream'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
