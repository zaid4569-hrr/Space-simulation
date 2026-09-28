const CACHE_NAME = 'orbital-command-shell-v2'
const APP_BASE = new URL('./', self.registration.scope)
const APP_SHELL = [
  './',
  'index.html',
  'fallback/destination-facts.json',
  'fallback/destination-media/earth.json',
  'fallback/destination-media/moon.json',
  'fallback/destination-media/mars.json',
  'fallback/media/earth.jpg',
  'fallback/media/moon.jpg',
  'fallback/media/mars.jpg',
]

function appUrl(path) {
  return new URL(path, APP_BASE).href
}

function assetPaths(content, baseUrl) {
  const matches = content.match(/(?:\/[^"'()\s]*?assets\/|\.\/)\w[\w.-]*\.(?:js|css|woff2?)/g) ?? []
  return [...new Set(matches.map((path) => new URL(path, baseUrl).href))]
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_SHELL.map(appUrl))

    const indexUrl = appUrl('index.html')
    const indexResponse = await fetch(indexUrl)
    const entryAssets = assetPaths(await indexResponse.text(), indexUrl)
    await cache.addAll(entryAssets)

    const scripts = entryAssets.filter((path) => new URL(path).pathname.endsWith('.js'))
    const lazyAssets = await Promise.all(scripts.map(async (path) => {
      const scriptUrl = new URL(path)
      const response = await cache.match(scriptUrl, { ignoreVary: true }) ?? await fetch(scriptUrl)
      return assetPaths(await response.text(), scriptUrl)
    }))
    await cache.addAll([...new Set(lazyAssets.flat())])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => {
    if (cached) return cached
    return fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      }
      return response
    })
  }).catch(() => request.mode === 'navigate'
    ? caches.match(appUrl('index.html'), { ignoreVary: true })
    : Promise.reject(new Error('Offline asset is not cached.'))))
})
