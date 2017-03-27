describe('Auth', function() {
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
				if(err){ 
					return done(err);
				}
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
				if(err){ 
					return done(err);
				}
				expect(res).to.have.status(500);
				done();
			});
	});

  it('should not register with same email', function(done) {
    var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: util.makeString()
		};
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {});
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				if(err){ 
					return done(err);
				}
				expect(res).to.have.status(500);
				expect(res).to.have.statusMessage('A user with this email already exists.');
				done();
			});
  });

  it('should not register with an invalid email', function(done) {
    var email = '(' + util.makeEmail() + ')';
		var name = util.makeString();
		var test_user = {
			email: email,	
			password: util.makeString(),
			name: util.makeString()
		};
		chai.request(URL)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				expect(res).to.have.status(500);
			});
  });

});