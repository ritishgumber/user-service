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
				if(err) done(err);
				expect(res).to.have.status(200);
				expect(res.body).to.be.an('object');
				expect(res.body.email).to.equal(email);
				expect(res.body.name).to.equal(name);
				done();
			});
	});
});