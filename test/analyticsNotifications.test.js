describe('Analytics Notifications', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};
	var secureKey = '1227d1c4-1385-4d5f-ae73-23e99f74b006';
	var app_name = util.makeString();
	var invitedEmail = util.makeEmail();
	var Cookie, id, appId;

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


	// 'post /:appId/notifications/over80'
	it('should send notifications when 80% usage', function(done) {
		request
			.post('/'+ appId +'/notifications/over80')
			.send({secureKey: secureKey})
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res.body.message).to.equal('success');
				done();
			});
	});

	// 'post /:appId/notifications/over100'
	it('should send notifications when 100% usage', function(done) {
		request
			.post('/'+ appId +'/notifications/over100')
			.send({secureKey: secureKey})
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res.body.message).to.equal('success');
				done();
			});
	});

});