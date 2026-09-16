'use client'
import WatchPlayer from './WatchPlayer'

export default function ShowScraper({ id, s, e, title, next, onClose, onNext }) {
  return (
    <WatchPlayer
      kind="tv"
      id={id}
      season={s}
      episode={e}
      title={title}
      next={next}
      onClose={onClose || (() => {})}
      onNext={onNext}
    />
  )
}
