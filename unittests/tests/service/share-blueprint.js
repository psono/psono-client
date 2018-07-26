(function () {
    describe('Service: shareBlueprint test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        var shareBlueprint;
        beforeEach(inject(function($injector){
            // unwrap necessary services
            shareBlueprint = $injector.get('shareBlueprint');
        }));

        it('shareBlueprint exists', inject(function (shareBlueprint) {
            expect(shareBlueprint).toBeDefined();
        }));


        it('get_blueprint can fetch user', inject(function (shareBlueprint) {

            var blueprint = shareBlueprint.get_blueprint('user');

            expect(blueprint).toBeTruthy();
        }));

        it('get_blueprint returns false in case of not found', inject(function (shareBlueprint) {

            var blueprint = shareBlueprint.get_blueprint('i-am-sure-that-i-dont-exist');

            expect(blueprint).toBeFalsy();
        }));

        it('get_default_blueprint_key returns users', inject(function (shareBlueprint) {

            var default_blueprint = shareBlueprint.get_default_blueprint_key();

            expect(default_blueprint).toBe('user');
        }));

        it('get_default_blueprint is users blueprint', inject(function (shareBlueprint) {

            var default_blueprint = shareBlueprint.get_default_blueprint();

            expect(default_blueprint).toEqual(shareBlueprint.get_blueprint('user'));
        }));

        it('get_additional_functions is empty', inject(function (shareBlueprint) {

            var additional_functions = shareBlueprint.get_additional_functions();

            expect(additional_functions).toEqual([]);
        }));

        it('get_additional_functions is empty', inject(function (shareBlueprint) {

            var blueprints = shareBlueprint.get_blueprints();

            for (var i = 0; i < blueprints.length; i++) {

                expect(blueprints[i].hasOwnProperty('id')).toBeTruthy();
                expect(blueprints[i].hasOwnProperty('name')).toBeTruthy();
                expect(blueprints[i].hasOwnProperty('title_field')).toBeTruthy();
                expect(blueprints[i].hasOwnProperty('search')).toBeTruthy();
                expect(blueprints[i].hasOwnProperty('fields')).toBeTruthy();
            }
        }));

        it('blueprint_has_on_click_new_tab for user returns false', inject(function () {

            expect(shareBlueprint.blueprint_has_on_click_new_tab('user')).toBeFalsy();

        }));

        it('getName', inject(function () {
            var bp = shareBlueprint.get_default_blueprint('user');

            expect(bp.getName([
                { name: "user_search_username" },
                { name: "user_name", value: 'TestUserName'},
                { name: "user_id" },
                { name: "user_username" },
                { name: "user_public_key", value: '123456789' }
            ])).toBe('TestUserName (123456789)');

            expect(bp.getName([
                { name: "user_search_username" },
                { name: "user_name"},
                { name: "user_id" },
                { name: "user_username", value: 'TestUserName' },
                { name: "user_public_key", value: '123456789' }
            ])).toBe('TestUserName (123456789)');

        }));

        it('has_advanced', inject(function (shareBlueprint) {

            expect(shareBlueprint.has_advanced({'fields': [{ position: "advanced" }]})).toBeTruthy();
            expect(shareBlueprint.has_advanced({'fields': [{ }]})).toBeFalsy();
        }));
    });

}).call();
