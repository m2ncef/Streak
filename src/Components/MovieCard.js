'use client'
import Link from 'next/link'

export default function Card({ img, id, show, rank }) {
  if (!img || /null/.test(String(img))) return null
  return (
    <Link href={`/${show === 'true' || show === true ? 'tv' : 'movie'}/${id}`} className="movieCard">
      <img src={`https://image.tmdb.org/t/p/w342${img}`} alt="" />
      <span className="cardPlay" aria-hidden="true">
        <i className="fa fa-play" />
      </span>
      {rank != null ? <span className="rankedNum">{rank}</span> : null}
    </Link>
  )
}
