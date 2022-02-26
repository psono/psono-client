self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(function (cache) {
            const requests = self.__WB_MANIFEST;

            return cache.addAll(
                requests.map((request) => {
                    return "./" + request["url"];
                })
            );
        })
    );
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            // caches.match() always resolves
            // but in case of a success the response will have a value
            //console.log(response);
            if (response) {
                //console.log('Serve from cache');
                return response;
            } else {
                return fetch(event.request).then(
                    function (response) {
                        return response;
                    },
                    function (response) {
                        //console.log(response);
                    }
                );
            }
        })
    );
});

self.addEventListener("activate", function (event) {
    var cacheWhitelist = [CACHE_VERSION];

    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(
                keyList.map(function (key) {
                    if (cacheWhitelist.indexOf(key) !== -1) {
                        return;
                    }
                    return caches.delete(key);
                })
            );
        })
    );
});
