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
        self.port.emit(event, data);
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
        self.port.on(event, myFunction);
    };

    return {
        emit: emit,
        on: on
    };
};