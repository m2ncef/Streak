'use client'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

function HlsCtor() {
  if (typeof Hls?.isSupported === 'function') return Hls
  if (typeof Hls?.default?.isSupported === 'function') return Hls.default
  return null
}

export default function HlsPlayer({ url, ...rest }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    const Ctor = HlsCtor()
    let hls
    let recovers = 0

    if (Ctor?.isSupported()) {
      hls = new Ctor({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: 0,
        testBandwidth: false,
        progressive: false,
        maxFragLookUpTolerance: 0.25,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      })
      hls.on(Ctor.Events.ERROR, (_evt, data) => {
        if (!data?.fatal) return
        if (data.type === Ctor.ErrorTypes.MEDIA_ERROR && recovers < 2) {
          recovers += 1
          hls.recoverMediaError()
          return
        }
        setError(data.details || 'Playback failed')
      })
      hls.on(Ctor.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
      hls.loadSource(url)
      hls.attachMedia(video)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}), { once: true })
    } else {
      setError('HLS is not supported in this browser')
    }

    return () => {
      hls?.destroy()
    }
  }, [url])

  return (
    <div className="hlsPlayer" {...rest}>
      <video
        ref={videoRef}
        controls
        playsInline
        muted
        preload="auto"
      />
      {error ? <p className="hlsError">{error}</p> : null}
    </div>
  )
}
