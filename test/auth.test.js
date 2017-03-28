describe('Auth', function() {
	this.timeout(1000);
	// 'post /user/signup'
	it('should register with name, email, password', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,
			password: util.makeString(),
			name: name
		};
		chai.request(URL)
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
		chai.request(URL)
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
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				chai.request(URL)
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
		chai.request(URL)
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
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				chai.request(URL)
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
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				User.findOne({email: email}, 'emailVerificationCode', function(err, user) {
					console.log(user);
					emailVerificationCode = user.emailVerificationCode;
				});
				chai.request(URL)
					.post('/user/activate')
					.send({code: emailVerificationCode})
					.end(function(err, res) {
						expect(res).to.have.status(200);
						expect(res.body).to.be.an('object');
						expect(res.body.email).to.equal(email);
						expect(res.body.name).to.equal(name);
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
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				chai.request(URL)
  					.post('/user/resendverification')
  					.send({email: email})
  					.end(function(err, res) {
  						expect(res).to.have.status(200);
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
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				chai.request(URL)
  					.post('/user/resendverification')
  					.send({email: email})
  					.end(function(err, res) {
  						expect(res).to.have.status(500);
  						done();
  					});
  			});
    });

  // post '/user/ResetPassword'
  it('should not accept reset password request when emailid is invalid', function(done) {
      var email = '(' + util.makeEmail() + ')';
  		var name = util.makeString();
  		var test_user = {
  			email: email,	
  			password: util.makeString(),
  			name: name
  		};
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				chai.request(URL)
  					.post('/user/ResetPassword')
  					.send({email: email})
  					.end(function(err, res) {
  						expect(res).to.have.status(500);
  						done();
  					});
  			});
    });

  it('should accept reset password request when emailid is valid', function(done) {
      var email = util.makeEmail();
  		var name = util.makeString();
  		var test_user = {
  			email: email,	
  			password: util.makeString(),
  			name: name
  		};
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				chai.request(URL)
  					.post('/user/ResetPassword')
  					.send({email: email})
  					.end(function(err, res) {
  						expect(res).to.have.status(200);
  						done();
  					});
  			});
    });

  // post '/user/updatePassword'
  it('should not reset password if verification code is invalid', function(done) {
      var email = util.makeEmail();
  		var name = util.makeString();
  		var test_user = {
  			email: email,	
  			password: util.makeString(),
  			name: name
  		};
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				chai.request(URL)
  					.post('/user/updatePassword')
  					.send({password: util.makeString(), code: util.generateRandomString()})
  					.end(function(err, res) {
  						expect(res).to.have.status(500);
  						done();
  					});
  			});
    });

  it('should reset password if verification code is valid', function(done) {
      var email = util.makeEmail();
  		var name = util.makeString();
  		var emailVerificationCode;
  		var test_user = {
  			email: email,	
  			password: util.makeString(),
  			name: name
  		};
  		chai.request(URL)
  			.post('/user/signup')
  			.send(test_user)
  			.end(function(err, res) {
  				// User.findOne({email: email}, 'emailVerificationCode', function(err, user) {
  				// 	console.log(user);
  				// 	emailVerificationCode = user.emailVerificationCode;
  				// });
  				chai.request(URL)
  					.post('/user/updatePassword')
  					.send({password: util.makeString(), code: util.generateRandomString()})
  					.end(function(err, res) {
  						expect(res).to.have.status(200);
  						done();
  					});
  			});
    });

});