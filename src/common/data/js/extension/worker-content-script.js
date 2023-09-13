/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScript = function (base, browser, jQuery, setTimeout) {
    "use strict";
    var websitePasswords = [];
    var lastRequestElement = null;
    var dropInstances = [];
    var myForms = [];

    var background_image =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTUiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eTowLjUwMTk2MTsiIGQ9Ik0gMC42OTUzMTIgMy43ODkwNjIgTCAzLjE3NTc4MSA1LjE3OTY4OCBMIDcuNTY2NDA2IDIuNzM0Mzc1IEwgMTEuOTE0MDYyIDUuMTYwMTU2IEwgMTQuMzc4OTA2IDMuODA4NTk0IEwgNy41ODU5MzggMC4wNDY4NzUgWiBNIDAuNjk1MzEyIDMuNzg5MDYyICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDU5LjYwNzg0MyUsODUuNDkwMTk2JSw2OC42Mjc0NTElKTtmaWxsLW9wYWNpdHk6MC41MDE5NjE7IiBkPSJNIDUuMTYwMTU2IDUuODY3MTg4IEwgNy41NzAzMTIgNy4yMTg3NSBMIDkuOTIxODc1IDUuOTUzMTI1IEwgNy41NjY0MDYgNC42NTIzNDQgWiBNIDUuMTYwMTU2IDUuODY3MTg4ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDI5LjAxOTYwOCUsNzUuMjk0MTE4JSw1Ni4wNzg0MzElKTtmaWxsLW9wYWNpdHk6MC41MDE5NjE7IiBkPSJNIDAuNjk1MzEyIDMuNzczNDM4IEwgMC42OTUzMTIgMTEuMjEwOTM4IEwgMy4xNzU3ODEgMTIuNTMxMjUgTCAzLjE5NTMxMiA1LjE3OTY4OCBaIE0gMC42OTUzMTIgMy43NzM0MzggIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMjkuMDE5NjA4JSw3NS4yOTQxMTglLDU2LjA3ODQzMSUpO2ZpbGwtb3BhY2l0eTowLjUwMTk2MTsiIGQ9Ik0gNS4xNzU3ODEgNS44NjcxODggTCA1LjE1NjI1IDguMzA4NTk0IEwgNy41NjY0MDYgOS41OTM3NSBMIDkuOTM3NSA4LjI3NzM0NCBMIDkuOTM3NSA1Ljk5MjE4OCBMIDcuNTg1OTM4IDcuMjM4MjgxIFogTSA1LjE3NTc4MSA1Ljg2NzE4OCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOnJnYigyOS4wMTk2MDglLDc1LjI5NDExOCUsNTYuMDc4NDMxJSk7ZmlsbC1vcGFjaXR5OjAuNTAxOTYxOyIgZD0iTSAxMS44OTg0MzggNS4xNzk2ODggTCAxMS45MTQwNjIgOS4xMTcxODggTCA3LjU2NjQwNiAxMS40ODgyODEgTCA1LjE3NTc4MSAxMC4yNDIxODggTCA1LjE3NTc4MSAxMy42MzI4MTIgTCA3LjU0Njg3NSAxNC45NTMxMjUgTCAxNC40MTc5NjkgMTEuMjA3MDMxIEwgMTQuMzc4OTA2IDMuODM5ODQ0IFogTSAxMS44OTg0MzggNS4xNzk2ODggIi8+CjwvZz4KPC9zdmc+Cg==";
    var background_image_hover =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTUiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSAwLjY5NTMxMiAzLjc4OTA2MiBMIDMuMTc1NzgxIDUuMTc5Njg4IEwgNy41NjY0MDYgMi43MzQzNzUgTCAxMS45MTQwNjIgNS4xNjAxNTYgTCAxNC4zNzg5MDYgMy44MDg1OTQgTCA3LjU4NTkzOCAwLjA0Njg3NSBaIE0gMC42OTUzMTIgMy43ODkwNjIgIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA1LjE2MDE1NiA1Ljg2NzE4OCBMIDcuNTcwMzEyIDcuMjE4NzUgTCA5LjkyMTg3NSA1Ljk1MzEyNSBMIDcuNTY2NDA2IDQuNjUyMzQ0IFogTSA1LjE2MDE1NiA1Ljg2NzE4OCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOnJnYigyOS4wMTk2MDglLDc1LjI5NDExOCUsNTYuMDc4NDMxJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDAuNjk1MzEyIDMuNzczNDM4IEwgMC42OTUzMTIgMTEuMjEwOTM4IEwgMy4xNzU3ODEgMTIuNTMxMjUgTCAzLjE5NTMxMiA1LjE3OTY4OCBaIE0gMC42OTUzMTIgMy43NzM0MzggIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMjkuMDE5NjA4JSw3NS4yOTQxMTglLDU2LjA3ODQzMSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA1LjE3NTc4MSA1Ljg2NzE4OCBMIDUuMTU2MjUgOC4zMDg1OTQgTCA3LjU2NjQwNiA5LjU5Mzc1IEwgOS45Mzc1IDguMjc3MzQ0IEwgOS45Mzc1IDUuOTkyMTg4IEwgNy41ODU5MzggNy4yMzgyODEgWiBNIDUuMTc1NzgxIDUuODY3MTg4ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDI5LjAxOTYwOCUsNzUuMjk0MTE4JSw1Ni4wNzg0MzElKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMTEuODk4NDM4IDUuMTc5Njg4IEwgMTEuOTE0MDYyIDkuMTE3MTg4IEwgNy41NjY0MDYgMTEuNDg4MjgxIEwgNS4xNzU3ODEgMTAuMjQyMTg4IEwgNS4xNzU3ODEgMTMuNjMyODEyIEwgNy41NDY4NzUgMTQuOTUzMTI1IEwgMTQuNDE3OTY5IDExLjIwNzAzMSBMIDE0LjM3ODkwNiAzLjgzOTg0NCBaIE0gMTEuODk4NDM4IDUuMTc5Njg4ICIvPgo8L2c+Cjwvc3ZnPgo=";

    jQuery(function () {
        activate();
    });

    function activate() {
        base.on("fillpassword", on_fillpassword);
        base.on("website-password-update", on_website_password_update);
        base.on("return-secret", on_return_secret);
        base.on("secrets-changed", on_secrets_changed);
        base.on("get-username", on_get_username);

        jQuery(function () {
            var i;
            // Tell our backend, that we are ready and waiting for instructions
            base.emit("ready", document.location.toString());
            base.emit("website-password-refresh", document.location.toString());

            var documents = [];
            var windows = [];

            base.get_all_documents(window, documents, windows);

            for (i = 0; i < documents.length; i++) {
                load_css(documents[i]);
            }

            base.register_observer(analyze_document);
        });
    }

    /**
     * Analyse a document and adds all forms and handlers to them
     *
     * @param document
     */
    function analyze_document(document) {
        add_form_buttons(document);
        document_submit_catcher(document);
    }

    /**
     * Register the submit catcher with all forms that have one password field
     *
     * @param document
     */
    function document_submit_catcher(document) {
        for (var i = 0; i < document.forms.length; i++) {
            form_submit_catcher(document.forms[i]);
        }
    }

    /**
     * Sanitizes some text and returns proper html escaped text
     *
     * @param unsaveText
     * @returns {string}
     */
    function sanitizeText(unsaveText) {
        var element = document.createElement('div');
        element.innerText = unsaveText;
        return element.innerHTML;
    }

    /**
     * Register the submit catcher if the given form has exactly one password field
     *
     * @param form
     */
    function form_submit_catcher(form) {
        var password_fields = form.querySelectorAll("input[type='password']");
        if (password_fields.length !== 1) {
            return;
        }

        if (form.classList.contains("psono-form_submit_catcher-covered")) {
            return;
        }
        form.classList.add("psono-form_submit_catcher-covered");

        form.addEventListener("submit", function (event) {
            var form = this;
            var form_data = get_username_and_password(form);
            if (form_data) {
                base.emit("login-form-submit", get_username_and_password(form));
            }
        });
    }

    /**
     * Analyse a form and returns the username and password
     *
     * @param form
     * @returns {{username: string, password: string}}
     */
    function get_username_and_password(form) {
        var fields = form.querySelectorAll("input[type='text'], input[type='email'], input[type='password']");

        var username = "";
        var password = "";
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].type === "") {
                continue;
            }
            if (fields[i].style.display === "none") {
                continue;
            }

            if (fields[i].type === "password") {
                password = fields[i].value;
                break;
            }
            username = fields[i].value;
        }
        if (username !== "" && password !== "") {
            return {
                username: username,
                password: password,
            };
        }
    }

    /**
     * Manipulates the forms of all documents
     *
     * @param document
     */
    function add_form_buttons(document) {
        var padding_right;

        // Lets start with searching all input fields and forms
        // if we find a password field, we remember that and take the field before as username field

        var inputs = document.querySelectorAll(
            "input[type='text'], input:not([type]), input[type='email'], input[type='password']"
        );

        for (var i = 0; i < inputs.length; ++i) {
            if (inputs[i].type !== "password") {
                continue;
            }

            if (inputs[i].classList.contains("psono-add_form_buttons-covered")) {
                continue;
            }

            inputs[i].classList.add("psono-add_form_buttons-covered");

            // found a password field, lets start the magic

            var newForm = {
                username: null,
                password: null,
                form: null,
            };

            for (var r = i - 1; r > -1; r--) {
                if (inputs[r].type === "password") continue;
                if (inputs[r].style.display === "none") continue;

                if (inputs[i].hasOwnProperty('checkVisibility') && inputs[i].checkVisibility() && inputs[r].offsetWidth < 90) continue; // we don't modify input fields that are too small if they are visible

                // username field is inputs[r]
                padding_right = jQuery(inputs[r]).css("padding-right");
                base.modify_input_field(
                    inputs[r],
                    background_image,
                    "center right " + padding_right,
                    document,
                    click,
                    mouseOver,
                    mouseOut,
                    mouseMove
                );

                newForm.username = inputs[r];
                break;
            }

            if (!inputs[i].hasOwnProperty('checkVisibility') || !inputs[i].checkVisibility() || inputs[i].offsetWidth >= 90) {
                // we don't modify input fields that are too small (offsetWidth is only proper calculated if the field is visible)
                // Password field is inputs[i]
                padding_right = jQuery(inputs[i]).css("padding-right");
                base.modify_input_field(
                    inputs[i],
                    background_image,
                    "center right " + padding_right,
                    document,
                    click,
                    mouseOver,
                    mouseOut,
                    mouseMove
                );
            }
            newForm.password = inputs[i];

            var parent = inputs[i].parentElement;

            while (parent.nodeName !== "FORM" && parent.parentNode) {
                parent = parent.parentNode;
            }

            if (parent.nodeName === "FORM") {
                //parent is surrounding form
                //parent.style.backgroundColor = "green";
                newForm.form = parent;
                //parent.submit();
            }
            if (newForm.username !== null || newForm.password !== null) {
                myForms.push(newForm);
            }
        }
    }

    /**
     * Loads the necessary content script css into the provided document
     *
     * @param document
     */
    function load_css(document) {
        // taken from https://stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript
        var cssId = "psono-css"; // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId)) {
            var head = document.getElementsByTagName("head")[0];
            var link = document.createElement("link");
            link.id = cssId;
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = browser.runtime.getURL("data/css/contentscript.css");
            link.media = "all";
            head.appendChild(link);
        }
    }
    /**
     * called within an event in a input field. Used to measure the distance from the right border of the input
     * element and the mouse at the moment of the click
     *
     * @param evt event
     * @param target The target that this event was bound to
     * @returns {number} Distance
     */
    function getDistance(evt, target) {
        return (
            jQuery(target).width() -
            evt.pageX +
            target.getBoundingClientRect().left +
            (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft)
        );
    }

    /**
     * triggered once the mouse is over the input field. Used to set the background to the hover image
     *
     * @param evt Mouse over event
     * @param target The original element that this event was bound to
     */
    function mouseOver(evt, target) {
        evt.target.style.setProperty("background-image", 'url("' + background_image_hover + '")', "important");
    }

    /**
     * triggered once the mouse leaves the input field. Used to set the background to the normal image
     *
     * @param evt Mouse out event
     * @param target The original element that this event was bound to
     */
    function mouseOut(evt, target) {
        evt.target.style.setProperty("background-image", 'url("' + background_image + '")', "important");
    }

    /**
     * triggered when the mouse moves in the input field. Used to adjust the mouse cursor according to the distance
     * to the right border
     *
     * @param evt Mouse move event
     * @param target The original element that this event was bound to
     */
    function mouseMove(evt, target) {
        if (getDistance(evt, target) < 30) {
            evt.target.style.setProperty("cursor", "pointer", "important");
        } else {
            evt.target.style.setProperty("cursor", "auto", "important");
        }
    }

    /**
     * Requests the password from the backend
     *
     * @param secret_id
     */
    function requestSecret(secret_id) {
        base.emit("request-secret", {
            url: document.location.toString(),
            secret_id: secret_id,
        });
    }

    /**
     * Opens the datastore
     */
    function open_datastore() {
        base.emit("open-tab", {
            url: "/data/index.html",
        });
    }

    /**
     * Searches the fields for a username field that is not empty and will return its value. Otherwise it returns an
     * empty string
     *
     * @returns {string}
     */
    function find_username() {
        var username = '';
        for (var i = 0; i < myForms.length; i++) {
            if (!myForms[i].username || !myForms[i].username.value) {
                continue
            }
            username = myForms[i].username.value;
            break
        }
        return username;
    }

    /**
     * Generates a password for the current page. Will try to find the username too.
     */
    function generate_password() {
        base.emit("generate-password", {
            url: document.location.toString(),
            username: find_username(),
        });
    }

    // /**
    //  * closes dropinstances if a click outside of a dropinstance happens.
    //  *
    //  * @param event
    //  */
    // function close (event) {
    //     for (var i = dropInstances.length - 1; i >= 0; i--) {
    //         if(dropInstances[i].drop.contains(event.target)) {
    //             continue;
    //         }
    //         dropInstances[i].close();
    //         dropInstances.splice(i, 1);
    //     }
    //     if (dropInstances.length > 0) {
    //         jQuery(window).one("click", close);
    //     }
    // }

    /**
     * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
     * once a click happens outside of the dropdown menu
     *
     * @param evt Click event
     * @param target The original element that this event was bound to
     * @param document The document the click occurred in
     */
    function click(evt, target, document) {
        if (getDistance(evt, target) < 30) {
            var openDatastoreClass = "psono_open-datastore-" + uuid.v4();
            var generatePasswordClass = "psono_generate-password-" + uuid.v4();
            var requestSecretClasses = [];

            var dropcontent = "";
            dropcontent += '<div class="psono-pw-drop-content-inner">';
            dropcontent += '<ul class="navigations">';
            dropcontent +=
                '<li><div class="' + openDatastoreClass + '" style="cursor: pointer;">Open Datastore</div></li>';
            if (websitePasswords.length < 1) {
                dropcontent +=
                    '<li><div class="' + generatePasswordClass + '" style="cursor: pointer;">Generate Password</div></li>';
            }
            for (var i = 0; i < websitePasswords.length; i++) {

                var sanitizedText = sanitizeText(websitePasswords[i].name)
                var requestSecretClass = "psono_request-secret-" + uuid.v4();

                dropcontent +=
                    '<li><div class="' +
                    requestSecretClass +
                    '" style="cursor: pointer;"">' +
                    sanitizedText +
                    "</div></li>";
                requestSecretClasses.push({'class': requestSecretClass, 'secret_id': websitePasswords[i].secret_id});
            }
            dropcontent += "</ul>";
            dropcontent += "</div>";

            lastRequestElement = evt.target;

            var dropInstance = create_dropdown_menu(evt, dropcontent, document);
            dropInstance.open();

            dropInstances.push(dropInstance);

            setTimeout(function () {
                var element = dropInstance.getElement();

                jQuery(element.getElementsByClassName(openDatastoreClass)).on("click", function () {
                    open_datastore();
                });

                jQuery(element.getElementsByClassName(generatePasswordClass)).on("click", function () {
                    generate_password();
                });

                for (var i = 0; i < requestSecretClasses.length; i++) {
                    (function(className, secretId) {
                        jQuery(element.getElementsByClassName(className)).on("click", function () {
                            requestSecret(secretId);
                        });
                    })(requestSecretClasses[i]['class'], requestSecretClasses[i]['secret_id'])

                }
            }, 0);
        }
    }

    /**
     * Creates the dropdown menu
     *
     * @param setup_event
     * @param content
     * @param document
     * @returns {{open: open, close: close}}
     */
    function create_dropdown_menu(setup_event, content, document) {
        var position = jQuery(setup_event.target).offset();
        var height = jQuery(setup_event.target).outerHeight();

        var element_id = "psono_drop-" + uuid.v4();

        var element = jQuery(
            "" +
                '<div id="' +
                element_id +
                '" class="psono-pw-drop yui3-cssreset" style="' +
                "     transform: translateX(" +
                position.left +
                "px) translateY(" +
                (position.top + height) +
                'px) translateZ(0px) !important;">' +
                '    <div class="psono-pw-drop-content">' +
                "        " +
                content +
                "    </div>" +
                "</div>"
        );

        document.onclick = function (event) {
            if (event.target !== setup_event.target) {
                var dropdowns = document.getElementsByClassName("psono-pw-drop");
                for (var i = dropdowns.length - 1; i >= 0; i--) {
                    dropdowns[i].remove();
                }
            }
        };

        function open() {
            element.appendTo(document.body);
        }

        function close() {
            element.remove();
        }

        function getElement() {
            return document.getElementById(element_id);
        }

        return {
            open: open,
            close: close,
            getElement: getElement,
        };
    }
    // Messaging functions below

    /**
     * Handler for a fillpassword event
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function on_fillpassword(data, sender, sendResponse) {
        var fill_field_helper = function (field, value) {
            jQuery(field).focus();
            field.value = value;
            jQuery(field).blur();
            jQuery(field).keydown();
            jQuery(field).keyup();
            jQuery(field).change();
        };

        for (var i = 0; i < myForms.length; i++) {
            if (data.hasOwnProperty("username") && data.username !== "") {
                fill_field_helper(myForms[i].username, data.username);
            }
            if (data.hasOwnProperty("password") && data.password !== "") {
                fill_field_helper(myForms[i].password, data.password);
            }
            if (
                myForms.length === 1 && //only 1 form
                myForms[i].form !== null && //we found the form
                data.hasOwnProperty("submit") &&
                data.submit && //https website
                data.hasOwnProperty("auto_submit") &&
                data.auto_submit //auto submit checked in settings
            ) {
                const myForm = myForms[i];
                setTimeout(function(){
                    myForm.form.submit();
                }, 1000);
            }
        }
    }

    /**
     * handles password update events
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function on_website_password_update(data, sender, sendResponse) {
        websitePasswords = data;
    }

    /**
     * handles password request answer
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function on_return_secret(data, sender, sendResponse) {
        var fill_field_helper = function (field, value) {
            if (field === null) {
                return;
            }
            if (typeof value === "undefined" || value === "") {
                return;
            }

            // trigger click event
            var clickEvent = new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            field.dispatchEvent(clickEvent);

            // fill value
            field.value = value;

            // trigger 'input' event
            const inputEvent = new Event("input", { bubbles: true });
            field.dispatchEvent(inputEvent);

            // jQuery event triggering is not working for angular apps
            if ("createEvent" in document) {
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                field.dispatchEvent(evt);
            } else {
                field.fireEvent("onchange");
            }
        };

        for (var i = 0; i < myForms.length; i++) {
            if (
                (myForms[i].username && myForms[i].username.isEqualNode(lastRequestElement)) ||
                (myForms[i].password && myForms[i].password.isEqualNode(lastRequestElement))
            ) {
                fill_field_helper(myForms[i].username, data.website_password_username);
                fill_field_helper(myForms[i].password, data.website_password_password);

                for (var ii = 0; ii < dropInstances.length; ii++) {
                    dropInstances[ii].close();
                }
                dropInstances = [];
                break;
            }
        }
    }

    /**
     * handles secret changed requests
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function on_secrets_changed(data, sender, sendResponse) {
        base.emit("website-password-refresh", document.location.toString());
    }

    /**
     * handles the request from the background script, when it asks for the username
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function on_get_username(data, sender, sendResponse) {
        sendResponse({
            'username': find_username(),
        });
    }
};
