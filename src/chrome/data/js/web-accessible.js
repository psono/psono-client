(function (setTimeout) {
    "use strict";

    // we don't wrap Psono in ready so that it's loaded faster before any potential authentication attempt
    if (typeof ClassWebAccessibleFido2 === 'function') {
        ClassWebAccessibleFido2();
    }
})(setTimeout);