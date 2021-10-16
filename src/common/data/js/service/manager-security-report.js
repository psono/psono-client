(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerSecurityReport
     * @requires $q
     * @requires $window
     * @requires $timeout
     * @requires $translate
     * @requires psonocli.managerExport
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerBase
     * @requires psonocli.managerStatus
     * @requires psonocli.apiClient
     * @requires psonocli.apiPwnedpasswords
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.storage
     *
     * @description
     * Service to manage security reports
     */

    var managerSecurityReport = function($q, $window, $timeout, $translate, managerExport, managerDatastore, managerDatastoreUser,
                                         managerBase, managerStatus, apiClient, apiPwnedpasswords, cryptoLibrary, storage) {


        var registrations = {};
        var masterpassword = '';
        var haveibeenpwned = false;
        var _translations;

        activate();

        function activate() {

            $translate([
                'PASSWORD_HAS_BEEN_COMPROMISED_MULTIPLE_TIMES',
            ], {
                pwned: '{{ pwned }}' // a small hack so we can replace it later manually
            }).then(function (translations) {
                _translations = translations;
            });
        }

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
         * @returns {object} Returns the rating with a score [0-100] and the advice regarding what to improve
         */
        var rate_secret = function (secret) {

            var _MIN_PASSWORD_LENGTH = 11;
            var _MAX_PASSWORD_LENGTH = 16;
            var _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH = 15;
            var _MIN_VARIATION_LENGTH = 3;
            var _VARIATION_PENALTY = 0.15;
            var _MAX_SCORE = 100;
            var _MIN_SCORE = 0;

            // inspired by https://stackoverflow.com/questions/948172/password-strength-meter
            var variations = {
                digits: /\d/.test(secret.password),
                lower: /[a-z]/.test(secret.password),
                upper: /[A-Z]/.test(secret.password),
                nonWords: /\W/.test(secret.password)
            };
            var variation_count = 0;
            for (var check in variations) {
                variation_count += (variations[check] === true) ? 1 : 0;
            }

            if (!secret.password) {
                // empty password
                return {
                    score: _MAX_SCORE,
                    advice: '',
                    password_length: 0,
                    variation_count: 0
                };
            }

            if (secret.password.length <= _MIN_PASSWORD_LENGTH) {
                return {
                    score: _MIN_SCORE,
                    advice: 'SET_LONGER_PASSWORD',
                    password_length: secret.password.length,
                    variation_count: variation_count,
                    min_password_length: _MIN_PASSWORD_LENGTH
                };
            }

            if (secret.username && secret.username !== '' && secret.password.toLowerCase().indexOf(secret.username.toLowerCase()) !== -1) {
                return {
                    score:0,
                    advice: 'REMOVE_USERNAME_FROM_PASSWORD',
                    password_length: secret.password.length,
                    variation_count: variation_count
                };
            }

            if (secret.password.length >= _MAX_PASSWORD_LENGTH) {
                return {
                    score: _MAX_SCORE,
                    advice: '',
                    password_length: secret.password.length,
                    variation_count: variation_count,
                    max_password_length: _MAX_PASSWORD_LENGTH
                };
            }

            var score = (secret.password.length - _MIN_PASSWORD_LENGTH) * _MAX_SCORE /(_MAX_PASSWORD_LENGTH - _MIN_PASSWORD_LENGTH);

            if (secret.password.length <= _MIN_VARIATION_ENFORCE_PASSWORD_LENGTH && variation_count < _MIN_VARIATION_LENGTH) {
                return {
                    score: Math.round(Math.max(Math.min(score * (1 - (_MIN_VARIATION_LENGTH - variation_count)*_VARIATION_PENALTY), _MAX_SCORE), _MIN_SCORE) * 10) / 10,
                    advice: 'SET_LONGER_OR_MORE_COMPLEX_PASSWORD',
                    password_length: secret.password.length,
                    variation_count: variation_count
                };
            }

            return {
                score: Math.round(Math.max(Math.min(score, _MAX_SCORE), _MIN_SCORE) * 10) / 10,
                advice: 'SET_LONGER_PASSWORD_10',
                password_length: secret.password.length,
                variation_count: variation_count
            };
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#filter_passwords_helper
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Little helper functions that will filter a folder object recursive and fills all found website passwords
         * into the provided passwords array
         *
         * @param {object} folder The folder to filter
         * @param {Array} passwords The array into which all passwords should be put in
         */
        var filter_passwords_helper = function(folder, passwords) {
            var i;
            if (folder.hasOwnProperty('deleted') && folder['deleted']) {
                // skip all deleted folders
                return
            }

            for (i = 0; folder.hasOwnProperty('items') && i < folder['items'].length; i++) {
                if (folder['items'][i]['type'] !== 'website_password' && folder['items'][i]['type'] !== 'application_password') {
                    continue;
                }
                if (!folder['items'][i].hasOwnProperty('create_date')) {
                    // we have no copy from the server, this usually means we received a 403
                    continue
                }
                if (folder['items'][i].hasOwnProperty('deleted') && folder['items'][i]['deleted']) {
                    // skip all deleted items
                    continue
                }
                
                if (folder['items'][i]['type'] === 'application_password') {
                    passwords.push({
                        'type': folder['items'][i]['type'],
                        'name': folder['items'][i]['name'],
                        'username': folder['items'][i]['application_password_username'],
                        'password': folder['items'][i]['application_password_password'],
                        'create_date': folder['items'][i]['create_date'],
                        'write_date': folder['items'][i]['write_date'],
                        'master_password': false,
                    });
                } else {

                    passwords.push({
                        'type': folder['items'][i]['type'],
                        'name': folder['items'][i]['name'],
                        'username': folder['items'][i]['website_password_username'],
                        'password': folder['items'][i]['website_password_password'],
                        'create_date': folder['items'][i]['create_date'],
                        'write_date': folder['items'][i]['write_date'],
                        'master_password': false,
                    });
                }
            }

            for (i = 0; folder.hasOwnProperty('folders') && i < folder['folders'].length; i++) {
                filter_passwords_helper(folder['folders'][i], passwords);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#filter_passwords
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Takes a datastore and returns an array of website passwords
         *
         * @param {object} datastores A list of datastore to filter
         *
         * @returns {Array} Returns an array of website passwords
         */
        var filter_passwords = function(datastores) {
            var passwords = [];

            for (var i = 0; i < datastores.length; i++) {
                filter_passwords_helper(datastores[i], passwords);
            }

            if (masterpassword) {
                passwords.unshift({
                    'type': 'master_password',
                    'name': 'Master Password',
                    'password': masterpassword,
                    'master_password': true
               })
            }

            return passwords;
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
            if (typeof(time_string) === 'undefined') {
                return 0;
            }
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
                    password: secrets[i]['password'],
                    master_password: secrets[i]['master_password'],
                    rating: rating['score'],
                    min_password_length: rating['min_password_length'],
                    password_length: rating['password_length'],
                    variation_count: rating['variation_count'],
                    breached: rating['breached'],
                    type: 'website_password',
                    input_type: 'password',
                    advice: rating['advice'],
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
                if (analysis.passwords[i].password === '' || typeof(analysis.passwords[i].password) === 'undefined') {
                    continue;
                }
                if (lookup_dict.hasOwnProperty(analysis.passwords[i].password)) {
                    analysis.passwords[i].duplicate = true;
                    lookup_dict[analysis.passwords[i].password].duplicate = true;
                    lookup_dict[analysis.passwords[i].password].advice = 'DO_NOT_USE_PASSWORDS_TWICE';
                } else {
                    lookup_dict[analysis.passwords[i].password] = analysis.passwords[i];
                }
            }

            emit('check-duplicate-complete', {});
            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#analyze_haveibeenpwned_single
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyzes a single entry against the haveibeenpawned service
         *
         * @param entry
         */
        var analyze_haveibeenpwned_single = function(entry) {

            var password_sha1 = cryptoLibrary.sha1(entry.password);
            var password_sha1_prefix = password_sha1.substring(0,5);
            var password_sha1_suffix = password_sha1.slice(5).toLowerCase();

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                var suffix_list = result.data.split("\n");
                for (var i = 0; i < suffix_list.length; i++) {
                    var suffix = suffix_list[i].split(":");
                    if(suffix[0].toLowerCase() !== password_sha1_suffix) {
                        continue;
                    }
                    entry.breached = suffix[1];
                    if (entry.breached > 1) {
                        entry.advice = _translations.PASSWORD_HAS_BEEN_COMPROMISED_MULTIPLE_TIMES.replace('{{ pwned }}', parseInt(entry.breached));
                    } else {
                        entry.advice = 'PASSWORD_HAS_BEEN_COMPROMISED';
                    }

                    entry.rating = 0;

                    return;
                }
                entry.breached = 0;
            };

            return apiPwnedpasswords.range(password_sha1_prefix).then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#analyze_haveibeenpwned
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Analyze all secrets from the last analysis against the haveibeenpawned service
         *
         * @param {object} analysis The secrets to analyze
         *
         * @returns {object} Returns the analysis of the passwords
         */
        var analyze_haveibeenpwned = function(analysis) {

            var haveibeenpwned_resolver;

            if (!haveibeenpwned) {
                return analysis;
            }

            if (analysis.passwords.length === 0) {
                return analysis
            }

            emit('check-haveibeenpwned-started', {});

            function little_helper(index, password_list) {

                if (index >= password_list.length) {
                    emit('check-haveibeenpwned-complete', {});
                    return haveibeenpwned_resolver(analysis)
                }

                if (password_list[index].password === '' || typeof(password_list[index].password) === 'undefined') {
                    return little_helper(index + 1, password_list);
                }


                var onError = function(result) {
                    // pass
                    $timeout(function() {
                        little_helper(index, password_list);
                    }, 10000);
                };

                var onSuccess = function(result) {
                    emit('get-haveibeenpwned-complete', {});
                    $timeout(function() {
                        little_helper(index + 1, password_list);
                    }, 250);
                };

                analyze_haveibeenpwned_single(password_list[index]).then(onSuccess, onError);
            }


            return $q(function(resolve, reject) {
                haveibeenpwned_resolver = resolve;

                // we will not query in parallel due to rate limiting,
                // so we will fake the start of the requests here, and query every password one by one with a 1.6 seconds
                // delay in between
                for (var i = 0; i < analysis.passwords.length; i++) {
                    var entry = analysis.passwords[i];
                    if (entry.password === '' || typeof(entry.password) === 'undefined') {
                        continue;
                    }
                    emit('get-haveibeenpwned-started', {});
                }

                little_helper(0, analysis.passwords);
            });
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
                    analysis.passwords[i].advice = 'ADVICE_PASSWORD_TOO_OLD';
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

            managerDatastoreUser.search_user(managerBase.find_key('config', 'user_username'))
                .then(onSuccess, onError);

            return analysis
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#fetch_all_password_datastores
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Fetches all password datastores
         *
         * @returns {promise} Returns a promise with the exportable datastore content of all datastores
         */
        var fetch_all_password_datastores = function() {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {
                var all_calls = [];

                for (var i = 0; i < result.data.datastores.length; i++) {
                    if (result.data.datastores[i].type !== 'password') {
                        continue;
                    }
                    all_calls.push(managerExport.fetch_datastore(undefined, result.data.datastores[i].id));
                }
                return $q.all(all_calls);
            };



            return managerDatastore.get_datastore_overview()
                .then(onSuccess, onError);

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
        var generate_security_report = function(password, check_haveibeenpwned) {

            masterpassword = password;
            haveibeenpwned = check_haveibeenpwned;

            emit('generation-started', {});

            return fetch_all_password_datastores()
                .then(filter_passwords)
                .then(analyze_password_length)
                .then(analyze_password_age)
                .then(analyze_password_duplicates)
                .then(analyze_haveibeenpwned)
                .then(summarize_password)
                .then(summarize_user)
                .then(function(analysis) {
                    emit('generation-complete', {});
                    return {
                        msgs: ['ANALYSIS_SUCCESSFUL'],
                        analysis: analysis
                    }
                });

        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#send_to_server
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Sends the report to the server
         *
         * @param {object} analysis The actual analysis
         * @param {boolean} check_haveibeenpwned Whether haveibeenpwned was checked or not
         * @param {string}  master_password The master password
         *
         * @returns {promise} Returns a promise to indicate the success of this or not
         */
        var send_to_server = function(analysis, check_haveibeenpwned, master_password) {
            var entries = [];

            var authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, master_password);

            for (var i = 0; i < analysis['passwords'].length; i++) {
                entries.push({
                    name: analysis['passwords'][i].name,
                    master_password: analysis['passwords'][i].master_password,
                    rating: analysis['passwords'][i].rating,
                    password_length: analysis['passwords'][i].password_length,
                    variation_count: analysis['passwords'][i].variation_count,
                    breached: analysis['passwords'][i].breached,
                    type: analysis['passwords'][i].type,
                    input_type: analysis['passwords'][i].input_type,
                    duplicate: analysis['passwords'][i].duplicate,
                    create_age: analysis['passwords'][i].create_age,
                    write_age: analysis['passwords'][i].write_age
                })
            }

            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                managerStatus.get_status(true);
                return result.data
            };

            return apiClient.send_security_report(managerBase.get_token(), managerBase.get_session_secret_key(), entries, check_haveibeenpwned, authkey).then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#central_security_reports_disable
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Returns the current status of security reports on the server
         *
         * @returns {boolean} Returns weather central security reports are disabled or not
         */
        var central_security_reports_disable = function() {
            var config = storage.find_key('config', 'server_info').value;
            if (config.hasOwnProperty('disable_central_security_reports')) {
                return storage.find_key('config', 'server_info').value['disable_central_security_reports'];
            }
            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#central_security_reports_enforced
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Returns the current enforcement status of security reports on the server
         *
         * @returns {boolean} Returns weather central security reports are enforced or not
         */
        var central_security_reports_enforced = function() {
            var config = storage.find_key('config', 'server_info').value;
            if (config.hasOwnProperty('compliance_enforce_central_security_reports')) {
                return storage.find_key('config', 'server_info').value['compliance_enforce_central_security_reports'];
            }
            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.managerSecurityReport#central_security_reports_recurrence_interval
         * @methodOf psonocli.managerSecurityReport
         *
         * @description
         * Returns the current enforced recurrence interval for the security report
         *
         * @returns {boolean} Returns weather central security reports are enforced or not
         */
        var central_security_reports_recurrence_interval = function() {
            var config = storage.find_key('config', 'server_info').value;
            if (config.hasOwnProperty('compliance_central_security_reports_recurrence_interval')) {
                return storage.find_key('config', 'server_info').value['compliance_central_security_reports_recurrence_interval'];
            }
            return 0;
        };

        return {
            on:on,
            emit:emit,
            generate_security_report:generate_security_report,
            send_to_server:send_to_server,
            central_security_reports_disable:central_security_reports_disable,
            central_security_reports_enforced:central_security_reports_enforced,
            central_security_reports_recurrence_interval:central_security_reports_recurrence_interval,
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerSecurityReport", ['$q', '$window', '$timeout', '$translate', 'managerExport', 'managerDatastore', 'managerDatastoreUser',
        'managerBase', 'managerStatus', 'apiClient', 'apiPwnedpasswords', 'cryptoLibrary', 'storage', managerSecurityReport]);

}(angular));
