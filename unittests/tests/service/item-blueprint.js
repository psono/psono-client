(function () {
    describe('Service: itemBlueprint test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('itemBlueprint exists', inject(function (itemBlueprint) {
            expect(itemBlueprint).toBeDefined();
        }));

        it('get_blueprints', inject(function (itemBlueprint) {
            var blueprints = itemBlueprint.get_blueprints();

            expect(blueprints.length > 0).toBeTruthy();
            for (var i = 0; i < blueprints.length; i++) {
                var bp = blueprints[i];
                expect(bp).toEqual(jasmine.any(Object));
                expect(bp.hasOwnProperty("id")).toBeTruthy();
                expect(bp.hasOwnProperty("name")).toBeTruthy();
                expect(bp.hasOwnProperty("title_field")).toBeTruthy();
                expect(bp.hasOwnProperty("fields")).toBeTruthy();
                expect(bp.hasOwnProperty("search")).toBeTruthy();
                expect(bp["fields"]).toEqual(jasmine.any(Array));
                expect(bp["search"]).toEqual(jasmine.any(Array));

            }
        }));

        it('get_blueprint:False', inject(function (itemBlueprint) {
            expect(itemBlueprint.get_blueprint("i dont exist")).toBeFalsy();
        }));

        it('get_blueprint:False', inject(function (itemBlueprint) {
            expect(itemBlueprint.get_default_blueprint_key()).toBe("website_password");
        }));
    });

}).call();
