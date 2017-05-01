describe('Payment Process', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};
	var test_card = {
		name: 'Joe Flagster',
		number: 4000000000000002,
		expMonth: 03,
		expYear: 22
	};
	var app_name = util.makeString();
	var Cookie, id, appId, cardId;

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
	// 'post /:appId/sale'
	it('should make a sale with proper token', function(done) {
		done();
	});

	// 'post /card'
	it('should add a card with correct details', function(done) {
		request
			.post('/card')
			.set('Cookie', Cookie)
			.send(test_card)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.equal('SUCCESS');
				done();
			});
	});

	// 'get /cards'
	it('should get cards for the specific user', function(done) {
		request
			.get('/cards')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				var cards = res.body;
				expect(res).to.have.status(200);
				expect(cards[0].name).to.equal(test_card.name);
				expect(cards[0].number).to.equal(test_card.number);
				expect(cards[0].expMonth).to.equal(test_card.expMonth);
				expect(cards[0].expYear).to.equal(test_card.expYear);
				cardId = cards[0].cardId;
				done();
			});
	});

	// 'delete /:appId/removecard'
	it('should update the plan for the app', function(done) {
		request
			.delete('/'+ appId +'/removecard')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.message).to.equal('Success');
				done();
			});
	});

	// 'delete /card/:cardId'
	it('should delete the card with valid cardId', function(done) {
		request
			.delete('/card/'+ cardId)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				done();
			});
	});

});