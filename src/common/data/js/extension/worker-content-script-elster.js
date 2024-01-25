/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptElster = function (base, browser, setTimeout) {
    "use strict";
    let lastCloseTime = 0;

    let buttonImage =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTUgMTUiIHZlcnNpb249IjEuMSI+CiAgICA8ZyBpZD0ic3VyZmFjZTEiPgogICAgICAgIDxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMCwxOTAsMjU1KTsiIGQ9Ik0gMC42OTUzMTIgMy43ODkwNjIgTCAzLjE3NTc4MSA1LjE3OTY4OCBMIDcuNTY2NDA2IDIuNzM0Mzc1IEwgMTEuOTE0MDYyIDUuMTYwMTU2IEwgMTQuMzc4OTA2IDMuODA4NTk0IEwgNy41ODU5MzggMC4wNDY4NzUgWiBNIDAuNjk1MzEyIDMuNzg5MDYyICIvPgogICAgICAgIDxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMCwxOTAsMjU1KTsiIGQ9Ik0gNS4xNjAxNTYgNS44NjcxODggTCA3LjU3MDMxMiA3LjIxODc1IEwgOS45MjE4NzUgNS45NTMxMjUgTCA3LjU2NjQwNiA0LjY1MjM0NCBaIE0gNS4xNjAxNTYgNS44NjcxODggIi8+CiAgICAgICAgPHBhdGggc3R5bGU9IiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOnJnYigwLDE5MCwyNTUpOyIgZD0iTSAwLjY5NTMxMiAzLjc3MzQzOCBMIDAuNjk1MzEyIDExLjIxMDkzOCBMIDMuMTc1NzgxIDEyLjUzMTI1IEwgMy4xOTUzMTIgNS4xNzk2ODggWiBNIDAuNjk1MzEyIDMuNzczNDM4ICIvPgogICAgICAgIDxwYXRoIHN0eWxlPSIgc3Ryb2tlOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7ZmlsbDpyZ2IoMCwxOTAsMjU1KTsiIGQ9Ik0gNS4xNzU3ODEgNS44NjcxODggTCA1LjE1NjI1IDguMzA4NTk0IEwgNy41NjY0MDYgOS41OTM3NSBMIDkuOTM3NSA4LjI3NzM0NCBMIDkuOTM3NSA1Ljk5MjE4OCBMIDcuNTg1OTM4IDcuMjM4MjgxIFogTSA1LjE3NTc4MSA1Ljg2NzE4OCAiLz4KICAgICAgICA8cGF0aCBzdHlsZT0iIHN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6cmdiKDAsMTkwLDI1NSk7IiBkPSJNIDExLjg5ODQzOCA1LjE3OTY4OCBMIDExLjkxNDA2MiA5LjExNzE4OCBMIDcuNTY2NDA2IDExLjQ4ODI4MSBMIDUuMTc1NzgxIDEwLjI0MjE4OCBMIDUuMTc1NzgxIDEzLjYzMjgxMiBMIDcuNTQ2ODc1IDE0Ljk1MzEyNSBMIDE0LjQxNzk2OSAxMS4yMDcwMzEgTCAxNC4zNzg5MDYgMy44Mzk4NDQgWiBNIDExLjg5ODQzOCA1LjE3OTY4OCAiLz4KICAgIDwvZz4KPC9zdmc+Cg==";


    base.ready(function() {
        activate();
    });

    function activate() {
        if (document.defaultView.location.origin + document.defaultView.location.pathname === 'https://www.elster.de/eportal/login/softpse') {
            // we use origin and pathname instead of href as we also want to support this url
            // https://www.elster.de/eportal/login/softpse?locale=en_US
            base.registerObserver(analyze_document);
        }
    }

    /**
     * Analyse a document and adds all forms and handlers to them
     *
     * @param document
     */
    function analyze_document(document) {
        addDropdownMenuButton(document);
        // add_pgp_message_writers(document);
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
     * hex to Uint8Array converter from nacl_factory.js
     * https://github.com/tonyg/js-nacl
     *
     * @param {string} val As hex encoded value
     *
     * @returns {Uint8Array} Returns Uint8Array representation
     */
    function fromHex(val) {
        const result = new Uint8Array(val.length / 2);
        for (let i = 0; i < val.length / 2; i++) {
            result[i] = parseInt(val.substr(2 * i, 2), 16);
        }
        return result;
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
        }, async (response) => {

            let fileName = response.data.elster_certificate_title.replace(/\s/g,'');
            if (!fileName.toLowerCase().endsWith('.pfx')) {
                fileName = fileName + '.pfx';
            }
            const content = fromHex(response.data.elster_certificate_file_content);

            // fill certificate field
            const blob = new Blob([content], { type: 'application/x-pkcs12' });
            const file = new File([blob], fileName, {
                type: 'application/x-pkcs12',
            });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const inputElement = document.getElementById('loginBox.file_cert');
            inputElement.files = dataTransfer.files;
            inputElement.dispatchEvent(new Event('change'));
            // small animation
            if (!inputElement.classList.contains("psono-autofill-style")) {
                inputElement.classList.add('psono-autofill-style');
                setTimeout(function () {
                    if (inputElement) {
                        inputElement.classList.remove('psono-autofill-style');
                    }
                }, 100);
            }


            // fill password field
            const passwordField = document.getElementById("password");
            passwordField.focus();
            passwordField.value = response.data.elster_certificate_password;
            ['keydown', 'keypress', 'keyup', 'change', 'blur', 'input'].forEach(eventType => {
                passwordField.dispatchEvent(new Event(eventType, {
                    bubbles: true,
                    cancelable: true,
                }));
            });
            // small animation
            if (!passwordField.classList.contains("psono-autofill-style")) {
                passwordField.classList.add('psono-autofill-style');
                setTimeout(function () {
                    if (passwordField) {
                        passwordField.classList.remove('psono-autofill-style');
                    }
                }, 100);
            }

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
     * Manipulates the forms and adds the button next to the login button
     *
     * @param document
     */
    function addDropdownMenuButton(document) {

        const loginButton = document.getElementById("bestaetigenButton");
        const elsterDropdownMenu = document.getElementById("psonoDropdownMenuElster"); // check if we already did run our logic
        if (!loginButton || elsterDropdownMenu) {
            return;
        }

        const loginButtonLi = loginButton.parentElement; // the li element encapsulating the login button
        const loginButtonUl = loginButtonLi.parentElement; // the ul element encapsulating the li element

        const listItem = document.createElement('li');
        listItem.className = 'alignment__item';
        listItem.style.marginLeft = '5px';

        const button = document.createElement('button');
        button.className = 'interactive interactive-icon--invert';
        button.id = 'psonoDropdownMenuElster';
        button.style.paddingBottom = '4px';

        const img = new Image();
        img.src = buttonImage;
        img.width = 20;
        img.height = 20;

        button.appendChild(img);
        listItem.appendChild(button);
        loginButtonUl.appendChild(listItem);

        button.addEventListener("click", function (evt) {
            handleButtonClick(evt, this, document);
        });

    }


    function handleButtonClick(evt, target, document) {
        base.emit("elster-certificate-refresh", document.location.toString(), async (response) => {

            let openDatastoreClass = "psono_open-datastore-" + uuid.v4();
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
                        '<li>No certificates found</li>';
                }
                if (response.data.length > 5) {
                    dropcontent += '<li><input type="text" class="psono-search-input" placeholder="Search..." /></li>';
                }
                for (let i = 0; i < response.data.length; i++) {
                    let sanitizedText = sanitizeText(response.data[i].name)
                    let requestSecretClass = "psono_request-secret-" + uuid.v4();
                    let style = '';
                    if (i >= 5) {
                        style = 'display:none !important';
                    }
                    dropcontent +=
                        '<li class="psono_request-secret" style="'+style+'"><div class="' +
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

            // lastRequestElement = evt.target;

            let dropInstance = createDropdownMenu(evt, dropcontent, document);
            dropInstance.open();

            // dropInstances.push(dropInstance);

            setTimeout(function () {
                let element = dropInstance.getElement();

                let openDatastoreElements = element.getElementsByClassName(openDatastoreClass);
                for (let el of openDatastoreElements) {
                    el.addEventListener("click", function () {
                        openDatastore();
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
                    let listItems = document.querySelectorAll('.psono_request-secret');

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

        })
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


};
