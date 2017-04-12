/**
 * The minimal browser client for form fills
 *
 * @returns {{emit: emit, on: on}}
 */
var browserClient = function() {

    var registrations = {};

    /**
     * sends an event message to browser
     *
     * @param event
     * @param data
     */
    var emit = function (event, data) {
        chrome.runtime.sendMessage({event: event, data: data}, function(response) {
            for (var i = 0; registrations.hasOwnProperty(response.event) && i < registrations[response.event].length; i++) {
                registrations[response.event][i](response.data);
            }
        });
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
        if (!registrations.hasOwnProperty(event)) {
            registrations[event] = [];
        }
        registrations[event].push(myFunction);
    };

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
            registrations[request.event][i](request.data);
        }
    });

    return {
        emit: emit,
        on: on
    };
};