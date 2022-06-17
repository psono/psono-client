/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptPGP = function (base, browser, jQuery, setTimeout) {
    "use strict";

    // to implement gmx, web.de outlook.com, t-online, yahoo, hotmail
    var supported_hoster = [
        {
            'name': 'gmail',
            'domain_filter': function() {
                return window.location.href.toLowerCase().indexOf('mail.google.com') !== -1;
            },
            'get_pgp_content': function (node) {
                var direct_parent = jQuery(node).parent();
                return direct_parent.text();
            },
            'get_sender': function (node) {
                // var direct_parent = jQuery(node).parent();
                // var top_parent = direct_parent.parents('.gs').first();
                // return top_parent.find("span.gD").data('hovercardId');
                return [];
            },
            'get_receiver': function (node) {
                return [];
            },
            'get_content_editable_fields': function (node) {
                return jQuery('textarea, [contenteditable="true"]').filter(':visible')
            }
        },
        {
            'name': 'livecom',
            'domain_filter': function() {
                return window.location.href.toLowerCase().indexOf('outlook.live.com') !== -1;
            },
            'get_pgp_content': function (node) {
                var direct_parent = jQuery(node).parent();
                return direct_parent.text();
            },
            'get_sender': function (node) {
                return [];
            },
            'get_receiver': function (node) {
                return [];
            },
            'get_content_editable_fields': function (node) {
                return jQuery('textarea, [contenteditable="true"]').filter(':visible')
            }
        },
        {
            'name': 'yahoo',
            'domain_filter': function() {
                return window.location.href.toLowerCase().indexOf('mail.yahoo.com') !== -1;
            },
            'get_pgp_content': function (node) {
                var direct_parent = jQuery(node).parent();
                return direct_parent.text();
            },
            'get_sender': function (node) {
                return [];
            },
            'get_receiver': function (node) {
                return [];
            },
            'get_content_editable_fields': function (node) {
                return jQuery('textarea, [contenteditable="true"]').filter(':visible')
            }
        }
    ];
    // var default_hoster = {
    //     'name': 'default',
    //     'domain_filter': function() {
    //         return true; // lets start with always true and see how that plays out
    //     },
    //     'get_pgp_content': function (node) {
    //         var direct_parent = jQuery(node).parent();
    //         return direct_parent.text();
    //     },
    //     'get_sender': function (node) {
    //         var direct_parent = jQuery(node).parent();
    //         var top_parent = direct_parent.parents('.gs').first();
    //         return top_parent.find("span.gD").data('hovercardId');
    //     },
    //     'get_receiver': function (node) {
    //         return [];
    //     }
    // };


    jQuery(function() {
        activate();
    });

    function activate() {
        base.register_observer(analyze_document);
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
    function get_supported_hoster(type) {
        for (var i = 0; i < supported_hoster.length; i++) {
            if (supported_hoster[i].hasOwnProperty('domain_filter') && supported_hoster[i].domain_filter()) {
                return supported_hoster[i];
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


    /**
     * Searches a document if it has a pgp message to decode and if yes add the necessary dom elements
     * RFC to filter messages https://tools.ietf.org/html/rfc4880
     *
     * inspided by https://developer.mozilla.org/de/docs/Web/API/Document/createTreeWalker
     *
     * @param document
     */
    function add_pgp_message_readers(document) {

        var hoster = get_supported_hoster('PGP MESSAGE');
        if (hoster === null) {
            return;
        }

        var tree_walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
                if (node.textContent.includes('-----BEGIN PGP MESSAGE')
                    && !node.parentNode.classList.contains('psono-add_pgp_message_readers-covered')
                    && jQuery(node.parentNode).is(':visible')
                    && jQuery(node).parents('[contenteditable]').length === 0
                    && jQuery(node).parents('textarea').length === 0
                ) {

                    node.parentNode.classList.add("psono-add_pgp_message_readers-covered");
                    return NodeFilter.FILTER_ACCEPT;
                } else {
                    return NodeFilter.FILTER_REJECT;
                }
            }});

        while(tree_walker.nextNode()) {

            var node = tree_walker.currentNode;

            var pgp_content = hoster.get_pgp_content(node);
            var pgp_sender = hoster.get_sender(node);

            // Attach our element with the parsed information
            var element_id = 'psono_pgp_reader-' + uuid.v4();
            var element = jQuery('' +
                '<div class="psono-pw-pgp-link yui3-cssreset">' +
                '    <div style="max-width: 150px">' +
                '        <img class="'+element_id+'" width="100%" data-pgp-content="'+pgp_content+'" data-pgp-sender="'+pgp_sender+'" src="' + browser.runtime.getURL("data/img/psono-decrypt.png") + '">' +
                '    </div>' +
                '</div>');

            var parent = node.parentElement.closest('div');
            element.prependTo(parent);
            jQuery( parent.getElementsByClassName(element_id) ).on( "click", function() {
                decryptGPG(jQuery(this).attr('data-pgp-content'), jQuery(this).attr('data-pgp-sender'));
            });
        }

    }


    /**
     * Searches a document for the edit / write box and adds the small pen logo
     *
     * @param document
     */
    function add_pgp_message_writers(document) {

        var hoster = get_supported_hoster('');
        if (hoster === null) {
            return;
        }
        var fields = hoster.get_content_editable_fields().not('.psono-add_pgp_message_writers-covered');
        for (var i = 0; i < fields.length; ++i) {
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
        var field = jQuery(node);
        field.addClass("psono-add_pgp_message_writers-covered");
        base.modify_input_field(node, browser.runtime.getURL("data/img/psono-encrypt.png"), 'top right', {node: node, get_receiver: hoster.get_receiver}, onClick, mouseOver, mouseOut, mouseMove);
    }

    /**
     * triggered when a click happens in an input field. Used to open the drop down menu and handle the closing
     * once a click happens outside of the dropdown menu
     *
     * @param evt Click event
     * @param target The original element that this event was bound to
     * @param click_data The data specified before to pass on
     */
    function onClick(evt, target, click_data) {
        if (getDistance(evt, target) < 30 && getDistance(evt, target) > 0) {
            var field = jQuery(click_data['node']);
            var receiver = click_data['get_receiver'](click_data['node']);
            encryptGPG (field, receiver)
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

        var left_border = target.getBoundingClientRect().left;
        var top_border = target.getBoundingClientRect().top;

        var distance_x = jQuery(target).width()
            - evt.pageX
            + left_border
            + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);

        var distance_y = top_border - evt.pageY;

        if (distance_y > -27 && distance_x < 51) {
            return 1
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
    function mouseMove (evt, target) {
        if (getDistance(evt, target) < 30 && getDistance(evt, target) > 0) {
            evt.target.style.cursor = 'pointer';
        } else {
            evt.target.style.cursor = 'auto';
        }
    }

    /**
     * Sends a GPG encrypted message to the backend once someone clicks the "DECRYPT" button
     *
     * @param message
     * @param sender
     */
    function decryptGPG (message, sender) {
        base.emit('decrypt-gpg', {
            message: message,
            sender: sender
        });
    }

    /**
     * Requests a GPG encrypted message from the backend
     *
     * @param text_element
     * @param receiver
     */
    function encryptGPG (text_element, receiver) {
        base.emit('encrypt-gpg', {
            receiver: receiver
        }, function(data) {
            if (text_element.is('[contenteditable="true"]')) {
                text_element.append('<pre>' + data.message + '<pre/>');
            } else {
                text_element.val(data.message + "\n" + text_element.val())
            }
        });
    }


};