/*
 * The content script worker loaded in every page responsible for the whole webauthn / fido2 / passkey
 */

var ClassWorkerContentScriptFido2 = (base, browser, setTimeout) => {
	activate();

	function activate() {
		const root = document.head || document.documentElement;
		if (root === null) {
			return;
		}

		window.addEventListener("message", (event) => {
			if (event.origin !== window.location.origin) {
				// SECURITY: Don't remove this check!
				return;
			}

			if (!Object.hasOwn(event.data, "event")) {
				return;
			}
			switch (event.data.event) {
				case "navigator-credentials-get":
				case "navigator-credentials-create":
					base.emit(event.data.event, event.data.data, (result) => {
						if (!Object.hasOwn(result, "event")) {
							return;
						}
						if (!Object.hasOwn(result, "data")) {
							return;
						}
						window.postMessage(
							{
								event: result.event,
								data: result.data,
							},
							window.location.origin,
						);
					});
					break;
			}
		});

		// create script
		const script1 = document.createElement("script");
		script1.src = browser.runtime.getURL(
			"data/js/extension/web-accessible-fido2.js",
		);
		root.appendChild(script1);
	}
};
