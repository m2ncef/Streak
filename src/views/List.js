'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Header from '../Components/Header'
import Footer from '../Components/Footer'
import Loading from '../Components/Loading'

const API = 'https://api.themoviedb.org/3'
const KEY = '84120436235fe71398e95a662f44db8b'
const IMG = 'https://image.tmdb.org/t/p/w342'

function parseEntry(entry) {
  if (typeof entry !== 'string') return null
  const m = entry.match(/\/?(movie|tv)\/(\d+)/)
  if (!m) return null
  return { kind: m[1], id: m[2], path: `/${m[1]}/${m[2]}` }
}

export default function List() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    document.title = 'Streak · My List'
    let cancelled = false
    const raw = JSON.parse(localStorage.getItem('library') || '[]')
    const parsed = (Array.isArray(raw) ? raw : []).map(parseEntry).filter(Boolean)
    if (!parsed.length) {
      setItems([])
      setStatus('empty')
      return
    }
    Promise.all(
      parsed.map((p) =>
        fetch(`${API}/${p.kind}/${p.id}?api_key=${KEY}`)
          .then((r) => r.json())
          .then((d) =>
            d.poster_path
              ? {
                  ...p,
                  title: d.title || d.name,
                  year: String(d.release_date || d.first_air_date || '').slice(0, 4),
                  vote: d.vote_average != null ? String(d.vote_average).slice(0, 3) : '',
                  poster: d.poster_path,
                }
              : null
          )
          .catch(() => null)
      )
    ).then((rows) => {
      if (cancelled) return
      const next = rows.filter(Boolean)
      setItems(next)
      setStatus(next.length ? 'ok' : 'empty')
    })
    return () => {
      cancelled = true
    }
  }, [])

  function remove(path) {
    const lib = JSON.parse(localStorage.getItem('library') || '[]').filter((x) => x !== path)
    localStorage.setItem('library', JSON.stringify(lib))
    setItems((prev) => {
      const next = prev.filter((i) => i.path !== path)
      if (!next.length) setStatus('empty')
      return next
    })
  }

  return (
    <>
      <Loading />
      <main className="listPage">
        <Header />
        <div className="listHead">
          <h1>My List</h1>
          {status === 'ok' && <p>{items.length} saved</p>}
        </div>

        {status === 'empty' && (
          <p className="listEmpty">
            Nothing saved yet. Add titles from a movie or show page.
          </p>
        )}

        {status === 'loading' && (
          <section className="browseGrid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="browseSkel" />
            ))}
          </section>
        )}

        {status === 'ok' && (
          <section className="listGrid">
            {items.map((item) => (
              <article key={item.path} className="listCard">
                <Link href={item.path}>
                  <img src={`${IMG}${item.poster}`} alt={item.title} />
                </Link>
                <div className="listCardMeta">
                  <Link href={item.path}>
                    <strong>{item.title}</strong>
                  </Link>
                  <span>
                    {item.kind === 'tv' ? 'Show' : 'Movie'}
                    {item.year ? ` · ${item.year}` : ''}
                    {item.vote ? ` · ★ ${item.vote}` : ''}
                  </span>
                </div>
                <button type="button" className="listRemove" onClick={() => remove(item.path)}>
                  Remove
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
