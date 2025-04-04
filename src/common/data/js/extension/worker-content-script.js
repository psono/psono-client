/*
 * The content script worker loaded in every page
 */

const ClassWorkerContentScript = function (base, browser, setTimeout) {
    "use strict";
    let lastRequestElement = null;
    let fillAll = false;
    let nextFillAllIndex = 0;
    let dropInstances = [];
    let myForms = [];
    let creditCardInputFields = [];
    let identityInputFields = [];
    let lastCloseTime = 0;

    const excludedOrigins = new Set([
        'https://www.elster.de', // conflict with elster certificates
    ])

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
    const totpFields = new Set([
        "one-time-code",
    ]);
    const identityAllFields = new Set([
        ...usernameFields,
        ...newPasswordFields,
        ...currentPasswordFields,
        ...totpFields,
    ]);


    base.ready(function() {
        activate();
    });

    function activate() {
        base.on("fillpassword", onFillPassword);
        base.on("fillcreditcard", onFillCreditCard);
        base.on("return-secret", onReturnSecret);
        base.on("get-username", onGetUsername);
        base.on("clear-clipboard-content-script", clearClipboard);

        base.ready(function() {
            let i;
            // Tell our backend, that we are ready and waiting for instructions
            base.emit("ready", document.location.toString());

            let documents = [];
            let windows = [];

            base.getAllDocuments(window, documents, windows);
            base.registerObserver(analyzeDocument);
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

        if (excludedOrigins.has(document.defaultView.location.origin)) {
            return;
        }

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
        let passwordFields = querySelectorAllIncShadowRoots(form, "input[type='password']");
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

        let submitButtons = querySelectorAllIncShadowRoots(form, "button[type='submit'], input[type='submit'], input[type='image']");

        if (submitButtons.length < 1) {
            // we didn't find any direct submit buttons, so we expand the scope and try just with buttons, potential
            // image buttons, buttons without type, spans and links.
            const otherButtons = querySelectorAllIncShadowRoots(form, "button[type='button'], input[type='button'], input[type='image'], button:not([type]), a, span");
            submitButtons = []
            for (let i = 0; i < otherButtons.length; i++) {
                let buttonContent = otherButtons[i].tagName.toLowerCase() === "input" ? otherButtons[i].value : otherButtons[i].innerText;

                if (passwordSubmitButtonLabels.has(buttonContent.toLowerCase().trim())) {
                    submitButtons.push(otherButtons[i]);
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
        let fields = querySelectorAllIncShadowRoots(form, "input[type='text'], input[type='email'], input[type='password']");

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

    function querySelectorAllIncShadowRoots(node, selector) {
        let inputs = [];

        // Search for inputs in the current node
        inputs = inputs.concat(Array.from(node.querySelectorAll(selector)));

        // Search for shadow roots and recursively search within them
        node.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                inputs = inputs.concat(querySelectorAllIncShadowRoots(el.shadowRoot, selector));
            }
        });

        return inputs;
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

        const inputs = querySelectorAllIncShadowRoots(document,
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
                paddingRight = window.getComputedStyle(inputs[r]).getPropertyValue("padding-right");
                base.modifyInputField(
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
                paddingRight = window.getComputedStyle(inputs[i]).getPropertyValue("padding-right");
                base.modifyInputField(
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
        const inputs = querySelectorAllIncShadowRoots(document,
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
        const inputs = querySelectorAllIncShadowRoots(document,
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
     * called within an event in a input field. Used to measure the distance from the right border of the input
     * element and the mouse at the moment of the click
     *
     * @param evt event
     * @param target The target that this event was bound to
     * @returns {number} Distance
     */
    function getDistance(evt, target) {
        return (
            target.offsetWidth -
            evt.pageX +
            target.getBoundingClientRect().left +
            (document.documentElement.scrollLeft || document.body.scrollLeft)
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

    /**
     * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
     * once a click happens outside of the dropdown menu
     *
     * @param evt Click event
     * @param target The original element that this event was bound to
     * @param document The document the click occurred in
     * @param input The input firing the click event
     */
    async function click(evt, target, document, input) {

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
                if (response.data.length > 5) {
                    dropcontent += '<li><input type="text" class="psono-search-input" placeholder="Search..." /></li>';
                }
                for (let i = 0; i < response.data.length; i++) {
                    let sanitizedName = sanitizeText(response.data[i].name)
                    let sanitizedDescription = '';
                    if (response.data[i].description && !response.data[i].name.toLowerCase().includes(response.data[i].description.toLowerCase())) {
                        sanitizedDescription = sanitizeText(' (' + response.data[i].description + ')')
                    }
                    if (sanitizedDescription) {
                        sanitizedDescription = '<span style="font-size: 11px !important; cursor: pointer !important;">' + sanitizedDescription + '</span>';
                    }
                    let requestSecretClass = "psono_request-secret-" + uuid.v4();
                    let style = '';
                    if (i >= 5) {
                        style = 'display:none !important';
                    }
                    dropcontent +=
                        '<li class="psono_request-secret" style="'+style+'"><div class="' +
                        requestSecretClass +
                        '" style="cursor: pointer !important;"">' +
                        sanitizedName +
                        sanitizedDescription +
                        "</div></li>";
                    requestSecretClasses.push({
                        'class': requestSecretClass,
                        'secret_id': response.data[i].secret_id
                    });
                }
            }

            dropcontent += "</ul>";
            dropcontent += "</div>";

            // events from inputs nested in shadowRoot won't set evt.target to the input.
            // as such we need this elaborated logic to find the correct input element that triggered things
            lastRequestElement = input;

            let dropInstance = createDropdownMenu(evt, dropcontent, document);
            dropInstance.open();

            dropInstances.push(dropInstance);

            setTimeout(function () {
                let element = dropInstance.getElement();

                let openDatastoreElements = element.getElementsByClassName(openDatastoreClass);
                for (let el of openDatastoreElements) {
                    el.addEventListener("click", function () {
                        openDatastore();
                    });
                }

                let generatePasswordElements = element.getElementsByClassName(generatePasswordClass);
                for (let el of generatePasswordElements) {
                    el.addEventListener("click", function () {
                        generate_password();
                    });
                }

                for (let i = 0; i < requestSecretClasses.length; i++) {
                    let className = requestSecretClasses[i]['class'];
                    let secretId = requestSecretClasses[i]['secret_id'];
                    let secretElements = element.getElementsByClassName(className);

                    for (let el of secretElements) {
                        el.addEventListener("click", function () {
                            requestSecret(secretId);
                        });
                    }
                }

                // Setup search functionality if response.data is longer than 5
                if (response.data.length > 5) {
                    let searchInput = document.querySelector('.psono-search-input');
                    let listItems = querySelectorAllIncShadowRoots(document, '.psono_request-secret');

                    searchInput.addEventListener('click', function (event) {
                        event.stopPropagation();
                    });

                    searchInput.addEventListener('keyup', function () {
                        const searchStrings = searchInput.value.toLowerCase().split(" ");

                        function match(searched) {
                            let containCounter = 0;
                            searched = searched.toLowerCase()

                            for (let ii = searchStrings.length - 1; ii >= 0; ii--) {
                                if (
                                    searched.indexOf(searchStrings[ii]) > -1
                                ) {
                                    containCounter++;
                                }
                            }
                            return containCounter === searchStrings.length;
                        }

                        let shownElements = 0;
                        listItems.forEach(function (li) {
                            let listItemText = li.textContent.toLowerCase();
                            if (!match(listItemText) || (shownElements >= 5)) {
                                li.setAttribute('style', 'display:none !important');
                            } else {
                                shownElements = shownElements + 1;
                                li.setAttribute('style', '');
                            }
                        });
                    });
                }
            }, 0);

        });
    }

    /**
     * Calculated the absolute position of an element, similar to jQuery's .offset() function
     *
     * @param element
     * @returns {{top: number, left: number}}
     */
    function getOffset(element){
        if (element.getClientRects().length < 1){
            return {
                top: 0,
                left: 0
            };
        }

        let rect = element.getBoundingClientRect();
        let win = element.ownerDocument.defaultView;
        return {
            top: rect.top + win.pageYOffset,
            left: rect.left + win.pageXOffset
        };
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
        let position = getOffset(setup_event.target);

        let height = setup_event.target.offsetHeight;

        let element_id = "psono_drop-" + uuid.v4();

        let element = document.createElement('div');
        element.id = element_id;
        element.className = 'psono-drop yui3-cssreset';
        element.setAttribute('style', `transform: translateX(${position.left}px) translateY(${position.top + height}px) translateZ(0px) !important`);
        element.innerHTML = '<div class="psono-drop-content">' + content + '</div>';

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
            document.body.appendChild(element);
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
     * Searches for input/textarea fields matching the given name across various attributes
     * 
     * @param {string} fieldName - The name to search for
     * @returns {Element|null} - The matching input element or null if not found
     */
    function findFieldByName(fieldName) {
        if (!fieldName) return null;
        
        const searchName = fieldName.toLowerCase();
        const selector = 'input:not([type="submit"]):not([type="button"]):not([type="reset"]), textarea';
        const elements = querySelectorAllIncShadowRoots(document, selector);
        
        return Array.from(elements).find(element => {
            if ((element.id && element.id.toLowerCase() === searchName) ||
                (element.name && element.name.toLowerCase() === searchName) ||
                (element.getAttribute('aria-label') && element.getAttribute('aria-label').toLowerCase() === searchName) ||
                (element.placeholder && element.placeholder.toLowerCase() === searchName)) {
                return true;
            }

            if (element.id) {
                const labelFor = document.querySelector(`label[for="${element.id}"]`);
                if (labelFor && labelFor.textContent.toLowerCase().trim() === searchName) {
                    return true;
                }
            }

            let parent = element.parentElement;
            while (parent) {
                if (parent.tagName === 'LABEL' && parent.textContent.toLowerCase().trim() === searchName) {
                    return true;
                }
                parent = parent.parentElement;
            }

            return false;
        });
    }

    /**
     * Small helper function to fill the values of a field and mimic user behavior events for compatibility reasons
     * with modern javascript frameworks.
     *
     * @param field
     * @param value
     */
    function fillFieldHelper(field, value) {
        if (!field || !value) {
            return;
        }

        // Focus the field
        field.focus();

        ['keydown', 'keypress'].forEach(eventType => {
            field.dispatchEvent(new Event(eventType, {
                bubbles: true,
                cancelable: true,
            }));
        });

        // Set the value of the field
        field.value = value;

        // Create and dispatch keyboard and other events
        ['input', 'keyup', 'change', 'blur'].forEach(eventType => {
            field.dispatchEvent(new Event(eventType, {
                bubbles: true,
                cancelable: true,
            }));
        });

        // Add a class to animate the field, then remove it after a delay
        if (!field.classList.contains("psono-autofill-style")) {
            field.classList.add('psono-autofill-style');
            setTimeout(function () {
                if (field) {
                    field.classList.remove('psono-autofill-style');
                }
            }, 100);
        }
    }

    /**
     * Handler for a fillpassword event
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onFillPassword(data, sender, sendResponse) {
        let foundUsername;
        let foundPassword;
        let foundTotp;

        for (let i = 0; i < myForms.length; i++) {
            if (data.hasOwnProperty("username") && data.username !== "") {
                foundUsername = true;
                fillFieldHelper(myForms[i].username, data.username);
            }
            if (data.hasOwnProperty("password") && data.password !== "") {
                foundPassword = true;
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
                foundUsername = true;
                fillFieldHelper(identityInputFields[i], data.username);
            }
            if (newPasswordFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("password") && data.password !== "") {
                foundPassword = true;
                fillFieldHelper(identityInputFields[i], data.password);
            }
            if (currentPasswordFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("password") && data.password !== "") {
                foundPassword = true;
                fillFieldHelper(identityInputFields[i], data.password);
            }
            if (totpFields.has(identityInputFields[i].autocomplete.trim().toLowerCase()) &&
                data.hasOwnProperty("totp_token") && data.totp_token !== "") {
                foundTotp = true;
                fillFieldHelper(identityInputFields[i], data.totp_token);
            }
        }

        if (!foundUsername) {
            // if we don't have a username field we try to find one with a name that matches username or email

            const inputs = Array.from(querySelectorAllIncShadowRoots(document,
                "input"
            ));

            let potentialUsernameFields = inputs.filter((input) => input.name.toLowerCase() === 'username');
            if (potentialUsernameFields.length === 0) {
                potentialUsernameFields = inputs.filter((input) => input.name.toLowerCase() === 'email');
            }
            if (potentialUsernameFields.length === 1) {
                fillFieldHelper(potentialUsernameFields[0], data.username);
            }
        }

        if (data.hasOwnProperty('custom_fields') && data.custom_fields) {
            for (let i = 0; i < data.custom_fields.length; i++) {
                const field = findFieldByName(data.custom_fields[i].name);
                if (field) {
                    fillFieldHelper(field, data.custom_fields[i].value);
                }
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
     * parses an URL and returns an object with all details separated
     *
     * @param {String} url The url to be parsed
     * @returns {object} Returns the split up url
     */
    function parseUrl(url) {
        const empty = {
            scheme: null,
            authority: null,
            authority_without_www: null,
            base_url: null,
            full_domain: null,
            full_domain_without_www: null,
            port: null,
            path: null,
            query: null,
            fragment: null
        };
        if (!url) {
            return empty;
        }

        if (!url.includes("://")) {
            // Its supposed to be an url but doesn't include a schema so let's prefix it with http://
            url = 'http://' + url;
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return empty;
        }

        return {
            scheme: parsedUrl.protocol.slice(0,-1),
            base_url: parsedUrl.protocol + '//' + parsedUrl.host,
            authority: parsedUrl.host,
            authority_without_www: parsedUrl.host ? parsedUrl.host.replace(/^(www\.)/, ""): parsedUrl.host, //remove leading www.
            full_domain: parsedUrl.hostname,
            full_domain_without_www: parsedUrl.hostname ? parsedUrl.hostname.replace(/^(www\.)/, "") : parsedUrl.hostname,
            port: parsedUrl.port || null,
            path: parsedUrl.pathname,
            query: parsedUrl.search || null,
            fragment: parsedUrl.hash ? parsedUrl.hash.substring(1) : null,
        };
    }

    /**
     * Checks if a provided urlfilter and authority fit together
     *
     * @param {string} authority The "authority" of the current website, e.g. www.example.com:80
     * @param {string} urlFilter The url filter, e.g. *.example.com or www.example.com
     *
     * @returns {boolean} Whether the string ends with the suffix or not
     */
    function isUrlFilterMatch(authority, urlFilter) {
        if (!authority || !urlFilter) {
            return false
        }
        authority = authority.toLowerCase();
        urlFilter = urlFilter.toLowerCase();
        let directMatch = authority === urlFilter;
        let wildcardMatch = urlFilter.startsWith('*.') && authority.endsWith(urlFilter.substring(1));

        return directMatch || wildcardMatch
    }

    /**
     * Returns the function that returns whether a certain leaf entry should be considered a possible condidate
     * for a provided url
     *
     * @param {string} url The url to match
     *
     * @returns {(function(*): (boolean|*))|*}
     */
    const getSearchWebsitePasswordsByUrlfilter = function (url) {
        const parsedUrl = parseUrl(url);

        const filter = function (leaf) {

            if (typeof leaf.website_password_url_filter === "undefined") {
                return false;
            }

            if (leaf.website_password_url_filter) {
                const urlFilters = leaf.website_password_url_filter.split(/\s+|,|;/);
                for (let i = 0; i < urlFilters.length; i++) {
                    if (!isUrlFilterMatch(parsedUrl.authority, urlFilters[i])) {
                        continue;
                    }
                    return parsedUrl.scheme === 'https' || (leaf.hasOwnProperty("allow_http") && leaf["allow_http"]);
                }
            }

            return false;
        };

        return filter;
    };

    /**
     * handles password request answer
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    async function onReturnSecret(data, sender, sendResponse) {

        const isIframe = window !== window.top;

        function autofill() {
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

            if (data.hasOwnProperty('custom_fields') && data.custom_fields) {
                for (let i = 0; i < data.custom_fields.length; i++) {
                    const field = findFieldByName(data.custom_fields[i].name);
                    if (field) {
                        fillFieldHelper(field, data.custom_fields[i].value);
                    }
                }
            }

            fillAll = false;
        }

        if (isIframe) {
            const filter = getSearchWebsitePasswordsByUrlfilter(window.location.origin);
            if (!filter(data)) {
                const parsedUrl = parseUrl(window.location.origin);
                const autofillId = uuid.v4();
                await base.emit("approve-iframe-login", {
                    'authority': parsedUrl.authority,
                    'autofill_id': autofillId
                }, (response) => {
                    if (response.data) {
                        autofill()
                    }
                });
            } else {
                autofill()
            }
        } else {
            autofill()
        }
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

    /**
     * handles the request from the background script, when it asks to clear the clipboard
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function clearClipboard(data, sender, sendResponse) {
        navigator.clipboard.writeText("");
    }
};
