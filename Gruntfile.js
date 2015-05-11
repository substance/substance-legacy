module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: ['src/**/*.js', 'test/**/*.js'],
      options: {
        "jshintrc": true
      }
    },
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', ['jshint']);
};
