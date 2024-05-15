// Polyfill TextEncoder
const textEncoding = require('text-encoding-utf-8');
global.TextEncoder = textEncoding.TextEncoder;
global.TextDecoder = textEncoding.TextDecoder;
global.BroadcastChannel = require('worker_threads').BroadcastChannel;

// Polifill crypto
const nodeCrypto = require('crypto');
window.crypto = {
    getRandomValues: function (buffer) {
        return nodeCrypto.randomFillSync(buffer);
    },
    subtle: nodeCrypto.webcrypto.subtle,
}
Object.defineProperty(global.self, "crypto", {
    value: window.crypto,
});
