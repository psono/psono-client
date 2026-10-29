// Polyfill TextEncoder
const textEncoding = require("text-encoding-utf-8");
global.TextEncoder = textEncoding.TextEncoder;
global.TextDecoder = textEncoding.TextDecoder;
const NodeBroadcastChannel = require("worker_threads").BroadcastChannel;
const broadcastChannels = new Set();
global.BroadcastChannel = class extends NodeBroadcastChannel {
	constructor(name) {
		super(name);
		broadcastChannels.add(this);
	}
	close() {
		broadcastChannels.delete(this);
		super.close();
	}
};
afterAll(() => {
	for (const channel of broadcastChannels) channel.close();
});

// Polifill crypto
const nodeCrypto = require("crypto");
window.crypto = {
	getRandomValues: (buffer) => nodeCrypto.randomFillSync(buffer),
	subtle: nodeCrypto.webcrypto.subtle,
};
Object.defineProperty(global.self, "crypto", {
	value: window.crypto,
});
