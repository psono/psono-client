'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
    gulp.src('src/common/data/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});

gulp.task('build-firefox', function() {
    gulp.src(['src/common/data/**/*', '!src/common/data/js/service/browser-client.js', '!src/common/data/{sass,sass/**}']).pipe(gulp.dest('build/firefox/data'));
    gulp.src(['src/firefox/**/*']).pipe(gulp.dest('build/firefox'));
});

gulp.task('build-chrome', function() {
    gulp.src(['src/common/data/**/*', '!src/common/data/js/service/browser-client.js', '!src/common/data/{sass,sass/**}']).pipe(gulp.dest('build/chrome/data'));
    gulp.src(['src/chrome/**/*']).pipe(gulp.dest('build/chrome'));
});

gulp.task('default', ['sass', 'build-chrome', 'build-firefox']);

gulp.watch(['src/common/data/**/*', '!src/common/data/sass/**/*.scss'], ['build-firefox', 'build-chrome']);
gulp.watch('src/chrome/**/*', ['build-chrome']);
gulp.watch('src/firefox/**/*', ['build-firefox']);
gulp.watch('src/common/data/sass/**/*.scss', ['sass', 'build-chrome', 'build-firefox']);