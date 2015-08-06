module.exports = function(grunt) {

  //initConfig will take our configuration object. This specifies which tasks
  //and plugins we want to use
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    //specify that we would like to use the uglify plugin with the build and option parameters
    uglify: {
      options: {
        //places a timestamp on top of our minified file
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }


  });


  ///////////////////////////////////////////////////////////
  ///Load the uglify and mocha plugins and set it 
  ///as the default task
  ///////////////////////////////////////////////////////////
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['mochaTest']);

};