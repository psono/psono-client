/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptBase = (browser, setTimeout) => {
	var registrations = {};
	var observerExecutables = [];
	var documents = [];
	var windows = [];

	activate();
	function activate() {
		ready(() => {
			var i;
			getAllDocuments(window, documents, windows);
			for (i = 0; i < windows.length; i++) {
				observe(windows[i]);
			}
		});
		browser.runtime.onMessage.addListener(onMessage);
	}

	/**
	 * Fires once the document is ready, similar to jQuery(function() { ... })
	 * @param fn
	 */
	function ready(fn) {
		// see if DOM is already available
		if (
			document.readyState === "complete" ||
			document.readyState === "interactive"
		) {
			// call on next available tick
			setTimeout(fn, 1);
		} else {
			document.addEventListener("DOMContentLoaded", fn);
		}
	}

	function getAllDocuments(window, documents, windows) {
		var frames = window.document.querySelectorAll("iframe");
		windows.push(window);
		documents.push(window.document);

		for (var i = 0; i < frames.length; i++) {
			try {
				getAllDocuments(frames[i].contentWindow.document, documents, windows);
			} catch (e) {
				//console.log(e);
			}
		}
	}

	function observe(window) {
		const doc = window.document;

		if (doc.body === null) {
			return;
		}

		const MutationObserver =
			window.MutationObserver ||
			window.WebKitMutationObserver ||
			window.MozMutationObserver;
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const addedNode of mutation.addedNodes) {
					observeShadowRoots(addedNode);
				}
			}

			// watch for changes, but block multiple executions for potentially the same event
			// by delaying the actual execution for 300ms and blocking all events within this timeslot to fire again
			if (doc.analyze_waiting) {
				return;
			}
			doc.analyze_waiting = true;
			setTimeout(() => {
				for (let i = 0; i < observerExecutables.length; i++) {
					observerExecutables[i](doc);
				}
				doc.analyze_waiting = false;
			}, 300);
		});
		const config = { childList: true, characterData: true, subtree: true };
		const observedRoots = new WeakSet();

		function observeRoot(root) {
			if (observedRoots.has(root)) {
				return;
			}
			observedRoots.add(root);
			observer.observe(root, config);
		}

		function observeShadowRoots(node) {
			if (!node || typeof node.querySelectorAll !== "function") {
				return;
			}

			if (node.shadowRoot) {
				observeRoot(node.shadowRoot);
				observeShadowRoots(node.shadowRoot);
			}

			for (const element of node.querySelectorAll("*")) {
				if (element.shadowRoot) {
					observeRoot(element.shadowRoot);
					observeShadowRoots(element.shadowRoot);
				}
			}
		}

		observeRoot(doc.body);
		observeShadowRoots(doc.body);
	}
	function registerObserver(fnc) {
		observerExecutables.push(fnc);
		for (let i = 0; i < documents.length; i++) {
			fnc(documents[i]);
		}
	}

	/**
	 * Cheks whether the code runs in an iframe or not.
	 *
	 * @returns {boolean}
	 */
	function inIframe() {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	}

	/**
	 * modifies an input field and adds the image button to click together with the appropriate event handlers
	 *
	 * @param input
	 * @param background_image
	 * @param position
	 * @param document
	 * @param click
	 * @param mouseOver
	 * @param mouseOut
	 * @param mouseMove
	 */
	function modifyInputField(
		input,
		background_image,
		position,
		document,
		click,
		mouseOver,
		mouseOut,
		mouseMove,
	) {
		input.style.setProperty(
			"background-image",
			'url("' + background_image + '")',
			"important",
		);
		input.style.setProperty("background-position", position, "important");
		input.style.setProperty("background-repeat", "no-repeat", "important");
		input.style.setProperty("background-size", "auto", "important");

		if (mouseOver) {
			input.addEventListener("mouseover", function (evt) {
				mouseOver(evt, this);
			});
		}
		if (mouseOut) {
			input.addEventListener("mouseout", function (evt) {
				mouseOut(evt, this);
			});
		}
		if (mouseMove) {
			input.addEventListener("mousemove", function (evt) {
				mouseMove(evt, this);
			});
		}
		if (click) {
			input.addEventListener("click", function (evt) {
				click(evt, this, document, input);
			});
		}
	}

	/**
	 * sends an event message to browser
	 *
	 * @param event
	 * @param data
	 * @param func
	 */
	function emit(event, data, func) {
		browser.runtime.sendMessage({ event: event, data: data }, (response) => {
			if (func) {
				func(response);
			}
			if (
				typeof response === "undefined" ||
				!Object.hasOwn(response, "event")
			) {
				return;
			}
			for (
				let i = 0;
				Object.hasOwn(registrations, response.event) &&
				i < registrations[response.event].length;
				i++
			) {
				registrations[response.event][i](response.data);
			}
		});
	}

	/**
	 * registers for an event with a function
	 *
	 * @param event
	 * @param myFunction
	 *
	 * @returns {boolean}
	 */
	function on(event, myFunction) {
		if (!Object.hasOwn(registrations, event)) {
			registrations[event] = [];
		}
		registrations[event].push(myFunction);
	}

	/**
	 * Main handler for all messages
	 *
	 * @param request
	 * @param sender
	 * @param sendResponse
	 */
	function onMessage(request, sender, sendResponse) {
		try {
			var willRespondAsync = false;
			for (
				var i = 0;
				Object.hasOwn(registrations, request.event) &&
				i < registrations[request.event].length;
				i++
			) {
				try {
					var result = registrations[request.event][i](
						request.data,
						sender,
						sendResponse,
					);
					// If any callback returns true, it means it will respond asynchronously
					if (result === true) {
						willRespondAsync = true;
					}
				} catch (callbackError) {
					console.error("Error in message callback:", callbackError);
				}
			}
			return willRespondAsync;
		} catch (error) {
			console.error("Error in onMessage handler:", error);
			return false;
		}
	}

	return {
		ready: ready,
		getAllDocuments: getAllDocuments,
		registerObserver: registerObserver,
		modifyInputField: modifyInputField,
		inIframe: inIframe,
		emit: emit,
		on: on,
		onMessage: onMessage,
	};
};

if (typeof module !== "undefined") {
	module.exports = ClassWorkerContentScriptBase;
}
