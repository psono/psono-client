/**
 * Converter service to convert between data formats
 */

import uuid from "uuid-js";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// https://github.com/MaxArt2501/base64-js/blob/39729b0e836f86398d6ebf1fb6d70c9f307bec0b/base64.js#L29
const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;

// https://github.com/paroga/cbor-js/blob/master/cbor.js
const POW_2_24 = 5.960464477539063e-8,
    POW_2_32 = 4294967296,
    POW_2_53 = 9007199254740992;

/**
 * encodes utf8 from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {string} toEncode String to encode
 *
 * @returns {Uint8Array} Encoded string
 */
function encodeUtf8(toEncode) {
    return encodeLatin1(unescape(encodeURIComponent(toEncode)));
}

/**
 * encodes latin1 from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {string} toEncode String to encode
 *
 * @returns {Uint8Array} Encoded string
 */
function encodeLatin1(toEncode) {
    const result = new Uint8Array(toEncode.length);
    for (let i = 0; i < toEncode.length; i++) {
        let c = toEncode.charCodeAt(i);
        if ((c & 0xff) !== c) throw new Error("Cannot encode string in Latin1:" + toEncode);
        result[i] = c & 0xff;
    }
    return result;
}

/**
 * decodes utf8 from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {Uint8Array} toDecode encoded utf-8 Uint8Array
 *
 * @returns {string} Decoded string
 */
function decodeUtf8(toDecode) {
    return decodeURIComponent(escape(decodeLatin1(toDecode)));
}

/**
 * decodes latin1 from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {Uint8Array} toDecode encoded latin1 Uint8Array
 *
 * @returns {string} Decoded string
 */
function decodeLatin1(toDecode) {
    const encoded = [];
    for (let i = 0; i < toDecode.length; i++) {
        encoded.push(String.fromCharCode(toDecode[i]));
    }
    return encoded.join("");
}

/**
 * Uint8Array to hex converter from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {Uint8Array} val As Uint8Array encoded value
 *
 * @returns {string} Returns hex representation
 */
function toHex(val) {
    const encoded = [];
    for (let i = 0; i < val.length; i++) {
        encoded.push("0123456789abcdef"[(val[i] >> 4) & 15]);
        encoded.push("0123456789abcdef"[val[i] & 15]);
    }
    return encoded.join("");
}

/**
 * hex to Uint8Array converter from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {string} val As hex encoded value
 *
 * @returns {Uint8Array} Returns Uint8Array representation
 */
function fromHex(val) {
    const result = new Uint8Array(val.length / 2);
    for (let i = 0; i < val.length / 2; i++) {
        result[i] = parseInt(val.substr(2 * i, 2), 16);
    }
    return result;
}

/**
 * Helper function to create a lookup map of a given alphabet
 * (based on https://github.com/cryptocoinjs/base-x)
 *
 * @param {string} alphabet The alphabet as string
 *
 * @returns {object} Returns the lookup map
 */
function baseXLookupTable(alphabet) {
    const alphabet_map = {};
    // pre-compute lookup table
    for (let z = 0; z < alphabet.length; z++) {
        let x = alphabet.charAt(z);

        if (alphabet_map[x] !== undefined) {
            throw new TypeError(x + " is ambiguous");
        }
        alphabet_map[x] = z;
    }
    return alphabet_map;
}

/**
 * Uint8Array to base X converter
 * (based on https://github.com/cryptocoinjs/base-x)
 *
 * @param {Uint8Array} val As Uint8Array encoded value
 * @param {string} alphabet The alphabet as string
 *
 * @returns {string} Returns base X representation
 */
function toBaseX(val, alphabet) {
    const base = alphabet.length;

    if (val.length === 0) return "";

    const digits = [0];
    for (let i = 0; i < val.length; ++i) {
        let carry = val[i];
        for (let j = 0; j < digits.length; ++j) {
            carry += digits[j] << 8;
            digits[j] = carry % base;
            carry = (carry / base) | 0;
        }

        while (carry > 0) {
            digits.push(carry % base);
            carry = (carry / base) | 0;
        }
    }

    let string = "";

    // deal with leading zeros
    for (let k = 0; val[k] === 0 && k < val.length - 1; ++k) {
        string += alphabet[0];
    }

    // convert digits to a string
    for (let q = digits.length - 1; q >= 0; --q) {
        string += alphabet[digits[q]];
    }

    return string;
}

/**
 * base X to Uint8Array converter
 * (based on https://github.com/cryptocoinjs/base-x)
 *
 * @param {string} val As base X encoded value
 * @param {string} alphabet The alphabet as string
 *
 * @returns {Uint8Array} Returns Uint8Array representation
 */
function fromBaseX(val, alphabet) {
    const base = alphabet.length;
    const leader = alphabet.charAt(0);
    const alphabetMap = baseXLookupTable(alphabet);

    if (val.length === 0) {
        return new Uint8Array(0);
    }

    const bytes = [0];
    for (let i = 0; i < val.length; i++) {
        let value = alphabetMap[val[i]];
        if (value === undefined) {
            throw new Error("Non-base" + base + " character");
        }
        let carry = value;
        for (let j = 0; j < bytes.length; ++j) {
            carry += bytes[j] * base;
            bytes[j] = carry & 0xff;
            carry >>= 8;
        }

        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }

    // deal with leading zeros
    for (let k = 0; val[k] === leader && k < val.length - 1; ++k) {
        bytes.push(0);
    }

    const representation = new Uint8Array(bytes.length);

    for (let l = 0; l < bytes.length; l++) {
        representation[l] = bytes[bytes.length - l - 1];
    }

    return representation;
}

/**
 * Uint8Array to base58 converter
 * (based on https://github.com/cryptocoinjs/base-x)
 *
 * @param {Uint8Array} val As Uint8Array encoded value
 *
 * @returns {string} Returns base58 representation
 */
function toBase58(val) {
    return toBaseX(val, BASE58);
}

/**
 * base58 to Uint8Array converter
 * (based on https://github.com/cryptocoinjs/base-x)
 *
 * @param {string} val As base58 encoded value
 *
 * @returns {Uint8Array} Returns Uint8Array representation
 */
function fromBase58(val) {
    return fromBaseX(val, BASE58);
}

/**
 * hex to uuid converter
 *
 * @param {string} val The hex one wants to convert
 *
 * @returns {string} Returns base58 representation
 */
function hexToBase58(val) {
    return toBase58(fromHex(val));
}

/**
 * Base58 to hex converter
 *
 * @param {string} val The base58 one wants to convert
 *
 * @returns {string} Returns hex representation
 */
function base58ToHex(val) {
    return toHex(fromBase58(val));
}

/**
 * Converts an arrayBuffer to Base64
 * https://www.rfc-editor.org/rfc/rfc4648#section-4
 *
 * @param buffer
 *
 * @returns {string} The Base64 representation of the buffer
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array( buffer );
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoaPolyfill(binary);
}

/**
 * Converts a Base64 encoded string to arrayBuffer
 * https://www.rfc-editor.org/rfc/rfc4648#section-4
 *
 * @param base64 the base64 encoded string
 *
 * @returns {ArrayBuffer} The buffer representation of the base64 encoded string
 */
function base64ToArrayBuffer(base64) {
    var binary_string = atobPolyfill(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Polyfill function for window.atob, so that we can use it without window object in the background for example
 *
 * Source:
 * https://github.com/MaxArt2501/base64-js/blob/39729b0e836f86398d6ebf1fb6d70c9f307bec0b/base64.js
 *
 * LICENSE:
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 MaxArt2501
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @param string
 * @returns {string}
 */
function atobPolyfill(string) {
    // atob can work with strings with whitespaces, even inside the encoded part,
    // but only \t, \n, \f, \r and ' ', which can be stripped.
    string = String(string).replace(/[\t\n\f\r ]+/g, "");
    if (!b64re.test(string))
        throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");

    // Adding the padding if missing, for semplicity
    string += "==".slice(2 - (string.length & 3));
    var bitmap, result = "", r1, r2, i = 0;
    for (; i < string.length;) {
        bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
            | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));

        result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
            : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
    }
    return result;
}
/**
 * Polyfill function for window.btoa, so that we can use it without window object in the background for example
 *
 * Source:
 * https://github.com/MaxArt2501/base64-js/blob/39729b0e836f86398d6ebf1fb6d70c9f307bec0b/base64.js
 *
 * LICENSE:
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 MaxArt2501
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @param string
 * @returns {string}
 */
function btoaPolyfill(string) {
    string = String(string);
    var bitmap, a, b, c,
        result = "", i = 0,
        rest = string.length % 3; // To determine the final padding

    for (; i < string.length;) {
        if ((a = string.charCodeAt(i++)) > 255
            || (b = string.charCodeAt(i++)) > 255
            || (c = string.charCodeAt(i++)) > 255)
            throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");

        bitmap = (a << 16) | (b << 8) | c;
        result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63)
            + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
    }

    // If there's need of padding, replace the last 'A's with equal signs
    return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
}

/**
 * Converts an arrayBuffer to Base64Url
 * https://www.rfc-editor.org/rfc/rfc4648#section-5
 *
 * @param buffer
 *
 * @returns {string} The Base64Url representation of the buffer
 */
function arrayBufferToBase64Url(buffer) {
    return arrayBufferToBase64(buffer).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
}

/**
 * Converts an Base64Url encoded string to arrayBuffer
 * https://www.rfc-editor.org/rfc/rfc4648#section-5
 *
 * @param base64Url The base64Url encoded string
 *
 * @returns {ArrayBuffer} The buffer representation of the base64Url encoded string
 */
function base64UrlToArrayBuffer(base64Url) {
    return base64ToArrayBuffer(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
}

/**
 * CBOR decodes data
 *
 * Source:
 * https://github.com/paroga/cbor-js/blob/master/cbor.js
 *
 * LICENSE:
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Patrick Gansterer <paroga@paroga.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @param data
 * @param tagger
 * @param simpleValue
 * @returns {*|number|number|Uint8Array|*[]|{}|boolean}
 */
function cborDecode(data, tagger, simpleValue) {
    var dataView = new DataView(data);
    var offset = 0;

    if (typeof tagger !== "function")
        tagger = function(value) { return value; };
    if (typeof simpleValue !== "function")
        simpleValue = function() { return undefined; };

    function commitRead(length, value) {
        offset += length;
        return value;
    }
    function readArrayBuffer(length) {
        return commitRead(length, new Uint8Array(data, offset, length));
    }
    function readFloat16() {
        var tempArrayBuffer = new ArrayBuffer(4);
        var tempDataView = new DataView(tempArrayBuffer);
        var value = readUint16();

        var sign = value & 0x8000;
        var exponent = value & 0x7c00;
        var fraction = value & 0x03ff;

        if (exponent === 0x7c00)
            exponent = 0xff << 10;
        else if (exponent !== 0)
            exponent += (127 - 15) << 10;
        else if (fraction !== 0)
            return (sign ? -1 : 1) * fraction * POW_2_24;

        tempDataView.setUint32(0, sign << 16 | exponent << 13 | fraction << 13);
        return tempDataView.getFloat32(0);
    }
    function readFloat32() {
        return commitRead(4, dataView.getFloat32(offset));
    }
    function readFloat64() {
        return commitRead(8, dataView.getFloat64(offset));
    }
    function readUint8() {
        return commitRead(1, dataView.getUint8(offset));
    }
    function readUint16() {
        return commitRead(2, dataView.getUint16(offset));
    }
    function readUint32() {
        return commitRead(4, dataView.getUint32(offset));
    }
    function readUint64() {
        return readUint32() * POW_2_32 + readUint32();
    }
    function readBreak() {
        if (dataView.getUint8(offset) !== 0xff)
            return false;
        offset += 1;
        return true;
    }
    function readLength(additionalInformation) {
        if (additionalInformation < 24)
            return additionalInformation;
        if (additionalInformation === 24)
            return readUint8();
        if (additionalInformation === 25)
            return readUint16();
        if (additionalInformation === 26)
            return readUint32();
        if (additionalInformation === 27)
            return readUint64();
        if (additionalInformation === 31)
            return -1;
        throw "Invalid length encoding";
    }
    function readIndefiniteStringLength(majorType) {
        var initialByte = readUint8();
        if (initialByte === 0xff)
            return -1;
        var length = readLength(initialByte & 0x1f);
        if (length < 0 || (initialByte >> 5) !== majorType)
            throw "Invalid indefinite length element";
        return length;
    }

    function appendUtf16Data(utf16data, length) {
        for (var i = 0; i < length; ++i) {
            var value = readUint8();
            if (value & 0x80) {
                if (value < 0xe0) {
                    value = (value & 0x1f) <<  6
                        | (readUint8() & 0x3f);
                    length -= 1;
                } else if (value < 0xf0) {
                    value = (value & 0x0f) << 12
                        | (readUint8() & 0x3f) << 6
                        | (readUint8() & 0x3f);
                    length -= 2;
                } else {
                    value = (value & 0x0f) << 18
                        | (readUint8() & 0x3f) << 12
                        | (readUint8() & 0x3f) << 6
                        | (readUint8() & 0x3f);
                    length -= 3;
                }
            }

            if (value < 0x10000) {
                utf16data.push(value);
            } else {
                value -= 0x10000;
                utf16data.push(0xd800 | (value >> 10));
                utf16data.push(0xdc00 | (value & 0x3ff));
            }
        }
    }

    function decodeItem() {
        var initialByte = readUint8();
        var majorType = initialByte >> 5;
        var additionalInformation = initialByte & 0x1f;
        var i;
        var length;

        if (majorType === 7) {
            switch (additionalInformation) {
                case 25:
                    return readFloat16();
                case 26:
                    return readFloat32();
                case 27:
                    return readFloat64();
            }
        }

        length = readLength(additionalInformation);
        if (length < 0 && (majorType < 2 || 6 < majorType))
            throw "Invalid length";

        switch (majorType) {
            case 0:
                return length;
            case 1:
                return -1 - length;
            case 2:
                if (length < 0) {
                    var elements = [];
                    var fullArrayLength = 0;
                    while ((length = readIndefiniteStringLength(majorType)) >= 0) {
                        fullArrayLength += length;
                        elements.push(readArrayBuffer(length));
                    }
                    var fullArray = new Uint8Array(fullArrayLength);
                    var fullArrayOffset = 0;
                    for (i = 0; i < elements.length; ++i) {
                        fullArray.set(elements[i], fullArrayOffset);
                        fullArrayOffset += elements[i].length;
                    }
                    return fullArray;
                }
                return readArrayBuffer(length);
            case 3:
                var utf16data = [];
                if (length < 0) {
                    while ((length = readIndefiniteStringLength(majorType)) >= 0)
                        appendUtf16Data(utf16data, length);
                } else
                    appendUtf16Data(utf16data, length);
                return String.fromCharCode.apply(null, utf16data);
            case 4:
                var retArray;
                if (length < 0) {
                    retArray = [];
                    while (!readBreak())
                        retArray.push(decodeItem());
                } else {
                    retArray = new Array(length);
                    for (i = 0; i < length; ++i)
                        retArray[i] = decodeItem();
                }
                return retArray;
            case 5:
                var retObject = {};
                for (i = 0; i < length || length < 0 && !readBreak(); ++i) {
                    var key = decodeItem();
                    retObject[key] = decodeItem();
                }
                return retObject;
            case 6:
                return tagger(decodeItem(), length);
            case 7:
                switch (length) {
                    case 20:
                        return false;
                    case 21:
                        return true;
                    case 22:
                        return null;
                    case 23:
                        return undefined;
                    default:
                        return simpleValue(length);
                }
        }
    }

    var ret = decodeItem();
    if (offset !== data.byteLength)
        throw "Remaining bytes";
    return ret;
}

/**
 * CBOR encodes a value
 *
 * Source:
 * https://github.com/paroga/cbor-js/blob/master/cbor.js
 *
 * LICENSE:
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Patrick Gansterer <paroga@paroga.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @param value
 * @returns {ArrayBuffer}
 */
function cborEncode(value) {
    var data = new ArrayBuffer(256);
    var dataView = new DataView(data);
    var lastLength;
    var offset = 0;

    function prepareWrite(length) {
        var newByteLength = data.byteLength;
        var requiredLength = offset + length;
        while (newByteLength < requiredLength)
            newByteLength <<= 1;
        if (newByteLength !== data.byteLength) {
            var oldDataView = dataView;
            data = new ArrayBuffer(newByteLength);
            dataView = new DataView(data);
            var uint32count = (offset + 3) >> 2;
            for (var i = 0; i < uint32count; ++i)
                dataView.setUint32(i << 2, oldDataView.getUint32(i << 2));
        }

        lastLength = length;
        return dataView;
    }
    function commitWrite() {
        offset += lastLength;
    }
    function writeFloat64(value) {
        commitWrite(prepareWrite(8).setFloat64(offset, value));
    }
    function writeUint8(value) {
        commitWrite(prepareWrite(1).setUint8(offset, value));
    }
    function writeUint8Array(value) {
        var dataView = prepareWrite(value.length);
        for (var i = 0; i < value.length; ++i)
            dataView.setUint8(offset + i, value[i]);
        commitWrite();
    }
    function writeUint16(value) {
        commitWrite(prepareWrite(2).setUint16(offset, value));
    }
    function writeUint32(value) {
        commitWrite(prepareWrite(4).setUint32(offset, value));
    }
    function writeUint64(value) {
        var low = value % POW_2_32;
        var high = (value - low) / POW_2_32;
        var dataView = prepareWrite(8);
        dataView.setUint32(offset, high);
        dataView.setUint32(offset + 4, low);
        commitWrite();
    }
    function writeTypeAndLength(type, length) {
        if (length < 24) {
            writeUint8(type << 5 | length);
        } else if (length < 0x100) {
            writeUint8(type << 5 | 24);
            writeUint8(length);
        } else if (length < 0x10000) {
            writeUint8(type << 5 | 25);
            writeUint16(length);
        } else if (length < 0x100000000) {
            writeUint8(type << 5 | 26);
            writeUint32(length);
        } else {
            writeUint8(type << 5 | 27);
            writeUint64(length);
        }
    }

    function encodeItem(value) {
        let i;

        if (value === false)
            return writeUint8(0xf4);
        if (value === true)
            return writeUint8(0xf5);
        if (value === null)
            return writeUint8(0xf6);
        if (value === undefined)
            return writeUint8(0xf7);

        switch (typeof value) {
            case "number":
                if (Math.floor(value) === value) {
                    if (0 <= value && value <= POW_2_53)
                        return writeTypeAndLength(0, value);
                    if (-POW_2_53 <= value && value < 0)
                        return writeTypeAndLength(1, -(value + 1));
                }
                writeUint8(0xfb);
                return writeFloat64(value);

            case "string":
                var utf8data = [];
                for (i = 0; i < value.length; ++i) {
                    var charCode = value.charCodeAt(i);
                    if (charCode < 0x80) {
                        utf8data.push(charCode);
                    } else if (charCode < 0x800) {
                        utf8data.push(0xc0 | charCode >> 6);
                        utf8data.push(0x80 | charCode & 0x3f);
                    } else if (charCode < 0xd800) {
                        utf8data.push(0xe0 | charCode >> 12);
                        utf8data.push(0x80 | (charCode >> 6)  & 0x3f);
                        utf8data.push(0x80 | charCode & 0x3f);
                    } else {
                        charCode = (charCode & 0x3ff) << 10;
                        charCode |= value.charCodeAt(++i) & 0x3ff;
                        charCode += 0x10000;

                        utf8data.push(0xf0 | charCode >> 18);
                        utf8data.push(0x80 | (charCode >> 12)  & 0x3f);
                        utf8data.push(0x80 | (charCode >> 6)  & 0x3f);
                        utf8data.push(0x80 | charCode & 0x3f);
                    }
                }

                writeTypeAndLength(3, utf8data.length);
                return writeUint8Array(utf8data);

            default:
                var length;
                if (Array.isArray(value)) {
                    length = value.length;
                    writeTypeAndLength(4, length);
                    for (i = 0; i < length; ++i)
                        encodeItem(value[i]);
                } else if (value instanceof Uint8Array) {
                    writeTypeAndLength(2, value.length);
                    writeUint8Array(value);
                } else {
                    var keys = Object.keys(value);
                    length = keys.length;
                    writeTypeAndLength(5, length);
                    for (i = 0; i < length; ++i) {
                        var key = keys[i];
                        encodeItem(key);
                        encodeItem(value[key]);
                    }
                }
        }
    }

    encodeItem(value);

    if ("slice" in data) {
        return data.slice(0, offset);
    }

    const ret = new ArrayBuffer(offset);
    const retView = new DataView(ret);
    for (let i = 0; i < offset; ++i) {
        retView.setUint8(i, dataView.getUint8(i));
    }
    return ret;
}


/**
 * uuid to hex converter
 *
 * @param {string} val The uuid one wants to convert
 *
 * @returns {string} Returns hex representation
 */
function uuidToHex(val) {
    return val.replace(/-/g, "");
}


/**
 * hex to uuid converter
 *
 * @param {string} val The hex representation of a uuid one wants to convert
 *
 * @returns {uuid} Returns uuid
 */
function hexToUuid(val) {
    return uuid.fromBytes(fromHex(val)).toString();
}

const Mnemonic = (function () {
    // Mnemonic.js v. 1.1.0

    // (c) 2012-2015 Yiorgis Gozadinos, Crypho AS.
    // Mnemonic.js is distributed under the MIT license.
    // http://github.com/ggozad/mnemonic.js

    // AMD/global registrations

    const Mnemonic = function (args) {
        this.seed = args;
        return this;
    };

    Mnemonic.prototype.toHex = function () {
        let l = this.seed.length,
            res = "",
            i = 0;
        for (; i < l; i++) {
            res += ("00000000" + this.seed[i].toString(16)).substr(-8);
        }
        return res;
    };

    Mnemonic.prototype.toWords = function () {
        let i = 0,
            l = this.seed.length,
            n = Mnemonic.wc,
            words = [],
            x,
            w1,
            w2,
            w3;
        for (; i < l; i++) {
            x = this.seed[i];
            w1 = x % n;
            w2 = (((x / n) >> 0) + w1) % n;
            w3 = (((((x / n) >> 0) / n) >> 0) + w2) % n;
            words.push(Mnemonic.words[w1]);
            words.push(Mnemonic.words[w2]);
            words.push(Mnemonic.words[w3]);
        }
        return words;
    };

    Mnemonic.fromWords = function (words) {
        let i = 0,
            n = Mnemonic.wc,
            l = words.length / 3,
            seed = new Uint32Array(l),
            w1,
            w2,
            w3;

        for (; i < l; i++) {
            w1 = Mnemonic.words.indexOf(words[3 * i]);
            w2 = Mnemonic.words.indexOf(words[3 * i + 1]);
            w3 = Mnemonic.words.indexOf(words[3 * i + 2]);
            seed[i] = w1 + n * Mnemonic._mod(w2 - w1, n) + n * n * Mnemonic._mod(w3 - w2, n);
        }

        return new Mnemonic(seed);
    };

    Mnemonic.fromHex = function (hex) {
        let hexParts = hex.match(/.{1,8}/g),
            i = 0,
            l = hex.length / 8,
            seed = new Uint32Array(l),
            x;

        for (; i < l; i++) {
            x = parseInt(hexParts[i], 16);
            seed[i] = x;
        }
        return new Mnemonic(seed);
    };

    Mnemonic.wc = 1626;
    //Wordlist of BIP39, because other contained words like "quick" and "quickly"
    Mnemonic.words = JSON.parse(
        '["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act","action","actor","actress","actual","adapt","add","addict","address","adjust","admit","adult","advance","advice","aerobic","affair","afford","afraid","again","age","agent","agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien","all","alley","allow","almost","alone","alpha","already","also","alter","always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety","any","apart","apology","appear","apple","approve","april","arch","arctic","area","arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive","arrow","art","artefact","artist","artwork","ask","aspect","assault","asset","assist","assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit","august","aunt","author","auto","autumn","average","avocado","avoid","awake","aware","away","awesome","awful","awkward","axis","baby","bachelor","bacon","badge","bag","balance","balcony","ball","bamboo","banana","banner","bar","barely","bargain","barrel","base","basic","basket","battle","beach","bean","beauty","because","become","beef","before","begin","behave","behind","believe","below","belt","bench","benefit","best","betray","better","between","beyond","bicycle","bid","bike","bind","biology","bird","birth","bitter","black","blade","blame","blanket","blast","bleak","bless","blind","blood","blossom","blouse","blue","blur","blush","board","boat","body","boil","bomb","bone","bonus","book","boost","border","boring","borrow","boss","bottom","bounce","box","boy","bracket","brain","brand","brass","brave","bread","breeze","brick","bridge","brief","bright","bring","brisk","broccoli","broken","bronze","broom","brother","brown","brush","bubble","buddy","budget","buffalo","build","bulb","bulk","bullet","bundle","bunker","burden","burger","burst","bus","business","busy","butter","buyer","buzz","cabbage","cabin","cable","cactus","cage","cake","call","calm","camera","camp","can","canal","cancel","candy","cannon","canoe","canvas","canyon","capable","capital","captain","car","carbon","card","cargo","carpet","carry","cart","case","cash","casino","castle","casual","cat","catalog","catch","category","cattle","caught","cause","caution","cave","ceiling","celery","cement","census","century","cereal","certain","chair","chalk","champion","change","chaos","chapter","charge","chase","chat","cheap","check","cheese","chef","cherry","chest","chicken","chief","child","chimney","choice","choose","chronic","chuckle","chunk","churn","cigar","cinnamon","circle","citizen","city","civil","claim","clap","clarify","claw","clay","clean","clerk","clever","click","client","cliff","climb","clinic","clip","clock","clog","close","cloth","cloud","clown","club","clump","cluster","clutch","coach","coast","coconut","code","coffee","coil","coin","collect","color","column","combine","come","comfort","comic","common","company","concert","conduct","confirm","congress","connect","consider","control","convince","cook","cool","copper","copy","coral","core","corn","correct","cost","cotton","couch","country","couple","course","cousin","cover","coyote","crack","cradle","craft","cram","crane","crash","crater","crawl","crazy","cream","credit","creek","crew","cricket","crime","crisp","critic","crop","cross","crouch","crowd","crucial","cruel","cruise","crumble","crunch","crush","cry","crystal","cube","culture","cup","cupboard","curious","current","curtain","curve","cushion","custom","cute","cycle","dad","damage","damp","dance","danger","daring","dash","daughter","dawn","day","deal","debate","debris","decade","december","decide","decline","decorate","decrease","deer","defense","define","defy","degree","delay","deliver","demand","demise","denial","dentist","deny","depart","depend","deposit","depth","deputy","derive","describe","desert","design","desk","despair","destroy","detail","detect","develop","device","devote","diagram","dial","diamond","diary","dice","diesel","diet","differ","digital","dignity","dilemma","dinner","dinosaur","direct","dirt","disagree","discover","disease","dish","dismiss","disorder","display","distance","divert","divide","divorce","dizzy","doctor","document","dog","doll","dolphin","domain","donate","donkey","donor","door","dose","double","dove","draft","dragon","drama","drastic","draw","dream","dress","drift","drill","drink","drip","drive","drop","drum","dry","duck","dumb","dune","during","dust","dutch","duty","dwarf","dynamic","eager","eagle","early","earn","earth","easily","east","easy","echo","ecology","economy","edge","edit","educate","effort","egg","eight","either","elbow","elder","electric","elegant","element","elephant","elevator","elite","else","embark","embody","embrace","emerge","emotion","employ","empower","empty","enable","enact","end","endless","endorse","enemy","energy","enforce","engage","engine","enhance","enjoy","enlist","enough","enrich","enroll","ensure","enter","entire","entry","envelope","episode","equal","equip","era","erase","erode","erosion","error","erupt","escape","essay","essence","estate","eternal","ethics","evidence","evil","evoke","evolve","exact","example","excess","repository","excite","exclude","excuse","execute","exercise","exhaust","exhibit","exile","exist","exit","exotic","expand","expect","expire","explain","expose","express","extend","extra","eye","eyebrow","fabric","face","faculty","fade","faint","faith","fall","false","fame","family","famous","fan","fancy","fantasy","farm","fashion","fat","fatal","father","fatigue","fault","favorite","feature","february","federal","fee","feed","feel","female","fence","festival","fetch","fever","few","fiber","fiction","field","figure","file","film","filter","final","find","fine","finger","finish","fire","firm","first","fiscal","fish","fit","fitness","fix","flag","flame","flash","flat","flavor","flee","flight","flip","float","flock","floor","flower","fluid","flush","fly","foam","focus","fog","foil","fold","follow","food","foot","force","forest","forget","fork","fortune","forum","forward","fossil","foster","found","fox","fragile","frame","frequent","fresh","friend","fringe","frog","front","frost","frown","frozen","fruit","fuel","fun","funny","furnace","fury","future","gadget","gain","galaxy","gallery","game","gap","garage","garbage","garden","garlic","garment","gas","gasp","gate","gather","gauge","gaze","general","genius","genre","gentle","genuine","gesture","ghost","giant","gift","giggle","ginger","giraffe","girl","give","glad","glance","glare","glass","glide","glimpse","globe","gloom","glory","glove","glow","glue","goat","goddess","gold","good","goose","gorilla","gospel","gossip","govern","gown","grab","grace","grain","grant","grape","grass","gravity","great","green","grid","grief","grit","grocery","group","grow","grunt","guard","guess","guide","guilt","guitar","gun","gym","habit","hair","half","hammer","hamster","hand","happy","harbor","hard","harsh","harvest","hat","have","hawk","hazard","head","health","heart","heavy","hedgehog","height","hello","helmet","help","hen","hero","hidden","high","hill","hint","hip","hire","history","hobby","hockey","hold","hole","holiday","hollow","home","honey","hood","hope","horn","horror","horse","hospital","host","hotel","hour","hover","hub","huge","human","humble","humor","hundred","hungry","hunt","hurdle","hurry","hurt","husband","hybrid","ice","icon","idea","identify","idle","ignore","ill","illegal","illness","image","imitate","immense","immune","impact","impose","improve","impulse","inch","include","income","increase","index","indicate","indoor","industry","infant","inflict","inform","inhale","inherit","initial","inject","injury","inmate","inner","innocent","input","inquiry","insane","insect","inside","inspire","install","intact","interest","into","invest","invite","involve","iron","island","isolate","issue","item","ivory","jacket","jaguar","jar","jazz","jealous","jeans","jelly","jewel","job","join","joke","journey","joy","judge","juice","jump","jungle","junior","junk","just","kangaroo","keen","keep","ketchup","key","kick","kid","kidney","kind","kingdom","kiss","kit","kitchen","kite","kitten","kiwi","knee","knife","knock","know","lab","label","labor","ladder","lady","lake","lamp","language","laptop","large","later","latin","laugh","laundry","lava","law","lawn","lawsuit","layer","lazy","leader","leaf","learn","leave","lecture","left","leg","legal","legend","leisure","lemon","lend","length","lens","leopard","lesson","letter","level","liar","liberty","library","license","life","lift","light","like","limb","limit","link","lion","liquid","list","little","live","lizard","load","loan","lobster","local","lock","logic","lonely","long","loop","lottery","loud","lounge","love","loyal","lucky","luggage","lumber","lunar","lunch","luxury","lyrics","machine","mad","magic","magnet","maid","mail","main","major","make","mammal","man","manage","mandate","mango","mansion","manual","maple","marble","march","margin","marine","market","marriage","mask","mass","master","match","material","math","matrix","matter","maximum","maze","meadow","mean","measure","meat","mechanic","medal","media","melody","melt","member","memory","mention","menu","mercy","merge","merit","merry","mesh","message","metal","method","middle","midnight","milk","million","mimic","mind","minimum","minor","minute","miracle","mirror","misery","miss","mistake","mix","mixed","mixture","mobile","model","modify","mom","moment","monitor","monkey","monster","month","moon","moral","more","morning","mosquito","mother","motion","motor","mountain","mouse","move","movie","much","muffin","mule","multiply","muscle","museum","mushroom","music","must","mutual","myself","mystery","myth","naive","name","napkin","narrow","nasty","nation","nature","near","neck","need","negative","neglect","neither","nephew","nerve","nest","net","network","neutral","never","news","next","nice","night","noble","noise","nominee","noodle","normal","north","nose","notable","note","nothing","notice","novel","now","nuclear","number","nurse","nut","oak","obey","object","oblige","obscure","observe","obtain","obvious","occur","ocean","october","odor","off","offer","office","often","oil","okay","old","olive","olympic","omit","once","one","onion","online","only","open","opera","opinion","oppose","option","orange","orbit","orchard","order","ordinary","organ","orient","original","orphan","ostrich","other","outdoor","outer","output","outside","oval","oven","over","own","owner","oxygen","oyster","ozone","pact","paddle","page","pair","palace","palm","panda","panel","panic","panther","paper","parade","parent","park","parrot","party","pass","patch","path","patient","patrol","pattern","pause","pave","payment","peace","peanut","pear","peasant","pelican","pen","penalty","pencil","people","pepper","perfect","permit","person","pet","phone","photo","phrase","physical","piano","picnic","picture","piece","pig","pigeon","pill","pilot","pink","pioneer","pipe","pistol","pitch","pizza","place","planet","plastic","plate","play","please","pledge","pluck","plug","plunge","poem","poet","point","polar","pole","police","pond","pony","pool","popular","portion","position","possible","post","potato","pottery","poverty","powder","power","practice","praise","predict","prefer","prepare","present","pretty","prevent","price","pride","primary","print","priority","prison","private","prize","problem","process","produce","profit","program","project","promote","proof","property","prosper","protect","proud","provide","public","pudding","pull","pulp","pulse","pumpkin","punch","pupil","puppy","purchase","purity","purpose","purse","push","put","puzzle","pyramid","quality","quantum","quarter","question","quick","quit","quiz","quote","rabbit","raccoon","race","rack","radar","radio","rail","rain","raise","rally","ramp","ranch","random","range","rapid","rare","rate","rather","raven","raw","razor","ready","real","reason","rebel","rebuild","recall","receive","recipe","record","recycle","reduce","reflect","reform","refuse","region","regret","regular","reject","relax","release","relief","rely","remain","remember","remind","remove","render","renew","rent","reopen","repair","repeat","replace","report","require","rescue","resemble","resist","resource","response","result","retire","retreat","return","reunion","reveal","review","reward","rhythm","rib","ribbon","rice","rich","ride","ridge","rifle","right","rigid","ring","riot","ripple","risk","ritual","rival","river","road","roast","robot","robust","rocket","romance","roof","rookie","room","rose","rotate","rough","round","route","royal","rubber","rude","rug","rule","run","runway","rural","sad","saddle","sadness","safe","sail","salad","salmon","salon","salt","salute","same","sample","sand","satisfy","satoshi","sauce","sausage","save","say","scale","scan","scare","scatter","scene","scheme","school","science","scissors","scorpion","scout","scrap","screen","script","scrub","sea","search","season","seat","second","secret","section","security","seed","seek","segment","select","sell","seminar","senior","sense","sentence","series","service","session","settle","setup","seven","shadow","shaft","shallow","share","shed","shell","sheriff","shield","shift","shine","ship","shiver","shock","shoe","shoot","shop","short","shoulder","shove","shrimp","shrug","shuffle","shy","sibling","sick","side","siege","sight","sign","silent","silk","silly","silver","similar","simple","since","sing","siren","sister","situate","six","size","skate","sketch","ski","skill","skin","skirt","skull","slab","slam","sleep","slender","slice","slide","slight","slim","slogan","slot","slow","slush","small","smart","smile","smoke","smooth","snack","snake","snap","sniff","snow","soap","soccer","social","sock","soda","soft","solar","soldier","solid","solution","solve","someone","song","soon","sorry","sort","soul","sound","soup","source","south","space","spare","spatial","spawn","speak","special","speed","spell","spend","sphere","spice","spider","spike","spin","spirit","split","spoil","sponsor","spoon","sport","spot","spray","spread","spring","spy","square","squeeze","squirrel","stable","stadium","staff","stage","stairs","stamp","stand","start","state","stay","steak","steel","stem","step","stereo","stick","still","sting","stock","stomach","stone","stool","story","stove","strategy","street","strike","strong","struggle","student","stuff","stumble","style","subject","submit","subway","success","such","sudden","suffer","sugar","suggest","suit","summer","sun","sunny","sunset","super","supply","supreme","sure","surface","surge","surprise","surround","survey","suspect","sustain","swallow","swamp","swap","swarm","swear","sweet","swift","swim","swing","switch","sword","symbol","symptom","syrup","system","table","tackle","tag","tail","talent","talk","tank","tape","target","task","taste","tattoo","taxi","teach","team","tell","ten","tenant","tennis","tent","term","test","text","thank","that","theme","then","theory","there","they","thing","this","thought","three","thrive","throw","thumb","thunder","ticket","tide","tiger","tilt","timber","time","tiny","tip","tired","tissue","title","toast","tobacco","today","toddler","toe","together","toilet","token","tomato","tomorrow","tone","tongue","tonight","tool","tooth","top","topic","topple","torch","tornado","tortoise","toss","total","tourist","toward","tower","town","toy","track","trade","traffic","tragic","train","transfer","trap","trash","travel","tray","treat","tree","trend","trial","tribe","trick","trigger","trim","trip","trophy","trouble","truck","true","truly","trumpet","trust","truth","try","tube","tuition","tumble","tuna","tunnel","turkey","turn","turtle","twelve","twenty","twice","twin","twist","two","type","typical","ugly","umbrella","unable","unaware","uncle","uncover","under","undo","unfair","unfold","unhappy","uniform","unique","unit","universe","unknown","unlock","until","unusual","unveil","update","upgrade","uphold","upon","upper","upset","urban","urge","usage","use","used","useful","useless","usual","utility","vacant","vacuum","vague","valid","valley","valve","van","vanish","vapor","various","vast","vault","vehicle","velvet","vendor","venture","venue","verb","verify","version","very","vessel","veteran","viable","vibrant","vicious","victory","video","view","village","vintage","violin","virtual","virus","visa","visit","visual","vital","vivid","vocal","voice","void","volcano","volume","vote","voyage","wage","wagon","wait","walk","wall","walnut","want","warfare","warm","warrior","wash","wasp","waste","water","wave","way","wealth","weapon","wear","weasel","weather","web","wedding","weekend","weird","welcome","west","wet","whale","what","wheat","wheel","when","where","whip","whisper","wide","width","wife","wild","will","win","window","wine","wing","wink","winner","winter","wire","wisdom","wise","wish","witness","wolf","woman","wonder","wood","wool","word","work","world","worry","worth","wrap","wreck","wrestle","wrist","write","wrong","yard","year","yellow","you","young","youth","zebra","zero","zone","zoo"]'
    );

    // make modulo arithmetic work as in math, not as in javascript ;)
    Mnemonic._mod = function (a, b) {
        return a - Math.floor(a / b) * b;
    };

    return Mnemonic;
})();

/**
 * Words to hex converter
 *
 * @param {array} words Array of words to convert to hex
 *
 * @returns {string} Returns hex representation
 */
function wordsToHex(words) {
    return Mnemonic.fromWords(words).toHex();
}

/**
 * Hex to words converter, only supports hex representations of binaries which are multiples of 32 bits
 *
 * @param {string} val Hex representation of the binary one wants to convert
 *
 * @returns {array} Returns the array of words
 */
function hexToWords(val) {
    // Mnemonic.fromHex("0a6deb990a3db22d6ed3010b").toWords()
    return Mnemonic.fromHex(val).toWords();
}

/**
 * Converts bytes (arraybuffer or uint8array) to string with the specified encoding (default utf-8)
 *
 * @param srcBytes
 * @param encoding
 *
 * @returns {*}
 */
function bytesToString(srcBytes, encoding) {
    let tmp_encoding = encoding;
    if (typeof tmp_encoding === "undefined") {
        tmp_encoding = "utf-8";
    }
    return new TextDecoder(tmp_encoding).decode(srcBytes);
}

const converterService = {
    // Conversion functions
    encodeUtf8: encodeUtf8,
    encodeLatin1: encodeLatin1,
    decodeUtf8: decodeUtf8,
    decodeLatin1: decodeLatin1,
    toHex: toHex,
    fromHex: fromHex,
    toBase58: toBase58,
    fromBase58: fromBase58,
    toBaseX: toBaseX,
    fromBaseX: fromBaseX,
    hexToBase58: hexToBase58,
    base58ToHex: base58ToHex,
    uuidToHex: uuidToHex,
    arrayBufferToBase64: arrayBufferToBase64,
    base64ToArrayBuffer: base64ToArrayBuffer,
    base64UrlToArrayBuffer: base64UrlToArrayBuffer ,
    arrayBufferToBase64Url: arrayBufferToBase64Url,
    cborEncode: cborEncode,
    cborDecode: cborDecode,
    hexToUuid: hexToUuid,
    wordsToHex: wordsToHex,
    hexToWords: hexToWords,
    bytesToString: bytesToString,
};

export default converterService;
