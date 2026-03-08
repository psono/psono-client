self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_VERSION).then((cache) => {
			const requests = self.__WB_MANIFEST;
			requests.push({
				url: "",
			});
			return cache.addAll(
				requests.map((request) => {
					return "./" + request["url"];
				}),
			);
		}),
	);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			// caches.match() always resolves
			// but in case of a success the response will have a value
			//console.log(response);
			if (response) {
				//console.log('Serve from cache');
				return response;
			} else {
				return fetch(event.request).then(
					(response) => response,
					(response) => {
						//console.log(response);
					},
				);
			}
		}),
	);
});

self.addEventListener("activate", (event) => {
	var cacheWhitelist = [CACHE_VERSION];

	event.waitUntil(
		caches.keys().then((keyList) =>
			Promise.all(
				keyList.map((key) => {
					if (cacheWhitelist.indexOf(key) !== -1) {
						return;
					}
					return caches.delete(key);
				}),
			),
		),
	);
});
