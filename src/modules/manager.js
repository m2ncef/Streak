import { instantiateModule, moduleMeta } from './load'

const KEY = 'streak.modules.engine'

const defaultState = () => ({
  installed: [],
})

let cache = null
const instances = new Map()
const listeners = new Set()

function readState() {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return { installed: parsed.installed || [] }
  } catch {
    return defaultState()
  }
}

function writeState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  cache = state
  emit()
}

function emit() {
  const list = listModules()
  listeners.forEach((fn) => fn(list))
}

function hydrate(entry) {
  if (instances.has(entry.id)) return instances.get(entry.id)
  const instance = instantiateModule(entry.code)
  instances.set(instance.id, instance)
  return instance
}

export function subscribeModules(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function listModules() {
  const state = cache || (cache = readState())
  return state.installed.map((entry) => {
    try {
      const instance = hydrate(entry)
      return {
        ...moduleMeta(instance, entry.url),
        enabled: entry.enabled !== false,
        error: '',
      }
    } catch (err) {
      return {
        id: entry.id,
        name: entry.name || entry.id,
        description: entry.description || '',
        icon: entry.icon || '',
        version: entry.version || '',
        labels: [],
        url: entry.url,
        enabled: false,
        error: err.message,
      }
    }
  })
}

export function getEnabledInstances() {
  const state = cache || (cache = readState())
  const out = []
  for (const entry of state.installed) {
    if (entry.enabled === false) continue
    try {
      out.push({ entry, instance: hydrate(entry) })
    } catch {
      /* skip broken */
    }
  }
  return out
}

export async function fetchModuleCode(url) {
  const res = await fetch(`/api/module?url=${encodeURIComponent(url)}`)
  const text = await res.text()
  if (!res.ok) {
    let message = text || 'Could not download module'
    try {
      message = JSON.parse(text).error || message
    } catch {}
    throw new Error(message)
  }
  return text
}

export async function installModule(url) {
  const href = String(url || '').trim()
  if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) {
    throw new Error('Paste a raw JS link (https://...)')
  }

  const absolute =
    href.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${href}`
      : href

  const code = await fetchModuleCode(absolute)
  const instance = instantiateModule(code)
  const meta = moduleMeta(instance, absolute)

  const state = cache || (cache = readState())
  const installed = state.installed.filter((m) => m.id !== meta.id && m.url !== absolute)
  installed.push({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    icon: meta.icon,
    version: meta.version,
    url: absolute,
    code,
    enabled: true,
  })
  instances.set(meta.id, instance)
  writeState({ installed })
  return meta
}

export function uninstallModule(id) {
  const state = cache || (cache = readState())
  instances.delete(id)
  writeState({ installed: state.installed.filter((m) => m.id !== id) })
}

export function setModuleEnabled(id, enabled) {
  const state = cache || (cache = readState())
  writeState({
    installed: state.installed.map((m) => (m.id === id ? { ...m, enabled } : m)),
  })
}

export function moveModule(id, dir) {
  const state = cache || (cache = readState())
  const list = [...state.installed]
  const i = list.findIndex((m) => m.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  writeState({ installed: list })
}

export async function refreshModule(id) {
  const state = cache || (cache = readState())
  const entry = state.installed.find((m) => m.id === id)
  if (!entry) throw new Error('Module not installed')
  instances.delete(id)
  return installModule(entry.url)
}

const BUILTIN_VIDSRC = '/modules/community/vidsrc.js'

async function ensureVidSrcModule() {
  if (typeof window === 'undefined') return
  const state = cache || (cache = readState())
  const entry = state.installed.find((m) => m.id === 'vidsrc')
  const href = `${window.location.origin}${BUILTIN_VIDSRC}`
  if (!entry) {
    try {
      await installModule(href)
    } catch {
      /* user can install manually */
    }
    return
  }
  const stale =
    !String(entry.url || '').includes('/modules/community/vidsrc.js') ||
    !String(entry.code || '').includes('onProgress')
  if (stale) {
    try {
      instances.delete('vidsrc')
      await installModule(href)
    } catch {
      /* keep current */
    }
  }
}

export async function resolveStreaming(ctx) {
  await ensureVidSrcModule()
  const enabled = getEnabledInstances()
  const report = (info) => {
    try {
      ctx.onProgress?.(info)
    } catch {
      /* ignore */
    }
  }

  if (!enabled.length) {
    report({ phase: 'error', message: 'No streaming modules enabled', pct: 0 })
    return { type: 'error' }
  }

  for (let i = 0; i < enabled.length; i++) {
    const { instance } = enabled[i]
    const pctBase = Math.round((i / enabled.length) * 80)
    report({
      phase: 'start',
      module: instance.name,
      message: `Trying ${instance.name}…`,
      pct: pctBase + 5,
    })
    const streamCtx = {
      ...ctx,
      onProgress: (p) =>
        report({
          phase: 'fetch',
          module: instance.name,
          pct: pctBase + 20,
          ...p,
        }),
    }
    try {
      const result =
        ctx.kind === 'tv'
          ? instance.getTvStream?.(ctx.id, ctx.season, ctx.episode, streamCtx)
          : instance.getMovieStream?.(ctx.id, streamCtx)
      const resolved = await result
      if (resolved?.url) {
        report({
          phase: 'ready',
          module: instance.name,
          message: `Playing via ${instance.name}`,
          pct: 100,
        })
        return { ...resolved, module: instance }
      }
    } catch (err) {
      report({
        phase: 'error',
        module: instance.name,
        message: err?.message || `${instance.name} failed`,
        pct: pctBase + 30,
      })
    }
  }
  report({ phase: 'error', message: 'No source found', pct: 100 })
  return { type: 'error' }
}

export async function resolveSubtitles(ctx) {
  const tracks = []
  for (const { instance } of getEnabledInstances()) {
    if (typeof instance.getSubtitles !== 'function') continue
    try {
      const result = await instance.getSubtitles(ctx)
      if (Array.isArray(result)) tracks.push(...result)
    } catch {
      /* skip */
    }
  }
  return tracks
}
