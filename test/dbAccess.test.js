describe('Database Access', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};
	var app_name = util.makeString();
	var Cookie, id, appId, db_username, db_password;

	before(function (done) {
		this.timeout(0);
		var emailVerificationCode;
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
							.send({email: test_user.email, password: test_user.password})
							.end(function(err, res2) {
								Cookie = res2.headers['set-cookie'].pop().split(';')[0];
								id = res2.body._id;
								request
									.post('/app/create')
									.set('Cookie', Cookie)
									.send({name: app_name})
									.end(function(err, res) {
										appId = res.body.appId;
										done();
									});
							});
					});
			});
	});

	after(function(done) {
		request
			.post('/user/logout')
			.end(function(err, res){
				done();
			});
	});

	// 'post /dbaccess/get/:appId'
	it('should not return the access url when no public url is present', function(done) {
		request
			.post('/dbaccess/get/' + appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(400);
				done();
			});
	});
	
	// 'post /dbaccess/enable/:appId'
	it('should create a db access entry for user with valid appId', function(done) {
		request
			.post('/dbaccess/enable/' + appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				var body = res.body;
				expect(body.data.user).to.have.all.keys(['username', 'password']);
				db_username = body.data.user.username;
				db_password = body.data.user.password;
				done();
			});
	});

	it('should not create a db access entry for user with invalid appId', function(done) {
		request
			.post('/dbaccess/enable/' + util.makeString())
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(400);
				done();
			});		
	});

	// 'post /dbaccess/get/:appId'
	it('should not return the access url when appid is invalid', function(done) {
		request
			.post('/dbaccess/get/' + util.makeString())
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(400);
				done();
			});
	});

	it('should return the public access url when appid is valid', function(done) {
		request
			.post('/dbaccess/get/' + appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body).to.have.all.keys(['data', 'url']);
				done();
			});
	});
});