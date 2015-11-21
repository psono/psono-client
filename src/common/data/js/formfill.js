/*
 * The content script loaded in every page
 */

(function(port) {

    /**
     * The minimal browser client for form fills
     *
     * @returns {{emit: emit, on: on}}
     */
    var browserClient = function() {

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            port.emit(event, data);
        };

        /**
         * registers for an event with a function
         *
         * @param event
         * @param myFunction
         *
         * @returns {boolean}
         */
        var on = function (event, myFunction) {
            port.on(event, myFunction);
        };

        return {
            emit: emit,
            on: on
        };
    };

    var main = function() {
        var inputs = document.querySelectorAll("input:not(:disabled):not([readonly]):not([type=hidden])");

        var myForms = [];

        for (var i = 0; i < inputs.length; ++i) {
            if (inputs[i].type == 'password') {

                var newForm = {
                    username: null,
                    password: null,
                    form: null
                };

                for (var r = i - 1; r > -1; r--) {
                    if (inputs[r].type == 'password')
                        continue;
                    if (inputs[r].style.display == 'none')
                        continue;

                    // username field is inputs[r]
                    inputs[r].style.backgroundColor = "blue";
                    inputs[r].value="myUsername";
                    newForm.username = inputs[r];
                    break;
                }

                // Password field is inputs[i]
                inputs[i].style.backgroundColor = "yellow";
                inputs[i].value="myPassword";

                newForm.password = inputs[i];

                var parent = inputs[i].parentElement;

                while (parent.nodeName !== "FORM" && parent.parentNode) {
                    parent = parent.parentNode;
                }

                if (parent.nodeName == "FORM") {
                    //parent is surrounding form
                    parent.style.backgroundColor = "green";
                    newForm.form = parent;
                    //parent.submit();
                }
                if (newForm.username !== null || newForm.password !== null) {
                    myForms.push(newForm);
                }
            }
        }

        //if (myForms.length > 0) {
            var bc = browserClient();
            bc.emit('test', document.location.toString());
        //}
    };

    main();

})(self.port);