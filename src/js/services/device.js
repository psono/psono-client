/**
 * Service with some device functions that do not fit anywhere else
 */
import { ClientJS } from "clientjs";
import cryptoLibrary from "./crypto-library";
import action from "../actions/bound-action-creators";

import store from "./store";

let fingerprint;
const clientJs = new ClientJS();

/**
 * Returns the device fingerprint
 *
 * @returns {string} Fingerprint of the device
 */
function getDeviceFingerprint() {
    if (fingerprint == null) {
        fingerprint = store.getState().persistent.fingerprint;
        if (fingerprint == null) {
            fingerprint = cryptoLibrary.generateUuid();
            action.setFingerprint(fingerprint);
        }
    }

    return fingerprint;
}

/**
 * Returns weather we are supposed to show a title bar
 *
 * @returns {boolean} Is this an electron app
 */
function hasTitlebar() {
    return isElectron() && (isWindows() || isMac());
}

/**
 * Returns weather we have an electron app
 *
 * @returns {boolean} Is this an electron app
 */
function isElectron() {
    return TARGET === 'electron';
}

/**
 * Returns weather we have a webclient (no electron app
 *
 * @returns {boolean} Is this a webclient
 */
function isWebclient() {
    return TARGET === 'chrome' || TARGET === 'firefox';
}

/**
 * Returns weather we have a windows machine
 *
 * @returns {boolean} Is this a windows device
 */
function isWindows() {
    return clientJs.isWindows()
}

/**
 * Returns weather we have a mac
 *
 * @returns {boolean} Is this a mac device
 */
function isMac() {
    return clientJs.isMac()
}

/**
 * Returns weather we have a linux device
 *
 * @returns {boolean} Is this a linux device
 */
function isLinux() {
    return clientJs.isLinux()
}

/**
 * Returns weather we have an android device or not
 *
 * @returns {boolean} Is this an android device
 */
function isMobileAndroid() {
    return clientJs.isMobileAndroid();
}

/**
 * Returns weather we have an ios device or not
 *
 * @returns {boolean} Is this an ios device
 */
function isMobileIos() {
    return clientJs.isMobileIOS();
}

/**
 * Returns weather we have an ios device or not
 *
 * @returns {boolean} Is this an ios device
 */
function isMobile() {
    return clientJs.isMobile();
}

/**
 * Returns weather we have a Chrome or not
 *
 * @returns {boolean} Is this an Chrome user
 */
function isChrome() {
    return clientJs.isChrome();
}

/**
 * Returns weather we have a Chrome or not
 *
 * @returns {boolean} Is this an Chrome user
 */
function isSafari() {
    return clientJs.isSafari();
}

/**
 * Returns weather we have a Firefox or not
 *
 * @returns {boolean} Is this an Firefox user
 */
function isFirefox() {
    return clientJs.isFirefox();
}

/**
 * Generates the Device description out of the Vendor, OS, Version and others
 *
 * @returns {string} Returns the device's description
 */
function getDeviceDescription() {
    let description = "";
    if (typeof clientJs.getDeviceVendor() !== "undefined") {
        description = description + clientJs.getDeviceVendor() + " ";
    }
    if (typeof clientJs.getDevice() !== "undefined") {
        description = description + clientJs.getDevice() + " ";
    }
    if (typeof clientJs.getOS() !== "undefined") {
        description = description + clientJs.getOS() + " ";
    }
    if (typeof clientJs.getOSVersion() !== "undefined") {
        description = description + clientJs.getOSVersion() + " ";
    }
    if (typeof clientJs.getBrowser() !== "undefined") {
        description = description + clientJs.getBrowser() + " ";
    }
    if (typeof clientJs.getBrowserVersion() !== "undefined") {
        description = description + clientJs.getBrowserVersion() + " ";
    }
    return description;
}

const deviceService = {
    getDeviceFingerprint: getDeviceFingerprint,
    hasTitlebar: hasTitlebar,
    isElectron: isElectron,
    isWebclient: isWebclient,
    isWindows: isWindows,
    isLinux: isLinux,
    isMac: isMac,
    isMobileAndroid: isMobileAndroid,
    isMobileIos: isMobileIos,
    isMobile: isMobile,
    isChrome: isChrome,
    isSafari: isSafari,
    isFirefox: isFirefox,
    getDeviceDescription: getDeviceDescription,
};
export default deviceService;
