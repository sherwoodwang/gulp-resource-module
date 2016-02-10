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

Or:

    gulp.task('resource-declaration', function () {
      return resource.glob('src/less/**/*.less', {
          extmap: {
            '.less': '.css'
          }
        })
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
