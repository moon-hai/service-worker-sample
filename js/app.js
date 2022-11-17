const APP = {
  SW: null,
  cacheName: 'assetCache1',
  init() {
    if ('serviceWorker' in navigator) {
      // register
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          APP.SW = registration.installing || registration.waiting || registration.active
          // console.log('Service worker registered !')
        })

      // check if service worker is exist
      if (navigator.serviceWorker.controller) {
        // console.log('Service worker was installed !')
      }

      // register a handler to detect when a new or
      // updated service worker is installed & activate
      navigator.serviceWorker.oncontrollerchange = (evt) => {
        // console.log('New service worker activated !')
      }

      // remove / unregister service workers
      // navigator.serviceWorker.getRegistrations().then(rs => {
      //   for (let r of rs) {
      //     r.unregister().then(isUnRegister => {
      //       console.log(isUnRegister)
      //     })
      //   }
      // })

      // APP.startCaching()
    } else {
      console.log('Service workers are not supported')
    }
  },

  getCached() {
    if ('storage' in navigator) {
      if ('estimate' in navigator.storage) {
        //get the total storage and current usage
        navigator.storage.estimate().then(({ usage, quota }) => {
          //returned numbers are in bytes
          //divide by 1024 to convert to KB
          let usedKB = parseInt(usage / 1024);
          let quotaKB = parseInt(quota / 1024);
          console.log(`Using ${usedKB} KB of ${quotaKB} KB`);
        });

        //see if storage can be set to persistent or stay best-effort
        navigator.storage.persist().then((isPer) => {
          console.log(`Browser grants persistent permission: ${isPer}`);
        });
      } else {
        console.log('No support for StorageManager methods');
      }
    }

    //look at individual files and their sizes
    caches.open('imageCache').then((cache) => {
      cache.matchAll().then((matches) => {
        //matches is an Array of Response objects
        let total = 0;
        matches.forEach((response) => {
          if (response.headers.has('content-length')) {
            total += parseInt(response.headers.get('content-length'));
            // console.log(`Adding size for ${response.url}`);
          }
        });

        // console.log(`Total size in imageCache is ${total}`);
      });
    });
  },

  startCaching() {
    return caches.open(APP.cacheName).then(c => {
      c.add('/img/a.jpg?id=1')

      const url = new URL('http://127.0.0.1:5500/img/a.jpg?id=2')
      c.add(url)

      const req = new Request('/img/a.jpg?id=3')
      c.add(req)

      c.keys().then(keys => {
        keys.forEach((k, i) => {
          // console.log(k, i)
        })
      })

      return c
    }).then(c => {
      // check is exist
      caches.has(APP.cacheName).then(hasCache => {
        console.log(hasCache)
      })

      // search for files in caches
      const urlStr = '/img/b.png'
      return caches.match(urlStr).then(cRes => {
        if (
          cRes &&
          cRes.status < 400 &&
          cRes.headers.has('content-type') &&
          cRes.headers.get('content-type').match(/^image\//i)
        ) {
          console.log('Found the cache')
          // console.log(cRes)
          return cRes
        } else {
          // No match found.
          return fetch(urlStr).then(fRes => {
            if (!fRes.ok) throw fRes.statusText

            c.put(urlStr, fRes.clone())
            return fRes
          })
        }
      }).then(res => {
        // console.log(res)
      })
    })
  }
}

window.addEventListener('DOMContentLoaded', () => {
  APP.init()
  APP.getCached()
})
