describe('Authentication', function() {
	describe('Sign Up', function() {
		// 'post /user/signup'
		it('should register with name, email, password', function(done) {
			var test_user = {
				email: util.makeEmail(),
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');
					expect(res.body.email).to.equal(test_user.email);
					expect(res.body.name).to.equal(test_user.name);
					done();
				});
		});

		it('should not register when name, email or password is null', function(done) {
			var test_user = {
				email: null,
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					expect(res).to.have.status(400);
					done();
				});
		});

		it('should not register with same email', function(done) {
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					request
						.post('/user/signup')
						.send(test_user)
						.end(function(err, res) {
							expect(res).to.have.status(500);
							done();
						});
				});
			
		});

		it('should not register with an invalid email', function(done) {
			var test_user = {
				email: '(' + util.makeEmail() + ')',	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		// post '/user/activate'
		it('should fail to activate the registered email with a invalid code', function(done) {
			var emailVerificationCode = util.generateRandomString();
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					request
						.post('/user/activate')
						.send({code: emailVerificationCode})
						.end(function(err, res) {
							expect(res).to.have.status(500);
							done();
						});
				});
		});

		it('should activate the registered email with a valid code', function(done) {
			var emailVerificationCode;
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					emailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: emailVerificationCode})
						.end(function(err, res1) {
							expect(res1).to.have.status(200);
							expect(res1.body).to.be.an('object');
							expect(res1.body.emailVerificationCode).to.equal(emailVerificationCode);
							done();
						});
				});
		});

		// post '/user/resendverification'
		it('should send verification mail when emailid is valid', function(done) {
				var test_user = {
					email: util.makeEmail(),	
					password: util.makeString(),
					name: util.makeString()
				};
				request
					.post('/user/signup')
					.send(test_user)
					.end(function(err, res) {
						request
							.post('/user/resendverification')
							.send({email: test_user.email})
							.end(function(err, res1) {
								expect(res1).to.have.status(200);
								done();
							});
					});
			});

		it('should not send verification mail when emailid is invalid', function(done) {
				var test_user = {
					email: '(' + util.makeEmail() + ')',	
					password: util.makeString(),
					name: util.makeString()
				};
				request
					.post('/user/signup')
					.send(test_user)
					.end(function(err, res) {
						request
							.post('/user/resendverification')
							.send({email: test_user.email})
							.end(function(err, res1) {
								expect(res1).to.have.status(500);
								done();
							});
					});
			});
	});

	describe('Reset Password', function() {
		var verificationCode;
		var test_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		before(function(done) {
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					done();
				});
		});

		// post '/user/ResetPassword'
		it('should not accept reset password request when emailid is invalid', function(done) {
			request
				.post('/user/ResetPassword')
				.send({email: '(' + test_user.email + ')'})
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		it('should accept reset password request when emailid is valid', function(done) {
			request
				.post('/user/ResetPassword')
				.send({email: test_user.email})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					verificationCode = res.body.emailVerificationCode;
					done();
				});
		});

		// post '/user/updatePassword'
		it('should not reset password if verification code is invalid', function(done) {
			var data = {
				password: util.makeString(),
				code: util.generateRandomString()
			};
			request
				.post('/user/updatePassword')
				.send(data)
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		it('should reset password if verification code is valid', function(done) {
			var data = {
				password: util.makeString(),
				code: verificationCode
			};
			request
				.post('/user/updatePassword')
				.send(data)
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.text).to.equal('You have changed password successfully!');
					done();
				});
		});
	});

	describe('Login', function() {
		var test_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		before(function (done) {
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
							done();
						});
				});
		});

		// post '/user/signin'
		it('should not allow to login with invalid credentials', function(done) {
			request
				.post('/user/signin')
				.send({email: util.makeEmail(), password: util.makeString()})
				.end(function(err, res) {
					expect(res).to.have.status(500);
					done();
				});
		});

		it('should allow to login with valid credentials', function(done) {
			request
				.post('/user/signin')
				.send({email: test_user.email, password: test_user.password})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body.email).to.equal(test_user.email);
					done();
				});
		});
	});
	
	describe('User', function() {
		var test_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		var Cookie, id;

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
		
		// get '/user'
		it('should return the current loggedin user details', function(done) {
			request
				.get('/user')
				.set('Cookie', Cookie)
				.end(function(err, res) {
					var body = res.body;
					expect(res).to.have.status(200);
					expect(body.user.email).to.equal(test_user.email);
					done();
				});
		});


		// post '/user/list'
		it('should return a list of user by ids', function(done) {
			request
				.post('/user/list')
				.set('Cookie', Cookie)
				.send({IdArray: [id]})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					done();
				});
		});

		// post '/user/list/bykeyword'
		it('should not return a list of user by keyword', function(done) {
			request
				.post('/user/list/bykeyword')
				.set('Cookie', Cookie)
				.send({keyword: util.makeEmail()})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.be.null;
					done();
				});
		});

		it('should return a list of user by keyword', function(done) {
			request
				.post('/user/list/bykeyword')
				.set('Cookie', Cookie)
				.send({keyword: test_user.email})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body[0].email).to.equal(test_user.email);
					done();
				});
		});

		// put '/user/list/:skip/:limit'
		it('should return a list of user within skip and limit', function(done) {
			var limit = Math.floor(Math.random() * 10 + 15);
			request
				.put('/user/list/0/'+ limit)
				.set('Cookie', Cookie)
				.send({skipUserIds: []})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.have.length.within(0, limit);
					done();
				});
		});

		it('should return a list of user skipping some userIds', function(done) {
			request
				.put('/user/list/0/0')
				.set('Cookie', Cookie)
				.send({skipUserIds: [id]})
				.end(function(err, res) {
					expect(res).to.have.status(200);
					expect(res.body).to.not.include({_id: id});
					done();
				});
		});
	});

	describe('User details update', function() {
		afterEach(function (done) {
			this.timeout(0);
			request
				.post('/user/logout')
				.end(function(err, res) {
					done();
				});
		});

		// post '/user/update'
		it('should change user password', function(done) {
			var emailVerificationCode;
			var test_user = {
				email: util.makeEmail(),
				password: util.makeString(),
				name: util.makeString()
			};
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
									var Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									var id = res2.body._id;
									var newPassword = util.makeString();
									var data = {
										name: null,
										oldPassword: test_user.password,
										newPassword: util.makeString()
									};
									request
										.post('/user/update')
										.set('Cookie', Cookie)
										.send(data)
										.end(function(err, res3) {
											expect(res3).to.have.status(200);
											expect(res3.body.email).to.equal(test_user.email);
											expect(res3.body.name).to.equal(test_user.name);
											done();
										});
								});
						});
				});
			
		});

		it('should change user\'s name', function(done) {
			var test_user = {
				email: util.makeEmail(),
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					var emailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: emailVerificationCode})
						.end(function(err, res1) {
							request
								.post('/user/signin')
								.send({email: test_user.email, password: test_user.password})
								.end(function(err, res2) {
									var Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									var id = res2.body._id;
									var newName = util.makeString();
									var data = {
										name: newName,
										oldPassword: null,
										newPassword: null
									}
									request
										.post('/user/update')
										.set('Cookie', Cookie)
										.send(data)
										.end(function(err, res3) {
											expect(res3).to.have.status(200);
											expect(res3.body.name).to.equal(newName);
											done();
										});
								});
						});
				});
		});
	});

	describe('User Activation', function() {
		var otherUserId;
		var other_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		before(function(done) {
			this.timeout(0);
			request
				.post('/user/signup')
				.send(other_user)
				.end(function(err, res) {
					var newEmailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: newEmailVerificationCode})
						.end(function(err, res1) {
							otherUserId = res1.body._id;
							done();
						});
				});
		});

		afterEach(function(done) {
			this.timeout(0);
			request
				.post('/user/logout')
				.end(function(err, res) {
					done();
				});
		});

		it('does not activate/deactivate the other user when the user is not an admin', function(done) {
			this.timeout(3000);
			var emailVerificationCode;
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
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
									var Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									var id = res2.body._id;
									request
										.get('/user/active/'+ otherUserId +'/'+ false)
										.set('Cookie', Cookie)
										.end(function(err, res3) {
											expect(res3).to.have.status(500);
											expect(res3.text).to.equal('You can\'t perform this action!');
											done();
										});
								});
						});
				});
		});
		
		it('should activate/deactivate other user when the user is an admin', function(done) {
			this.timeout(3000);
			var admin_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString(),
				isAdmin: true
			};
			request
				.post('/user/signup')
				.send(admin_user)
				.end(function(err, res) {
					emailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/signin')
						.send({email: admin_user.email, password: admin_user.password})
						.end(function(err, res1) {
							var adminCookie = res1.headers['set-cookie'].pop().split(';')[0];
							var id = res1.body._id;
							request
								.get('/user/active/'+ otherUserId +'/' + false)
								.set('Cookie', adminCookie)
								.end(function(err, res) {
									expect(res).to.have.status(200);
									expect(res.body.email).to.equal(other_user.email);
									expect(res.body.isActive).to.be.false;
									done();
								});
						});
				});
			
		});
	});

	describe('User Role', function() {
		var otherUserId;
		var other_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		before(function(done) {
			this.timeout(0);
			request
				.post('/user/signup')
				.send(other_user)
				.end(function(err, res) {
					var newEmailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: newEmailVerificationCode})
						.end(function(err, res1) {
							otherUserId = res1.body._id;
							done();
						});
				});
		});

		afterEach(function(done) {
			this.timeout(0);
			request
				.post('/user/logout')
				.end(function(err, res) {
					done();
				});
		});

		it('does not change the other users role when the user is not an admin', function(done) {
			this.timeout(3000);
			var emailVerificationCode;
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					var emailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: emailVerificationCode})
						.end(function(err, res1) {
							request
								.post('/user/signin')
								.send({email: test_user.email, password: test_user.password})
								.end(function(err, res2) {
									var Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									var id = res2.body._id;
									request
										.get('/user/changerole/'+ otherUserId +'/'+ true)
										.set('Cookie', Cookie)
										.end(function(err, res3) {
											expect(res3).to.have.status(500);
											expect(res3.text).to.equal('You can\'t perform this action!');
											done();
										});
								});
						});
				});
		});
		
		it('should change the other users role when the user is an admin', function(done) {
			this.timeout(3000);
			var admin_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString(),
				isAdmin: true
			};
			request
				.post('/user/signup')
				.send(admin_user)
				.end(function(err, res) {
					request
						.post('/user/signin')
						.send({email: admin_user.email, password: admin_user.password})
						.end(function(err, res1) {
							var adminCookie = res1.headers['set-cookie'].pop().split(';')[0];
							var id = res1.body._id;
							request
								.get('/user/changerole/'+ otherUserId +'/' + true)
								.set('Cookie', adminCookie)
								.end(function(err, res2) {
									expect(res2).to.have.status(200);
									expect(res2.body.email).to.equal(other_user.email);
									done();
								});
						});
				});
		});
	});

	describe('Get admin User', function() {
		var otherUserId;
		var other_user = {
			email: util.makeEmail(),	
			password: util.makeString(),
			name: util.makeString()
		};

		before(function(done) {
			this.timeout(0);
			request
				.post('/user/signup')
				.send(other_user)
				.end(function(err, res) {
					var newEmailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: newEmailVerificationCode})
						.end(function(err, res1) {
							otherUserId = res1.body._id;
							done();
						});
				});
		});

		afterEach(function(done) {
			this.timeout(0);
			request
				.post('/user/logout')
				.end(function(err, res) {
					done();
				});
		});

		it('should not return user list by email if the searching user is not admin', function(done) {
			this.timeout(3000);
			var emailVerificationCode;
			var test_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString()
			};
			request
				.post('/user/signup')
				.send(test_user)
				.end(function(err, res) {
					var emailVerificationCode = res.body.emailVerificationCode;
					request
						.post('/user/activate')
						.send({code: emailVerificationCode})
						.end(function(err, res1) {
							request
								.post('/user/signin')
								.send({email: test_user.email, password: test_user.password})
								.end(function(err, res2) {
									var Cookie = res2.headers['set-cookie'].pop().split(';')[0];
									var id = res2.body._id;
									request
										.post('/user/byadmin')
										.set('Cookie', Cookie)
										.send({
											email: other_user.email
										})
										.end(function(err, res3) {
											expect(res3).to.have.status(500);
											expect(res3.text).to.equal('You can\'t perform this action!');
											done();
										});
								});
						});
				});
		});
		
		it('should return user list by email if the searching user is an admin', function(done) {
			this.timeout(3000);
			var admin_user = {
				email: util.makeEmail(),	
				password: util.makeString(),
				name: util.makeString(),
				isAdmin: true
			};
			request
				.post('/user/signup')
				.send(admin_user)
				.end(function(err, res) {
					request
						.post('/user/signin')
						.send({email: admin_user.email, password: admin_user.password})
						.end(function(err, res1) {
							var adminCookie = res1.headers['set-cookie'].pop().split(';')[0];
							var id = res1.body._id;
							request
								.post('/user/byadmin')
								.set('Cookie', adminCookie)
								.send({
									email: other_user.email
								})
								.end(function(err, res2) {
									expect(res2).to.have.status(200);
									expect(res2.body.email).to.equal(other_user.email);
									done();
								});
						});
				});
		});
	});

});
