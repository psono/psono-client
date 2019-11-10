/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptBase = function (browser, jQuery, setTimeout) {
    "use strict";
    var registrations = {};
    var observer_executables = [];
    var documents = [];
    var windows = [];

    activate();
    function activate() {

        jQuery(function() {
            var i;
            get_all_documents(window, documents, windows);
            for (i = 0; i < windows.length; i++) {
                observe(windows[i]);
            }
        });
        browser.runtime.onMessage.addListener(onMessage);
    }

    function get_all_documents(window, documents, windows) {
        var frames = window.document.querySelectorAll('iframe');
        windows.push(window);
        documents.push(window.document);

        for (var i = 0; i < frames.length; i++) {
            try {
                get_all_documents(frames[i].contentWindow.document, documents, windows);
            } catch (e) {
                //console.log(e);
            }
        }
    }

    function observe(window) {
        var doc = window.document;
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var observer = new MutationObserver(function(mutations) {
            // watch for changes, but block multiple executions for potentially the same event
            // by delaying the actual execution for 300ms and blocking all events within this timeslot to fire again
            if (doc.analyze_waiting) {
                return;
            }
            doc.analyze_waiting = true;
            setTimeout(function(){
                for (var i = 0; i < observer_executables.length; i++) {
                    observer_executables[i](doc)
                }
                doc.analyze_waiting = false;
            }, 300);
        });
        //var config = { attributes: true, childList: true, characterData: true, subtree:true };
        var config = { childList: true, characterData: true, subtree:true };
        observer.observe(doc.body, config)

    }
    function register_observer(fnc) {
        observer_executables.push(fnc);
        for (var i = 0; i < documents.length; i++) {
            fnc(documents[i]);
        }
    }


    /**
     * modifies an input field and adds the image button to click together with the appropriate event handlers
     *
     * @param input
     * @param background_image
     * @param position
     * @param document
     * @param click
     * @param mouseOver
     * @param mouseOut
     * @param mouseMove
     */
    function modify_input_field(input, background_image, position, document, click, mouseOver, mouseOut, mouseMove) {
        input.style.setProperty('background-image', 'url("'+background_image+'")', 'important');
        input.style.setProperty('background-position', position, 'important');
        input.style.setProperty('background-repeat', 'no-repeat', 'important');
        input.style.setProperty('background-size', 'auto', 'important');

        if (mouseOver) {
            input.addEventListener('mouseover', function(evt) {
                mouseOver(evt, this)
            });
        }
        if (mouseOut) {
            input.addEventListener('mouseout', function(evt) {
                mouseOut(evt, this)
            });
        }
        if (mouseMove) {
            input.addEventListener('mousemove', function(evt) {
                mouseMove(evt, this)
            });
        }
        if (click) {
            input.addEventListener('click', function(evt) {
                click(evt, this, document)
            });
        }
    }



    /**
     * sends an event message to browser
     *
     * @param event
     * @param data
     * @param func
     */
    function emit(event, data, func) {
        browser.runtime.sendMessage({event: event, data: data}, function(response) {
            if (func) {
                func(response);
            }
            if (typeof(response) === 'undefined' || !response.hasOwnProperty('event')) {
                return;
            }
            for (var i = 0; registrations.hasOwnProperty(response.event) && i < registrations[response.event].length; i++) {
                registrations[response.event][i](response.data);
            }
        });
    }

    /**
     * registers for an event with a function
     *
     * @param event
     * @param myFunction
     *
     * @returns {boolean}
     */
    function on(event, myFunction) {
        if (!registrations.hasOwnProperty(event)) {
            registrations[event] = [];
        }
        registrations[event].push(myFunction);
    }

    /**
     * Main handler for all messages
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function onMessage(request, sender, sendResponse){
        for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
            registrations[request.event][i](request.data);
        }
    }

    return {
        get_all_documents: get_all_documents,
        register_observer: register_observer,
        modify_input_field: modify_input_field,
        emit: emit,
        on: on,
        onMessage: onMessage
    }


};