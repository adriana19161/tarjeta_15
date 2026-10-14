const CACHE_NAME = 'vaiolet-15-v9';
const APP_SHELL = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './assets/icon-180.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/wax_seal.png',
    './assets/hero_block_ref.jpg',
    './assets/pistachio_bg.png',
    './assets/princesa_y_el_sapo_espanol.mp3',
    './assets/vendor/fonts.css',
    './assets/vendor/fontawesome.min.css',
    './assets/vendor/qrcode.min.js',
    './assets/vendor/confetti.browser.js',
    './assets/vendor/html2canvas.min.js',
    './assets/vendor/webfonts/fa-brands-400.woff2',
    './assets/vendor/webfonts/fa-regular-400.woff2',
    './assets/vendor/webfonts/fa-solid-900.woff2',
    './assets/vendor/webfonts/fa-v4compatibility.woff2',
    './assets/vendor/fonts/alex-brush-latin-400-normal.woff2',
    './assets/vendor/fonts/alex-brush-latin-ext-400-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-400-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-600-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-700-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-800-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-ext-400-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-ext-600-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-ext-700-normal.woff2',
    './assets/vendor/fonts/cinzel-latin-ext-800-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-300-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-400-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-500-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-600-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-700-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-ext-300-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-ext-400-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-ext-500-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-ext-600-normal.woff2',
    './assets/vendor/fonts/montserrat-latin-ext-700-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-400-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-400-italic.woff2',
    './assets/vendor/fonts/playfair-display-latin-600-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-600-italic.woff2',
    './assets/vendor/fonts/playfair-display-latin-700-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-700-italic.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-400-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-400-italic.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-600-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-600-italic.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-700-normal.woff2',
    './assets/vendor/fonts/playfair-display-latin-ext-700-italic.woff2'
];

function cacheResponse(request, response) {
    if (!response.ok || response.type !== 'basic') return Promise.resolve(response);

    return caches.open(CACHE_NAME)
        .then(cache => cache.put(request, response.clone()))
        .then(() => response)
        .catch(error => {
            console.error('No se pudo guardar un recurso en caché:', error);
            return response;
        });
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);
    const appRoot = new URL('./', self.location.href);
    const isAppEntry = requestUrl.pathname === appRoot.pathname
        || requestUrl.pathname === new URL('index.html', appRoot).pathname;

    if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

    const isWithinScope = requestUrl.pathname.startsWith(appRoot.pathname);
    if (request.mode === 'navigate' && isWithinScope) {
        event.respondWith(
            fetch(request).then(response => cacheResponse(request, response))
                .catch(async () => {
                    const cachedPage = await caches.match(request);
                    if (cachedPage) return cachedPage;
                    if (isAppEntry) {
                        const appEntry = await caches.match('./index.html');
                        if (appEntry) return appEntry;
                    }
                    return Response.error();
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => cacheResponse(request, response));
        })
    );
});
