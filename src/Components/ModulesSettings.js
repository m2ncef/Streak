'use client'
import { useEffect, useState } from 'react'
import {
  installModule,
  listModules,
  moveModule,
  refreshModule,
  setModuleEnabled,
  subscribeModules,
  uninstallModule,
} from '../modules'

export default function ModulesSettings() {
  const [modules, setModules] = useState([])
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setModules(listModules())
    return subscribeModules(setModules)
  }, [])

  async function install(e) {
    e.preventDefault()
    setStatus(null)
    setBusy(true)
    try {
      const meta = await installModule(url)
      setStatus({ ok: true, text: `Installed ${meta.name}` })
      setUrl('')
    } catch (err) {
      setStatus({ ok: false, text: err.message || 'Install failed' })
    } finally {
      setBusy(false)
    }
  }

  async function reload(id) {
    setStatus(null)
    setBusy(true)
    try {
      const meta = await refreshModule(id)
      setStatus({ ok: true, text: `Reloaded ${meta.name}` })
    } catch (err) {
      setStatus({ ok: false, text: err.message || 'Reload failed' })
    } finally {
      setBusy(false)
    }
  }

  function remove(mod) {
    if (!window.confirm(`Remove ${mod.name}?`)) return
    uninstallModule(mod.id)
  }

  return (
    <section className="settingsBlock">
      <h2>Modules</h2>
      <p className="settingsLead">
        Paste a raw <code>.js</code> link. Enabled sources are tried from top to bottom.
      </p>

      <form className="moduleInstall" onSubmit={install}>
        <input
          type="url"
          placeholder="https://…/module.js"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          aria-label="Module file URL"
        />
        <button type="submit" disabled={busy || !url.trim()}>
          {busy ? 'Working…' : 'Install'}
        </button>
      </form>

      {status && (
        <p className={status.ok ? 'moduleNotice' : 'moduleError'} role="status">
          {status.text}
        </p>
      )}

      {modules.length === 0 ? (
        <p className="moduleEmpty">Nothing installed yet. Drop in a source file to start streaming.</p>
      ) : (
        <ol className="moduleList">
          {modules.map((mod, i) => (
            <li key={mod.id} className={`moduleRow ${mod.enabled ? '' : 'is-off'}`}>
              <div className="moduleIcon" aria-hidden="true">
                {mod.icon ? <img src={mod.icon} alt="" /> : <span>{(mod.name || '?')[0]}</span>}
              </div>
              <div className="moduleMeta">
                <strong>{mod.name}</strong>
                {mod.description && <span>{mod.description}</span>}
                <em>
                  {[
                    mod.version && `v${mod.version}`,
                    mod.author,
                    ...(mod.labels || []),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </em>
                {mod.error && <em className="moduleError">{mod.error}</em>}
                <div className="moduleLinks">
                  <button type="button" disabled={i === 0} onClick={() => moveModule(mod.id, -1)}>
                    Up
                  </button>
                  <button type="button" disabled={i === modules.length - 1} onClick={() => moveModule(mod.id, 1)}>
                    Down
                  </button>
                  <button type="button" disabled={busy} onClick={() => reload(mod.id)}>
                    Reload
                  </button>
                  <button type="button" className="is-danger" onClick={() => remove(mod)}>
                    Remove
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={`moduleToggle ${mod.enabled ? 'on' : ''}`}
                aria-pressed={mod.enabled}
                onClick={() => setModuleEnabled(mod.id, !mod.enabled)}
              >
                <span>{mod.enabled ? 'On' : 'Off'}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
