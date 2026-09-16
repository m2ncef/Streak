'use client'
import WatchPlayer from './WatchPlayer'

export default function MovieScraper({ id, title, onClose }) {
  return (
    <WatchPlayer
      kind="movie"
      id={id}
      title={title}
      onClose={onClose || (() => {})}
    />
  )
}
