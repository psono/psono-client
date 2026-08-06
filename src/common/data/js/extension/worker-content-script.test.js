const ClassWorkerContentScriptBase = require("./worker-content-script-base");
const ClassWorkerContentScript = require("./worker-content-script");

describe("content script shadow DOM autofill", () => {
	it("discovers delayed nested shadow forms and fills them without waiting for the observer", async () => {
		jest.useFakeTimers();
		Object.defineProperty(document, "readyState", {
			configurable: true,
			value: "complete",
		});

		const messageListeners = [];
		const browser = {
			runtime: {
				onMessage: {
					addListener: (listener) => messageListeners.push(listener),
				},
				sendMessage: (message, callback) => {
					if (message.event === "website-password-refresh") {
						callback({ data: [] });
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

		jest.useRealTimers();
	});
});
