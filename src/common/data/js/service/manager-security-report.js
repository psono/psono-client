(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerSecurityReport
     * @requires $q
     * @requires $window
     * @requires $timeout
     * @requires psonocli.managerExport
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerBase
     *
     * @description
     * Service to manage the export of datastores
     */

    var managerSecurityReport = function($q, $window, $timeout, managerExport, managerDatastoreUser, managerBase) {


        var registrations = {};

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#on
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * used to register functions for specific events
         *
         * @param {string} event The event to subscribe to
         * @param {function} func The callback function to subscribe
         */
        var on = function (event, func) {

            // pass through all export listeners
            if (['get-secret-started', 'get-secret-complete'].indexOf(event) >= 0){
                return managerExport.on(event, func);
            }

            if (!registrations.hasOwnProperty(event)){
                registrations[event] = [];
            }

            registrations[event].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#emit
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * sends an event message to the export service
         *
         * @param {string} event The event to trigger
         * @param {*} data The payload data to send to the subscribed callback functions
         */
        var emit = function (event, data) {
            if (!registrations.hasOwnProperty(event)){
                return;
            }
            for (var i = registrations[event].length - 1; i >= 0; i--) {
                registrations[event][i](data);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#rate_secret
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Creates the rating for a given secret
         *
         * @param {*} secret The secret to rate
         *
         * @returns {object} Returns the rating with a score [0-100] and the advise what to improve
         */
        var rate_secret = function (secret) {

            var _MIN_PASSWORD_LENGTH = 11;
            var _MAX_PASSWORD_LENGTH = 18;
            var _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH = 15;
            var _MIN_VARIATION_LENGTH = 3;
            var _VARIATION_PENALTY = 0.15;
            var _MAX_SCORE = 100;
            var _MIN_SCORE = 0;

            // inspired by https://stackoverflow.com/questions/948172/password-strength-meter
            var variations = {
                digits: /\d/.test(secret.website_password_password),
                lower: /[a-z]/.test(secret.website_password_password),
                upper: /[A-Z]/.test(secret.website_password_password),
                nonWords: /\W/.test(secret.website_password_password)
            };
            var variation_count = 0;
            for (var check in variations) {
                variation_count += (variations[check] === true) ? 1 : 0;
            }

            if (secret.website_password_password.length <= _MIN_PASSWORD_LENGTH) {
                return {
                    score: _MIN_SCORE,
                    advise: 'Set longer password (length <= ' + _MIN_PASSWORD_LENGTH + ')'
                };
            }

            if (secret.website_password_username !== '' && secret.website_password_password.toLowerCase().indexOf(secret.website_password_username.toLowerCase()) !== -1) {
                return {
                    score:0,
                    advise: 'Remove username from password.'
                };
            }

            if (secret.website_password_password.length >= _MAX_PASSWORD_LENGTH) {
                return {
                    score: _MAX_SCORE,
                    advise: ''
                };
            }

            var score = (secret.website_password_password.length - _MIN_PASSWORD_LENGTH) * _MAX_SCORE /(_MAX_PASSWORD_LENGTH - _MIN_PASSWORD_LENGTH);

            if (secret.website_password_password.length <= _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH && variation_count < _MIN_VARIATION_LENGTH) {
                return {
                    score: Math.round(Math.max(Math.min(score * (1 - (_MIN_VARIATION_LENGTH - variation_count)*_VARIATION_PENALTY), _MAX_SCORE), _MIN_SCORE) * 10) / 10,
                    advise: 'Set longer or more complex password.'
                };
            }

            return {
                score: Math.round(Math.max(Math.min(score, _MAX_SCORE), _MIN_SCORE) * 10) / 10,
                advise: 'Set longer password.'
            };
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#filter_website_passwords_helper
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Little helper functions that will filter a folder object recursive and fills all found website passwords
         * into the provided website_passwords array
         *
         * @param {object} folder The folder to filter
         * @param {Array} website_passwords The array into which all website_passwords should be put in
         */
        var filter_website_passwords_helper = function(folder, website_passwords) {
            var i;

            for (i = 0; folder.hasOwnProperty('items') && i < folder['items'].length; i++) {
                if (folder['items'][i]['type'] !== 'website_password') {
                    continue;
                }
                website_passwords.push(folder['items'][i]);
            }

            for (i = 0; folder.hasOwnProperty('folders') && i < folder['folders'].length; i++) {
                filter_website_passwords_helper(folder['folders'][i], website_passwords);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#filter_website_passwords
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Takes a datastore and returns an array of website passwords
         *
         * @param {object} datastore The datastore to filter
         *
         * @returns {Array} Returns an array of website passwords
         */
        var filter_website_passwords = function(datastore) {
            console.log("filter_website_passwords");
            var website_passwords = [];

            filter_website_passwords_helper(datastore, website_passwords);
            return website_passwords;
        };


        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#get_age_in_days
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Takes an ISO formatted string and returns the days that have passed since then.
         *
         * @param {string} time_string Time as string in ISO formatting
         * @returns {number} Numbers of days that have passed since then
         */
        var get_age_in_days = function(time_string) {
            var date1 = new Date(time_string);
            var date2 = new Date();
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());

            return Math.ceil(timeDiff / (1000 * 3600 * 24));
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#analyze_password_length
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyze all secrets in the datastore
         *
         * @param {object} secrets The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var analyze_password_length = function(secrets) {
            var analysis = {
                passwords: []
            };
            var rating;

            emit('check-length-started', {});
            for (var i = 0; i < secrets.length; i++) {
                rating = rate_secret(secrets[i]);
                analysis.passwords.push({
                    name: secrets[i]['name'],
                    password: secrets[i]['website_password_password'],
                    rating: rating['score'],
                    input_type: 'password',
                    advise: rating['advise'],
                    create_age: get_age_in_days(secrets[i]['create_date']),
                    write_age: get_age_in_days(secrets[i]['write_date']),
                    duplicate: false
                });
            }
            emit('check-length-complete', {});
            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#analyze_password_duplicates
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyze all secrets from the last analysis and check for duplicates
         *
         * @param {object} analysis The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var analyze_password_duplicates = function(analysis) {

            var lookup_dict = {};

            emit('check-duplicate-started', {});
            for (var i = 0; i < analysis.passwords.length; i++) {
                if (analysis.passwords[i].password === '') {
                    continue;
                }
                if (lookup_dict.hasOwnProperty(analysis.passwords[i].password)) {
                    analysis.passwords[i].duplicate = true;
                    lookup_dict[analysis.passwords[i].password].duplicate = true;
                    lookup_dict[analysis.passwords[i].password].advise = 'Change password, do not use passwords twice.';
                } else {
                    lookup_dict[analysis.passwords[i].password] = analysis.passwords[i];
                }
            }

            emit('check-duplicate-complete', {});
            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#analyze_password_age
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyze all secrets from the last analysis and check for the password age
         *
         * @param {object} analysis The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var analyze_password_age = function(analysis) {


            emit('check-password-age-started', {});
            for (var i = 0; i < analysis.passwords.length; i++) {
                if (analysis.passwords[i].password === '') {
                    continue;
                }
                if (analysis.passwords[i].write_age > 180) {
                    analysis.passwords[i].advise = 'Update password, its too old.';
                }
            }

            emit('check-password-age-complete', {});
            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#summarize_password
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyze all secrets from the last analysis and check for duplicates
         *
         * @param {object} analysis The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var summarize_password = function(analysis) {

            analysis['password_summary'] = {
                total: 0,
                duplicate: 0,
                no_duplicate: 0,
                weak: 0,
                good: 0,
                strong: 0,
                average_rating: 0,
                average_update_age: 0,
                update_newer_than_90_days: 0,
                update_older_than_90_days: 0,
                update_older_than_180_days: 0
            };

            emit('summarize-password-started', {});
            for (var i = 0; i < analysis.passwords.length; i++) {
                analysis['password_summary']['total'] ++;
                analysis['password_summary']['average_rating'] += analysis.passwords[i].rating;
                analysis['password_summary']['average_update_age'] += analysis.passwords[i].write_age;

                if (analysis.passwords[i].duplicate) {
                    analysis['password_summary']['duplicate'] ++;
                } else {
                    analysis['password_summary']['no_duplicate'] ++;
                }

                if (analysis.passwords[i].rating <= 40) {
                    analysis['password_summary']['weak'] ++;
                } else if (analysis.passwords[i].rating < 80) {
                    analysis['password_summary']['good'] ++;
                } else {
                    analysis['password_summary']['strong'] ++;
                }

                if (analysis.passwords[i].write_age <= 90) {
                    analysis['password_summary']['update_newer_than_90_days'] ++;
                } else if (analysis.passwords[i].write_age <= 180) {
                    analysis['password_summary']['update_older_than_90_days'] ++;
                } else {
                    analysis['password_summary']['update_older_than_180_days'] ++;
                }
            }

            //calculate average rating
            if (analysis['password_summary']['total']) {
                analysis['password_summary']['average_rating'] = Math.round(analysis['password_summary']['average_rating'] / analysis['password_summary']['total'] * 10) / 10;
                analysis['password_summary']['average_update_age'] = Math.round(analysis['password_summary']['average_update_age'] / analysis['password_summary']['total']);
            } else {
                analysis['password_summary']['average_rating'] = 0;
                analysis['password_summary']['average_update_age'] = 0;
            }

            emit('summarize-password-complete', {});
            return analysis
        };



        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#summarize_user
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Summarize password statistics
         *
         * @param {object} analysis The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var summarize_user = function(analysis) {

            analysis['user_summary'] = {

            };

            emit('summarize-user-started', {});

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                analysis['user_summary']['multifactor_auth_enabled'] = result.data.multifactor_auth_enabled;
                analysis['user_summary']['recovery_code_enabled'] = result.data.recovery_code_enabled;
                emit('summarize-user-complete', {});
            };

            managerDatastoreUser.search_user(managerBase.find_one('config', 'user_username'))
                .then(onSuccess, onError);

            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#generate_security_report
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Fetches all secrets
         *
         * @returns {promise} Returns a promise with the exportable datastore content
         */
        var generate_security_report = function() {

            emit('generation-started', {});
            console.log("generate_security_report");

            return managerExport.fetch_datastore()
                .then(filter_website_passwords)
                .then(analyze_password_length)
                .then(analyze_password_age)
                .then(analyze_password_duplicates)
                .then(summarize_password)
                .then(summarize_user)
                .then(function(analysis) {
                    emit('generation-complete', {});
                    return {
                        msgs: ['Analysis successful.'],
                        analysis: analysis
                    }
                });

        };

        return {
            on:on,
            emit:emit,
            generate_security_report:generate_security_report
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerSecurityReport", ['$q', '$window', '$timeout', 'managerExport', 'managerDatastoreUser', 'managerBase', managerSecurityReport]);

}(angular));