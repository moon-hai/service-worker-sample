const version = 1

const staticName = `staticCache-${version}`
const dynamicName = 'dynamicCache'
const fontName = 'fontCache'
const imgName = 'imageCache'

const assets = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/app.js'
]

const imgAssets = [
  '/img/a.jpg',
  '/img/a.jpg?id=1',
  '/img/a.jpg?id=2',
  '/img/a.jpg?id=3',
  '/img/b.png'
]

self.addEventListener('install', ev => {
  // ev.waitUntil(
  //   Promise.resolve()
  //     .then(() => {
  //       console.log('a')
  //     })
  //     .then(() => {
  //       console.log('b')
  //     })
  //     .then(() => {
  //       console.log('installed')
  //     })
  // )
  // self.skipWaiting()

  console.log(`Version ${version} installed`)

  ev.waitUntil(
    caches.open(staticName)
      .then((cache) => {
        cache.addAll(assets).then(
          () => {
            console.log(`${staticName} has been updated`)
          }, err => {
            console.warn(err)
            console.warn(`failed to update ${staticName}`)
          })

        cache.add('/404.html').then(
          () => {
            console.log('404 page cached')
          }, err => {
            console.warn(err)
            console.warn(`failed to update ${staticName}`)
          })
      })
      .then(() => {
        caches.open(imgName).then(cache => {
          cache.addAll(imgAssets).then(
            () => {
              console.log(`${imgName} has been updated`)
            }, err => {
              console.warn(err)
              console.warn(`failed to update ${imgName}`)
            })
        })
      })
  )
})

self.addEventListener('activate', ev => {
  ev.waitUntil(
    // caches.keys().then((keys) => {
    //   return Promise.all(
    //     keys.filter(key => key !== staticName && key !== imgName && key !== fontName).map(key => caches.delete(key))
    //   )
    // })
  )
})

self.addEventListener('fetch', ev => {
  // ver.1: pass thru
  // ev.respondWith(fetch(ev.request))

  // ver.2: check the caches first for the file. If missing do a fetch
  // ev.respondWith(
  //   caches.match(ev.request).then(res => {
  //     if (typeof res === 'undefined') {
  //       console.log(`Missing ${ev.request.url}`)
  //     }

  //     return res || fetch(env.request)
  //   })
  // )

  // ver.3: check cache. fetch if missing then add response to the cache
  ev.respondWith(
    caches.match(ev.request).then(cacheRes => {
      return cacheRes ||
        fetch(ev.request)
          .then(fetchRes => {
            if (fetchRes.ok) {
              const type = fetchRes.headers.get('content-type')
              if (type && type.match(/^text\/css/i) || ev.request.url.match(/fonts.googleapis.com/i)) {
                // css to save in dynamic code
                console.log(`Save css file ${ev.request.url}`)
                caches.open(dynamicName).then((c) => {
                  c.put(ev.request, fetchRes.clone())
                  return fetchRes
                })
              } else if (type && type.match(/^font\//i) || ev.request.url.match(/fonts.gstatic.com/i)) {
                console.log(`Save font ${ev.request.url}`)
                caches.open(fontName).then((c) => {
                  c.put(ev.request, fetchRes.clone())
                  return fetchRes
                })
              } else if (type && type.match(/^image\//i)) {
                caches.open(imgName).then((c) => {
                  c.put(ev.request, fetchRes.clone())
                  return fetchRes
                })
              } else {
                caches.open(dynamicName).then((c) => {
                  c.put(ev.request, fetchRes.clone())
                  return fetchRes
                })
              }
            } else {
              if (fetchRes.status === 404) {
                if (ev.request.url.match(/\.html/i)) {
                  return caches.open(staticName).then(c => {
                    return c.match('/404.html')
                  })
                }
              }
            }
          }, err => {
            // this network is failure
            // return 404.html file if it is a request for an html file
            if (ev.request.url.match(/\.html/i)) {
              return caches.open(staticName).then(c => {
                return c.match('/404.html')
              })
            }
          })
    })
  )

  clients.claim().then(() => {
    // console.log('DONE')
  })
})

self.addEventListener('message', ev => {

})
