describe('File', function() {
	// files[]
	var test_user = {
		email: util.makeEmail(),	
		password: util.makeString(),
		name: util.makeString()
	};

	var Cookie, id, fileid, fileurl;

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

	// 'post /file'
	it('should upload the file', function(done) {
		request
			.post('/file')
			.set('Cookie', Cookie)
			.attach('files[]', fs.readFileSync( __dirname + '/img/CbLogoIcon.png' ), 'CbLogoIcon.png')
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body.document.name).to.equal('CbLogoIcon.png');
				fileid = res.body.document.id;
				fileurl = res.body.document.url;
				done();
			});
	});

	// 'get /file/:id'
	it('should not return the file when invalid fileId', function(done) {
		request
			.get('/file/' + util.makeString())
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(500);
				expect(res.body).to.be.empty;
				done();
			});
	});

	it('should return the file when valid fileId', function(done) {
		request
			.get('/file/' + fileid)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res.headers['content-disposition']).to.have.string('CbLogoIcon.png');
				done();
			});
	});

	// 'delete /file/:id'
	it('should not delete the file with invalid fileId', function(done) {
		request
			.delete('/file/' + util.makeString())
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(500);
				expect(res.body).to.be.empty;
				done();
			});
	});

	it('should delete the file with valid fileId', function(done) {
		request
			.delete('/file/' + fileid)
			.set('Cookie', Cookie)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.text).to.equal('Deleted Successfully');
				done();
			});
	});

});