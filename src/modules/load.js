function stripExportWrapper(code) {
  const wrapped = code.match(
    /export\s+const\s+\w+\s*=\s*(['"`])([\s\S]*?)\1\s*;?\s*$/m
  )
  if (wrapped) return wrapped[2]
  return code
    .replace(/^\s*export\s+default\s+/, 'return ')
    .replace(/^\s*export\s+const\s+\w+\s*=\s*/, 'return ')
}

export function instantiateModule(code) {
  const moduleCode = stripExportWrapper(String(code || '')).trim()
  if (!moduleCode) throw new Error('Empty module file')

  let instance
  try {
    instance = new Function(moduleCode)()
  } catch (err) {
    throw new Error(`Module failed to run: ${err.message}`)
  }

  if (!instance || typeof instance !== 'object') {
    throw new Error('Module must return an object')
  }
  if (!instance.id || !instance.name) {
    throw new Error('Module needs an id and name')
  }

  return instance
}

export function moduleMeta(instance, url) {
  return {
    id: instance.id,
    name: instance.name,
    description: instance.description || '',
    version: instance.version || '1.0.0',
    icon: instance.icon || '',
    labels: instance.labels || [],
    author: instance.author || '',
    url,
    hasMovie: typeof instance.getMovieStream === 'function',
    hasTv: typeof instance.getTvStream === 'function',
    hasSubs: typeof instance.getSubtitles === 'function',
  }
}
