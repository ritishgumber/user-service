var request = chai.request(URL);
describe('Authentication', function() {
	this.slow(3000);
	// 'post /user/signup'
	it('should register with name, email, password', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body).to.be.an('object');
				expect(res.body.email).to.equal(email);
				expect(res.body.name).to.equal(name);
				done();
			});
	});

	it('should not register when name, email or password is null', function(done) {
		var email = null;
		var name = util.makeString();
		var test_user = {
			email: email,
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				expect(res).to.have.status(400);
				done();
			});
	});

	it('should not register with same email', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				request
					.post('/user/signup')
					.send(test_user)
					.end(function(err, res) {
						expect(res).to.have.status(500);
						done();
					});
			});
		
	});

	it('should not register with an invalid email', function(done) {
		var email = '(' + util.makeEmail() + ')';
		var name = util.makeString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				expect(res).to.have.status(500);
				done();
			});
	});

	// post '/user/activate'
	it('should fail to activate the registered email with a invalid code', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var emailVerificationCode = util.generateRandomString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				request
					.post('/user/activate')
					.send({code: emailVerificationCode})
					.end(function(err, res) {
						expect(res).to.have.status(500);
						done();
					});
			});
	});

	it('should activate the registered email with a valid code', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var emailVerificationCode;
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: name
		};
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				emailVerificationCode = res.body.emailVerificationCode;
				request
					.post('/user/activate')
					.send({code: emailVerificationCode})
					.end(function(err, res1) {
						expect(res1).to.have.status(200);
						expect(res1.body).to.be.an('object');
						expect(res1.body.emailVerificationCode).to.equal(emailVerificationCode);
						done();
					});
			});
	});

	// post '/user/resendverification'
	it('should send verification mail when emailid is valid', function(done) {
			var email = util.makeEmail();
			var name = util.makeString();
			var test_user = {
				email: email,	
				password: util.makeString(),
				name: name
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					request
						.post('/user/resendverification')
						.send({email: email})
						.end(function(err, res1) {
							expect(res1).to.have.status(200);
							done();
						});
				});
		});

	it('should not send verification mail when emailid is invalid', function(done) {
			var email = '(' + util.makeEmail() + ')';
			var name = util.makeString();
			var test_user = {
				email: email,	
				password: util.makeString(),
				name: name
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					request
						.post('/user/resendverification')
						.send({email: email})
						.end(function(err, res1) {
							expect(res1).to.have.status(500);
							done();
						});
				});
		});

	describe('Reset Password', function() {
		var verificationCode;
		var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: name
		};

		before(function(done) {
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					done();
				});
		});

		// post '/user/ResetPassword'
		it('should not accept reset password request when emailid is invalid', function(done) {
			request
				.post('/user/ResetPassword')
				.send({email: '(' + email + ')'})
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		it('should accept reset password request when emailid is valid', function(done) {
			request
				.post('/user/ResetPassword')
				.send({email: email})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					verificationCode = res.body.emailVerificationCode;
					done();
				});
		});

		// post '/user/updatePassword'
		it('should not reset password if verification code is invalid', function(done) {
			var data = {
				password: util.makeString(),
				code: util.generateRandomString()
			};
			request
				.post('/user/updatePassword')
				.send(data)
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		it('should reset password if verification code is valid', function(done) {
			var data = {
				password: util.makeString(),
				code: verificationCode
			};
			request
				.post('/user/updatePassword')
				.send(data)
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.text).to.equal('You have changed password successfully!');
					done();
				});
		});
	});

	describe('Login', function() {
    
    var email = util.makeEmail();
    var password = util.makeString();
		var name = util.makeString();

  	before(function (done) {
  		var emailVerificationCode;
  		var test_user = {
  			email: email,	
  			password: password,
  			name: name
  		};
  		request
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				emailVerificationCode = res.body.emailVerificationCode;
  				request
  					.post('/user/activate')
  					.send({code: emailVerificationCode})
  					.end(function(err, res1) {
  						done();
  					});
  			});
		});

  	// post '/user/signin'
		it('should not allow to login with invalid credentials', function(done) {
			var email = util.makeEmail();
    	var password = util.makeString();

    	request
    		.post('/user/signin')
    		.send({email: email, password: password})
    		.end(function(err, res) {
					expect(res).to.have.status(500);
    			done();
    		});
		});

		it('should allow to login with valid credentials', function(done) {
			request
    		.post('/user/signin')
    		.send({email: email, password: password})
    		.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body.email).to.equal(email);
    			done();
    		});
		});
	});
	
	describe('User', function() {
    var email = util.makeEmail();
    var password = util.makeString();
		var name = util.makeString();
  	var Cookie;
		var newName;
		var id;

  	before(function (done) {
  		var emailVerificationCode;
  		var test_user = {
  			email: email,	
  			password: password,
  			name: name
  		};
  		request
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				emailVerificationCode = res.body.emailVerificationCode;
  				request
  					.post('/user/activate')
  					.send({code: emailVerificationCode})
  					.end(function(err, res1) {
							request
				    		.post('/user/signin')
				    		.send({email: email, password: password})
				    		.end(function(err, res2) {
									Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									id = res2.body._id;
				    			done();
				    		});
  					});
  			});
		});
  	
  	// get '/user'
		it('should return the current loggedin user details', function(done) {
			request
  			.get('/user')
  			.set('Cookie', Cookie)
  			.end(function(err, res) {
					var body = res.body;
					expect(res).to.have.status(200);
					expect(body.user.email).to.equal(email);
  				done();
  			});
		});

		// post '/user/update'
		/*describe('', function() {
			afterEach(function(done) {
				request
	    		.post('/user/signin')
	    		.send({email: email, password: password})
	    		.end(function(err, res2) {
						Cookie = res2.headers['set-cookie'].pop().split(';')[0];
						id = res2.body._id;
	    			done();
	    		});
			});
	
			it('should change user password', function(done) {
				var newPassword = util.makeString();
				var data = {
					name: null,
					oldPassword: password,
					newPassword: util.makeString()
				}
				request
	  			.post('/user/update')
	  			.set('Cookie', Cookie)
	  			.send(data)
	  			.end(function(err, res) {
						expect(res).to.have.status(200);
						expect(res.body.email).to.equal(email);
						expect(res.body.name).to.equal(name);
						password = newPassword;
	  				done();
	  			});
			});

			it('should change user\'s name', function(done) {
				newName = util.makeString();
				var data = {
					name: newName,
					oldPassword: null,
					newPassword: null
				}
				request
	  			.post('/user/update')
	  			.set('Cookie', Cookie)
	  			.send(data)
	  			.end(function(err, res) {
						expect(res).to.have.status(200);
						expect(res.body.name).to.equal(newName);
	  				done();
	  			});
			});

  	});*/

		// post '/user/list'
		it('should return a list of user by ids', function(done) {
			var idsList = [id];
			request
  			.post('/user/list')
  			.set('Cookie', Cookie)
  			.send({IdArray: idsList})
  			.end(function(err, res) {
					expect(res).to.have.status(200);
					// expect(res.body[0].name).to.equal(newName);
  				done();
  			});
		});

		// post '/user/list/bykeyword'
		it('should not return a list of user by keyword', function(done) {
			request
  			.post('/user/list/bykeyword')
  			.set('Cookie', Cookie)
  			.send({keyword: util.makeEmail()})
  			.end(function(err, res) {
					expect(res).to.have.status(200);
					console.log(res.body);
					expect(res.body).to.be.null;
  				done();
  			});
		});

		it('should return a list of user by keyword', function(done) {
			request
  			.post('/user/list/bykeyword')
  			.set('Cookie', Cookie)
  			.send({keyword: email})
  			.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body[0].email).to.equal(email);
  				done();
  			});
		});

		// put '/user/list/:skip/:limit'
		it('should not return a list of user within skip and limit', function(done) {
			var limit = Math.floor(Math.random() * 10 + 15);
			request
  			.put('/user/list/0/'+ limit)
  			.set('Cookie', Cookie)
  			.send({skipUserIds: []})
  			.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.have.lengthOf(limit);
  				done();
  			});
		});

		it('should return a list of user skipping some userIds', function(done) {
			request
  			.put('/user/list/0/0')
  			.set('Cookie', Cookie)
  			.send({skipUserIds: [id]})
  			.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.not.include({_id: id});
  				done();
  			});
		});
		

  });

});