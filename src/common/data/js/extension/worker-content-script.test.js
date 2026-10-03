const ClassWorkerContentScriptBase = require("./worker-content-script-base");
const ClassWorkerContentScript = require("./worker-content-script");

describe("content script shadow DOM autofill", () => {
	it("renders passkey choices as text in the protected password-style dropdown", () => {
		document.body.innerHTML = "";
		const handlers = {};
		const emit = jest.fn();
		const base = {
			ready: (fn) => fn(),
			inIframe: () => false,
			on: (event, handler) => {
				handlers[event] = handler;
			},
			emit,
			getAllDocuments: () => {},
			registerObserver: () => {},
		};
		const originalAttachShadow = Element.prototype.attachShadow;
		let selectorRoot;
		const shadowSpy = jest
			.spyOn(Element.prototype, "attachShadow")
			.mockImplementation(function (options) {
				selectorRoot = originalAttachShadow.call(this, options);
				return selectorRoot;
			});
		global.uuid = { v4: jest.fn(() => "selector-id") };
		ClassWorkerContentScript(base, {}, setTimeout);
		handlers["show-passkey-selector"]({
			id: "private-session",
			tabOrigin: document.location.origin,
			origin: "https://example.com",
			labels: [
				'<img src=x onerror="alert(1)">',
				"Second account",
				"Third",
				"Fourth",
				"Fifth",
				"Sixth",
			],
		});
		const host = document.querySelector('[id^="psono_drop-"]');
		expect(host.shadowRoot).toBeNull();
		expect(selectorRoot.querySelector("img")).toBeNull();
		expect(selectorRoot.textContent).toContain(
			'<img src=x onerror="alert(1)">',
		);
		const list = selectorRoot.querySelector(".navigations");
		expect(list.style.overflowY).toBe("auto");
		expect(list.style.maxHeight).toBe("min(360px, 75vh)");
		expect(list.querySelector('input[type="search"]')).not.toBeNull();
		expect(
			list.contains(selectorRoot.querySelector(".psono-passkey-cancel")),
		).toBe(false);
		const choices = selectorRoot.querySelectorAll(
			'.psono-passkey-entry [role="button"]',
		);
		choices[0].click(); // Synthetic page events cannot approve an account.
		expect(emit).not.toHaveBeenCalledWith(
			"passkey-selector-select",
			expect.anything(),
		);
		handlers["hide-passkey-selector"]({ id: "private-session" });
		expect(document.querySelector('[id^="psono_drop-"]')).toBeNull();
		shadowSpy.mockRestore();
	});

	it("discovers delayed nested shadow forms and fills them without waiting for the observer", async () => {
		jest.useFakeTimers();
		Object.defineProperty(document, "readyState", {
			configurable: true,
			value: "complete",
		});

		const messageListeners = [];
		let availablePasswords = [
			{ secret_id: "password-id", name: "Example account" },
		];
		const browser = {
			runtime: {
				onMessage: {
					addListener: (listener) => messageListeners.push(listener),
				},
				sendMessage: (message, callback) => {
					if (message.event === "website-password-refresh") {
						callback({ data: availablePasswords });
						return;
					}
					if (message.event === "is-logged-in") {
						callback(true);
						return;
					}
					callback?.();
				},
			},
		};

		document.body.innerHTML = "<ba-modal></ba-modal>";
		const modalRoot = document
			.querySelector("ba-modal")
			.attachShadow({ mode: "open" });
		const base = ClassWorkerContentScriptBase(browser, setTimeout);
		ClassWorkerContentScript(base, browser, setTimeout);

		jest.runOnlyPendingTimers();
		jest.runOnlyPendingTimers();

		const observedPanel = document.createElement(
			"ba-auth-password-credential-panel",
		);
		const observedPanelRoot = observedPanel.attachShadow({ mode: "open" });
		observedPanelRoot.innerHTML = `
			<form>
				<input id="observed-username" type="text">
				<input id="observed-password" type="password">
			</form>
		`;
		modalRoot.appendChild(observedPanel);

		await Promise.resolve();
		jest.advanceTimersByTime(300);

		const observedPassword =
			observedPanelRoot.querySelector("#observed-password");
		const observedUsername =
			observedPanelRoot.querySelector("#observed-username");
		expect(observedPassword.classList).toContain(
			"psono-addPasswordFormButtons-covered",
		);
		expect(observedPassword.style.backgroundImage).toContain(
			"data:image/svg+xml",
		);

		const immediatePanel = document.createElement(
			"ba-auth-password-credential-panel",
		);
		const immediatePanelRoot = immediatePanel.attachShadow({ mode: "open" });
		immediatePanelRoot.innerHTML = `
			<form>
				<input id="credential_username" type="text">
				<input id="credential_password" type="password">
			</form>
		`;
		modalRoot.replaceChildren(immediatePanel);

		const username = immediatePanelRoot.querySelector("#credential_username");
		const password = immediatePanelRoot.querySelector("#credential_password");
		const usernameInput = jest.fn();
		const passwordInput = jest.fn();
		const composedInput = jest.fn();
		let passwordClickListener;
		const addPasswordEventListener = password.addEventListener.bind(password);
		password.addEventListener = (type, listener, options) => {
			if (type === "click") {
				passwordClickListener = listener;
			}
			addPasswordEventListener(type, listener, options);
		};
		username.addEventListener("input", usernameInput);
		password.addEventListener("input", passwordInput);
		document.addEventListener("input", composedInput);

		messageListeners[0](
			{
				event: "fillpassword",
				data: { username: "atlas-user", password: "atlas-password" },
			},
			{},
			jest.fn(),
		);

		expect(username.value).toBe("atlas-user");
		expect(password.value).toBe("atlas-password");
		expect(usernameInput).toHaveBeenCalledTimes(1);
		expect(passwordInput).toHaveBeenCalledTimes(1);
		expect(composedInput).toHaveBeenCalledTimes(2);
		expect(password.style.backgroundImage).toContain("data:image/svg+xml");
		expect(observedUsername.value).toBe("");
		expect(observedPassword.value).toBe("");

		Object.defineProperties(password, {
			offsetHeight: { configurable: true, value: 36 },
			offsetWidth: { configurable: true, value: 240 },
		});
		password.getClientRects = () => [{}];
		password.getBoundingClientRect = () => ({
			bottom: 296,
			height: 36,
			left: 320,
			right: 560,
			top: 260,
			width: 240,
		});
		global.uuid = { v4: jest.fn(() => "test-id") };

		passwordClickListener.call(password, {
			pageX: 550,
			target: document.querySelector("ba-modal"),
		});
		await Promise.resolve();
		await Promise.resolve();

		const dropdown = document.querySelector('[id^="psono_drop-"]');
		expect(dropdown.style.transform).toContain("translateX(320px)");
		expect(dropdown.style.transform).toContain("translateY(296px)");
		expect(
			dropdown._psonoShadowRoot.querySelector(".psono-entry-dot"),
		).not.toBeNull();
		expect(
			dropdown._psonoShadowRoot.querySelector(".psono-entry-label"),
		).not.toBeNull();
		const datastoreButton = dropdown._psonoShadowRoot.querySelector(
			".psono-selector-actions button",
		);
		expect(datastoreButton.getAttribute("aria-label")).toBe("Open Datastore");
		expect(datastoreButton.getAttribute("type")).toBe("button");
		expect(datastoreButton.querySelector("svg path")).not.toBeNull();
		expect(
			Array.from(
				dropdown._psonoShadowRoot.querySelectorAll(
					".psono-selector-actions button",
				),
				(button) => button.getAttribute("aria-label"),
			),
		).toEqual(["Open Datastore", "Generate Password"]);

		availablePasswords = [];
		passwordClickListener.call(password, {
			pageX: 550,
			target: document.querySelector("ba-modal"),
		});
		await Promise.resolve();
		await Promise.resolve();
		const dropdowns = document.querySelectorAll('[id^="psono_drop-"]');
		const emptyDropdown = dropdowns[dropdowns.length - 1]._psonoShadowRoot;
		expect(
			emptyDropdown.querySelector(".psono-password-empty").textContent,
		).toBe("No passwords found");
		expect(
			Array.from(
				emptyDropdown.querySelectorAll(".psono-selector-actions button"),
				(button) => button.getAttribute("aria-label"),
			),
		).toEqual(["Open Datastore", "Generate Password"]);

		jest.useRealTimers();
	});
});
