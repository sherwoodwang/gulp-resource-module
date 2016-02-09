Pack resources into a systemjs module.

Example:

    gulp.task('resource', function () {
      return gulp.src('src/less/**/*.less')
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(resource(
          'src/app/resource.d.ts', 'dist/app/resource.js'))
        .pipe(gulp.dest('.'));
    });
