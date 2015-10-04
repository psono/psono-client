'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');


gulp.task('sass', function () {
    gulp.src('src/common/data/css/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/common/data/css'));
});

gulp.task('build-firefox', function() {
    gulp.src(['src/firefox/**/*']).pipe(gulp.dest('build/firefox'));
    gulp.src(['src/common/**/*']).pipe(gulp.dest('build/firefox'));
});

gulp.task('build-chrome', function() {
    // place code for your default task here
    gulp.src(['src/chrome/**/*']).pipe(gulp.dest('build/chrome'));
    gulp.src(['src/common/**/*']).pipe(gulp.dest('build/chrome'));
});

gulp.task('default', ['sass', 'build-firefox', 'build-chrome']);

gulp.watch(['src/common/**/*', '!src/common/**/*.scss'], ['build-firefox', 'build-chrome']);
gulp.watch('src/chrome/**/*', ['build-chrome']);
gulp.watch('src/firefox/**/*', ['build-firefox']);
gulp.watch('src/common/data/css/sass/**/*.scss', ['sass', 'build-chrome', 'build-firefox']);