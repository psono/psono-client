self.importScripts('lib/ecma-nacl.min.js');

var nacl = require('ecma-nacl');

function encrypt_file (data, k, n) {
    data = new Uint8Array(data);
    k = new Uint8Array(k);
    n = new Uint8Array(n);

    var encrypted_data = nacl.secret_box.formatWN.pack(data, n, k);
    var encrypted_buffer = encrypted_data.buffer;

    self.postMessage({kwargs: encrypted_buffer}, [encrypted_buffer]);
}

function decrypt_file(text, k) {
    text = new Uint8Array(text);
    k = new Uint8Array(k);

    var decrypted_data = nacl.secret_box.formatWN.open(text, k);
    var decrypted_buffer = decrypted_data.buffer;
    decrypted_buffer = decrypted_buffer.slice(32,decrypted_buffer.byteLength);

    self.postMessage({kwargs: decrypted_buffer}, [decrypted_buffer]);
}

self.onmessage = function (msg) {
    switch (msg.data.job) {
        case 'encrypt_file':
            encrypt_file(msg.data.kwargs.data, msg.data.kwargs.k, msg.data.kwargs.n);
            break;
        case 'decrypt_file':
            decrypt_file(msg.data.kwargs.text, msg.data.kwargs.k);
            break;
        default:
            throw 'job could not be handled: ' + msg.data.job;
    }
};