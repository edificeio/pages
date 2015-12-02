var jshint = require('gulp-jshint');
var gulp   = require('gulp');

gulp.task('lint', function() {
    return gulp.src('./src/main/resources/public/js/*.js')
                .pipe(jshint())
                .pipe(jshint.reporter('./build/resources/report-jshint'));
                                  })

