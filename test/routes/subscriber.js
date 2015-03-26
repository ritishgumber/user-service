
var should = require('should');
var util = require('../util/util.js');

module.exports = function(request,app){

	describe('Subscriber', function(){

		this.timeout(50000);

		describe('Subscribe', function(){

			it('should not allow null values', function(done){

		    	var data = {email : '' };

		        request(app).post('/subscribe')
				  .send(data)
				  .expect(204)
				  .end(function(err, res){

				  	if(err) throw err;
				  	data = {};

			  	   request(app).post('/subscribe')
					  .send(data)
					  .expect(204)
					  .end(function(err, res){
					  	if(err) throw err;
						    done();
					   });

				  });

		    });

		    it('should insert a subscriber', function(done){

		    	var data = {email : util.makeEmail() };

		        request(app).post('/subscribe')
				  .send(data)
				  .expect(200)
				  .end(function(err, res){
				  	if(err) throw err;
				    done();
				  });

		    });

		    it('should NOT insert a subscriber which already exists', function(done){
		      	 var data = {email : util.makeEmail() };

		        request(app).post('/subscribe')
				  .send(data)
				  .expect(200)
				  .end(function(err, res){
				  	if(err) throw err;
				    //post it again. 
				    request(app).post('/subscribe')
				  	  .send(data)
					  .expect(406)
					  .end(function(err, res){
					  	console.log(err);
					  	if(err) throw err;
					    done();
					  });
				  });
		    });


		});

	});
}

