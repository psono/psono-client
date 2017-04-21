'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var htmlmin = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');
var minify = require('gulp-minify');
var sass = require('gulp-sass');
var template_cache = require('gulp-angular-templatecache');
var crx = require('gulp-crx-pack');
var fs = require("fs");
var path = require('path');
var ospath = require('ospath');
var child_process = require('child_process');
var jeditor = require("gulp-json-editor");
var karma_server = require('karma').Server;
var removeFiles = require('gulp-remove-files');
var gulpDocs = require('gulp-ngdocs');
var webstore_upload = require('webstore-upload');
var runSequence = require('run-sequence');

/**
 * Compiles .sass files to css files
 */
gulp.task('sass', function () {
    return gulp.src('src/common/data/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});


var build = function(build_path, remove_default_browser_client, minify_js) {
    gulp.src(['src/common/data/css/**/*'])
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(path.join(build_path, 'css')));

    gulp.src(['src/common/data/fonts/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'fonts')));

    gulp.src(['src/common/data/img/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'img')));


    var js_source = ['src/common/data/js/**/*'];

    if(remove_default_browser_client) {
        js_source.push('!src/common/data/js/service/browser-client.js');
    }
    if (minify_js) {
        gulp.src(js_source)
            .pipe(minify({
                ext:{
                    min:'.js'
                },
                ignoreFiles: ['.min.js'],
                noSource: true,
                preserveComments: 'some'
            }))
            .pipe(gulp.dest(path.join(build_path, 'js')));
    } else {
        gulp.src(js_source)
            .pipe(gulp.dest(path.join(build_path, 'js')));
    }

    gulp.src('src/common/data/view/**/*.html')
        .pipe(template_cache('templates.js', { module:'psonocli', root: 'view/' }))
        .pipe(gulp.dest(path.join(build_path, 'view')));

    return gulp.src([
        'src/common/data/*',
        '!src/common/data/sass'
    ])
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(build_path));
};



/**
 * Creates the Webserver build folder
 */
gulp.task('build-webserver', function() {
    return build('build/webserver', false, true);
});

/**
 * Creates the Firefox build folder
 */
gulp.task('build-firefox', function() {

    build('build/firefox/data', true, false);

    return gulp.src(['src/firefox/**/*'])
        .pipe(gulp.dest('build/firefox'));

});

/**
 * Creates the Chrome build folder
 */
gulp.task('build-chrome', function() {

    build('build/chrome/data', true, false);

    return gulp.src(['src/chrome/**/*'])
        .pipe(gulp.dest('build/chrome'));

});

gulp.task('default', function(callback) {
    runSequence('sass',
        ['build-chrome', 'build-firefox', 'build-webserver'],
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
        'src/webserver/**/*',
        '!src/common/data/css/**/*',
        '!src/common/data/sass/**/*.scss'], ['build-webserver', 'build-firefox', 'build-chrome']);
    gulp.watch('src/common/data/sass/**/*.scss', ['default']);
});

gulp.task('watchpost', function() {
    child_process.exec("cd build/firefox/ && jpm watchpost --post-url http://localhost:8888/", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

/**
 * creates the crx and update file for Chrome
 */
gulp.task('crx', function() {
    var manifest = JSON.parse(fs.readFileSync('./build/chrome/manifest.json'));

    var codebase = manifest.codebase;
    var updateXmlFilename = 'psono.PW.update.xml';

    return gulp.src('./build/chrome')
        .pipe(crx({
            privateKey: fs.readFileSync(ospath.home() + '/.psono_client/certs/key', 'utf8'),
            filename: manifest.name + '.crx',
            codebase: codebase,
            updateXmlFilename: updateXmlFilename
        }))
        .pipe(gulp.dest('./dist/chrome'));
});


/**
 * Deploys the Chrome Extension to the Chrome Web Store
 */
gulp.task('chrome-deploy', function() {

    var client_id = gutil.env.webstore_client_id;
    var client_secret = gutil.env.webstore_client_secret;
    var refresh_token = gutil.env.webstore_refresh_token;
    var app_id = gutil.env.webstore_app_id;

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
                zip: 'dist/chrome/psono.PW.zip'
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
 * creates the unsigned xpi file for Firefox
 */
gulp.task('xpiunsigned', function (cb) {

    child_process.exec('cd build/firefox/ && jpm xpi && cd ../../ && mv build/firefox/@psonopw-*.xpi dist/firefox/psono.PW.unsigned.xpi', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

/**
 * signs an xpi file with addons.mozilla.org api credentials
 * To obtain your api credentials visit https://addons.mozilla.org/en-US/developers/addon/api/key/
 *
 * create the following file (if not already exist):
 * ~/.psono_client/apikey_addons_mozilla_org/key.json
 *
 * As content put the following (replace the values with your api credentials from addons.mozilla.org):
 * {
 *       "issuer": "user:123467:789",
 *       "secret": "15c686fea..."
 * }
 *
 * Side note: This command requires jpm 1.0.4 or later to work.
 *            You can check with "jpm --version"
 *            Try to update it or install the version directly from git like:
 *
 *            git clone https://github.com/mozilla-jetpack/jpm.git
 *            cd jpm
 *            npm install
 *            npm link
 */
gulp.task('xpi', ['xpiunsigned'], function (cb) {

    var key = require(path.homedir() + '/.psono_client/apikey_addons_mozilla_org/key.json');

    child_process.exec('jpm sign --api-key '+key.issuer+' --api-secret '+key.secret+' --xpi dist/firefox/psono.PW.unsigned.xpi && mv psonopw*.xpi dist/firefox/psono.PW.xpi', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});




gulp.task('dist', ['default', 'crx', 'xpi']);

gulp.task('updateversion', function() {

    var fileContent = fs.readFileSync("./src/common/data/VERSION.txt", "utf8");

    var all_browsers = ['chrome', 'firefox'];
    all_browsers.forEach(function(browser) {
        gulp.src(path.join("./build", browser, "manifest.json"))
            .pipe(removeFiles());

        gulp.src(path.join("./src", browser, "manifest.json"))
            .pipe(jeditor({
                'version': fileContent.trim()
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
        title: "Psono Client",
        styles: ['var/ngdocs/style.css']
    };

    return gulp.src([
        'src/common/data/js/*.js',
        'src/common/data/js/service/*.js',
        'src/common/data/js/widgets/*.js'
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
