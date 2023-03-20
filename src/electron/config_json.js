const fs = require("fs");
let windows
if (process.platform === "win32") {
    windows = require("windows");
}

let config;

function getConfigJsonWindows() {
    if ( typeof config !== 'undefined') {
        return config
    }
    try {
        keyset = windows.registry('HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\3rdparty\\extensions\\eljmjmgjkbmpmfljlmklcfineebidmlo\\policy')
        config = keyset.ConfigJson.value
    } catch (e) {
        config = null;
    }
    return config;
}

function getConfigJsonLinux() {
    if ( typeof config !== 'undefined') {
        return config
    }
    try {
        const buffer = fs.readFileSync("/etc/opt/chrome/policies/managed/psono.json");
        config = buffer.toString();
    } catch (e) {
        config = null;
    }
    return config;
}

function getConfigJsonMacOs() {
    if ( typeof config !== 'undefined') {
        return config
    }
    // TODO implement logic for MacOs
    return config;
}

function get() {
    const isWin = process.platform === "win32";
    const isLinux = process.platform === "linux";
    const isMacOs = process.platform === "darwin";
    if (isWin) {
        return getConfigJsonWindows();
    } else if (isLinux) {
        return getConfigJsonLinux();
    } else if (isMacOs) {
        return getConfigJsonMacOs();
    }
    return config;
}

module.exports = {
    get:get,
};