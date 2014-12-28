
var should = require('should');
var util = require('../util/util.js');

module.exports = function(request,app){

	describe('User', function(){

		this.timeout(100000);

		describe('Register', function(){

			it('should register with name, email, password', function(done){
		        done();
		    });

		    it('should not register with same email', function(done){
 				done(); 
		    });

		    it('should not register when email, password or name is null', function(done){
 				done(); 
		    });
		});

		describe('Signin', function(){

			it('should not signin when email or password is null', function(done){
		        done();
		    });

		    it('should not signin with incorrect username', function(done){
 				done(); 
		    });

		    it('should not signin with incorrect password', function(done){
 				done(); 
		    });

		});

	});
}

