/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptOIDCSAML = (base, _browser, _setTimeout) => {
	base.ready(() => {
		activate();
	});

	function activate() {
		base.registerObserver(observer);
	}

	/**
	 * Analyse a document and adds a listener
	 *
	 * @param document
	 */
	function observer(document) {
		if (document.defaultView !== document.defaultView.top) {
			return;
		}

		const url = new URL(document.defaultView.location.href);
		if (url.origin === "https://psono.com" && url.pathname === "/redirect") {
			base.emit("oidc-saml-redirect-detected", {});
		}
	}
};

if (typeof module !== "undefined") {
	module.exports = ClassWorkerContentScriptOIDCSAML;
}
