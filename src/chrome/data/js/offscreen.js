// Keep the MV3 worker responsive while the in-memory key host is alive.
// Keys themselves live in lock-offscreen.js, never on window or in storage.
setInterval(async () => {
	(await navigator.serviceWorker.ready).active.postMessage("keepAlive");
}, 20e3);
