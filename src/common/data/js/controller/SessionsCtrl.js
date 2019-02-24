(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:SessionsCtrl
     * @requires $rootScope
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Sessions tab in the "Others" menu
     */
    angular.module('psonocli').controller('SessionsCtrl', ['$rootScope', '$scope', '$routeParams', 'managerDatastoreUser', 'helper', 'DTOptionsBuilder', 'DTColumnDefBuilder',
        function ($rootScope, $scope, $routeParams, managerDatastoreUser, helper, DTOptionsBuilder, DTColumnDefBuilder) {

            $scope.delete_session = delete_session;

            $scope.dtOptions = DTOptionsBuilder.newOptions();
            $scope.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3)
            ];

            $scope.sessions=[];

            activate();
            function activate() {
                managerDatastoreUser.get_sessions().then(function (sessions) {
                    $scope.sessions = sessions;
                });

                $rootScope.$on('$translateChangeSuccess', function (event, lang) {
                    console.log(lang);
                    vm.dtOptions.withLanguageSource('http://cdn.datatables.net/plug-ins/1.10.11/i18n/'+(lang.language == 'de' ? 'German' : 'English')+'.json');
                    $rootScope.rerenderTable();
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:SessionsCtrl#delete_session
             * @methodOf psonocli.controller:SessionsCtrl
             *
             * @description
             * deletes an open session with given session id
             *
             * @param {uuid} session_id The session id to delete
             */
            function delete_session(session_id) {

                var onSuccess = function () {
                    helper.remove_from_array($scope.sessions, session_id, function(session, session_id) {
                        return session['id'] === session_id;
                    });
                };
                var onError = function () {
                };

                managerDatastoreUser.delete_session(session_id).then(onSuccess, onError);
            }
        }]
    );
}(angular));