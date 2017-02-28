var gulp = require('gulp');
var ts = require('gulp-typescript');
var webpack = require('webpack-stream');
var bower = require('gulp-bower');
var merge = require('merge2');
var watch = require('gulp-watch');
var rev = require('gulp-rev');
var revReplace = require("gulp-rev-replace");
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('typescript');

var paths = {
    infra: '../infra-front',
    toolkit: '../toolkit'
};

function compileTs(){
    var tsProject = ts.createProject('./src/main/resources/public/ts/tsconfig.json', {
        typescript: typescript
    });
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));
        
    return tsResult.js
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./src/main/resources/public/temp'));
}

function startWebpackEntcore(isLocal) {
    return gulp.src('./src/main/resources/public')
        .pipe(webpack(require('./webpack-entcore.config.js')))
        .pipe(gulp.dest('./src/main/resources/public/dist/entcore'))
        .pipe(rev())
        .pipe(gulp.dest('./src/main/resources/public/dist/entcore'))
        .pipe(rev.manifest({ merge: true }))
        .pipe(gulp.dest('./'));
}

function startWebpack(isLocal) {
    return gulp.src('./src/main/resources/public')
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('./src/main/resources/public/dist'))
        .pipe(rev())
        .pipe(gulp.dest('./src/main/resources/public/dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./'));
}

function updateRefs() {
    return gulp.src("./src/main/resources/view-src/**/*.html")
        .pipe(revReplace({manifest: gulp.src("./rev-manifest.json") }))
        .pipe(gulp.dest("./src/main/resources/view"));
}

gulp.task('drop-old-files', function () {
    return gulp.src(['./src/main/resources/public/temp', './src/main/resources/public/dist', './src/main/resources/public/ts/entcore'], { read: false })
       .pipe(clean());
});

gulp.task('copy-local-libs', ['drop-old-files'], () => {
    var ts = gulp.src(paths.infra + '/src/ts/**/*.ts')
        .pipe(gulp.dest('./src/main/resources/public/ts/entcore'));
        
    var toolkitModule = gulp.src([paths.toolkit + '/**/*.d.ts', paths.toolkit + '/**/*.js', '!' + paths.toolkit + '/node_modules', '!' + paths.toolkit + '/node_modules/**' ])
        .pipe(gulp.dest('./node_modules/toolkit'));

    var module = gulp.src(paths.infra + '/src/ts/**/*.ts')
        .pipe(gulp.dest('./node_modules/entcore'));

    var html = gulp.src(paths.infra + '/src/template/**/*.html')
        .pipe(gulp.dest('./src/main/resources/public/template/entcore'));
    return merge([html, ts, module, toolkitModule]);
});

gulp.task('drop-cache', ['drop-old-files'], function(){
     return gulp.src(['./bower_components', './src/main/resources/public/dist'], { read: false })
		.pipe(clean());
});

gulp.task('bower', ['drop-cache'], function(){
    return bower({ directory: './bower_components', cwd: '.', force: true });
});

gulp.task('update-libs', ['bower'], function(){
    var html = gulp.src('./bower_components/entcore/src/template/**/*.html')
         .pipe(gulp.dest('./src/main/resources/public/template/entcore'));

    var ts = gulp.src('./bower_components/entcore/src/ts/**/*.ts')
         .pipe(gulp.dest('./src/main/resources/public/ts/entcore'));

    var module = gulp.src('./bower_components/entcore/src/ts/**/*.ts')
        .pipe(gulp.dest('./node_modules/entcore'));

    var sassJs = gulp.src('./bower_components/sass.js/dist/**/*.js')
        .pipe(gulp.dest('./src/main/resources/public/dist/sass-js'));
        
   return merge([html, ts, sassJs]);
});

gulp.task('ts-local', ['copy-local-libs'], function () { return compileTs() });
gulp.task('webpack-local', ['ts-local'], function(){ return startWebpack() });
gulp.task('webpack-entcore-local', ['webpack-local'], function(){ return startWebpackEntcore() });

gulp.task('ts', ['update-libs'], function () { return compileTs() });
gulp.task('webpack', ['ts'], function(){ return startWebpack() });
gulp.task('webpack-entcore', ['webpack'], function(){ return startWebpackEntcore() });

gulp.task('drop-temp', ['webpack-entcore'], () => {
    return gulp.src([
        './src/main/resources/public/**/*.map.map',
        './src/main/resources/public/temp',
        './src/main/resources/public/dist/entcore/ng-app.js',
        './src/main/resources/public/dist/entcore/ng-app.js.map',
        './src/main/resources/public/dist/application.js',
        './src/main/resources/public/dist/application.js.map'
    ], { read: false })
		.pipe(clean());
})

gulp.task('build', ['drop-temp'], function () {
    var refs = updateRefs();
    var copyBehaviours = gulp.src('./src/main/resources/public/dist/behaviours.js')
        .pipe(gulp.dest('./src/main/resources/public/js'));
    return merge[refs, copyBehaviours];
});

gulp.task('build-local', ['webpack-entcore-local'], function () {
    var refs = updateRefs();
    var copyBehaviours = gulp.src('./src/main/resources/public/dist/behaviours.js')
        .pipe(gulp.dest('./src/main/resources/public/js'));
    return merge[refs, copyBehaviours];
});
