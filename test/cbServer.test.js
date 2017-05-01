describe('CloudBoost Server', function() {
	
	it('should tell whether it is a new server or not', function(done) {
		request
			.get('/server/isNewServer')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.be.oneOf(['true', 'false']);
				done();
			});
	});

	// 'get /server'
	it('should return the server settings', function(done) {
		request
			.get('/server')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body).to.be.an('object');
				done();
			});
	});

	// 'get /server/isHosted'
	it('should return current status of hosted server', function(done) {
		request
			.get('/server/isHosted')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.be.oneOf(['true', 'false']);
				done();
			});
	});
	// 'get /status'
	it('should return current status of MongoDB & RedisDB', function(done) {
		request
			.get('/status')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.message).to.equal('Service Status : OK');
				done();
			});
	});

});

describe('Update CloudBoost Server', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString(),
		isAdmin: true
	};
	var Cookie, id, cbSettings;

	before(function (done) {
		this.timeout(0);
		request
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				request
					.get('/server')
					.end(function(err, res1) {
						cbSettings = res1.body;
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

	// 'post /server'
	it('should update server setting', function(done) {
		request
			.post('/server')
			.set('Cookie', Cookie)
			.send({id: cbSettings._id, allowedSignUp: true})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body._id).to.equal(cbSettings._id);
				expect(res.body.allowSignUp).to.be.true;
				done();
			});
	});

	// 'post /server/url'
	it('should update server api url', function(done) {
		var apiURL = 'www.' + util.makeString() + '.com';
		request
			.post('/server/url')
			.set('Cookie', Cookie)
			.send({apiURL: apiURL})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body._id).to.equal(cbSettings._id);
				expect(res.body.myURL).to.equal(apiURL);
				done();
			});
	});
	
});