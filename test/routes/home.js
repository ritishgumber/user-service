
var should = require('should');
var util = require('../util/util.js');

module.exports = function(request,app){

	describe('Home', function(){

		this.timeout(100000);

		describe('Home', function(){

			it('check if the server is up', function(done){

		        request(app).get('/')
				  .expect(200)
				  .end(function(err, res){

				  	if(err) throw err;
				  	if(res.text === 'Hello World'){
				  		done();
				  	}else{
				  		throw "Wrong Server Response";
				  	}

				  });

		    });

		});

	});
}

