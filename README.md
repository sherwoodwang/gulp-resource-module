Pack resources into systemjs modules.

Example:

    var cssnano = require('gulp-cssnano');
    var less = require('gulp-less');
    var resource = require('gulp-resource-module');

    gulp.task('resource', function () {
      return gulp.src('src/less/**/*.less')
        .pipe(less())
        .pipe(cssnano())
        .pipe(resource.pack(
          'src/app/resource.d.ts',
          'dist/app/resource.js'))
        .pipe(gulp.dest('.'));
    });

Or:

    var cssnano = require('gulp-cssnano');
    var less = require('gulp-less');
    var rename = require('gulp-rename');
    var resource = require('gulp-resource-module');

    gulp.task('resource-declaration', function () {
      return gulp.src('src/less/**/*.less', { read: false })
        .pipe(rename({ extname: '.css' }))
        .pipe(resource.declaration())
        .pipe(gulp.dest('src/ts'));
    });

    gulp.task('resource', function () {
      return gulp.src('src/less/**/*.less')
        .pipe(less())
        .pipe(cssnano())
        .pipe(resource.definition())
        .pipe(gulp.dest('dist/app'));
    });
