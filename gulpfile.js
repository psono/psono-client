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
var jwt = require('jsonwebtoken');
var run = require('gulp-run');

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
    gulp.src(['src/common/data/css/**/*'])
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(path.join(build_path, 'css')));

    gulp.src(['src/common/data/fonts/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'fonts')));

    gulp.src(['src/common/data/img/**/*'])
        .pipe(gulp.dest(path.join(build_path, 'img')));


    var js_source = ['src/common/data/js/**/*'];

    if(type === 'firefox' || type === 'chrome') {
        // remove default browser client
        js_source.push('!src/common/data/js/service/browser-client.js');
    }

    if(type === 'webserver') {
        // remove extension specific javascript
        js_source.push('!src/common/data/js/extension/');
    }

    if (type === 'webserver') {
        // minify
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
    return build('build/webserver', 'webserver');
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
                zip: 'dist/chrome/psono.chrome.PW.zip'
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

    var jwt_issuer = gutil.env.mozilla_jwt_issuer;
    var jwt_secret = gutil.env.mozilla_jwt_secret;
    var version = gutil.env.mozilla_version;
    var mozilla_addon_id = gutil.env.mozilla_addon_id;

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

    return run('curl "https://addons.mozilla.org/api/v3/addons/'+mozilla_addon_id+'/versions/'+ version +'/" -g -XPUT --form "upload=@dist/firefox/psono.firefox.PW.zip" -H "Authorization: JWT '+ token +'"').exec()
        .pipe(gulp.dest('output'));
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

    var fileContent = fs.readFileSync("/.psono_client/apikey_addons_mozilla_org/key.json", "utf8");
    var key = JSON.parse(fileContent);

    child_process.exec('jpm sign --api-key '+key.issuer+' --api-secret '+key.secret+' --xpi dist/firefox/psono.PW.unsigned.xpi && mv psonopw*.xpi dist/firefox/psono.PW.xpi', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});




gulp.task('dist', ['default', 'crx', 'xpi']);

gulp.task('updateversion', function() {


    var commit_tag = gutil.env.commit_tag;
    var commit_sha = gutil.env.commit_sha;


    if (! /^v\d*\.\d*\.\d*$/.test(commit_tag)) {
        return;
    }

    var version = commit_tag.substring(1);
    var hash = commit_sha.substring(0,8);
    var version_long = version+ ' (Build '+hash+')';

    fs.writeFile("./build/webserver/VERSION.txt", version_long, function(err) {
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
        'src/common/data/js/controller/*.js'
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
