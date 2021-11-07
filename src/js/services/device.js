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
 * Returns weather we have an IE or not
 *
 * @returns {boolean} Is this an IE user
 */
function isIe() {
    return clientJs.isIE();
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
 * Returns weather we have a Firefox or not
 *
 * @returns {boolean} Is this an Firefox user
 */
function isFirefox() {
    return clientJs.isFirefox();
}

/**
 * Returns weather we have a Safari or not
 *
 * @returns {boolean} Is this an Safari user
 */
function isSafari() {
    return clientJs.isSafari();
}

/**
 * Returns weather we have a Opera or not
 *
 * @returns {boolean} Is this an Opera user
 */
function isOpera() {
    return clientJs.isOpera();
}

/**
 * Generates the Device description out of the Vendor, OS, Version and others
 *
 * @returns {string} Returns the device's description
 */
function getDeviceDescription() {
    var description = "";
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

const service = {
    getDeviceFingerprint: getDeviceFingerprint,
    isMobileAndroid: isMobileAndroid,
    isMobileIos: isMobileIos,
    isMobile: isMobile,
    isIe: isIe,
    isChrome: isChrome,
    isFirefox: isFirefox,
    isSafari: isSafari,
    isOpera: isOpera,
    getDeviceDescription: getDeviceDescription,
};
export default service;
