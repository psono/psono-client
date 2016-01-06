'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var removeCode = require('gulp-remove-code');
var templateCache = require('gulp-angular-templatecache');
var crx = require('gulp-crx-pack');
var fs = require("fs");
var path = require('path-extra');
var child_process = require('child_process');


/**
 * Compiles .sass files to css files
 */
gulp.task('sass', function () {
    gulp.src('src/common/data/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});

/**
 * Creates the build Firefox build folder
 */
gulp.task('build-firefox', function() {
    gulp.src([
        'src/common/data/**/*',
        '!src/common/data/view/**/*',
        '!src/common/data/js/service/browser-client.js',
        '!src/common/data/{sass,sass/**}',
        '!src/common/data/img/**/*',
        '!src/common/data/fonts/**/*'
    ])
        .pipe(removeCode({ firefox: true }))
        .pipe(gulp.dest('build/firefox/data'));

    gulp.src('src/common/data/view/**/*.html')
        .pipe(templateCache('templates.js', { module:'passwordManagerApp', root: 'view/' }))
        .pipe(gulp.dest('build/firefox/data/view'));

    gulp.src(['src/common/data/img/**/*'])
        .pipe(gulp.dest('build/firefox/data/img'));

    gulp.src(['src/common/data/fonts/**/*'])
        .pipe(gulp.dest('build/firefox/data/fonts'));

    gulp.src(['src/firefox/**/*'])
        .pipe(gulp.dest('build/firefox'));
});

/**
 * Creates the build Chrome build folder
 */
gulp.task('build-chrome', function() {
    gulp.src([
        'src/common/data/**/*',
        '!src/common/data/view/**/*',
        '!src/common/data/js/service/browser-client.js',
        '!src/common/data/{sass,sass/**}'
    ])
        .pipe(gulp.dest('build/chrome/data'));

    gulp.src('src/common/data/view/**/*.html')
        .pipe(templateCache('templates.js', { module:'passwordManagerApp', root: 'view/' }))
        .pipe(gulp.dest('build/chrome/data/view'));

    gulp.src(['src/chrome/**/*'])
        .pipe(gulp.dest('build/chrome'));
});

gulp.task('default', ['sass', 'build-chrome', 'build-firefox']);

/**
 * Watcher to compile the project again once something changes
 *
 * - initiates the task for the compilation of the sass
 * - initiates the task for the creation of the firefox build folder
 * - initiates the task for the creation of the chrome build folder
 */
gulp.task('watch', ['sass', 'build-chrome', 'build-firefox'], function() {
    gulp.watch(['src/common/data/**/*', '!src/common/data/sass/**/*.scss'], ['build-firefox', 'build-chrome']);
    gulp.watch('src/chrome/**/*', ['build-chrome']);
    gulp.watch('src/firefox/**/*', ['build-firefox']);
    gulp.watch('src/common/data/sass/**/*.scss', ['sass', 'build-chrome', 'build-firefox']);
});

/**
 * creates the crx and update file for Chrome
 */
gulp.task('crx', function() {
    var manifest = require('./build/chrome/manifest.json');

    var codebase = manifest.codebase;
    var updateXmlFilename = 'sanso.PW.update.xml';


    return gulp.src('./build/chrome')
        .pipe(crx({
            privateKey: fs.readFileSync(path.homedir() + '/.password_manager_browser_plugins/certs/key', 'utf8'),
            filename: manifest.name + '.crx',
            codebase: codebase,
            updateXmlFilename: updateXmlFilename
        }))
        .pipe(gulp.dest('./dist/chrome'));
});

/**
 * creates the unsigned xpi file for Firefox
 */
gulp.task('xpiunsigned', function (cb) {

    //child_process.exec('cd build/firefox/ && jpm xpi && cd ../../ && mv build/firefox/@sansopw-*.xpi dist/firefox/ && cd dist/firefox/ && for file in @*; do mv $file `echo $file | cut -c2-`; done && cd ../../', function (err, stdout, stderr) {
    child_process.exec('cd build/firefox/ && jpm xpi && cd ../../ && mv build/firefox/@sansopw-*.xpi dist/firefox/sanso.PW.unsigned.xpi', function (err, stdout, stderr) {
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
 * ~/.password_manager_browser_plugins/apikey_addons_mozilla_org/key.json
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

    var key = require(path.homedir() + '/.password_manager_browser_plugins/apikey_addons_mozilla_org/key.json');

    child_process.exec('jpm sign --api-key '+key.issuer+' --api-secret '+key.secret+' --xpi dist/firefox/sanso.PW.unsigned.xpi && mv sansopw*.xpi dist/firefox/sanso.PW.xpi', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('dist', ['default', 'crx', 'xpi']);