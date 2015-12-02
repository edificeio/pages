var jshint = require('gulp-jshint');
var gulp   = require('gulp');
var minifyHTML = require('gulp-minify-html');

gulp.task('lint', function() {
    return gulp.src('./src/main/resources/public/js/*.js')
                .pipe(jshint())
                .pipe(jshint.reporter('./build/resources/report-jshint'));
                                  })

gulp.task('minify-html', function() {
var opts = {
conditionals: true,
spare:true
};

return gulp.src('./src/main/resources/public/template/*.html')
.pipe(minifyHTML(opts))
.pipe(gulp.dest('./build/resources/'));
});

