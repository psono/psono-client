/*
 * The content script worker loaded in every page
 */

const ClassWorkerContentScript = function (base, browser, jQuery, setTimeout) {
    "use strict";
    let lastRequestElement = null;
    let fillAll = false;
    let nextFillAllIndex = 0;
    let dropInstances = [];
    let myForms = [];
    let creditCardInputFields = [];
    let identityInputFields = [];
    let lastCloseTime = 0;

    let backgroundImage =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTUiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eTowLjUwMTk2MTsiIGQ9Ik0gMC42OTUzMTIgMy43ODkwNjIgTCAzLjE3NTc4MSA1LjE3OTY4OCBMIDcuNTY2NDA2IDIuNzM0Mzc1IEwgMTEuOTE0MDYyIDUuMTYwMTU2IEwgMTQuMzc4OTA2IDMuODA4NTk0IEwgNy41ODU5MzggMC4wNDY4NzUgWiBNIDAuNjk1MzEyIDMuNzg5MDYyICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDU5LjYwNzg0MyUsODUuNDkwMTk2JSw2OC42Mjc0NTElKTtmaWxsLW9wYWNpdHk6MC41MDE5NjE7IiBkPSJNIDUuMTYwMTU2IDUuODY3MTg4IEwgNy41NzAzMTIgNy4yMTg3NSBMIDkuOTIxODc1IDUuOTUzMTI1IEwgNy41NjY0MDYgNC42NTIzNDQgWiBNIDUuMTYwMTU2IDUuODY3MTg4ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDI5LjAxOTYwOCUsNzUuMjk0MTE4JSw1Ni4wNzg0MzElKTtmaWxsLW9wYWNpdHk6MC41MDE5NjE7IiBkPSJNIDAuNjk1MzEyIDMuNzczNDM4IEwgMC42OTUzMTIgMTEuMjEwOTM4IEwgMy4xNzU3ODEgMTIuNTMxMjUgTCAzLjE5NTMxMiA1LjE3OTY4OCBaIE0gMC42OTUzMTIgMy43NzM0MzggIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMjkuMDE5NjA4JSw3NS4yOTQxMTglLDU2LjA3ODQzMSUpO2ZpbGwtb3BhY2l0eTowLjUwMTk2MTsiIGQ9Ik0gNS4xNzU3ODEgNS44NjcxODggTCA1LjE1NjI1IDguMzA4NTk0IEwgNy41NjY0MDYgOS41OTM3NSBMIDkuOTM3NSA4LjI3NzM0NCBMIDkuOTM3NSA1Ljk5MjE4OCBMIDcuNTg1OTM4IDcuMjM4MjgxIFogTSA1LjE3NTc4MSA1Ljg2NzE4OCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOnJnYigyOS4wMTk2MDglLDc1LjI5NDExOCUsNTYuMDc4NDMxJSk7ZmlsbC1vcGFjaXR5OjAuNTAxOTYxOyIgZD0iTSAxMS44OTg0MzggNS4xNzk2ODggTCAxMS45MTQwNjIgOS4xMTcxODggTCA3LjU2NjQwNiAxMS40ODgyODEgTCA1LjE3NTc4MSAxMC4yNDIxODggTCA1LjE3NTc4MSAxMy42MzI4MTIgTCA3LjU0Njg3NSAxNC45NTMxMjUgTCAxNC40MTc5NjkgMTEuMjA3MDMxIEwgMTQuMzc4OTA2IDMuODM5ODQ0IFogTSAxMS44OTg0MzggNS4xNzk2ODggIi8+CjwvZz4KPC9zdmc+Cg==";
    let backgroundImageHover =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTUiIHZlcnNpb249IjEuMSI+CjxnIGlkPSJzdXJmYWNlMSI+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSAwLjY5NTMxMiAzLjc4OTA2MiBMIDMuMTc1NzgxIDUuMTc5Njg4IEwgNy41NjY0MDYgMi43MzQzNzUgTCAxMS45MTQwNjIgNS4xNjAxNTYgTCAxNC4zNzg5MDYgMy44MDg1OTQgTCA3LjU4NTkzOCAwLjA0Njg3NSBaIE0gMC42OTUzMTIgMy43ODkwNjIgIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoNTkuNjA3ODQzJSw4NS40OTAxOTYlLDY4LjYyNzQ1MSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA1LjE2MDE1NiA1Ljg2NzE4OCBMIDcuNTcwMzEyIDcuMjE4NzUgTCA5LjkyMTg3NSA1Ljk1MzEyNSBMIDcuNTY2NDA2IDQuNjUyMzQ0IFogTSA1LjE2MDE1NiA1Ljg2NzE4OCAiLz4KPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOnJnYigyOS4wMTk2MDglLDc1LjI5NDExOCUsNTYuMDc4NDMxJSk7ZmlsbC1vcGFjaXR5OjE7IiBkPSJNIDAuNjk1MzEyIDMuNzczNDM4IEwgMC42OTUzMTIgMTEuMjEwOTM4IEwgMy4xNzU3ODEgMTIuNTMxMjUgTCAzLjE5NTMxMiA1LjE3OTY4OCBaIE0gMC42OTUzMTIgMy43NzM0MzggIi8+CjxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMjkuMDE5NjA4JSw3NS4yOTQxMTglLDU2LjA3ODQzMSUpO2ZpbGwtb3BhY2l0eToxOyIgZD0iTSA1LjE3NTc4MSA1Ljg2NzE4OCBMIDUuMTU2MjUgOC4zMDg1OTQgTCA3LjU2NjQwNiA5LjU5Mzc1IEwgOS45Mzc1IDguMjc3MzQ0IEwgOS45Mzc1IDUuOTkyMTg4IEwgNy41ODU5MzggNy4yMzgyODEgWiBNIDUuMTc1NzgxIDUuODY3MTg4ICIvPgo8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDI5LjAxOTYwOCUsNzUuMjk0MTE4JSw1Ni4wNzg0MzElKTtmaWxsLW9wYWNpdHk6MTsiIGQ9Ik0gMTEuODk4NDM4IDUuMTc5Njg4IEwgMTEuOTE0MDYyIDkuMTE3MTg4IEwgNy41NjY0MDYgMTEuNDg4MjgxIEwgNS4xNzU3ODEgMTAuMjQyMTg4IEwgNS4xNzU3ODEgMTMuNjMyODEyIEwgNy41NDY4NzUgMTQuOTUzMTI1IEwgMTQuNDE3OTY5IDExLjIwNzAzMSBMIDE0LjM3ODkwNiAzLjgzOTg0NCBaIE0gMTEuODk4NDM4IDUuMTc5Njg4ICIvPgo8L2c+Cjwvc3ZnPgo=";


    const passwordSubmitButtonLabels = new Set([
        "change",
        "change password",
        "continue",
        "log in",
        "save",
        "save password",
        "submit",
        "sign in",
        "go",
        "login",
        "update password",
        "next",

        "cambiar contraseña", // Spanish: change password
        "passwort ändern", // German: change password
        "changer le mot de passe", // French: change password
        "cambia password", // Italian: change password
        "mudar senha", // Portuguese: change password
        "wachtwoord wijzigen", // Dutch: change password

        "enviar", // Spanish: submit
        "einreichen", // German: submit
        "soumettre", // French: submit
        "inviare", // Italian: submit
        "enviar", // Portuguese: submit
        "indienen", // Dutch: submit

        "siguiente", // Spanish: next
        "nächster", // German: next
        "suivant", // French: next
        "prossimo", // Italian: next
        "próximo", // Portuguese: next
        "volgende", // Dutch: next

        "continuar", // Spanish: continue
        "fortsetzen", // German: continue
        "continuer", // French: continue
        "continuare", // Italian: continue
        "continuar", // Portuguese: continue
        "doorgaan", // Dutch: continue

        "iniciar sesión", // Spanish: log in
        "einloggen", // German: log in
        "se connecter", // French: log in
        "accedere", // Italian: log in
        "entrar", // Portuguese: log in
        "inloggen", // Dutch: log in

        "guardar contraseña", // Spanish: save password
        "passwort speichern", // German: save password
        "sauvegarder le mot de passe", // French: save password
        "salva password", // Italian: save password
        "salvar senha", // Portuguese: save password
        "wachtwoord opslaan", // Dutch: save password

        "inicio de sesión", // Spanish: login
        "Login", // German: login
        "connexion", // French: login
        "login", // Italian: login
        "login", // Portuguese: login
        "login", // Dutch: login

        "registrarse", // Spanish: sign in
        "anmelden", // German: sign in
        "s'inscrire", // French: sign in
        "registrarsi", // Italian: sign in
        "inscrever-se", // Portuguese: sign in
        "aanmelden", // Dutch: sign in

        "ir", // Spanish: go
        "gehen", // German: go
        "aller", // French: go
        "andare", // Italian: go
        "ir", // Portuguese: go
        "gaan", // Dutch: go

        "actualizar contraseña", // Spanish: update password
        "passwort aktualisieren", // German: update password
        "mettre à jour le mot de passe", // French: update password
        "aggiorna password", // Italian: update password
        "atualizar senha", // Portuguese: update password
        "wachtwoord bijwerken", // Dutch: update password

        "guardar", // Spanish: save
        "speichern", // German: save
        "sauvegarder", // French: save
        "salvare", // Italian: save
        "salvar", // Portuguese: save
        "opslaan", // Dutch: save

        "cambiar", // Spanish: change
        "ändern", // German: change
        "changer", // French: change
        "cambiare", // Italian: change
        "mudar", // Portuguese: change
        "wijzigen", // Dutch: change
    ]);

    // https://web.dev/learn/forms/payment#help_users_enter_their_payment_details
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
    const creditCardNameFields = new Set([
        "cc-name",
    ]);
    const creditCardNumberFields = new Set([
        "cc-number",
    ]);
    const creditCardCSCFields = new Set([
        "cc-csc",
    ]);
    const creditCardExpiryDateFields = new Set([
        "cc-exp",
    ]);
    const creditCardExpiryDateMonthFields = new Set([
        "cc-exp-month",
    ]);
    const creditCardExpiryDateYearFields = new Set([
        "cc-exp-year",
    ]);

    const creditCardAllFields = new Set([
        ...creditCardNameFields,
        ...creditCardNumberFields,
        ...creditCardCSCFields,
        ...creditCardExpiryDateFields,
        ...creditCardExpiryDateMonthFields,
        ...creditCardExpiryDateYearFields,
    ]);

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
    const usernameFields = new Set([
        "username",
        "email", // not really a username yet may be missused
    ]);
    const newPasswordFields = new Set([
        "new-password",
    ]);
    const currentPasswordFields = new Set([
        "current-password",
    ]);
    const identityAllFields = new Set([
        ...usernameFields,
        ...newPasswordFields,
        ...currentPasswordFields,
    ]);


    jQuery(function () {
        activate();
    });

    function activate() {
        base.on("fillpassword", onFillPassword);
        base.on("fillcreditcard", onFillCreditCard);
        base.on("return-secret", onReturnSecret);
        base.on("get-username", onGetUsername);

        jQuery(function () {
            let i;
            // Tell our backend, that we are ready and waiting for instructions
            base.emit("ready", document.location.toString());

            let documents = [];
            let windows = [];

            base.get_all_documents(window, documents, windows);

            for (i = 0; i < documents.length; i++) {
                loadCss(documents[i]);
            }

            base.register_observer(analyzeDocument);
        });


        document.onkeyup = function(e) {
            if (e.ctrlKey && e.shiftKey && e.code === "KeyL") {
                //Ctrl + Shift + L
                base.emit("website-password-refresh", document.location.toString(), async (response) => {
                    fillAll=true;
                    requestSecret(response.data[nextFillAllIndex % response.data.length].secret_id)
                    nextFillAllIndex = nextFillAllIndex + 1
                })
            }
        };
    }

    /**
     * Analyse a document and adds all forms and handlers to them
     *
     * @param document
     */
    function analyzeDocument(document) {
        addPasswordFormButtons(document);
        findCreditCardInputFields(document);
        findIdentityInputFields(document);
        documentSubmitCatcher(document);
    }

    /**
     * Register the submit catcher with all forms that have one password field
     *
     * @param document
     */
    function documentSubmitCatcher(document) {
        for (let i = 0; i < document.forms.length; i++) {
            formSubmitCatcher(document.forms[i]);
        }
    }

    /**
     * Sanitizes some text and returns proper html escaped text
     *
     * @param unsaveText
     * @returns {string}
     */
    function sanitizeText(unsaveText) {
        const element = document.createElement('div');
        element.innerText = unsaveText;
        return element.innerHTML;
    }

    /**
     * Register the submit catcher if the given form has exactly one password field
     *
     * @param form
     */
    function formSubmitCatcher(form) {
        let passwordFields = form.querySelectorAll("input[type='password']");
        if (passwordFields.length !== 1) {
            return;
        }

        if (form.classList.contains("psono-formSubmitCatcher-covered")) {
            return;
        }
        form.classList.add("psono-formSubmitCatcher-covered");

        const formSubmitEventListener = function (event) {
            let form;
            if (event.type === 'click') {
                // click on submit button
                form = event.target.closest('form')
            } else {
                // submit event of a form
                form = this;
            }

            if (!form) {
                return;
            }

            let formData = getUsernameAndPassword(form);
            if (formData) {
                base.emit("login-form-submit", getUsernameAndPassword(form));
            }
        }

        form.addEventListener("submit", formSubmitEventListener);

        let submitButtons = form.querySelectorAll("button[type='submit'], input[type='submit'], input[type='image']");

        if (submitButtons.length < 1) {
            // we didn't find any direct submit buttons, so we expand the scope and try just with buttons, potential
            // image buttons, buttons without type, spans and links.
            const otherButtons = form.querySelectorAll("button[type='button'], input[type='button'], input[type='image'], button:not([type]), a, span");
            submitButtons = []
            for (let i = 0; i < otherButtons.length; i++) {
                let buttonContent = otherButtons[i].tagName.toLowerCase() === "input" ? otherButtons[i].value : otherButtons[i].innerText;

                if (passwordSubmitButtonLabels.has(buttonContent.toLowerCase().trim())) {
                    submitButtons.append(otherButtons[i]);
                }
            }

            return;
        }
        for (let i = 0; i < submitButtons.length; i++) {
            submitButtons[0].addEventListener("click", formSubmitEventListener, false);
        }

    }

    /**
     * Analyse a form and returns the username and password
     *
     * @param form
     * @returns {{username: string, password: string}}
     */
    function getUsernameAndPassword(form) {
        let fields = form.querySelectorAll("input[type='text'], input[type='email'], input[type='password']");

        let username = "";
        let password = "";
        for (let i = 0; i < fields.length; i++) {
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
     * Manipulates the forms of a document and adds the password buttons
     *
     * @param document
     */
    function addPasswordFormButtons(document) {
        let paddingRight;

        // Lets start with searching all input fields and forms
        // if we find a password field, we remember that and take the field before as username field

        const inputs = document.querySelectorAll(
            "input[type='text'], input:not([type]), input[type='email'], input[type='password']"
        );

        for (let i = 0; i < inputs.length; ++i) {
            if (inputs[i].type !== "password") {
                continue;
            }

            if (inputs[i].classList.contains("psono-addPasswordFormButtons-covered")) {
                continue;
            }

            inputs[i].classList.add("psono-addPasswordFormButtons-covered");

            // found a password field, lets start the magic

            let newForm = {
                username: null,
                password: null,
                form: null,
            };

            for (let r = i - 1; r > -1; r--) {
                if (inputs[r].type === "password") continue;
                if (inputs[r].style.display === "none") continue;

                if (inputs[i].hasOwnProperty('checkVisibility') && inputs[i].checkVisibility() && inputs[r].offsetWidth < 90) continue; // we don't modify input fields that are too small if they are visible

                // username field is inputs[r]
                paddingRight = jQuery(inputs[r]).css("padding-right");
                base.modify_input_field(
                    inputs[r],
                    backgroundImage,
                    "center right " + paddingRight,
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
                paddingRight = jQuery(inputs[i]).css("padding-right");
                base.modify_input_field(
                    inputs[i],
                    backgroundImage,
                    "center right " + paddingRight,
                    document,
                    click,
                    mouseOver,
                    mouseOut,
                    mouseMove
                );
            }
            newForm.password = inputs[i];

            let parent = inputs[i].parentElement;

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
     * Searches the document to find all credit card input fields
     *
     * @param document
     */
    function findCreditCardInputFields(document) {
        // Lets start with searching all input fields
        const inputs = document.querySelectorAll(
            "input"
        );

        for (let i = 0; i < inputs.length; ++i) {
            if (inputs[i].classList.contains("psono-findCreditCardInputFields-covered")) {
                continue;
            }

            if (creditCardAllFields.has(inputs[i].autocomplete.trim().toLowerCase())) {
                inputs[i].classList.add("psono-findCreditCardInputFields-covered");
                creditCardInputFields.push(inputs[i]);
            }
        }
    }

    /**
     * Searches the document to find all identity (username or password) input fields
     *
     * @param document
     */
    function findIdentityInputFields(document) {
        // Lets start with searching all input fields
        const inputs = document.querySelectorAll(
            "input"
        );

        for (let i = 0; i < inputs.length; ++i) {
            if (inputs[i].classList.contains("psono-findIdentityInputFields-covered")) {
                continue;
            }

            if (identityAllFields.has(inputs[i].autocomplete.trim().toLowerCase())) {
                inputs[i].classList.add("psono-findIdentityInputFields-covered");
                identityInputFields.push(inputs[i]);
            }
        }
    }

    /**
     * Loads the necessary content script css into the provided document
     *
     * @param document
     */
    function loadCss(document) {
        // taken from https://stackoverflow.com/questions/574944/how-to-load-up-css-files-using-javascript
        let cssId = "psono-css"; // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId)) {
            let head = document.getElementsByTagName("head")[0];
            let link = document.createElement("link");
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
        evt.target.style.setProperty("background-image", 'url("' + backgroundImageHover + '")', "important");
    }

    /**
     * triggered once the mouse leaves the input field. Used to set the background to the normal image
     *
     * @param evt Mouse out event
     * @param target The original element that this event was bound to
     */
    function mouseOut(evt, target) {
        evt.target.style.setProperty("background-image", 'url("' + backgroundImage + '")', "important");
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
    function openDatastore() {
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
        let username = '';
        for (let i = 0; i < myForms.length; i++) {
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
    //     for (let i = dropInstances.length - 1; i >= 0; i--) {
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
     * Checks whether we just did recently close the dialog.
     * @param el
     * @returns {boolean}
     */
    function hasRecentlyBeenClosed(el) {
        return lastCloseTime + 50 > new Date().getTime();
    }

    /**
     * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
     * once a click happens outside of the dropdown menu
     *
     * @param evt Click event
     * @param target The original element that this event was bound to
     * @param document The document the click occurred in
     */
    async function click(evt, target, document) {

        if (hasRecentlyBeenClosed(target)) {
            // we only open dropdown menus 50 ms after the last time that one has been closed.
            // necessary for e.g. upwork login, otherwise the Dropdown opens a second time when the first one closes
            // as their password field is directly beneath the user field. Tried to block it different with ignoring not
            // displayed targets, yet that breaks sites like e.g. reddit.
            return;
        }

        if (target.hasOwnProperty('checkVisibility') && !target.checkVisibility()) {
            // we only open dropdown menus for elements that are visible
            return;
        }

        if (getDistance(evt, target) >= 30) {
            return
        }

        base.emit("website-password-refresh", document.location.toString(), async (response) => {

            let openDatastoreClass = "psono_open-datastore-" + uuid.v4();
            let generatePasswordClass = "psono_generate-password-" + uuid.v4();
            let requestSecretClasses = [];

            let dropcontent = "";
            dropcontent += '<div class="psono-drop-content-inner">';
            dropcontent += '<ul class="navigations">';

            let isLogged = await new Promise(function (resolve,) {
                base.emit("is-logged-in", undefined, (state) => {
                    resolve(state);
                });
            });

            if (!isLogged) {
                dropcontent +=
                    '<li><div class="' + openDatastoreClass + '" style="cursor: pointer !important;">Login</div></li>';
            } else {
                dropcontent +=
                    '<li><div class="' + openDatastoreClass + '" style="cursor: pointer !important;">Open Datastore</div></li>';
                if (response.data.length < 1) {
                    dropcontent +=
                        '<li><div class="' + generatePasswordClass + '" style="cursor: pointer !important;">Generate Password</div></li>';
                }
                for (let i = 0; i < response.data.length; i++) {

                    let sanitizedText = sanitizeText(response.data[i].name)
                    let requestSecretClass = "psono_request-secret-" + uuid.v4();

                    dropcontent +=
                        '<li><div class="' +
                        requestSecretClass +
                        '" style="cursor: pointer !important;"">' +
                        sanitizedText +
                        "</div></li>";
                    requestSecretClasses.push({
                        'class': requestSecretClass,
                        'secret_id': response.data[i].secret_id
                    });
                }
            }

            dropcontent += "</ul>";
            dropcontent += "</div>";

            lastRequestElement = evt.target;

            let dropInstance = createDropdownMenu(evt, dropcontent, document);
            dropInstance.open();

            dropInstances.push(dropInstance);

            setTimeout(function () {
                let element = dropInstance.getElement();

                jQuery(element.getElementsByClassName(openDatastoreClass)).on("click", function () {
                    openDatastore();
                });

                jQuery(element.getElementsByClassName(generatePasswordClass)).on("click", function () {
                    generate_password();
                });

                for (let i = 0; i < requestSecretClasses.length; i++) {
                    (function (className, secretId) {
                        jQuery(element.getElementsByClassName(className)).on("click", function () {
                            requestSecret(secretId);
                        });
                    })(requestSecretClasses[i]['class'], requestSecretClasses[i]['secret_id'])

                }
            }, 0);

        });
    }

    /**
     * Creates the dropdown menu
     *
     * @param setup_event
     * @param content
     * @param document
     * @returns {{open: open, close: close}}
     */
    function createDropdownMenu(setup_event, content, document) {
        let position = jQuery(setup_event.target).offset();
        let height = jQuery(setup_event.target).outerHeight();

        let element_id = "psono_drop-" + uuid.v4();

        let element = jQuery(
            "" +
                '<div id="' +
                element_id +
                '" class="psono-drop yui3-cssreset" style="' +
                "     transform: translateX(" +
                position.left +
                "px) translateY(" +
                (position.top + height) +
                'px) translateZ(0px) !important;">' +
                '    <div class="psono-drop-content">' +
                "        " +
                content +
                "    </div>" +
                "</div>"
        );

        document.onclick = function (event) {
            if (event.target !== setup_event.target) {
                let dropdowns = document.getElementsByClassName("psono-drop");
                for (let i = dropdowns.length - 1; i >= 0; i--) {
                    dropdowns[i].remove();
                }
                lastCloseTime = new Date().getTime();
            }
        };

        function open() {
            element.appendTo(document.body);
        }

        function close() {
            element.remove();
            lastCloseTime = new Date().getTime();
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
     * Small helper function to fill the values of a field and mimic user behavior events for compatibility reasons
     * with modern javascript frameworks.
     *
     * @param field
     * @param value
     */
    function fillFieldHelper (field, value) {
        if (!field) {
            return
        }
        if (!value) {
            return
        }
        if (typeof field.click === "function") {
            field.click()
        }
        jQuery(field).focus();
        field.value = value;
        jQuery(field).keydown();
        jQuery(field).trigger( "keypress" );
        jQuery(field).keyup();

        field.dispatchEvent(new Event("input", {
            bubbles: true,
            cancelable: true,
        }));

        jQuery(field).change();
        jQuery(field).blur();

        if (!field.classList.contains("psono-autofill-style")) {
            // we don't want to animate a field multiple times
            field.classList.add('psono-autofill-style');
            setTimeout(function () {
                if (field) {
                    field.classList.remove('psono-autofill-style');
                }
            }, 100);
        }
    };

    /**
     * Handler for a fillpassword event
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onFillPassword(data, sender, sendResponse) {

        for (let i = 0; i < myForms.length; i++) {
            if (data.hasOwnProperty("username") && data.username !== "") {
                fillFieldHelper(myForms[i].username, data.username);
            }
            if (data.hasOwnProperty("password") && data.password !== "") {
                fillFieldHelper(myForms[i].password, data.password);
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

        for (let i = 0; i < identityInputFields.length; i++) {
            if (usernameFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("username") && data.username !== "") {
                fillFieldHelper(identityInputFields[i], data.username);
            }
            if (newPasswordFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("password") && data.password !== "") {
                fillFieldHelper(identityInputFields[i], data.password);
            }
            if (currentPasswordFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("password") && data.password !== "") {
                fillFieldHelper(identityInputFields[i], data.password);
            }
        }

    }

    /**
     * Handler for a fillcreditcard event
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onFillCreditCard(data, sender, sendResponse) {

        for (let i = 0; i < creditCardInputFields.length; i++) {
            if (creditCardNameFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_name") && data.credit_card_name !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_name);
            }
            if (creditCardNumberFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_number") && data.credit_card_number !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_number);
            }
            if (creditCardCSCFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_cvc") && data.credit_card_cvc !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_cvc);
            }
            if (creditCardExpiryDateFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_valid_through") && data.credit_card_valid_through !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_valid_through);
            }
            if (creditCardExpiryDateMonthFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_valid_through") && data.credit_card_valid_through !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_valid_through.slice(0, 2));
            }
            if (creditCardExpiryDateYearFields.has(creditCardInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("credit_card_valid_through") && data.credit_card_valid_through !== "") {
                fillFieldHelper(creditCardInputFields[i], data.credit_card_valid_through.slice(2, 4));
            }
        }
    }

    /**
     * handles password request answer
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onReturnSecret(data, sender, sendResponse) {
        for (let i = 0; i < myForms.length; i++) {
            if (
                (myForms[i].username && myForms[i].username.isEqualNode(lastRequestElement)) ||
                (myForms[i].password && myForms[i].password.isEqualNode(lastRequestElement)) ||
                fillAll
            ) {
                fillFieldHelper(myForms[i].username, data.website_password_username);
                fillFieldHelper(myForms[i].password, data.website_password_password);

                for (let ii = 0; ii < dropInstances.length; ii++) {
                    dropInstances[ii].close();
                }
                dropInstances = [];
                if (!fillAll) {
                    break;
                }
            }
        }
        fillAll=false;
    }

    /**
     * handles the request from the background script, when it asks for the username
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onGetUsername(data, sender, sendResponse) {
        sendResponse({
            'username': find_username(),
        });
    }
};
