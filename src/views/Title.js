'use client'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MovieCard from '../Components/MovieCard'
import Footer from '../Components/Footer'
import Loading from '../Components/Loading'
import { Toaster, toast } from 'react-hot-toast'
import WatchPlayer from '../Components/WatchPlayer'

const API = 'https://api.themoviedb.org/3'
const KEY = '84120436235fe71398e95a662f44db8b'
const IMG = 'https://image.tmdb.org/t/p/w500'
const STILL = 'https://image.tmdb.org/t/p/w300'
const ORIGINAL = 'https://image.tmdb.org/t/p/original'

function posters(results) {
  return (results || [])
    .filter((r) => r.poster_path)
    .map((r) => ({ img: r.poster_path, id: r.id }))
}

export default function Title({ kind }) {
  const isTv = kind === 'tv'
  const { id } = useParams()
  const router = useRouter()
  const [info, setInfo] = useState(null)
  const [recom, setRecom] = useState([])
  const [similar, setSimilar] = useState([])
  const [season, setSeason] = useState(1)
  const [episodes, setEpisodes] = useState([])
  const [player, setPlayer] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [logo, setLogo] = useState(null)

  const path = `/${kind}/${id}`

  useEffect(() => {
    const lib = JSON.parse(localStorage.getItem('library') || '[]')
    setSaved(lib.includes(path))
  }, [path])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setInfo(null)
      setLogo(null)
      setSeason(1)
      try {
        const [main, rec, sim] = await Promise.all([
          fetch(`${API}/${kind}/${id}?api_key=${KEY}`),
          fetch(`${API}/${kind}/${id}/recommendations?api_key=${KEY}`),
          fetch(`${API}/${kind}/${id}/similar?api_key=${KEY}`),
        ])
        const data = await main.json()
        if (cancelled) return
        if (data.status_code) throw new Error(data.status_message)
        setInfo(data)
        document.title = `Streak | ${data.title || data.name}`
        const recData = await rec.json()
        const simData = await sim.json()
        if (cancelled) return
        setRecom(posters(recData.results))
        setSimilar(posters(simData.results))
        fetch(`${API}/${kind}/${id}/images?api_key=${KEY}&include_image_language=en,null`)
          .then((r) => r.json())
          .then((img) => {
            if (cancelled) return
            const logos = img.logos || []
            const best = logos.find((l) => l.iso_639_1 === 'en') || logos[0]
            if (best) setLogo(best.file_path)
          })
          .catch(() => {})
      } catch {
        if (!cancelled) setError('Could not load this title.')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [kind, id])

  useEffect(() => {
    if (!isTv || !info) return
    let cancelled = false
    fetch(`${API}/tv/${id}/season/${season}?api_key=${KEY}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setEpisodes(
          (data.episodes || []).map((ep) => ({
            n: ep.episode_number,
            title: ep.name,
            runtime: ep.runtime,
            vote: ep.vote_average,
            still: ep.still_path,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setEpisodes([])
      })
    return () => {
      cancelled = true
    }
  }, [isTv, id, season, info])

  function saveToLibrary() {
    const lib = JSON.parse(localStorage.getItem('library') || '[]')
    if (lib.includes(path)) return
    localStorage.setItem('library', JSON.stringify([...lib, path]))
    setSaved(true)
    toast.success('Added to My List', { position: 'bottom-center' })
  }

  const bar = (
    <div className="titleBar">
      <button type="button" className="titleBarBtn" onClick={() => router.back()} aria-label="Back">
        <i className="fa fa-chevron-left" aria-hidden="true" />
      </button>
      <Link href="/" className="titleBarBrand">
        Streak
      </Link>
      <Link href="/browse" className="titleBarBtn" aria-label="Search">
        <i className="fa fa-search" aria-hidden="true" />
      </Link>
    </div>
  )

  if (error) {
    return (
      <>
        {bar}
        <p className="homeError">{error}</p>
        <Footer />
      </>
    )
  }

  const title = info?.title || info?.name || ''
  const year = String(info?.release_date || info?.first_air_date || '').slice(0, 4)
  const lang = info?.spoken_languages?.[0]?.english_name
  const vote = info?.vote_average != null ? String(info.vote_average).slice(0, 3) : ''
  const poster = info?.poster_path ? `${IMG}${info.poster_path}` : ''
  const backdrop = info?.backdrop_path ? `${ORIGINAL}${info.backdrop_path}` : poster
  const logoSrc = logo ? `${ORIGINAL}${logo}` : ''
  const seasons = info?.number_of_seasons || 0

  function nextEpisode(s, e) {
    if (!isTv || !info) return null
    const list = (info.seasons || []).filter((x) => x.season_number > 0)
    const cur = list.find((x) => x.season_number === s)
    const count = cur?.episode_count || episodes.length
    if (e < count) return { s, e: e + 1 }
    const nxt = list.find((x) => x.season_number === s + 1)
    if (nxt?.episode_count) return { s: s + 1, e: 1 }
    if (!cur && e < episodes.length) return { s, e: e + 1 }
    return null
  }

  return (
    <>
      <Loading />
      <Toaster />
      <main className="titlePage">
        {bar}
        {info && (
          <section className="titleHero" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}>
            <div className="titleHeroScrim" />
            <div className="titleHeroScrimSide" />
            <div className="titleHeroScrimBottom" />

            <div className="titleHeroCopy">
              {logoSrc ? (
                <img className="titleHeroLogo" src={logoSrc} alt={title} />
              ) : (
                <h1 className="titleHeroTitleFallback">{title}</h1>
              )}

              {info?.status && isTv && <p className="titleKicker">{info.status}</p>}
              {info?.tagline && <p className="titleTagline">{info.tagline}</p>}

              <p className="titleFacts">
                {vote && <span className="titleFactsScore">★ {vote}</span>}
                {year && <span>{year}</span>}
                {lang && <span>{lang}</span>}
                {info?.runtime ? <span>{info.runtime}m</span> : null}
                {isTv && seasons ? <span>{seasons} season{seasons > 1 ? 's' : ''}</span> : null}
              </p>

              {!!info?.genres?.length && (
                <p className="titleGenreLine">{info.genres.map((g) => g.name).join(' · ')}</p>
              )}

              {info?.overview && <p className="titleOverview">{info.overview}</p>}

              <div className="titleActs">
                {!isTv && (
                  <button type="button" className="titlePlay" onClick={() => setPlayer({ s: 1, e: 1 })}>
                    <i className="fa fa-play" aria-hidden="true" /> Play
                  </button>
                )}
                <button type="button" className="titleList" disabled={saved} onClick={saveToLibrary}>
                  <i className="fa fa-bookmark" aria-hidden="true" /> {saved ? 'Saved' : 'List'}
                </button>
              </div>
            </div>
          </section>
        )}

        {isTv && (
          <section className="titleBlock">
            <div className="titleBlockHead">
              <h2>Episodes</h2>
              {seasons > 0 && (
                <select value={season} onChange={(e) => setSeason(Number(e.target.value))} aria-label="Season">
                  {Array.from({ length: seasons }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Season {n}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="titleEps">
              {episodes.map((ep) => (
                <button
                  type="button"
                  key={ep.n}
                  className="titleEp"
                  onClick={() => setPlayer({ s: season, e: ep.n })}
                >
                  {ep.still ? (
                    <img src={`${STILL}${ep.still}`} alt="" />
                  ) : (
                    <span className="titleEpBlank" />
                  )}
                  <span className="titleEpMeta">
                    Ep {ep.n}
                    {ep.runtime ? ` · ${ep.runtime}m` : ''}
                    {ep.vote ? ` · ${String(ep.vote).slice(0, 3)}` : ''}
                  </span>
                  <span className="titleEpName">{ep.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {recom.length > 1 && (
          <section className="titleBlock">
            <h2>Recommended</h2>
            <div className="trendingScroll">
              {recom.map((m) => (
                <MovieCard key={`r-${m.id}`} img={m.img} id={m.id} show={isTv ? 'true' : undefined} />
              ))}
            </div>
          </section>
        )}
        {similar.length > 1 && (
          <section className="titleBlock">
            <h2>More like this</h2>
            <div className="trendingScroll">
              {similar.map((m) => (
                <MovieCard key={`s-${m.id}`} img={m.img} id={m.id} show={isTv ? 'true' : undefined} />
              ))}
            </div>
          </section>
        )}
      </main>

      {player && (
        <div className="Player is-open">
          <WatchPlayer
            kind={kind}
            id={id}
            season={player.s}
            episode={player.e}
            title={title}
            next={isTv ? nextEpisode(player.s, player.e) : null}
            runtime={
              isTv && player.s === season
                ? episodes.find((ep) => ep.n === player.e)?.runtime
                : undefined
            }
            onClose={() => setPlayer(null)}
            key={`${player.s}-${player.e}`}
            onNext={() => {
              const n = nextEpisode(player.s, player.e)
              if (n) {
                setSeason(n.s)
                setPlayer(n)
              }
            }}
          />
        </div>
      )}
      <Footer />
    </>
  )
}
