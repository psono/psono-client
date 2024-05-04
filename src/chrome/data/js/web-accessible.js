(function (setTimeout) {
    "use strict";

    // we don't wrap Psono in ready so that it's loaded faster before any potential authentication attempt
    ClassWebAccessibleFido2()
})(setTimeout);