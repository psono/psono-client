'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var del = require('del');


gulp.task('sass', function () {
    gulp.src('src/common/data/css/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});

gulp.task('build-firefox', function() {
    gulp.src(['src/common/data/**/*']).pipe(gulp.dest('build/firefox/data'));
    del(['build/firefox/data/addon.js']).then(function () {
        gulp.src(['src/firefox/**/*']).pipe(gulp.dest('build/firefox'));
    });
});

gulp.task('build-chrome', function() {
    // place code for your default task here
    gulp.src(['src/common/data/**/*']).pipe(gulp.dest('build/chrome/data'));
    del(['build/chrome/data/addon.js']).then(function () {
        gulp.src(['src/chrome/**/*']).pipe(gulp.dest('build/chrome'));
    });
});

gulp.task('default', ['sass', 'build-firefox', 'build-chrome']);

gulp.watch(['src/common/data/**/*', '!src/common/data/**/*.scss'], ['build-firefox', 'build-chrome']);
gulp.watch('src/chrome/**/*', ['build-chrome']);
gulp.watch('src/firefox/**/*', ['build-firefox']);
gulp.watch('src/common/data/css/sass/**/*.scss', ['sass', 'build-chrome', 'build-firefox']);
