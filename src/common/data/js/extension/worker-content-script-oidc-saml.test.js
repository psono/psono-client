const ClassWorkerContentScriptOIDCSAML = require("./worker-content-script-oidc-saml");

describe("OIDC/SAML redirect content script", () => {
	function observe(document) {
		let observer;
		const base = {
			ready: (callback) => callback(),
			registerObserver: (callback) => {
				observer = callback;
			},
			emit: jest.fn(),
		};
		ClassWorkerContentScriptOIDCSAML(base, {}, setTimeout);
		observer(document);
		return base.emit;
	}

	it("reports exact top-level Psono redirect pages without trusting URL data", () => {
		const defaultView = {
			location: {
				href: "https://psono.com/redirect#!/saml/token/state/token",
			},
		};
		defaultView.top = defaultView;

		const emit = observe({ defaultView });

		expect(emit).toHaveBeenCalledWith("oidc-saml-redirect-detected", {});
	});

	it("ignores redirects in child frames", () => {
		const defaultView = {
			location: { href: "https://psono.com/redirect" },
			top: {},
		};

		const emit = observe({ defaultView });

		expect(emit).not.toHaveBeenCalled();
	});

	it("ignores lookalike redirect paths", () => {
		const defaultView = {
			location: { href: "https://psono.com/redirect-attacker" },
		};
		defaultView.top = defaultView;

		const emit = observe({ defaultView });

		expect(emit).not.toHaveBeenCalled();
	});
});
