'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import MovieCard from '../Components/MovieCard'
import Header from '../Components/Header'
import Footer from '../Components/Footer'

const API = 'https://api.themoviedb.org/3'
const KEY = '84120436235fe71398e95a662f44db8b'

const SORTS = {
  movie: [
    { value: 'popularity.desc', label: 'Popular' },
    { value: 'vote_average.desc', label: 'Top rated' },
    { value: 'primary_release_date.desc', label: 'Newest' },
  ],
  tv: [
    { value: 'popularity.desc', label: 'Popular' },
    { value: 'vote_average.desc', label: 'Top rated' },
    { value: 'first_air_date.desc', label: 'Newest' },
  ],
}

function toCards(results) {
  return (results || [])
    .filter((r) => r.poster_path)
    .map((r) => ({ img: r.poster_path, id: r.id }))
}

export default function Explore() {
  const router = useRouter()
  const sp = useSearchParams()
  const type = sp.get('type') === 'tv' ? 'tv' : 'movie'
  const q = sp.get('q') || ''
  const sort = sp.get('sort') || 'popularity.desc'
  const genre = sp.get('genre') || ''

  const [draft, setDraft] = useState(q)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [genres, setGenres] = useState([])
  const [status, setStatus] = useState('loading')

  const sorts = SORTS[type]

  const queryKey = useMemo(() => `${type}|${q}|${sort}|${genre}`, [type, q, sort, genre])

  function setFilters(patch, replace = true) {
    const next = new URLSearchParams(sp.toString())
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k)
      else next.set(k, v)
    })
    const href = `/browse?${next.toString()}`
    if (replace) router.replace(href, { scroll: false })
    else router.push(href, { scroll: false })
  }

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    document.title = type === 'tv' ? 'Streak · Shows' : 'Streak · Movies'
    let cancelled = false
    fetch(`${API}/genre/${type}/list?api_key=${KEY}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setGenres(data.genres || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [type])

  useEffect(() => {
    setPage(1)
    setItems([])
  }, [queryKey])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setStatus(page === 1 ? 'loading' : 'more')
      try {
        const params = new URLSearchParams({
          api_key: KEY,
          include_adult: 'false',
          page: String(page),
        })
        let url
        if (q.trim()) {
          params.set('query', q.trim())
          url = `${API}/search/${type}?${params}`
        } else {
          params.set('sort_by', sort)
          params.set('vote_count.gte', sort.includes('vote') ? '80' : '0')
          if (genre) params.set('with_genres', genre)
          url = `${API}/discover/${type}?${params}`
        }
        const res = await fetch(url)
        const data = await res.json()
        if (cancelled) return
        const next = toCards(data.results)
        setTotal(data.total_results || next.length)
        setItems((prev) => (page === 1 ? next : [...prev, ...next]))
        setStatus(next.length ? 'ok' : 'empty')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [queryKey, page, type, q, sort, genre])

  function onSearch(e) {
    e.preventDefault()
    setFilters({ q: draft.trim(), sort: '', genre: '' })
  }

  const heading = q
    ? `Results for “${q}”`
    : type === 'tv'
      ? 'Shows'
      : 'Movies'
  const activeSort = sorts.some((s) => s.value === sort) ? sort : sorts[0].value
  const genreName = genres.find((g) => String(g.id) === String(genre))?.name

  return (
    <>
      <main className="browsePage">
        <Header />

        <form className="browseSearch" onSubmit={onSearch}>
          <i className="fa fa-search" aria-hidden="true" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={type === 'tv' ? 'Search shows' : 'Search movies'}
            aria-label="Search"
          />
          {draft && (
            <button
              type="button"
              className="browseSearchClear"
              onClick={() => {
                setDraft('')
                if (q) setFilters({ q: '' })
              }}
              aria-label="Clear"
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          )}
        </form>

        {!q && (
          <>
            <div className="browseSorts" role="group" aria-label="Sort">
              {sorts.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  className={activeSort === s.value ? 'is-on' : ''}
                  onClick={() => setFilters({ sort: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {genres.length > 0 && (
              <div className="browseChips" role="list">
                <button
                  type="button"
                  className={!genre ? 'is-on' : ''}
                  onClick={() => setFilters({ genre: '' })}
                >
                  All
                </button>
                {genres.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    className={String(genre) === String(g.id) ? 'is-on' : ''}
                    onClick={() => setFilters({ genre: String(g.id) })}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="browseHead">
          <h1>
            {heading}
            {genreName && !q ? <span> · {genreName}</span> : null}
          </h1>
          {total > 0 && <p>{total.toLocaleString()} titles</p>}
        </div>

        {status === 'error' && <p className="homeError">Could not load this catalog.</p>}
        {status === 'empty' && <p className="browseEmpty">Nothing with a poster for these filters.</p>}

        {status === 'loading' && items.length === 0 && (
          <section className="browseGrid" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="browseSkel" />
            ))}
          </section>
        )}

        <section className="browseGrid">
          {items.map((m) => (
            <MovieCard key={`${type}-${m.id}`} img={m.img} id={m.id} show={type === 'tv' ? 'true' : 'false'} />
          ))}
        </section>

        {status !== 'empty' && status !== 'error' && items.length > 0 && items.length < total && (
          <button
            type="button"
            className="browseMore"
            disabled={status === 'more'}
            onClick={() => setPage((p) => p + 1)}
          >
            {status === 'more' ? 'Loading…' : 'Load more'}
          </button>
        )}
      </main>
      <Footer />
    </>
  )
}
