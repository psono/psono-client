// Polyfill TextEncoder
const textEncoding = require('text-encoding-utf-8');
global.TextEncoder = textEncoding.TextEncoder;
global.TextDecoder = textEncoding.TextDecoder;