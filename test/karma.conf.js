// Karma configuration
// Generated on Sat May 09 2015 01:51:50 GMT+0200 (W. Europe Summer Time)
module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['qunit', 'commonjs'],
    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-commonjs',
      'karma-coverage'
    ],
    files: [
      {pattern: 'index.js'},
      {pattern: 'src/**/*.js'},
      {pattern: 'node_modules/lodash/**/*.js'},
      {pattern: 'test/**/*.test.js'}
    ],
    exclude: [
    ],
    preprocessors: {
      "index.js": ["commonjs"],
      "src/**/*.js": ["commonjs"],
      "test/**/*.test.js": ["commonjs"],
      "node_modules/lodash/**/*.js": ["commonjs"],
      // compute test coverage only for the real modules
      "src/!(basics)/**/*.js": ["coverage"],
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true
  });
};
