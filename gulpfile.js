'use strict';
/* eslint node:true */

var gulp = require('gulp');
var config = require('ng-factory').use(gulp, {
  cdn: true,
  src: {
    docsViews: '*/docs/{,*/}*.tpl.{html,jade}'
  },
  bower: {
    exclude: /jquery|js\/bootstrap|\.less/
  }
});

//
// Tasks

gulp.task('serve', gulp.series('ng:serve'));

var del = require('del');
var path = require('path');
gulp.task('build', gulp.series('ng:build', function afterBuild(done) {
  var paths = config.paths;
  // Delete useless module.* build files
  del(path.join(paths.dest, 'module.*'), done);
}));

gulp.task('pages', gulp.series('ng:pages', function afterPages(done) {
  var paths = config.docs;
  return gulp.src(['bower_components/highlightjs/styles/github.css'], {cwd: paths.cwd, base: paths.cwd})
    .pipe(gulp.dest(paths.dest));
}));

//
// Tests

var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
gulp.task('jshint', function() {
  var paths = config.paths;
  return gulp.src(paths.scripts, {cwd: paths.cwd})
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

var Server = require('karma').Server;
var testTimezone = '';
gulp.task('karma:unit', gulp.series('ng:test/templates', function() {
  // if testTimezone has value, set the environment timezone
  // before starting karma, so PhantomJS picks up the
  // timezone setting
  if (testTimezone) {
    console.log('Setting timezone to => [' + testTimezone + ']');
    process.env.TZ = testTimezone;
  }
  new Server({
    configFile: path.join(__dirname, 'test/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['dots'],
    singleRun: true
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  }).start();
}));
gulp.task('karma:server', gulp.series('ng:test/templates', function karmaServer() {
  new Server({
    configFile: path.join(__dirname, 'test/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['progress'],
    autoWatch: true,
    singleRun: false
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  }).start();
}));
// codeclimate-test-reporter
gulp.task('karma:travis', gulp.series('ng:test/templates', function karmaTravis() {
  new Server({
    configFile: path.join(__dirname, 'test/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['dots', 'coverage'],
    singleRun: true
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
    gulp.src('test/coverage/**/lcov.info')
      .pipe(coveralls())
      .on('end', function() {
        process.exit(code);
      });
  }).start();
}));
gulp.task('karma:travis~1.2.0', gulp.series('ng:test/templates', function karmaTravis120() {
  new Server({
    configFile: path.join(__dirname, 'test/~1.2.0/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['dots'],
    singleRun: true
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  }).start();
}));
gulp.task('karma:travis~1.3.0', gulp.series('ng:test/templates', function karmaTravis130() {
  new Server({
    configFile: path.join(__dirname, 'test/~1.3.0/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['dots'],
    singleRun: true
    // autoWatch: true,
    // singleRun: false
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  }).start();
}));

gulp.task('test', gulp.series('ng:test/templates', gulp.parallel('jshint', 'karma:unit')));
gulp.task('test:timezone', function() {
  // parse command line argument for optional timezone
  // invoke like this:
  //     gulp test:timezone --Europe/Paris
  var timezone = process.argv[3] || '';
  testTimezone = timezone.replace(/-/g, '');
  return gulp.series('ng:test/templates', gulp.parallel('jshint', 'karma:unit'));
});
gulp.task('test:server', gulp.series('ng:test/templates', 'karma:server'));

gulp.task('default', gulp.task('build'));
