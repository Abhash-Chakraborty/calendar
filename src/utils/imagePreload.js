const imagePromises = new Map()
const preloadedLinks = new Set()
const connectionHints = new Set()

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const normalizePriority = (priority) => {
  if (priority === 'high' || priority === 'low') {
    return priority
  }

  return 'auto'
}

const ensureImagePreloadLink = (src, priority) => {
  if (!hasDom() || preloadedLinks.has(src)) {
    return
  }

  const head = document.head
  if (!head) {
    return
  }

  const existing = head.querySelector(`link[rel="preload"][as="image"][href="${src}"]`)
  if (existing) {
    preloadedLinks.add(src)
    return
  }

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src

  if (priority !== 'auto') {
    link.setAttribute('fetchpriority', priority)
  }

  link.setAttribute('data-image-preload', 'true')
  head.appendChild(link)
  preloadedLinks.add(src)
}

const addConnectionHint = (origin, rel) => {
  if (!hasDom()) {
    return
  }

  const key = `${rel}:${origin}`
  if (connectionHints.has(key)) {
    return
  }

  const head = document.head
  if (!head) {
    return
  }

  const existing = head.querySelector(`link[rel="${rel}"][href="${origin}"]`)
  if (existing) {
    connectionHints.add(key)
    return
  }

  const link = document.createElement('link')
  link.rel = rel
  link.href = origin
  if (rel === 'preconnect') {
    link.crossOrigin = 'anonymous'
  }

  head.appendChild(link)
  connectionHints.add(key)
}

export const primeImageConnections = (sources = []) => {
  if (!hasDom()) {
    return
  }

  const origins = new Set()

  sources.forEach((source) => {
    if (!source) {
      return
    }

    try {
      const parsed = new URL(source, window.location.href)
      if (parsed.origin !== window.location.origin) {
        origins.add(parsed.origin)
      }
    } catch {
      // Ignore malformed sources silently
    }
  })

  origins.forEach((origin) => {
    addConnectionHint(origin, 'dns-prefetch')
    addConnectionHint(origin, 'preconnect')
  })
}

export const preloadImage = (src, options = {}) => {
  if (!src) {
    return Promise.resolve(null)
  }

  if (imagePromises.has(src)) {
    return imagePromises.get(src)
  }

  const priority = normalizePriority(options.priority)
  if (options.addPreloadLink !== false) {
    ensureImagePreloadLink(src, priority)
  }

  const promise = new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null)
      return
    }

    const image = new Image()
    image.decoding = 'async'

    if ('fetchPriority' in image && priority !== 'auto') {
      image.fetchPriority = priority
    }

    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().catch(() => null).finally(() => resolve(src))
        return
      }

      resolve(src)
    }

    image.onerror = () => {
      resolve(null)
    }

    image.src = src
  })

  imagePromises.set(src, promise)
  return promise
}

export const preloadImages = (sources = [], options = {}) => {
  const uniqueSources = [...new Set(sources.filter(Boolean))]
  return Promise.all(uniqueSources.map((source) => preloadImage(source, options)))
}

export const preloadImagesInIdle = (sources = [], options = {}) => {
  if (!hasDom()) {
    return () => {}
  }

  const queue = [...new Set(sources.filter(Boolean))]
  if (!queue.length) {
    return () => {}
  }

  let idleHandle = null
  let timeoutHandle = null
  let cancelled = false

  const processQueue = (deadline) => {
    if (cancelled) {
      return
    }

    while (queue.length) {
      if (deadline && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 8) {
        break
      }

      const nextSource = queue.shift()
      preloadImage(nextSource, options)
    }

    if (queue.length) {
      schedule()
    }
  }

  const schedule = () => {
    if (cancelled || !queue.length) {
      return
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(processQueue, { timeout: 1200 })
      return
    }

    timeoutHandle = window.setTimeout(() => processQueue(), 120)
  }

  schedule()

  return () => {
    cancelled = true

    if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleHandle)
    }

    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle)
    }
  }
}
