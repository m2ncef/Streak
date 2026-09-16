'use client'
import Link from 'next/link'
import Header from '../Components/Header'
import Footer from '../Components/Footer'

const EXAMPLE = `/**
 * Streak module — example
 * Runs in the browser. Do not put secrets here.
 */

const MODULE = {
  id: 'my-source',
  name: 'My Source',
  author: 'you',
  version: '1.0.0',
  labels: ['community'],
  description: 'Example stream + subtitles',

  async getMovieStream(id, ctx) {
    ctx?.onProgress?.({ message: 'Resolving…', pct: 40 })
    return {
      type: 'iframe', // or 'hls'
      url: 'https://example.com/embed/movie/' + id,
    }
  },

  async getTvStream(id, season, episode, ctx) {
    return {
      type: 'iframe',
      url: \`https://example.com/embed/tv/\${id}/\${season}/\${episode}\`,
    }
  },

  async getSubtitles(ctx) {
    return [
      { label: 'English', lang: 'en', url: 'https://example.com/en.vtt' },
    ]
  },
}

return MODULE`

export default function ModulesGuide() {
  return (
    <>
      <Header />
      <main className="guidePage">
      <h1>Build a module</h1>
      <p className="guideLead">
        Anyone can add a source. A module is a single <code>.js</code> file that Streak runs in
        the browser. Host it on GitHub (raw URL) or drop it in this repo under{' '}
        <code>public/modules/community/</code>.
      </p>

      <section className="guideLegal" aria-label="Legal">
        <h2>Read this first</h2>
        <p>
          <strong>Streak does not host, store, cache, or transmit copyrighted video, audio, or
          subtitle files.</strong> The app only shows publicly available metadata (titles, posters)
          from TMDB and plays URLs that <em>your</em> modules return. Those URLs point at
          third-party servers we do not operate.
        </p>
        <ul>
          <li>This project is for <strong>educational and research use only</strong>.</li>
          <li>We are not a streaming service, CDN, or file host.</li>
          <li>Modules must not upload or store media on Streak’s servers.</li>
          <li>If a module links to infringing material, that is solely the module author’s and
            the remote host’s responsibility.</li>
          <li>
            Copyright complaints belong with the site that actually serves the file — not Streak.
            For this repository: open an issue on{' '}
            <a href="https://github.com/m2ncef/streak" target="_blank" rel="noreferrer">
              github.com/m2ncef/streak
            </a>{' '}
            and we can remove a community module from the tree.
          </li>
        </ul>
        <p>
          By installing or publishing a module you confirm you have the right to use the links it
          returns, and you agree not to use Streak to break the law.
        </p>
      </section>

      <section>
        <h2>What a module is</h2>
        <p>
          Settings → Modules → paste a raw <code>.js</code> URL. The file is fetched, stored in
          this browser, and executed locally. Stream modules are tried from top to bottom.
          Subtitle modules are merged. Nothing is uploaded to us.
        </p>
      </section>

      <section>
        <h2>Contract</h2>
        <p>The file must <code>return</code> an object (not <code>export default</code> unless you also return it):</p>
        <ul>
          <li>
            <code>id</code>, <code>name</code> — required
          </li>
          <li>
            <code>getMovieStream(id, ctx)</code> → <code>{'{ type, url, subtitles? }'}</code>
          </li>
          <li>
            <code>getTvStream(id, season, episode, ctx)</code> — same shape
          </li>
          <li>
            <code>getSubtitles(ctx)</code> → <code>{'[{ label, lang, url }]'}</code>
          </li>
        </ul>
        <p>
          <code>id</code> is a TMDB id. <code>type</code> is <code>iframe</code> or <code>hls</code>.
          Optional <code>{'ctx.onProgress({ message, pct })'}</code> drives the loading bar.
          You may implement only streams, only subtitles, or both.
        </p>
      </section>

      <section>
        <h2>Example</h2>
        <pre className="guideCode">
          <code>{EXAMPLE}</code>
        </pre>
      </section>

      <section>
        <h2>Install it</h2>
        <ol>
          <li>Push the file to GitHub (or any static host).</li>
          <li>
            Copy the <strong>raw</strong> URL (must be <code>text/javascript</code> or plain text).
          </li>
          <li>
            Open <Link href="/settings">Settings</Link> → Modules → paste → Install.
          </li>
        </ol>
      </section>

      <section>
        <h2>Contribute to the repo</h2>
        <p>
          Built-in community files live in <code>public/modules/community/</code>. To add yours
          for everyone who clones Streak:
        </p>
        <ol>
          <li>
            Fork{' '}
            <a href="https://github.com/m2ncef/streak" target="_blank" rel="noreferrer">
              m2ncef/streak
            </a>
            .
          </li>
          <li>
            Add <code>public/modules/community/your-id.js</code> (unique <code>id</code>, no secrets).
          </li>
          <li>Open a pull request. Describe what it resolves and that it does not host files.</li>
        </ol>
        <p>
          We may refuse modules that impersonate Streak, ship malware, or clearly exist only to
          traffic stolen media. Educational examples and metadata-only helpers are welcome.
        </p>
        <p>
          <a className="guideCta" href="https://github.com/m2ncef/streak" target="_blank" rel="noreferrer">
            Open the GitHub repo
          </a>
        </p>
      </section>

      <Footer />
      </main>
    </>
  )
}
