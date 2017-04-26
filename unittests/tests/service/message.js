(function () {
    describe('Service: message test suite', function () {

        beforeEach(module('psonocli'));

        it('message exists', inject(function (message) {
            expect(message).toBeDefined();
        }));

        it('message:on', inject(function (message) {

            var dummy_data = "1234";

            var dummy = {
                my_callback_fct: function(data) {
                },
                my_second_callback_fct: function(data) {
                }
            };

            spyOn(dummy, 'my_callback_fct');
            spyOn(dummy, 'my_second_callback_fct');

            message.on('test_event', dummy.my_callback_fct);
            message.on('test_event', dummy.my_second_callback_fct);
            message.emit('test_event', dummy_data);

            expect(dummy.my_callback_fct).toHaveBeenCalledWith(dummy_data);
            expect(dummy.my_second_callback_fct).toHaveBeenCalledWith(dummy_data);
        }));

        it('message:on', inject(function (message) {

            var dummy_data = "1234";

            message.emit('test_event', dummy_data);
            
        }));
    });

}).call();
