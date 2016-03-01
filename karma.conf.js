module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'jasmine'],
    files: [
      'src/**/*.js',
      'test/**/*Spec.js'
    ],
    preprocessors: {
      'test/**/*.js': ['jshint', 'browserify'],
      'src/**/*.js': ['jshint', 'browserify']
    },
    browsers: ['PhantomJS'],
    browserify: {
      debug: true,
      bundleDelay: 2000 // Fixes "reload" error messages, YMMV!
    }
  });
};
