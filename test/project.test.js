describe('Projects', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};
	var secureKey = '1227d1c4-1385-4d5f-ae73-23e99f74b006';
	var app_name = util.makeString();
	var invitedEmail = util.makeEmail();
	var Cookie, id, appId, masterKey, clientKey;

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
								done();
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

	// 'post /app/create'
	it('should create an app', function(done) {
		this.timeout(10000);
		request
			.post('/app/create')
			.set('Cookie', Cookie)
			.send({name: app_name})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.name).to.equal(app_name);
				appId = res.body.appId;
				done();
			});
	});

	// 'post /app/active/:appId'
	it('should set last active for app', function(done) {
		request
			.post('/app/active/' + appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.equal(app_name);
				done();
			});
	});

	// 'delete /apps/inactive'
	it('should delete inactive app', function(done) {
		request
			.delete('/apps/inactive')
			.set('Cookie', Cookie)
			.send({deleteReason: util.makeString(), secureKey: secureKey})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	// 'post /apps/notifyInactive'
	it('should notify when app is inactive', function(done) {
		request
			.post('/apps/notifyInactive')
			.set('Cookie', Cookie)
			.send({secureKey: secureKey})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	// 'get /app'
	it('should get project list', function(done) {
		request
			.get('/app')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body[0]).to.include({appId: appId});
				done();
			});
	});

	// 'get /:appId/status'
	it('should return app status', function(done) {
		request
			.get('/'+ appId +'/status')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	// 'put /app/:appId'
	it('should update app details', function(done) {
		var newAppName = util.makeString();
		request
			.put('/app/'+ appId)
			.set('Cookie', Cookie)
			.send({name: newAppName})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.name).to.equal(newAppName);
				done();
			});
	});

	// 'get /app/:appId'
	it('should get an app by appId', function(done) {
		request
			.get('/app/'+ appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.appId).to.equal(appId);
				masterKey = res.body.keys.master;
				clientKey = res.body.keys.js;
				done();
			});
	});

	// 'get /app/:appId/masterkey'
	it('should get masterkey by appId with valid secureKey', function(done) {
		request
			.get('/app/'+ appId +'/masterkey')
			.set('Cookie', Cookie)
			.send({key: secureKey})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.equal(masterKey);
				done();
			});
	});

	// 'get /app/:appId/change/masterkey'
	it('should change masterkey by appId', function(done) {
		request
			.get('/app/'+ appId +'/change/masterkey')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.not.equal(masterKey);
				done();
			});
	});

	// 'get /app/:appId/change/clientkey'
	it('should change clientkey by appId', function(done) {
		request
			.get('/app/'+ appId +'/change/clientkey')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.not.equal(clientKey);
				done();
			});
	});

	// 'post /app/:appId/invite'
	it('should invite to app using emailid, appId', function(done) {
		request
			.post('/app/'+ appId +'/invite')
			.set('Cookie', Cookie)
			.send({email: invitedEmail})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.equal('successfully Invited!');
				done();
			});
	});

	// 'post /app/:appId/removeinvitee'
	it('should remove Invitee by appId', function(done) {
		request
			.post('/app/'+ appId +'/removeinvitee')
			.set('Cookie', Cookie)
			.send({email: invitedEmail})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.appId).to.equal(appId);
				expect(res.body.invited).to.not.include(invitedEmail);
				done();
			});
	});

	// 'get /app/:appId/adddeveloper/:email'
	it('should add developer with an emailid', function(done) {
		request
			.post('/app/'+ appId +'/invite')
			.set('Cookie', Cookie)
			.send({email: invitedEmail})
			.end(function(err, res) {
				request
					.get('/app/'+ appId +'/adddeveloper/' + invitedEmail)
					.set('Cookie', Cookie)
					.send({email: invitedEmail})
					.end(function(err, res1) {
						expect(res1).to.have.status(200);
						// expect(res1.body.appId).to.equal(appId);
						// expect(res1.body.invited).to.not.include(invitedEmail);
						// expect(res1.body.developers[0].userId).to.equal(id);
						done();
					});
			});
	});

	// 'get /app/:appId/changerole/:userId/:role'
	it('should change developer role for an app', function(done) {
		request
			.get('/app/'+ appId +'/changerole/'+ id +'/'+ 'Admin' )
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	// 'delete /app/:appId/removedeveloper/:userId'
	it('should remove developer by userId', function(done) {
		request
			.delete('/app/'+ appId +'/removedeveloper/'+ id)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

	// 'delete /app/:appId'
	it('should delete app by appId', function(done) {
		request
			.delete('/app/'+ appId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});
});