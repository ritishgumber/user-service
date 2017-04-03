describe('Subscriber', function() {
	var email = '(' + util.makeEmail() + ')';
	// post '/subscribe'
	it('should not add a subscriber if emailid is invalid', function(done) {
		request
			.post('/subscribe')
			.send({email: email})
			.end(function(err, res) {
				expect(res).to.have.status(400);
				expect(res.text).to.equal('Emailid invalid..');
				done();
			});
	});

	it('should add email to subscriber list', function(done) {
		email = util.makeEmail();
		request
			.post('/subscribe')
			.send({email: email})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body).to.equal(email);
				done();
			});
	});

	it('should not add a subscriber if already present', function(done) {
		request
			.post('/subscribe')
			.send({email: email})
			.end(function(err, res) {
				expect(res).to.have.status(400);
				expect(res.text).to.equal('Already Subscribed');
				done();
			});
	});

});