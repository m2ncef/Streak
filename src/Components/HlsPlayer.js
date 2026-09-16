'use client'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

function HlsCtor() {
  if (typeof Hls?.isSupported === 'function') return Hls
  if (typeof Hls?.default?.isSupported === 'function') return Hls.default
  return null
}

export default function HlsPlayer({ url, muted = false, onEnded, onTime, ...rest }) {
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
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        testBandwidth: true,
        progressive: false,
        maxBufferHole: 1,
        maxFragLookUpTolerance: 0.5,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 10,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
      })
      hls.on(Ctor.Events.ERROR, (_evt, data) => {
        if (!data) return
        const reset =
          data.details === 'mediaSourceRequiresReset' ||
          data.details === Ctor.ErrorDetails?.BUFFER_APPEND_ERROR
        if (reset || (data.fatal && data.type === Ctor.ErrorTypes.MEDIA_ERROR)) {
          if (recovers < 4) {
            recovers += 1
            try {
              hls.recoverMediaError()
              hls.startLoad()
            } catch {
              setError(data.details || 'Playback failed')
            }
            return
          }
        }
        if (!data.fatal) return
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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
  }, [muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnd = () => onEnded?.()
    const onT = () => {
      if (!video.duration) return
      onTime?.({ current: video.currentTime, duration: video.duration })
    }
    video.addEventListener('ended', onEnd)
    video.addEventListener('timeupdate', onT)
    return () => {
      video.removeEventListener('ended', onEnd)
      video.removeEventListener('timeupdate', onT)
    }
  }, [onEnded, onTime, url])

  return (
    <div className="hlsPlayer" {...rest}>
      <video
        ref={videoRef}
        controls
        playsInline
        muted={muted}
        autoPlay
        preload="auto"
      />
      {error ? <p className="hlsError">{error}</p> : null}
    </div>
  )
}
