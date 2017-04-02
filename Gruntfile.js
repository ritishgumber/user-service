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
					reporter: 'spec',
					require: [
						function() {
							chai = require('chai');
							expect = chai.expect;
							chaiHttp = require('chai-http');
							chai.use(chaiHttp);
							URL = "http://localhost:3000";
							request = chai.request(URL);
							util = {
								makeString: function() {
									var text = "";
									var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

									for (var i = 0; i < 5; i++)
										text += possible.charAt(Math.floor(Math.random() * possible.length));

									return text;
								},
								makeEmail: function() {
									return this.makeString() + '@sample.com';
								},
							  generateRandomString: function() {
							    var text = "";
							    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

							    for (var i = 0; i < 8; i++)
							      text += possible.charAt(Math.floor(Math.random() * possible.length));

							    return text;
							  }
							};
						}
					]
				},
				src: ['test/**/*.js']
			}
		},

		eslint: {
			all: ["*.js", "**/*.js", "api/**/*.js", "!node_modules/**/*.js", "!test/**/*.js", "!Gruntfile.js"]
		},

		jsbeautifier: {
			src: ["*.js", "**/*.js", "!node_modules/**/*.js"],
			options: {
				js: {
					indentSize: 1,
					indentChar: " ",
					indentWithTabs: true
				}
			}
		}

	});


	///////////////////////////////////////////////////////////
	///Load the uglify and mocha plugins and set it 
	///as the default task
	///////////////////////////////////////////////////////////
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-jsbeautifier");

	grunt.registerTask('default', ['mochaTest', 'eslint:all']);
	grunt.registerTask('beautify_js', ['jsbeautifier']);
};
