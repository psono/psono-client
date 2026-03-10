if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("service-worker.js")
		.then((registration) => {
			//console.log('ServiceWorker registration successful with scope: ', registration.scope);
		})
		.catch((err) => {
			console.log("Service Worker registration failed: ", err);
		});
}
