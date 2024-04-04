/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptPGP = function (base, browser, setTimeout) {
    "use strict";

    function htmlToText(str) {
        str = str.replace(/<\/(div|p)>/g, "\n");
        str = str.replace(/<br>/g, "\n");
        str = str.replace(/<(.+?)>/g, "");
        return str;
    }

    function stringToBase64 (str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    function base64ToString (base64EncodedString) {
        return decodeURIComponent(escape(atob(base64EncodedString)));
    }

    // to implement gmx, web.de outlook.com, t-online, yahoo, hotmail
    const supportedHoster = [
        {
            name: "gmail",
            domain_filter: function () {
                return window.location.host.toLowerCase() === "mail.google.com";
            },
            getPgpContent: function (node) {
                let directParent = node.parentNode;
                if (!directParent.textContent.includes("-----END PGP MESSAGE-----")) {
                    directParent = directParent.parentNode;
                }
                let htmlText = directParent.innerHTML;
                return htmlToText(htmlText);
            },
            getSender: function (node) {
                return "";
            },
            getReceiver: function (node) {
                return [];
            },
            getContentEditableFields: function (node) {
                const elements = document.querySelectorAll('textarea, [contenteditable="true"]');
                const visibleElements = Array.from(elements).filter(function(el) {
                    return el.offsetWidth > 0 && el.offsetHeight > 0;
                });
                return visibleElements;
            },
        },
        {
            name: "livecom",
            domain_filter: function () {
                return window.location.host.toLowerCase() === "outlook.live.com";
            },
            getPgpContent: function (node) {
                const directParent = node.parentNode;
                return directParent.textContent;
            },
            getSender: function (node) {
                return "";
            },
            getReceiver: function (node) {
                return [];
            },
            getContentEditableFields: function (node) {
                const elements = document.querySelectorAll('textarea, [contenteditable="true"]');
                const visibleElements = Array.from(elements).filter(function(el) {
                    return el.offsetWidth > 0 && el.offsetHeight > 0;
                });
                return visibleElements;
            },
        },
        {
            name: "outlookoffice365com",
            domain_filter: function () {
                return window.location.host.toLowerCase() === "outlook.office365.com";
            },
            getPgpContent: function (node) {
                const directParent = node.parentNode;
                return directParent.textContent;
            },
            getSender: function (node) {
                return "";
            },
            getReceiver: function (node) {
                return [];
            },
            getContentEditableFields: function (node) {
                const elements = document.querySelectorAll('textarea, [contenteditable="true"]');
                const visibleElements = Array.from(elements).filter(function(el) {
                    return el.offsetWidth > 0 && el.offsetHeight > 0;
                });
                return visibleElements;
            },
        },
        {
            name: "yahoo",
            domain_filter: function () {
                return window.location.host.toLowerCase() === "mail.yahoo.com";
            },
            getPgpContent: function (node) {
                const directParent = node.parentNode;
                return directParent.textContent;
            },
            getSender: function (node) {
                return "";
            },
            getReceiver: function (node) {
                return [];
            },
            getContentEditableFields: function (node) {
                const elements = document.querySelectorAll('textarea, [contenteditable="true"]');
                const visibleElements = Array.from(elements).filter(function(el) {
                    return el.offsetWidth > 0 && el.offsetHeight > 0;
                });
                return visibleElements;
            },
        },
    ];

    base.ready(function() {
        activate();
    });

    function activate() {
        base.registerObserver(analyze_document);
    }

    /**
     * Analyse a document and adds all forms and handlers to them
     *
     * @param document
     */
    function analyze_document(document) {
        add_pgp_message_readers(document);
        add_pgp_message_writers(document);
    }

    /**
     * Returns null or a supported hoster that can filter the pgp content (and detect the senders)#
     *
     * @returns {*}
     */
    function get_supportedHoster(type) {
        for (let i = 0; i < supportedHoster.length; i++) {
            if (supportedHoster[i].hasOwnProperty("domain_filter") && supportedHoster[i].domain_filter()) {
                return supportedHoster[i];
            }
        }

        // // we have a reader, so lets return the default hoster
        // if (type) {
        //     if (default_hoster.hasOwnProperty('domain_filter') && default_hoster.domain_filter()) {
        //         return default_hoster;
        //     }
        // }

        return null;
    }


    function isElementVisible(elem) {
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    }

    function hasParentWithSelector(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return true;
            }
            element = element.parentElement;
        }
        return false;
    }

    /**
     * Searches a document if it has a pgp message to decode and if yes add the necessary dom elements
     * RFC to filter messages https://tools.ietf.org/html/rfc4880
     *
     * inspided by https://developer.mozilla.org/de/docs/Web/API/Document/createTreeWalker
     *
     * @param document
     */
    function add_pgp_message_readers(document) {
        const hoster = get_supportedHoster("PGP MESSAGE");
        if (hoster === null) {
            return;
        }

        const tree_walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (
                    node.textContent.includes("-----BEGIN PGP MESSAGE") &&
                    !node.parentNode.classList.contains("psono-add_pgp_message_readers-covered") &&
                    isElementVisible(node.parentNode) &&
                    !hasParentWithSelector(node, "[contenteditable]") &&
                    !hasParentWithSelector(node, "textarea")
                ) {
                    node.parentNode.classList.add("psono-add_pgp_message_readers-covered");
                    return NodeFilter.FILTER_ACCEPT;
                } else {
                    return NodeFilter.FILTER_REJECT;
                }
            },
        });

        while (tree_walker.nextNode()) {
            var node = tree_walker.currentNode;

            var pgpContent = hoster.getPgpContent(node);
            var pgp_sender = hoster.getSender(node);

            var pgpContent_base64 = stringToBase64(pgpContent);
            var pgp_sender_base64 = stringToBase64(pgp_sender);

            // Create and configure the new element with the parsed information
            var elementId = "psono_pgp_reader-" + uuid.v4();
            var element = document.createElement('div');
            element.className = 'psono-pgp-link yui3-cssreset';
            element.innerHTML = '<div style="max-width: 150px">' +
                '    <img class="' + elementId + '" width="100%" data-pgp-content="' +
                pgpContent_base64 + '" data-pgp-sender="' + pgp_sender_base64 +
                '" src="' + browser.runtime.getURL("data/img/psono-decrypt.png") + '">' +
                '</div>';

            var parent = node.parentElement.closest("div");
            if (parent) {
                // Prepend the new element to the parent
                parent.insertBefore(element, parent.firstChild);

                // Attach event listener for clicks on the new element
                var imgElement = parent.getElementsByClassName(elementId)[0];
                if (imgElement) {
                    imgElement.addEventListener("click", function() {
                        decryptGPG(base64ToString(this.getAttribute("data-pgp-content")),
                            base64ToString(this.getAttribute("data-pgp-sender")));
                    });
                }
            }
        }
    }

    /**
     * Searches a document for the edit / write box and adds the small pen logo
     *
     * @param document
     */
    function add_pgp_message_writers(document) {
        const hoster = get_supportedHoster("");
        if (hoster === null) {
            return;
        }
        const fields = hoster.getContentEditableFields();

        for (let i = 0; i < fields.length; ++i) {
            if (fields[i].classList.contains(".psono-add_pgp_message_writers-covered")) {
                continue;
            }
            add_pgp_message_writer(hoster, fields[i]);
        }
    }

    /**
     * Adds the small pen logo to a textarea or editable div
     *
     * @param hoster
     * @param node
     */
    function add_pgp_message_writer(hoster, node) {
        node.classList.add("psono-add_pgp_message_writers-covered");
        base.modifyInputField(
            node,
            browser.runtime.getURL("data/img/psono-encrypt.png"),
            "top right",
            { node: node, getReceiver: hoster.getReceiver },
            onClick,
            mouseOver,
            mouseOut,
            mouseMove
        );
    }

    /**
     * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
     * once a click happens outside of the dropdown menu
     *
     * @param evt Click event
     * @param target The original element that this event was bound to
     * @param clickData The data specified before to pass on
     * @param input The input element firing the event
     */
    function onClick(evt, target, clickData, input) {
        if (getDistance(evt, target) < 30 && getDistance(evt, target) > 0) {
            const field = clickData["node"]; // Assuming 'node' is a DOM element
            const receiver = clickData["getReceiver"](clickData["node"]);
            encryptGPG(field, receiver);
        }
    }

    /**
     * called within an event in a input field. Used to measure the distance from the right border of the input
     * element and the mouse at the moment of the click
     *
     * @param evt event
     * @param target The target that this element was bound to
     * @returns {number} Distance
     */
    function getDistance(evt, target) {
        const rect = target.getBoundingClientRect();
        const leftBorder = rect.left;
        const topBorder = rect.top;

        const distanceX =
            target.offsetWidth -
            evt.pageX +
            leftBorder +
            (document.documentElement.scrollLeft || document.body.scrollLeft);

        const distanceY = topBorder - evt.pageY;

        if (distanceY > -27 && distanceX < 51) {
            return 1;
        }

        return 0;
    }

    /**
     * triggered once the mouse is over the input field. Used to set the background to the hover image
     *
     * @param evt Mouse over event
     * @param target The original element that this event was bound to
     */
    function mouseOver(evt, target) {
        //evt.target.style.backgroundImage = 'url("' + background_image_hover + '")';
    }

    /**
     * triggered once the mouse leaves the input field. Used to set the background to the normal image
     *
     * @param evt Mouse out event
     * @param target The original element that this event was bound to
     */
    function mouseOut(evt, target) {
        //evt.target.style.backgroundImage = 'url("' + background_image + '")';
    }

    /**
     * triggered when the mouse moves in the input field. Used to adjust the mouse cursor according to the distance
     * to the right border
     *
     * @param evt Mouse move event
     * @param target The original element that this event was bound to
     */
    function mouseMove(evt, target) {
        if (getDistance(evt, target) < 30 && getDistance(evt, target) > 0) {
            evt.target.style.cursor = "pointer";
        } else {
            evt.target.style.cursor = "auto";
        }
    }

    /**
     * Sends a GPG encrypted message to the backend once someone clicks the "DECRYPT" button
     *
     * @param message
     * @param sender
     */
    function decryptGPG(message, sender) {
        base.emit("decrypt-gpg", {
            message: message,
            sender: sender,
        });
    }

    /**
     * Requests a GPG encrypted message from the backend
     *
     * @param text_element
     * @param receiver
     */
    function encryptGPG(text_element, receiver) {
        base.emit(
            "encrypt-gpg",
            {
                receiver: receiver,
            },
            function (data) {
                if (text_element.is('[contenteditable="true"]')) {
                    text_element.append("<pre>" + data.message + "<pre/>");
                } else {
                    text_element.val(data.message + "\n" + text_element.val());
                }
            }
        );
    }
};
