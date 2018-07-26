var CACHE_VERSION = '%%PSONOVERSION%%';

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(function(cache) {
            return cache.addAll([
                './',
                './activate.html',
                './config.json',
                './enforce-two-fa.html',
                './index.html',
                './lost-password.html',
                './open-secret.html',
                './popup_pgp.html',
                './privacy-policy.html',
                './privacy-policy-content.html',
                './register.html',
                './search.xml',
                './VERSION.txt',
                './css/lib/bundle.min.css',
                './css/contentscript.css',
                './css/datastore.css',
                './css/main.css',
                './css/open-secret.css',

                './fonts/FontAwesome.otf',
                './fonts/fontawesome-webfont.eot?v=4.7.0',
                './fonts/fontawesome-webfont.svg?v=4.7.0',
                './fonts/fontawesome-webfont.ttf?v=4.7.0',
                './fonts/fontawesome-webfont.woff?v=4.7.0',
                './fonts/fontawesome-webfont.woff2?v=4.7.0',
                './fonts/glyphicons-halflings-regular.eot',
                './fonts/glyphicons-halflings-regular.svg',
                './fonts/glyphicons-halflings-regular.ttf',
                './fonts/glyphicons-halflings-regular.woff',
                './fonts/glyphicons-halflings-regular.woff2',
                './fonts/opensans-cyrillic.woff2',
                './fonts/opensans-cyrillic-ext.woff2',
                './fonts/opensans-greek.woff2',
                './fonts/opensans-greek-ext.woff2',
                './fonts/opensans-latin.woff2',
                './fonts/opensans-latin-ext.woff2',
                './fonts/opensans-vietnamese.woff2',

                './img/android-chrome-192x192.png',
                './img/android-chrome-512x512.png',
                './img/apple-touch-icon.png',
                './img/appstore_apple.png',
                './img/appstore_google.png',
                './img/browserconfig.xml',
                './img/favicon.ico',
                './img/favicon-16x16.png',
                './img/favicon-32x32.png',
                './img/icon-16.png',
                './img/icon-32.png',
                './img/icon-48.png',
                './img/icon-64.png',
                './img/icon-128.png',
                './img/logo.png',
                './img/logo-inverse.png',
                './img/mstile-150x150.png',
                './img/psono-decrypt.png',
                './img/psono-encrypt.png',
                './img/sort_asc.png',
                './img/sort_asc_disabled.png',
                './img/sort_both.png',
                './img/sort_desc.png',
                './img/sort_desc_disabled.png',

                './translations/locale-de.json',
                './translations/locale-en.json',

                './js/lib/openpgp.worker.min.js',
                './js/bundle.min.js',

                './view/templates.js'

            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // caches.match() always resolves
                // but in case of a success the response will have a value
                //console.log(response);
                if (response) {
                    //console.log('Serve from cache');
                    return response;
                } else {
                    return fetch(event.request).then(function (response) {
                        return response;
                    }, function (response) {
                        //console.log(response);
                    });
                }
            })
    );
});

self.addEventListener('activate', function(event) {
    var cacheWhitelist = [CACHE_VERSION];

    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (cacheWhitelist.indexOf(key) !== -1) {
                    return;
                }
                return caches.delete(key);
            }));
        })
    );
});