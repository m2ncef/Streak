'use client'
import { useEffect, useState } from 'react'
import Loading from '../Components/Loading'
import Nav from '../Components/Nav'
import Footer from '../Components/Footer'
import ModulesSettings from '../Components/ModulesSettings'

export default function Settings() {
  const [commit, setCommit] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('https://api.github.com/repos/m2ncef/Streak/commits')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.[0]?.commit) return
        const date = new Date(data[0].commit.committer.date)
        setCommit({
          message: data[0].commit.message,
          author: data[0].commit.committer.name,
          when: date.toLocaleString(),
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function clearLibrary() {
    if (!window.confirm('Remove every title from My List?')) return
    localStorage.setItem('library', JSON.stringify([]))
  }

  return (
    <>
      <Loading />
      <Nav />
      <main className="settingsPage">
        <header className="settingsIdentity">
          <img src="/icon.png" alt="" />
          <div>
            <h1>Streak</h1>
            <p>
              Movies &amp; TV · by{' '}
              <button type="button" className="settingsAuthor" onClick={() => window.open('https://instagram.com/m2ncef', '_blank')}>
                moncef
              </button>
            </p>
          </div>
        </header>
        {commit && (
          <p className="settingsCommit">
            Latest push: {commit.message} · {commit.author} · {commit.when}
          </p>
        )}

        <ModulesSettings />
        <p className="settingsLead">
          <a href="/modules">How to write a module and contribute</a>
        </p>

        <section className="settingsBlock">
          <h2>Library</h2>
          <button type="button" className="settingsDanger" onClick={clearLibrary}>
            Clear My List
          </button>
        </section>

        <section className="settingsBlock">
          <h2>Credits</h2>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB — titles, posters, trending
          </a>
          <a href="https://github.com/m2ncef/streak" target="_blank" rel="noreferrer">
            Streak — this app
          </a>
          <a href="https://artplayer.org/document/en" target="_blank" rel="noreferrer">
            ArtPlayer — HLS playback
          </a>
          <a href="https://sub.wyzie.io/" target="_blank" rel="noreferrer">
            Wyzie — Community Subs
          </a>
          <a href="https://www.opensubtitles.org/" target="_blank" rel="noreferrer">
            OpenSubtitles — Community Subs
          </a>
          <p className="settingsLegal">
            Streak does not host, store, or serve video or subtitle files. This app is for
            educational use. Modules only return links to third-party servers. Copyright claims
            go to those hosts. See <a href="/modules">the modules page</a> for the full notice.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
