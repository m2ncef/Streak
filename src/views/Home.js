'use client'
import Link from 'next/link'
import Header from '../Components/Header'
import { useEffect, useMemo, useRef, useState } from 'react'
import MovieCard from '../Components/MovieCard'
import Footer from '../Components/Footer'
import Loading from '../Components/Loading'

const API = 'https://api.themoviedb.org/3'
const KEY = '84120436235fe71398e95a662f44db8b'
const IMG = 'https://image.tmdb.org/t/p/w500'
const WIDE = 'https://image.tmdb.org/t/p/w1280'
const ORIGINAL = 'https://image.tmdb.org/t/p/original'
const LOGO = 'https://image.tmdb.org/t/p/w500'

const GENRE_RAILS = [
  { title: 'Action & thrillers', id: 28, type: 'movie' },
  { title: 'Comedies', id: 35, type: 'movie' },
  { title: 'Sci-fi & fantasy', id: 878, type: 'movie' },
  { title: 'Crime dramas', id: 80, type: 'tv' },
  { title: 'Animation', id: 16, type: 'movie' },
  { title: 'Documentaries', id: 99, type: 'tv' },
]

const GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

function cards(results) {
  return (results || [])
    .filter((r) => r.poster_path)
    .map((r) => ({ img: r.poster_path, id: r.id }))
}

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function Rail({ title, href, items, show, large, ranked }) {
  if (!items?.length) return null
  return (
    <section className={`homeRail ${large ? 'is-large' : ''} ${ranked ? 'is-ranked' : ''}`}>
      <div className="homeRailHead">
        <h2>{title}</h2>
        {href && (
          <Link href={href} className="homeRailMore">
            See all
          </Link>
        )}
      </div>
      <div className="trendingScroll">
        {items.map((m, i) => (
          ranked ? (
            <div className="rankedCard" key={m.id}>
              <span className="rankedNum">{i + 1}</span>
              <MovieCard img={m.img} id={m.id} show={show ? 'true' : undefined} />
            </div>
          ) : (
            <MovieCard key={m.id} img={m.img} id={m.id} show={show ? 'true' : undefined} />
          )
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const [hero, setHero] = useState(null)
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [latest, setLatest] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [top10, setTop10] = useState([])
  const [genreRails, setGenreRails] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [myList, setMyList] = useState([])
  const [error, setError] = useState('')
  const [heroMuted, setHeroMuted] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const trailerRef = useRef(null)

  useEffect(() => {
    document.title = 'Streak'
    let cancelled = false

    async function load() {
      try {
        const [nowM, topM, weekTV, topTV, trendingWeek] = await Promise.all([
          fetch(`${API}/movie/now_playing?api_key=${KEY}`),
          fetch(`${API}/movie/top_rated?api_key=${KEY}`),
          fetch(`${API}/trending/tv/week?api_key=${KEY}`),
          fetch(`${API}/tv/top_rated?api_key=${KEY}`),
          fetch(`${API}/trending/all/week?api_key=${KEY}`),
        ])
        const nowData = await nowM.json()
        const popularData = await topM.json()
        const latestData = await weekTV.json()
        const popularTData = await topTV.json()
        const trendingData = await trendingWeek.json()
        if (cancelled) return

        const results = nowData.results || []
        const withArt = results.filter((r) => r.backdrop_path && r.poster_path)
        const pick = withArt[Math.floor(Math.random() * withArt.length)] || withArt[0]
        if (pick) {
          setHero({
            id: pick.id,
            title: pick.title,
            overview: pick.overview,
            poster: pick.poster_path,
            backdrop: pick.backdrop_path || pick.poster_path,
            vote: String(pick.vote_average ?? '').slice(0, 3),
            year: String(pick.release_date || '').slice(0, 4),
            genreIds: pick.genre_ids || [],
            logo: null,
            runtime: null,
            trailerKey: null,
          })
          fetch(`${API}/movie/${pick.id}/images?api_key=${KEY}&include_image_language=en,null`)
            .then((r) => r.json())
            .then((img) => {
              if (cancelled) return
              const logos = img.logos || []
              const best = logos.find((l) => l.iso_639_1 === 'en') || logos[0]
              if (best) setHero((h) => (h ? { ...h, logo: best.file_path } : h))
            })
            .catch(() => {})
          fetch(`${API}/movie/${pick.id}?api_key=${KEY}`)
            .then((r) => r.json())
            .then((d) => {
              if (cancelled) return
              setHero((h) => (h ? { ...h, runtime: d.runtime, certification: d.adult ? '18+' : null } : h))
            })
            .catch(() => {})
          fetch(`${API}/movie/${pick.id}/videos?api_key=${KEY}`)
            .then((r) => r.json())
            .then((v) => {
              if (cancelled) return
              const vids = v.results || []
              const best =
                vids.find((x) => x.site === 'YouTube' && x.type === 'Trailer' && x.official) ||
                vids.find((x) => x.site === 'YouTube' && x.type === 'Trailer') ||
                vids.find((x) => x.site === 'YouTube')
              if (best) setHero((h) => (h ? { ...h, trailerKey: best.key } : h))
            })
            .catch(() => {})
        }

        setTrending(cards(results))
        setPopular(cards(popularData.results))
        setLatest(cards(latestData.results))
        setPopularTV(cards(popularTData.results))
        setTop10(
          cards((trendingData.results || []).slice(0, 10)).map((c, i) => ({
            ...c,
            show: trendingData.results?.[i]?.media_type === 'tv',
          }))
        )

        const genreResponses = await Promise.all(
          GENRE_RAILS.map((g) =>
            fetch(`${API}/discover/${g.type}?api_key=${KEY}&with_genres=${g.id}&sort_by=popularity.desc`).then(
              (r) => r.json()
            )
          )
        )
        if (cancelled) return
        setGenreRails(
          GENRE_RAILS.map((g, i) => ({
            title: g.title,
            show: g.type === 'tv',
            href: `/browse?type=${g.type}&genre=${g.id}`,
            items: cards(genreResponses[i]?.results),
          }))
        )
      } catch {
        if (!cancelled) setError('TMDB did not answer. Try again in a bit.')
      }
    }

    load()

    const cw = readList('continueWatching')
    setContinueWatching(
      cw.map((entry) => ({
        id: typeof entry === 'string' ? entry.split('/').pop() : entry.id,
        img: entry.poster,
        show: typeof entry === 'string' ? entry.includes('tv') : entry.show,
      })).filter((c) => c.img)
    )
    const list = readList('library')
    setMyList(
      list
        .map((entry) => {
          if (typeof entry !== 'string') return null
          const [, type, id] = entry.match(/\/?(movie|tv)\/(\d+)/) || []
          return type ? { id, show: type === 'tv' } : null
        })
        .filter(Boolean)
    )

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!myList.length) return
    let cancelled = false
    Promise.all(
      myList.map((m) =>
        fetch(`${API}/${m.show ? 'tv' : 'movie'}/${m.id}?api_key=${KEY}`)
          .then((r) => r.json())
          .then((d) => (d.poster_path ? { id: m.id, img: d.poster_path, show: m.show } : null))
      )
    ).then((resolved) => {
      if (!cancelled) setMyList(resolved.filter(Boolean))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hero?.trailerKey) return
    setTrailerReady(false)
    const t = setTimeout(() => setTrailerReady(true), 800)
    return () => clearTimeout(t)
  }, [hero?.trailerKey])

  useEffect(() => {
    const w = trailerRef.current?.contentWindow
    if (!w) return
    w.postMessage(
      `{"event":"command","func":"${heroMuted ? 'mute' : 'unMute'}","args":""}`,
      '*'
    )
  }, [heroMuted])

  const field = hero?.backdrop ? `${ORIGINAL}${hero.backdrop}` : ''
  const logoSrc = hero?.logo ? `${LOGO}${hero.logo}` : ''
  const showTrailer = Boolean(hero?.trailerKey) && trailerReady
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const trailerSrc = hero?.trailerKey
    ? `https://www.youtube-nocookie.com/embed/${hero.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${hero.trailerKey}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : ''

  const heroTags = useMemo(() => {
    if (!hero) return []
    const tags = []
    if (hero.vote && Number(hero.vote) >= 7.5) tags.push('Top rated')
    if (hero.year === String(new Date().getFullYear())) tags.push('New release')
    return tags
  }, [hero])

  const heroGenres = useMemo(() => {
    if (!hero?.genreIds) return []
    return hero.genreIds.slice(0, 3).map((id) => GENRE_NAMES[id]).filter(Boolean)
  }, [hero])

  const heroRuntime = useMemo(() => {
    if (!hero?.runtime) return ''
    const h = Math.floor(hero.runtime / 60)
    const m = hero.runtime % 60
    return h ? `${h}h ${m}m` : `${m}m`
  }, [hero])

  return (
    <>
      <Loading />
      <main className="homePage">
        <Header />
        {error && <p className="homeError">{error}</p>}

        {hero && (
          <section className="homeHero" style={{ backgroundImage: `url(${field})` }}>
            {showTrailer && (
              <div className="homeHeroVideo" aria-hidden="true">
                <iframe
                  ref={trailerRef}
                  src={trailerSrc}
                  title="Trailer"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  tabIndex={-1}
                  onLoad={(e) => {
                    const w = e.currentTarget.contentWindow
                    if (!w) return
                    w.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
                    w.postMessage(
                      `{"event":"command","func":"${heroMuted ? 'mute' : 'unMute'}","args":""}`,
                      '*'
                    )
                  }}
                />
                <div className="homeHeroVideoShield" />
              </div>
            )}
            <div className="homeHeroScrim" />
            <div className="homeHeroScrimSide" />
            <div className="homeHeroScrimBottom" />

            {showTrailer && (
              <button
                type="button"
                className="heroMuteToggle"
                onClick={() => setHeroMuted((m) => !m)}
                aria-label={heroMuted ? 'Unmute' : 'Mute'}
              >
                <i className={`fa fa-volume-${heroMuted ? 'off' : 'up'}`} aria-hidden="true" />
              </button>
            )}

            <div className="homeHeroCopy">
              {logoSrc ? (
                <img className="homeHeroLogo" src={logoSrc} alt={hero.title} />
              ) : (
                <h1 className="homeHeroTitleFallback">{hero.title}</h1>
              )}

              <p className="homeMeta">
                {hero.vote && <span className="homeMetaScore">★ {hero.vote}</span>}
                {hero.year && <span>{hero.year}</span>}
                {heroRuntime && <span>{heroRuntime}</span>}
                {heroGenres.length > 0 && <span>{heroGenres.join(' · ')}</span>}
                {heroTags.map((t) => (
                  <span key={t} className="homeTag">
                    {t}
                  </span>
                ))}
              </p>

              {hero.overview && <p className="homeOverview">{hero.overview}</p>}

              <div className="homeHeroActs">
                <Link href={`/movie/${hero.id}`} className="homePlay">
                  <i className="fa fa-play" aria-hidden="true" /> Play
                </Link>
                <Link href={`/movie/${hero.id}`} className="homeGhost">
                  <i className="fa fa-info-circle" aria-hidden="true" /> More info
                </Link>
              </div>
            </div>
          </section>
        )}

        <Rail title="Continue watching" items={continueWatching} large />
        <Rail title="Top 10 this week" items={top10} ranked />
        <Rail
          title="Now in theaters"
          href="/browse?type=movie&sort=popularity.desc"
          items={trending}
          large
        />
        <Rail title="My List" href="/list" items={myList} />
        <Rail title="Highest rated films" href="/browse?type=movie&sort=vote_average.desc" items={popular} />
        <Rail title="Shows people are on" href="/browse?type=tv" items={latest} show />
        <Rail title="TV worth finishing" href="/browse?type=tv&sort=vote_average.desc" items={popularTV} show />
        {genreRails.map((g) => (
          <Rail key={g.title} title={g.title} href={g.href} items={g.items} show={g.show} />
        ))}
      </main>
      <Footer />
    </>
  )
}
