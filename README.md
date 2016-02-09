Pack resources into systemjs modules.

Example:

    gulp.task('resource', function () {
      return gulp.src('src/less/**/*.less')
        .pipe(less())
        .pipe(cssnano())
        .pipe(resource.pack(
          'src/app/resource.d.ts',
          'dist/app/resource.js'))
        .pipe(gulp.dest('.'));
    });
