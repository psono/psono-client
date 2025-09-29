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
    let styleProtectionObserver = null;
    let protectedElements = new Set();
    let originalStyles = new WeakMap();

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
    
    // Identity fields for form autofill
    const identityNameFields = new Set([
        "name",
        "given-name", // First name
        "additional-name", // Middle name
        "family-name", // Last name
        "honorific-prefix", // Mr., Mrs., Dr., etc.
        "honorific-suffix", // Jr., PhD., etc.
    ]);
    const identityAddressFields = new Set([
        "street-address",
        "address-line1",
        "address-line2",
        "address-line3",
        "address-level1", // State/province
        "address-level2", // City
        "address-level3", // District/suburb
        "address-level4", // Neighborhood/village
        "postal-code",
        "country",
        "country-name",
    ]);
    const identityContactFields = new Set([
        "tel",
        "tel-country-code",
        "tel-national",
        "tel-area-code",
        "tel-local",
        "tel-extension",
        "organization", // Company
        "organization-title", // Job title
    ]);
    
    const identityAllFields = new Set([
        ...usernameFields,
        ...newPasswordFields,
        ...currentPasswordFields,
        ...totpFields,
        ...identityNameFields,
        ...identityAddressFields,
        ...identityContactFields,
    ]);


    base.ready(function() {
        activate();
    });

    function activate() {
        base.on("fillpassword", onFillPassword);
        base.on("fillcreditcard", onFillCreditCard);
        base.on("fillidentity", onFillIdentity);
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
            
            // Initialize style protection observer
            initializeStyleProtection();
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
     * Initialize the MutationObserver to protect styles of our extension elements
     */
    function initializeStyleProtection() {
        if (styleProtectionObserver) {
            styleProtectionObserver.disconnect();
        }

        let isRestoring = false; // Prevent infinite loops

        styleProtectionObserver = new MutationObserver((mutations) => {
            if (isRestoring) return; // Skip if we're currently restoring styles

            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    
                    const target = mutation.target;
                    
                    // Check if this is one of our protected elements and the change wasn't made by us
                    if ((protectedElements.has(target) || isProtectedElement(target)) && 
                        !target.hasAttribute('data-psono-restoring')) {
                        
                        isRestoring = true;
                        restoreElementStyles(target);
                        isRestoring = false;
                    }
                    
                    // Check for parent element opacity/visibility attacks
                    if ((target === document.body || target === document.documentElement) && 
                        protectedElements.size > 0) {
                        
                        isRestoring = true;
                        checkAndRestoreParentVisibility(target);
                        isRestoring = false;
                    }
                }
                
                // Handle childList mutations to catch new elements that might interfere
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if any added elements try to interfere with our elements
                            checkForInterference(node);
                        }
                    });
                }
            });
        });

        // Start observing the document with the configured options
        styleProtectionObserver.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['style', 'class']
        });
    }

    /**
     * Check if an element is one of our protected extension elements
     * @param {Element} element 
     * @returns {boolean}
     */
    function isProtectedElement(element) {
        return element.classList.contains('psono-drop') ||
               element.classList.contains('psono-drop-content') ||
               element.classList.contains('psono-drop-content-inner') ||
               element.classList.contains('navigations') ||
               element.closest('.psono-drop') !== null;
    }

    /**
     * Restore the original styles of a protected element
     * @param {Element} element 
     */
    function restoreElementStyles(element) {
        // Mark element as being restored to prevent loops
        element.setAttribute('data-psono-restoring', 'true');
        
        const originalStyleData = originalStyles.get(element);
        
        if (originalStyleData) {
            // Restore original inline styles
            element.style.cssText = originalStyleData.inlineStyles;
            
            // Restore original classes - remove any non-original classes
            const currentClasses = Array.from(element.classList);
            const originalClasses = originalStyleData.classes;
            
            // Remove all classes first
            element.className = '';
            
            // Add back only original classes
            originalClasses.forEach(cls => element.classList.add(cls));
            
            // Also preserve any legitimate classes that might have been added during runtime
            const allowedClasses = new Set([
                'psono-drop',
                'psono-drop-content',
                'psono-drop-content-inner',
                'psono-autofill-style',
                'yui3-cssreset',
                'navigations'
            ]);
            
            const legitimateRuntimeClasses = currentClasses.filter(cls => allowedClasses.has(cls));
            legitimateRuntimeClasses.forEach(cls => {
                if (!element.classList.contains(cls)) {
                    element.classList.add(cls);
                }
            });
            
        } else if (isProtectedElement(element)) {
            // If we don't have original data but it's a protected element,
            // remove any suspicious classes and maintain critical styles
            removeNonLegitimateClasses(element);
            maintainCriticalStyles(element);
        }
        
        // Remove the restoration marker after a brief delay
        setTimeout(() => {
            element.removeAttribute('data-psono-restoring');
        }, 10);
    }

    /**
     * Remove non-legitimate classes from protected elements
     * @param {Element} element 
     */
    function removeNonLegitimateClasses(element) {
        // Exact whitelist of allowed classes - NO wildcards or startsWith
        const allowedClasses = new Set([
            'psono-drop',
            'psono-drop-content',
            'psono-drop-content-inner',
            'psono-autofill-style',
            'yui3-cssreset',
            'navigations'
        ]);
        
        const currentClasses = Array.from(element.classList);
        const legitimateClasses = currentClasses.filter(cls => allowedClasses.has(cls));
        
        // Reset classes to only whitelisted ones
        element.className = legitimateClasses.join(' ');
    }

    /**
     * Maintain critical styles for our extension elements
     * @param {Element} element 
     */
    function maintainCriticalStyles(element) {
        // Mark element as being restored to prevent loops
        element.setAttribute('data-psono-restoring', 'true');
        
        if (element.classList.contains('psono-drop')) {
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('z-index', '2147483647', 'important');
            element.style.setProperty('display', 'block', 'important');
        } else if (element.classList.contains('psono-drop-content')) {
            element.style.setProperty('position', 'relative', 'important');
            element.style.setProperty('background', '#FFF', 'important');
            element.style.setProperty('display', 'block', 'important');
        }
        
        // Remove the restoration marker after a brief delay
        setTimeout(() => {
            element.removeAttribute('data-psono-restoring');
        }, 10);
    }

    /**
     * Check and restore parent element visibility (body/html)
     * @param {Element} element 
     */
    function checkAndRestoreParentVisibility(element) {
        if (!element) return;
        
        element.setAttribute('data-psono-restoring', 'true');
        
        const computedStyle = window.getComputedStyle(element);
        const isBodyOrHtml = element === document.body || element === document.documentElement;
        
        if (isBodyOrHtml) {
            // Check for opacity attacks
            const opacity = parseFloat(computedStyle.opacity);
            if (opacity < 0.1) {
                element.style.setProperty('opacity', '1', 'important');
                console.warn('PSONO Security: Restored parent element opacity from', opacity, 'to 1');
            }
            
            // Check for visibility attacks
            if (computedStyle.visibility === 'hidden') {
                element.style.setProperty('visibility', 'visible', 'important');
                console.warn('PSONO Security: Restored parent element visibility from hidden to visible');
            }
            
            // Check for display attacks
            if (computedStyle.display === 'none') {
                element.style.setProperty('display', 'block', 'important');
                console.warn('PSONO Security: Restored parent element display from none to block');
            }
        }
        
        setTimeout(() => {
            element.removeAttribute('data-psono-restoring');
        }, 10);
    }

    /**
     * Check if newly added nodes might interfere with our elements
     * @param {Element} node 
     */
    function checkForInterference(node) {
        // Check if the added node has styles that might hide our elements
        if (node.style) {
            const computedStyle = window.getComputedStyle(node);
            
            // If an element is positioned over our dropdown area, monitor it
            if (computedStyle.position === 'absolute' || 
                computedStyle.position === 'fixed' ||
                parseInt(computedStyle.zIndex) > 2147483640) {
                
                // Check if it overlaps with any of our dropdowns
                protectedElements.forEach((protectedElement) => {
                    if (protectedElement.classList.contains('psono-drop')) {
                        const protectedRect = protectedElement.getBoundingClientRect();
                        const nodeRect = node.getBoundingClientRect();
                        
                        if (rectsOverlap(protectedRect, nodeRect)) {
                            // Potentially malicious element detected - lower its z-index
                            node.style.setProperty('z-index', '2147483630', 'important');
                        }
                    }
                });
            }
        }
    }

    /**
     * Check if two rectangles overlap
     * @param {DOMRect} rect1 
     * @param {DOMRect} rect2 
     * @returns {boolean}
     */
    function rectsOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect2.right < rect1.left || 
                 rect1.bottom < rect2.top || 
                 rect2.bottom < rect1.top);
    }

    /**
     * Add an element to the protected elements set and store its original styles
     * @param {Element} element 
     */
    function protectElement(element) {
        if (!protectedElements.has(element)) {
            protectedElements.add(element);
            
            // Store original styles
            originalStyles.set(element, {
                inlineStyles: element.style.cssText,
                classes: Array.from(element.classList)
            });
        }
    }

    /**
     * Remove an element from protection (when it's removed from DOM)
     * @param {Element} element 
     */
    function unprotectElement(element) {
        protectedElements.delete(element);
        originalStyles.delete(element);
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

        // Perform comprehensive security check before showing dropdown
        const securityCheck = performSecurityCheck();
        if (!securityCheck.safe) {
            console.warn('PSONO Security: Dropdown blocked due to security threats:', securityCheck.threats);
            
            // If existing popovers are detected, don't show our dropdown
            if (securityCheck.threats.includes('existing_popovers')) {
                console.warn('PSONO Security: Blocking dropdown due to existing popover elements');
                return;
            }
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
                let shadowRoot = dropInstance.getShadowRoot();

                let openDatastoreElements = shadowRoot.querySelectorAll(`.${openDatastoreClass}`);
                for (let el of openDatastoreElements) {
                    el.addEventListener("click", function () {
                        openDatastore();
                    });
                }

                let generatePasswordElements = shadowRoot.querySelectorAll(`.${generatePasswordClass}`);
                for (let el of generatePasswordElements) {
                    el.addEventListener("click", function () {
                        generate_password();
                    });
                }

                for (let i = 0; i < requestSecretClasses.length; i++) {
                    let className = requestSecretClasses[i]['class'];
                    let secretId = requestSecretClasses[i]['secret_id'];
                    let secretElements = shadowRoot.querySelectorAll(`.${className}`);

                    for (let el of secretElements) {
                        el.addEventListener("click", function () {
                            requestSecret(secretId);
                        });
                    }
                }

                // Setup search functionality if response.data is longer than 5
                if (response.data.length > 5) {
                    let searchInput = shadowRoot.querySelector('.psono-search-input');
                    let listItems = shadowRoot.querySelectorAll('.psono_request-secret');

                    if (searchInput) {
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
     * Check if Popover API is supported
     * @returns {boolean}
     */
    function isPopoverSupported() {
        return typeof HTMLElement.prototype.showPopover === 'function' &&
               typeof HTMLElement.prototype.hidePopover === 'function';
    }

    /**
     * Check for existing popover elements in the top layer
     * @returns {Element[]} Array of popover elements found
     */
    function checkExistingPopovers() {
        const popovers = [];
        const allElements = document.querySelectorAll('[popover]');
        
        allElements.forEach(element => {
            // Check if popover is currently showing (in top layer)
            if (element.matches(':popover-open')) {
                popovers.push(element);
            }
        });
        
        return popovers;
    }

    /**
     * Check for highest z-index elements that might conflict
     * @returns {Element[]} Array of high z-index elements
     */
    function checkHighZIndexElements() {
        const highZElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const zIndex = parseInt(computedStyle.zIndex);
            
            if (zIndex > 2147483640 && !element.id.startsWith('psono_drop-')) {
                highZElements.push({
                    element: element,
                    zIndex: zIndex,
                    position: computedStyle.position
                });
            }
        });
        
        // Sort by z-index descending
        highZElements.sort((a, b) => b.zIndex - a.zIndex);
        return highZElements;
    }

    /**
     * Check if an element is suspicious based on its styling and attributes
     * @param {Element} element
     * @returns {boolean} True if element is suspicious
     */
    function isSuspiciousElement(element) {
        const computedStyle = window.getComputedStyle(element);
        return (
            // Test elements (our attack simulation)
            element.id.startsWith('test-') ||
            // High z-index positioned elements
            ((computedStyle.position === 'fixed' || computedStyle.position === 'absolute') &&
             parseInt(computedStyle.zIndex) > 2147483640) ||
            // Elements with suspicious styling
            (computedStyle.pointerEvents !== 'none' && 
             (computedStyle.position === 'fixed' || computedStyle.position === 'absolute') &&
             parseInt(computedStyle.zIndex) > 2147483640)
        );
    }

    /**
     * Check for overlay conflicts using elementsFromPoint
     * @param {Element} dropdownElement 
     * @returns {boolean} True if overlay detected
     */
    function checkForOverlayConflicts(dropdownElement) {
        if (!dropdownElement) return false;
        
        const rect = dropdownElement.getBoundingClientRect();
        
        // Check multiple points across the dropdown
        const testPoints = [
            { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.25 },
            { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.25 },
            { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 },
            { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.75 },
            { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.75 }
        ];
        
        for (const point of testPoints) {
            const elements = document.elementsFromPoint(point.x, point.y);
            
            // Check if there are suspicious elements in the stack
            if (elements.length > 0) {
                // Look through the element stack to find suspicious overlays
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    
                    // Skip our own dropdown and its contents
                    if (element === dropdownElement || 
                        element.closest(`#${dropdownElement.id}`) ||
                        dropdownElement.contains(element)) {
                        continue;
                    }
                    
                    // Skip body and html elements (normal page structure)
                    if (element.tagName === 'BODY' || element.tagName === 'HTML') {
                        continue;
                    }
                    
                    // Skip normal form elements that are part of the page structure
                    if (['LABEL', 'FORM', 'INPUT'].includes(element.tagName) && 
                        !element.id.startsWith('test-') && 
                        !element.id.startsWith('psono-')) {
                        continue;
                    }
                    
                    if (isSuspiciousElement(element)) {
                        // For Popover API elements, we need different detection logic
                        // Check if the suspicious element is actually covering our dropdown
                        const elementRect = element.getBoundingClientRect();
                        
                        // Check if the suspicious element overlaps with our dropdown
                        const overlaps = !(
                            rect.right < elementRect.left || 
                            elementRect.right < rect.left || 
                            rect.bottom < elementRect.top || 
                            elementRect.bottom < rect.top
                        );
                        
                        if (overlaps) {
                            console.warn('PSONO Security: Overlay conflict detected at point', point);
                            console.warn('PSONO Security: Interfering element:', element);
                            console.warn('PSONO Security: Element bounds:', elementRect);
                            console.warn('PSONO Security: Dropdown bounds:', rect);
                            console.warn('PSONO Security: Element stack:', elements.map(el => `${el.tagName}${el.id ? '#' + el.id : ''}`));
                            
                            // Try to lower the z-index of the interfering element first
                            const currentComputedStyle = window.getComputedStyle(element);
                            element.style.setProperty('z-index', '2147483630', 'important');
                            console.warn('PSONO Security: Attempting to lower z-index from', currentComputedStyle.zIndex, 'to 2147483630');
                            
                            // Re-check if the element is still suspicious after z-index change
                            if (isSuspiciousElement(element)) {
                                console.error('PSONO Security: Z-index lowering failed, element still interfering');
                                return true;
                            } else {
                                console.warn('PSONO Security: Z-index lowering successful, continuing');
                                // Continue checking other points, don't return true yet
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Temporarily disable pointer-events on all elements except our dropdown
     * @param {Element} dropdownElement 
     * @returns {Array} Array of elements that had pointer-events modified
     */
    function temporarilyDisablePointerEvents(dropdownElement) {
        const modifiedElements = [];
        const allPopovers = document.querySelectorAll('[popover]');
        
        allPopovers.forEach(element => {
            if (element !== dropdownElement && element.matches(':popover-open')) {
                const originalPointerEvents = element.style.pointerEvents;
                element.style.setProperty('pointer-events', 'none', 'important');
                modifiedElements.push({
                    element: element,
                    originalPointerEvents: originalPointerEvents
                });
            }
        });
        
        return modifiedElements;
    }

    /**
     * Restore pointer-events on modified elements
     * @param {Array} modifiedElements 
     */
    function restorePointerEvents(modifiedElements) {
        modifiedElements.forEach(({ element, originalPointerEvents }) => {
            if (originalPointerEvents) {
                element.style.pointerEvents = originalPointerEvents;
            } else {
                element.style.removeProperty('pointer-events');
            }
        });
    }

    /**
     * Comprehensive security check before showing dropdown
     * @returns {Object} Security check results
     */
    function performSecurityCheck() {
        const result = {
            safe: true,
            threats: [],
            existingPopovers: [],
            highZElements: []
        };
        
        // Check for existing popovers
        const existingPopovers = checkExistingPopovers();
        if (existingPopovers.length > 0) {
            result.safe = false;
            result.threats.push('existing_popovers');
            result.existingPopovers = existingPopovers;
            console.warn('PSONO Security: Existing popover elements detected:', existingPopovers);
        }
        
        // Check for high z-index elements
        const highZElements = checkHighZIndexElements();
        if (highZElements.length > 0) {
            result.threats.push('high_z_elements');
            result.highZElements = highZElements;
            console.warn('PSONO Security: High z-index elements detected:', highZElements);
        }
        
        return result;
    }

    /**
     * Creates the dropdown menu with closed shadow root, MutationObserver protection, and Popover API if supported
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

        // Create the host element with original positioning
        let element = document.createElement('div');
        element.id = element_id;
        element.className = 'psono-drop yui3-cssreset';
        
        // Use Popover API if available for better isolation
        const usePopover = isPopoverSupported();
        if (usePopover) {
            element.setAttribute('popover', 'manual'); // Manual control over show/hide
        }
        
        element.setAttribute('style', `transform: translateX(${position.left}px) translateY(${position.top + height}px) translateZ(0px) !important`);

        // Create closed shadow root for complete isolation
        let shadowRoot = element.attachShadow({ mode: 'closed' });
        
        // Inject all styles and content into the closed shadow root
        shadowRoot.innerHTML = `
            <style>
                :host {
                    top: 0 !important;
                    left: 0 !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    padding-top: 12px !important;
                    position: absolute !important;
                    display: block !important;
                    z-index: 2147483647 !important;
                    box-sizing: border-box !important;
                }
                
                .psono-drop-content {
                    position: relative !important;
                    background: #FFF !important;
                    padding: 2px !important;
                    transform: translateZ(0) !important;
                    display: block !important;
                    box-sizing: border-box !important;
                }

                .psono-drop-content-inner {
                    position: relative !important;
                    background-color: #151f2b !important;
                    border: 1px solid #cdd2df !important;
                    border-radius: 2px !important;
                    padding: 6px !important;
                    display: block !important;
                    box-sizing: border-box !important;
                }

                .psono-drop-content-inner * {
                    font-family: 'Open Sans', sans-serif !important;
                    font-size: 13px !important;
                    color: #b1b6c1 !important;
                    box-sizing: border-box !important;
                }

                .psono-drop-content-inner:after,
                .psono-drop-content-inner:before {
                    bottom: 100% !important;
                    left: 20% !important;
                    border: solid transparent !important;
                    content: " " !important;
                    height: 0 !important;
                    width: 0 !important;
                    position: absolute !important;
                    pointer-events: none !important;
                }

                .psono-drop-content-inner:after {
                    border-color: #151f2b !important;
                    border-color: rgba(21, 31, 43, 0) !important;
                    border-bottom-color: #151f2b !important;
                    border-width: 10px !important;
                    margin-left: -10px !important;
                }

                .psono-drop-content-inner:before {
                    border-color: #bababa !important;
                    border-color: rgba(186, 186, 186, 0) !important;
                    border-bottom-color: #fff !important;
                    border-width: 13px !important;
                    border-radius: 2px !important;
                    margin-left: -13px !important;
                }

                .navigations {
                    padding: 0 !important;
                    margin: 0 !important;
                }

                .navigations li {
                    list-style-type: none !important;
                    margin-top: 1px !important;
                    border-radius: 4px !important;
                    display: block !important;
                }

                .navigations li div {
                    text-decoration: none !important;
                    display: inline-block !important;
                    padding: 10px !important;
                    width: 100% !important;
                    cursor: pointer !important;
                    box-sizing: border-box !important;
                }

                .navigations li input {
                    padding: 10px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    background: transparent !important;
                    border: none !important;
                    color: #b1b6c1 !important;
                    font-family: 'Open Sans', sans-serif !important;
                    font-size: 13px !important;
                }

                .navigations li:hover {
                    background-color: #fff !important;
                    color: #151f2b !important;
                }

                .navigations li:hover div {
                    color: #151f2b !important;
                }

                .navigations li.active {
                    background-color: #2dbb93 !important;
                }

                .navigations li.active div {
                    color: #fff !important;
                }
            </style>
            <div class="psono-drop-content">
                ${content}
            </div>
        `;

        // Store shadow root reference for internal access only
        element._psonoShadowRoot = shadowRoot;

        document.onclick = function (event) {
            if (event.target !== setup_event.target) {
                // Clean up both regular dropdowns and shadow root dropdowns
                let dropdowns = document.getElementsByClassName("psono-drop");
                for (let i = dropdowns.length - 1; i >= 0; i--) {
                    dropdowns[i].remove();
                }
                
                let shadowDropdowns = document.querySelectorAll('[id^="psono_drop-"]');
                for (let i = shadowDropdowns.length - 1; i >= 0; i--) {
                    if (shadowDropdowns[i]._psonoShadowRoot) {
                        shadowDropdowns[i].remove();
                    }
                }
                lastCloseTime = new Date().getTime();
            }
        };

        function open() {
            document.body.appendChild(element);
            
            // Use Popover API if supported for maximum protection
            if (usePopover) {
                try {
                    element.showPopover();
                } catch (e) {
                    console.warn('PSONO: Popover API failed, using fallback', e);
                }
            }
            
            // Protect the host element with MutationObserver
            // (the shadow root content is already protected by being closed)
            protectElement(element);
            
            // Perform overlay detection after a brief delay to allow rendering
            setTimeout(() => {
                // Temporarily disable pointer-events on other popovers for accurate detection
                const modifiedElements = temporarilyDisablePointerEvents(element);
                
                // Check for overlay conflicts
                const overlayDetected = checkForOverlayConflicts(element);
                
                // Restore pointer-events
                restorePointerEvents(modifiedElements);
                
                // If overlay is detected, close the dropdown for security
                if (overlayDetected) {
                    console.error('PSONO Security: Overlay attack detected - closing dropdown for safety');
                    close();
                    return;
                }

            }, 50);
        }

        function close() {
            // Hide popover if using Popover API
            if (usePopover) {
                try {
                    element.hidePopover();
                } catch (e) {
                    // Popover might already be hidden
                }
            }
            
            // Unprotect the host element
            unprotectElement(element);
            
            element.remove();
            lastCloseTime = new Date().getTime();
        }

        function getElement() {
            return document.getElementById(element_id);
        }

        function getShadowRoot() {
            // Only our code can access this
            return element._psonoShadowRoot;
        }

        function manualOverlayCheck() {
            // Public function for testing overlay detection
            const overlayDetected = checkForOverlayConflicts(element);
            if (overlayDetected) {
                console.error('PSONO Security: Manual check detected overlay attack - closing dropdown');
                close();
                return true;
            }
            console.log('PSONO Security: Manual check passed - no overlay detected');
            return false;
        }

        // Expose manual check function globally for testing
        if (typeof window !== 'undefined') {
            window.psonoManualOverlayCheck = manualOverlayCheck;
        }

        return {
            open: open,
            close: close,
            getElement: getElement,
            getShadowRoot: getShadowRoot,
            manualOverlayCheck: manualOverlayCheck,
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
     * Handler for a fillidentity event
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onFillIdentity(data, sender, sendResponse) {
        for (let i = 0; i < identityInputFields.length; i++) {
            const autocompleteValue = identityInputFields[i].autocomplete.trim().toLowerCase();

            if (autocompleteValue === "name" && 
                ((data.hasOwnProperty("identity_first_name") && data.identity_first_name !== "") || 
                (data.hasOwnProperty("identity_last_name") && data.identity_last_name !== ""))) {
                const fullName = [
                    data.hasOwnProperty("identity_first_name") ? data.identity_first_name : "",
                    data.hasOwnProperty("identity_last_name") ? data.identity_last_name : ""
                ].filter(Boolean).join(" ");
                
                if (fullName) {
                    fillFieldHelper(identityInputFields[i], fullName);
                }
            }
            else if (autocompleteValue === "given-name" && 
                     data.hasOwnProperty("identity_first_name") && data.identity_first_name !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_first_name);
            }
            else if (autocompleteValue === "family-name" && 
                     data.hasOwnProperty("identity_last_name") && data.identity_last_name !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_last_name);
            }

            else if (autocompleteValue === "street-address" && 
                     data.hasOwnProperty("identity_address") && data.identity_address !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_address);
            }
            else if ((autocompleteValue === "address-line1" || autocompleteValue === "address-line2" || autocompleteValue === "address-line3") && 
                     data.hasOwnProperty("identity_address") && data.identity_address !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_address);
            }
            else if (autocompleteValue === "address-level1" && 
                     data.hasOwnProperty("identity_state") && data.identity_state !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_state);
            }
            else if (autocompleteValue === "address-level2" && 
                     data.hasOwnProperty("identity_city") && data.identity_city !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_city);
            }
            else if (autocompleteValue === "postal-code" && 
                     data.hasOwnProperty("identity_postal_code") && data.identity_postal_code !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_postal_code);
            }
            else if ((autocompleteValue === "country" || autocompleteValue === "country-name") && 
                     data.hasOwnProperty("identity_country") && data.identity_country !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_country);
            }

            else if ((autocompleteValue === "tel" || 
                    autocompleteValue === "tel-national" || 
                    autocompleteValue === "tel-local") && 
                    data.hasOwnProperty("identity_phone_number") && data.identity_phone_number !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_phone_number);
            }
            else if (autocompleteValue === "email" && 
                     data.hasOwnProperty("identity_email") && data.identity_email !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_email);
            }
            else if (autocompleteValue === "organization" && 
                     data.hasOwnProperty("identity_company") && data.identity_company !== "") {
                fillFieldHelper(identityInputFields[i], data.identity_company);
            }
        }

        const inputs = Array.from(querySelectorAllIncShadowRoots(document, "input"));

        const fieldNameMappings = {
            'first-name': 'identity_first_name',
            'firstname': 'identity_first_name',
            'fname': 'identity_first_name',
            'last-name': 'identity_last_name',
            'lastname': 'identity_last_name',
            'lname': 'identity_last_name',
            'address': 'identity_address',
            'street': 'identity_address',
            'street-address': 'identity_address',
            'postal-code': 'identity_postal_code',
            'postalcode': 'identity_postal_code',
            'zip': 'identity_postal_code',
            'zipcode': 'identity_postal_code',
            'city': 'identity_city',
            'state': 'identity_state',
            'province': 'identity_state',
            'country': 'identity_country',
            'phone': 'identity_phone_number',
            'tel': 'identity_phone_number',
            'telephone': 'identity_phone_number',
            'mobile': 'identity_phone_number',
            'company': 'identity_company',
            'organization': 'identity_company'
        };

        inputs.forEach(input => {
            if (input.type === 'password' || input.type === 'hidden') return;
            
            const inputName = (input.name || input.id || '').toLowerCase();
            
            Object.entries(fieldNameMappings).forEach(([fieldName, dataProperty]) => {
                if (inputName === fieldName || inputName.includes(fieldName)) {
                    if (data.hasOwnProperty(dataProperty) && data[dataProperty] !== "") {
                        fillFieldHelper(input, data[dataProperty]);
                    }
                }
            });
        });
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
     * @param {string} urlFilter The url filter, e.g. *.example.com, www.example.com, blub.com:*, or *.blub.com:*
     *
     * @returns {boolean} Whether the filter matches the authority
     */
    function isUrlFilterMatch(authority, urlFilter) {
        if (!authority || !urlFilter) {
            return false
        }
        authority = authority.toLowerCase();
        urlFilter = urlFilter.toLowerCase();
        
        // Direct exact match
        if (authority === urlFilter) {
            return true;
        }
        
        // Handle port wildcard patterns (e.g., "blub.com:*" or "*.blub.com:*")
        if (urlFilter.endsWith(':*')) {
            const filterWithoutPortWildcard = urlFilter.slice(0, -2); // Remove ":*"
            const authorityParts = authority.split(':');
            const authorityHost = authorityParts[0];
            
            // Check if the host part matches the filter (with potential domain wildcard)
            if (filterWithoutPortWildcard.startsWith('*.')) {
                // Pattern like "*.blub.com:*" should match "sub.blub.com:1234"
                const domainPattern = filterWithoutPortWildcard.substring(1); // Remove "*"
                return authorityHost.endsWith(domainPattern);
            } else {
                // Pattern like "blub.com:*" should match "blub.com:1234"
                return authorityHost === filterWithoutPortWildcard;
            }
        }
        
        // Handle domain wildcard patterns (existing logic for "*.example.com")
        if (urlFilter.startsWith('*.')) {
            return authority.endsWith(urlFilter.substring(1));
        }
        
        return false;
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
