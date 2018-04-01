'use strict';

var gulp = require('gulp');
var template_cache = require('gulp-angular-templatecache');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var htmlreplace = require('gulp-html-replace');
var htmlmin = require('gulp-htmlmin');
var jeditor = require("gulp-json-editor");
var minify = require('gulp-minify');
var gulpDocs = require('gulp-ngdocs');
var removeFiles = require('gulp-remove-files');
var run = require('gulp-run');
var sass = require('gulp-sass');
var jwt = require('jsonwebtoken');
var karma_server = require('karma').Server;
var runSequence = require('run-sequence');
var webstore_upload = require('webstore-upload');

var fs = require("fs");
var path = require('path');

/**
 * Compiles .sass files to css files
 */
gulp.task('sass', function () {
    return gulp.src('src/common/data/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});
/**
 * Compiles template files to template.js file
 */
gulp.task('template', function () {
    return gulp.src('src/common/data/view/**/*.html')
        .pipe(template_cache('templates.js', { module:'psonocli', root: 'view/' }))
        .pipe(gulp.dest('src/common/data/view'));
});


var build = function(build_path, type) {

    // All files in data/css
    if (type === 'webclient') {
        gulp.src([
            "src/common/data/css/lib/cssreset-context-min.css",
            "src/common/data/css/lib/opensans.css",
            "src/common/data/css/lib/angular-csp.css",
            "src/common/data/css/lib/bootstrap.css",
            "src/common/data/css/lib/ui-bootstrap-csp.css",
            "src/common/data/css/lib/datatables.min.css",
            "src/common/data/css/lib/angular-snap.css",
            "src/common/data/css/lib/font-awesome.min.css",
            "src/common/data/css/lib/angular-datatables.css",
            "src/common/data/css/lib/datatables.bootstrap.css",
            "src/common/data/css/lib/angular-ui-select.css",
            "src/common/data/css/lib/loading-barbar.min.css",
            'src/common/data/css/angular-tree-view.css',
            'src/common/data/css/style.css'
        ])
            .pipe(cleanCSS({compatibility: 'ie8'}))
            .pipe(concat('bundle.min.css'))
            .pipe(gulp.dest(path.join(build_path, 'css', 'lib')));

        gulp.src([
            'src/common/data/css/contentscript.css',
            'src/common/data/css/datastore.css',
            'src/common/data/css/main.css',
            'src/common/data/css/open-secret.css'
        ])
            .pipe(cleanCSS({compatibility: 'ie8'}))
            .pipe(gulp.dest(path.join(build_path, 'css')));
    } else {
        gulp.src(['src/common/data/css/**/*'])
            .pipe(cleanCSS({compatibility: 'ie8'}))
            .pipe(gulp.dest(path.join(build_path, 'css')));
    }

    // All files in data/view
    gulp.src('src/common/data/view/**/*.html')
        .pipe(template_cache('templates.js', { module:'psonocli', root: 'view/' }))
        .pipe(gulp.dest(path.join(build_path, 'view')));

    // All files in data/fonts
    gulp.src(['src/common/data/fonts/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'fonts')));

    // All files in data/img
    gulp.src(['src/common/data/img/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'img')));

    // License.md
    gulp.src(['LICENSE.md'])
        .pipe(gulp.dest(path.join(build_path)));

    // All files in data/js
    if (type === 'webclient') {
        // minify

        gulp.src([
            "src/common/data/js/lib/ecma-nacl.min.js",
            "src/common/data/js/lib/openpgp.min.js",
            "src/common/data/js/lib/sha512.min.js",
            "src/common/data/js/lib/sha256.min.js",
            "src/common/data/js/lib/sha1.min.js",
            "src/common/data/js/lib/uuid.js",
            "src/common/data/js/lib/chart.min.js",
            "src/common/data/js/lib/jquery.min.js",
            "src/common/data/js/lib/client.min.js",
            "src/common/data/js/lib/datatables.min.js",
            "src/common/data/js/lib/snap.min.js",
            "src/common/data/js/lib/jquery-ui.min.js",
            "src/common/data/js/lib/sortable.min.js",
            "src/common/data/js/lib/lokijs.min.js",
            "src/common/data/js/lib/qrcode.min.js",
            "src/common/data/js/lib/fastclick.js",
            "src/common/data/js/lib/password-generator.js",
            "src/common/data/js/lib/papaparse.min.js",
            "src/common/data/js/lib/fast-xml-parser.js",
            "src/common/data/js/lib/angular.min.js",
            "src/common/data/js/lib/angular-animate.min.js",
            "src/common/data/js/lib/angular-touch.min.js",
            "src/common/data/js/lib/angular-complexify.min.js",
            "src/common/data/js/lib/loading-bar.min.js",
            "src/common/data/js/lib/angular-chart.min.js",
            "src/common/data/js/lib/angular-route.min.js",
            "src/common/data/js/lib/angular-sanitize.min.js",
            "src/common/data/js/lib/angular-local-storage.min.js",
            "src/common/data/js/lib/angular-snap.min.js",
            "src/common/data/js/lib/ui-bootstrap-tpls.min.js",
            "src/common/data/js/lib/ngdraggable.js",
            "src/common/data/js/lib/angular-ui-select.js",
            "src/common/data/js/lib/ng-context-menu.js",
            "src/common/data/js/lib/angular-datatables.js",

            "src/common/data/js/module/ng-tree.js",

            "src/common/data/js/main.js",

            "src/common/data/js/directive/fileReader.js",
            "src/common/data/js/directive/treeView.js",
            "src/common/data/js/directive/treeViewNode.js",

            "src/common/data/js/controller/AcceptShareCtrl.js",
            "src/common/data/js/controller/AccountCtrl.js",
            "src/common/data/js/controller/ActivationCtrl.js",
            "src/common/data/js/controller/DatastoreCtrl.js",
            "src/common/data/js/controller/SecurityReportCtrl.js",
            "src/common/data/js/controller/LoginCtrl.js",
            "src/common/data/js/controller/GPGDecryptMessageCtrl.js",
            "src/common/data/js/controller/GPGEncryptMessageCtrl.js",
            "src/common/data/js/controller/LostPasswordCtrl.js",
            "src/common/data/js/controller/MainCtrl.js",
            "src/common/data/js/controller/modal/AcceptShareCtrl.js",
            "src/common/data/js/controller/modal/ConfigureGoogleAuthenticatorCtrl.js",
            "src/common/data/js/controller/modal/DeleteOtherSessionsCtrl.js",
            "src/common/data/js/controller/modal/AddGPGReceiverCtrl.js",
            "src/common/data/js/controller/modal/ConfigureDuoCtrl.js",
            "src/common/data/js/controller/modal/ConfigureYubiKeyOTPCtrl.js",
            "src/common/data/js/controller/modal/CreateDatastoreCtrl.js",
            "src/common/data/js/controller/modal/EditDatastoreCtrl.js",
            "src/common/data/js/controller/modal/DeleteDatastoreCtrl.js",
            "src/common/data/js/controller/modal/DatastoreNewEntryCtrl.js",
            "src/common/data/js/controller/modal/DisplayShareRightsCtrl.js",
            "src/common/data/js/controller/modal/EditEntryCtrl.js",
            "src/common/data/js/controller/modal/EditFolderCtrl.js",
            "src/common/data/js/controller/modal/NewFolderCtrl.js",
            "src/common/data/js/controller/modal/VerifyCtrl.js",
            "src/common/data/js/controller/modal/NewGroupCtrl.js",
            "src/common/data/js/controller/modal/PickUserCtrl.js",
            "src/common/data/js/controller/modal/EditGroupCtrl.js",
            "src/common/data/js/controller/modal/EncryptMessageGPGCtrl.js",
            "src/common/data/js/controller/modal/EditGPGUserCtrl.js",
            "src/common/data/js/controller/modal/GenerateNewMailGPGKeyCtrl.js",
            "src/common/data/js/controller/modal/ImportMailGPGKeyAsTextCtrl.js",
            "src/common/data/js/controller/modal/ShareEditEntryCtrl.js",
            "src/common/data/js/controller/modal/ShareEntryCtrl.js",
            "src/common/data/js/controller/modal/ShareNewEntryCtrl.js",
            "src/common/data/js/controller/modal/ShowRecoverycodeCtrl.js",
            "src/common/data/js/controller/modal/DeleteAccountCtrl.js",
            "src/common/data/js/controller/OpenSecretCtrl.js",
            "src/common/data/js/controller/OtherCtrl.js",
            "src/common/data/js/controller/SessionsCtrl.js",
            "src/common/data/js/controller/KnownHostsCtrl.js",
            "src/common/data/js/controller/OtherDatastoreCtrl.js",
            "src/common/data/js/controller/ExportCtrl.js",
            "src/common/data/js/controller/ImportCtrl.js",
            "src/common/data/js/controller/PanelCtrl.js",
            "src/common/data/js/controller/RegisterCtrl.js",
            "src/common/data/js/controller/SettingsCtrl.js",
            "src/common/data/js/controller/ShareCtrl.js",
            "src/common/data/js/controller/ShareusersCtrl.js",
            "src/common/data/js/controller/GroupsCtrl.js",
            "src/common/data/js/controller/WrapperCtrl.js",
            "src/common/data/js/controller/Enforce2FaCtrl.js",

            "src/common/data/js/service/api-client.js",
            "src/common/data/js/service/api-pwnedpasswords.js",
            "src/common/data/js/service/helper.js",
            "src/common/data/js/service/device.js",
            "src/common/data/js/service/message.js",
            "src/common/data/js/service/item-blueprint.js",
            "src/common/data/js/service/share-blueprint.js",
            "src/common/data/js/service/crypto-library.js",
            "src/common/data/js/service/converter.js",
            "src/common/data/js/service/openpgp.js",
            "src/common/data/js/service/storage.js",
            "src/common/data/js/service/account.js",
            "src/common/data/js/service/settings.js",
            "src/common/data/js/service/manager-base.js",
            "src/common/data/js/service/manager.js",
            "src/common/data/js/service/manager-widget.js",
            "src/common/data/js/service/manager-datastore.js",
            "src/common/data/js/service/manager-secret-link.js",
            "src/common/data/js/service/manager-share-link.js",
            "src/common/data/js/service/manager-export.js",
            "src/common/data/js/service/manager-hosts.js",
            "src/common/data/js/service/manager-import.js",
            "src/common/data/js/service/manager-security-report.js",
            "src/common/data/js/service/import-chrome-csv.js",
            "src/common/data/js/service/import-psono-pw-json.js",
            "src/common/data/js/service/import-lastpass-com-csv.js",
            "src/common/data/js/service/import-keepassx-org-csv.js",
            "src/common/data/js/service/import-keepass-info-csv.js",
            "src/common/data/js/service/import-keepass-info-xml.js",
            "src/common/data/js/service/manager-secret.js",
            "src/common/data/js/service/manager-share.js",
            "src/common/data/js/service/manager-datastore-password.js",
            "src/common/data/js/service/manager-datastore-user.js",
            "src/common/data/js/service/manager-datastore-gpg-user.js",
            "src/common/data/js/service/manager-groups.js",
            "src/common/data/js/service/manager-datastore-setting.js",
            "src/common/data/js/service/browser-client.js",
            "src/common/data/js/service/drop-down-menu-watcher.js",

            "src/common/data/view/templates.js",
            "src/common/data/js/google-analytics.js"
        ])
            .pipe(minify({
                ext:{
                    min:'.js'
                },
                ignoreFiles: ['.min.js'],
                noSource: true,
                preserveComments: 'some'
            }))
            .pipe(concat('bundle.min.js'))
            .pipe(gulp.dest(path.join(build_path, 'js')));

        gulp.src([
            'src/common/data/js/lib/openpgp.worker.min.js'
        ])
            .pipe(gulp.dest(path.join(build_path, 'js', 'lib')));

    } else {

        gulp.src([
            'src/common/data/js/**/*',
            '!src/common/data/js/google-analytics.js',
            '!src/common/data/js/service/browser-client.js'
        ])
            .pipe(gulp.dest(path.join(build_path, 'js')));
    }

    // All files in data
    if (type === 'webclient') {
        return gulp.src([
                'src/common/data/*',
                '!src/common/data/background.html',
                '!src/common/data/default_popup.html',
                '!src/common/data/sass'
            ])
            .pipe(htmlreplace({
                'build_min_js': 'js/bundle.min.js',
                'build_min_css': 'css/lib/bundle.min.css'
            }))
            .pipe(htmlmin({collapseWhitespace: true}))
            .pipe(gulp.dest(build_path));
    } else {
        return gulp.src([
                'src/common/data/*',
                '!src/common/data/sass'
            ])
            .pipe(htmlmin({collapseWhitespace: true}))
            .pipe(gulp.dest(build_path));
    }

};



/**
 * Creates the webclient build folder
 */
gulp.task('build-webclient', function() {
    return build('build/webclient', 'webclient');
});

/**
 * Creates the Firefox build folder
 */
gulp.task('build-firefox', function() {

    build('build/firefox/data', 'firefox');

    return gulp.src(['src/firefox/**/*'])
        .pipe(gulp.dest('build/firefox'));

});

/**
 * Creates the Chrome build folder
 */
gulp.task('build-chrome', function() {

    build('build/chrome/data', 'chrome');

    return gulp.src(['src/chrome/**/*'])
        .pipe(gulp.dest('build/chrome'));

});

gulp.task('default', function(callback) {
    runSequence(['sass', 'template'],
        ['build-chrome', 'build-firefox', 'build-webclient'],
        callback);
});

/**
 * Watcher to compile the project again once something changes
 *
 * - initiates the task for the compilation of the sass
 * - initiates the task for the creation of the firefox build folder
 * - initiates the task for the creation of the chrome build folder
 */
gulp.task('watch', ['default'], function() {
    gulp.watch([
        'src/common/data/**/*',
        'src/chrome/**/*',
        'src/firefox/**/*',
        'src/webclient/**/*',
        '!src/common/data/css/**/*',
        '!src/common/data/sass/**/*.scss'], ['build-webclient', 'build-firefox', 'build-chrome']);
    gulp.watch('src/common/data/sass/**/*.scss', ['default']);
});


/**
 * Deploys the Chrome Extension to the Chrome Web Store
 */
gulp.task('chrome-deploy', function() {

    var client_id = process.env.webstore_client_id;
    var client_secret = process.env.webstore_client_secret;
    var refresh_token = process.env.webstore_refresh_token;
    var app_id = process.env.webstore_app_id;

    var uploadOptions = {
        accounts: {
            default: {
                client_id: client_id,
                client_secret: client_secret,
                refresh_token: refresh_token
            }
        },
        extensions: {
            extension1: {
                publish: true,
                appID: app_id,
                zip: 'chrome-extension.zip'
            }
        },
        uploadExtensions : ['extension1']
    };

    webstore_upload(uploadOptions, 'default')
        .then(function(result) {
            console.log(result);
            return 'Upload Complete';
        })
        .catch(function(err) {
            console.error(err);
        });
});

/**
 * Deploys the Firefox Extension to the Firefox Web Store
 */
gulp.task('firefox-deploy', function() {

    var jwt_issuer = process.env.mozilla_jwt_issuer;
    var jwt_secret = process.env.mozilla_jwt_secret;
    var version = process.env.mozilla_version;
    var mozilla_addon_id = process.env.mozilla_addon_id;

    var issuedAt = Math.floor(Date.now() / 1000);
    var payload = {
        iss: jwt_issuer,
        jti: Math.random().toString(),
        iat: issuedAt,
        exp: issuedAt + 60
    };

    var token = jwt.sign(payload, jwt_secret, {
        algorithm: 'HS256'  // HMAC-SHA256 signing algorithm
    });

    return run('curl "https://addons.mozilla.org/api/v3/addons/'+mozilla_addon_id+'/versions/'+ version +'/" -g -XPUT --form "upload=@firefox-extension.zip" -H "Authorization: JWT '+ token +'"').exec()
        .pipe(gulp.dest('output'));
});


gulp.task('updateversion', function() {

    var commit_tag = process.env.CI_COMMIT_TAG;
    var commit_sha = process.env.CI_COMMIT_SHA;

    if (! /^v\d*\.\d*\.\d*$/.test(commit_tag)) {
        return;
    }

    var version = commit_tag.substring(1);
    var hash = commit_sha.substring(0,8);
    var version_long = version+ ' (Build '+hash+')';

    fs.writeFile("./build/webclient/VERSION.txt", version_long, function(err) {
        if(err) {
            return console.log(err);
        }
    });

    var all_browsers = ['chrome', 'firefox'];
    all_browsers.forEach(function(browser) {

        fs.writeFile("./build/" + browser + "/data/VERSION.txt", version_long, function(err) {
            if(err) {
                return console.log(err);
            }
        });


        gulp.src(path.join("./build", browser, "manifest.json"))
            .pipe(removeFiles());

        gulp.src(path.join("./src", browser, "manifest.json"))
            .pipe(jeditor({
                'version': version
            }))
            .pipe(gulp.dest(path.join("./build/", browser)));
    });
});


/**
 * Create ngdocs documentation once and exit
 */

gulp.task('docs', [], function () {

    var options = {
        html5Mode: false,
        titleLink: "/api",
        startPage: '/api',
        title: "Psono Client",
        styles: ['var/ngdocs/style.css']
    };

    return gulp.src([
        'src/common/data/js/*.js',
        'src/common/data/js/module/*.js',
        'src/common/data/js/service/*.js',
        'src/common/data/js/directive/*.js',
        'src/common/data/js/controller/*.js',
        'src/common/data/js/controller/modal/*.js',
    ])
        .pipe(gulpDocs.process(options))
        .pipe(gulp.dest('./docs'));
});


/**
 * Run test once and exit
 */
gulp.task('unittest', function (done) {
    new karma_server({
        configFile: path.join(__dirname, 'unittests', 'karma-chrome.conf.js'),
        singleRun: true
    }, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('unittestwatch', function (done) {
    new karma_server({
        configFile: path.join(__dirname, 'unittests', 'karma-chrome.conf.js'),
        singleRun: false
    }, done).start();
});
