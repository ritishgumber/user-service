describe('Beacon', function() {
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};
	var Cookie, id, beacon_id;

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

	// 'get /beacon/get'
	it('should get beacon for a user', function (done) {
		request
			.get('/beacon/get')
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.firstApp).to.be.oneOf([true, false]);
				expect(res.body.firstTable).to.be.oneOf([true, false]);
				expect(res.body.firstColumn).to.be.oneOf([true, false]);
				expect(res.body.firstRow).to.be.oneOf([true, false]);
				expect(res.body.tableDesignerLink).to.be.oneOf([true, false]);
				expect(res.body.documentationLink).to.be.oneOf([true, false]);
				beacon_id = res.body._id;
				done();
			});
	});

	// 'post /beacon/update'  
	it('should update a beacon for user', function(done) {
		var beacon_updated = {
			firstApp: !!(Math.floor(Math.random() * 2)),
			firstTable: !!(Math.floor(Math.random() * 2)),
			firstColumn: !!(Math.floor(Math.random() * 2)),
			firstRow: !!(Math.floor(Math.random() * 2)),
			tableDesignerLink: !!(Math.floor(Math.random() * 2)),
			documentationLink: !!(Math.floor(Math.random() * 2)),
			_userId: id,
			_id: beacon_id
		};
		request
			.post('/beacon/update')
			.set('Cookie', Cookie)
			.send(beacon_updated)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.firstApp).to.equal(beacon_updated.firstApp);
				expect(res.body.firstTable).to.equal(beacon_updated.firstTable);
				expect(res.body.firstColumn).to.equal(beacon_updated.firstColumn);
				expect(res.body.firstRow).to.equal(beacon_updated.firstRow);
				expect(res.body.tableDesignerLink).to.equal(beacon_updated.tableDesignerLink);
				expect(res.body.documentationLink).to.equal(beacon_updated.documentationLink);
				done();
			});
	});
});