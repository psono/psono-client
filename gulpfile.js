var gulp = require('gulp');


gulp.task('build-firefox', function() {
    gulp.src(['src/firefox/**/*']).pipe(gulp.dest('build/firefox'));
    gulp.src(['src/common/**/*']).pipe(gulp.dest('build/firefox'));
});

gulp.task('build-chrome', function() {
    // place code for your default task here
    gulp.src(['src/chrome/**/*']).pipe(gulp.dest('build/chrome'));
    gulp.src(['src/common/**/*']).pipe(gulp.dest('build/chrome'));
});

gulp.task('default', ['build-firefox', 'build-chrome']);

gulp.watch('src/common/**/*', ['build-firefox', 'build-chrome']);
gulp.watch('src/chrome/**/*', ['build-chrome']);
gulp.watch('src/firefox/**/*', ['build-firefox']);