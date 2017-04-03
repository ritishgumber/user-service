describe('CloudBoost Partner', function() {
	var partner_id;
	var partner_test_data = {
		companyName: util.makeString(),
		companyDescription: 'This is a Cloudboost partner API test. This is a random company test data created.',
		personName: util.makeString(),
		companyEmail: util.makeEmail(),
		companyContact: Math.floor(Math.random() * 8999999999 + 1000000000),
		personMobile: Math.floor(Math.random() * 8999999999 + 1000000000),
		companyAddress: util.makeString(),
		companyWebsite: 'www.' + util.makeString() + '.com',
		companyCountry: util.makeString(),
		appSpecilizedIn: util.makeString(),
		companySize: Math.floor(Math.random() * 50)
	}

	// post /partner
	it('should save a partner', function(done) {
		request
			.post('/partner')
			.send(partner_test_data)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.message).to.equal('Success');
				partner_id = res.body.id;
				done();
			});
	});

	it('should not save a partner when it is already saved', function(done) {
		request
			.post('/partner')
			.send(partner_test_data)
			.end(function(err, res) {
				expect(res).to.have.status(400);
				expect(res.body.Error).to.equal('This Business email already subscribed to cloudboost.');
				done();
			});
	});

	// 'get /partner/item/:id'
	it('should return a partner by id', function(done) {
		request
			.get('/partner/item/' + partner_id)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.companyEmail).to.equal(partner_test_data.companyEmail);
				done();
			});
	});

	it('should not return a partner by invalid id', function(done) {
		request
			.get('/partner/item/' + util.makeString())
			.end(function(err, res) {
				expect(res).to.have.status(400);
				done();
			});
	});

	// 'get /partner/export'
	it('should return the whole partner list', function(done) {
		request
			.get('/partner/export')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.headers['content-disposition']).to.have.string('partners.xlsx');
				done();
			});
	});

	it('should return the partner list when skip and limit is given', function(done) {
		request
			.get('/partner/export')
			.query({skip: 0, limit: Math.floor(Math.random() * 10)})
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});
		
});