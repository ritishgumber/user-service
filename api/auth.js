var express = require('express');
var app = express();
var url = require('url');

//setup passport
module.exports = function(passport) {

	// routes
	app.post('/user/signup', function(req, res, next) {

		console.log("User SignUp");

		var data = req.body || {};

		if(data.email && data.password) {
			global.userService.register(data).then(function(user) {
				if (!user) {
					console.log('++++++ User Registration Failed +++++++++++++');
					return res.send(500, "Error: Something went wrong");
				}

				console.log('++++++ User Registration Success +++++++++++++');

				var newsListId = "b0419808f9";
				global.mailChimpService.addSubscriber(newsListId, user.email);

				if (data.isAdmin) {
					req.login(user, function(err) {

						if (err) {
							console.log('++++++ User Login Error +++++++++++++');
							console.log(err);
							return next(err);
						}

						console.log('++++++ User Login Success +++++++++++++');

						// delete user.emailVerificationCode;
						delete user.password; //delete this code form response for security

						return res.status(200).json(user);
					});

				} else {
					global.mailService.sendSignupMail(user);
					global.notificationService.linkUserId(user.email, user._id);
					return res.status(200).json(user);
				}
			}, function(error) {
				console.log('++++++ User Registration Failed +++++++++++++');
				console.log(error);
				return res.send(500, error);
			});
		} else {
			return res.send(400, 'Bad Request');
		}

	});

	app.post('/user/activate', function(req, res, next) {

		var data = req.body || {};

		global.userService.activate(data.code).then(function(user) {

			console.log('++++++ Activation Successful +++++++++++++');
			//send activated email.           
			global.mailService.sendActivationMail(user);

			req.login(user, function(err) {

				if (err) {
					console.log('++++++ User Login Error +++++++++++++');
					console.log(err);
					return next(err);
				}

				console.log('++++++ User Login Success +++++++++++++');

				// delete user.emailVerificationCode;
				delete user.password; //delete this code form response for security

				return res.status(200).json(user);
			});

		}, function(error) {
			console.log('++++++ Activation Failed +++++++++++++');
			console.log(error);
			return res.send(500, error);
		});
	});

	app.post('/user/resendverification', function(req, res, next) {

		var data = req.body || {};

		global.userService.getAccountByEmail(data.email).then(function(user) {

			console.log('++++++ Resent verification Code Successful +++++++++++++');
			global.mailService.sendSignupMail(user);
			return res.send(200);
		}, function(error) {
			return res.send(500, error);
		});
	});

	app.post('/user/ResetPassword', function(req, res, next) {

		var data = req.body || {};

		global.userService.requestResetPassword(data.email).then(function(user) {

			console.log('++++++ Request Reset Password Successful +++++++++++++');
			//send activated email. 
			global.mailService.sendResetPasswordMail(user);
			console.log(user);
			return res.status(200).json(user);
		}, function(error) {
			console.log('++++++ Request Reset Password Failed +++++++++++++');
			console.log(error);
			return res.send(500, error);
		});
	});

	app.post('/user/updatePassword', function(req, res, next) {

		var data = req.body || {};

		global.userService.resetPassword(data.code, data.password).then(function(user) {

			console.log('++++++ Request Update Password Successful +++++++++++++');
			//send activated email            
			global.mailService.sendUpdatePasswordMail(user);
			return res.status(200).send('You have changed password successfully!');
		}, function(error) {
			console.log('++++++ Request Reset Password Failed +++++++++++++');
			console.log(error);
			return res.send(500, error);
		});
	});


	app.post('/user/logout', function(req, res, next) {
		req.logout();
		return res.status(200).json({});
	});


	app.post('/user/signin', function(req, res, next) {

		console.log("User SignIn");

		passport.authenticate('local', function(err, user, info) {

			if (err || !user) {
				return res.status(500).send(info);
			}
			req.login(user, function(err) {
				if (err) {
					console.log("User login failed.");
					return next(err);
				}

				delete user._doc.emailVerificationCode;
				delete user._doc.password; //delete this code form response for security
				delete user._doc.salt;

				global.userService.updateUserLastLogin(user._doc._id).then(function(id) {
					console.log("User successfully logged in");
					return res.status(200).send(user);
				}, function(error) {
					console.log('++++++ User login failed +++++++++++++');
					console.log(error);
					return res.send(500, error);
				});
			});
		})(req, res, next);
	});


	app.get('/user', function(req, res, next) {

		console.log("Get User");

		var serverUrl = fullUrl(req);
		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
		var respJson = {};

		if (currentUserId) {
			global.userService.getAccountById(currentUserId).then(function(user) {
				delete user.password;
				delete user.salt;
				delete user.emailVerificationCode;

				respJson.user = user;

				if (user && user.fileId) {
					return global.fileService.getFileById(user.fileId);
				}
			}).then(function(file) {

				if (file) {
					//Wrapping for consistency in UI
					var fileObject = {};
					fileObject.id = file._id;
					fileObject.name = file.filename;
					fileObject.url = serverUrl + "/file/" + respJson.user.fileId;

					var wrapper = {};
					wrapper.document = fileObject;

					respJson.file = wrapper;
				} else {
					respJson.file = null;
				}
				console.log("Successfully retrieved the user.");
				return res.status(200).send(respJson);
			}, function(error) {
				console.log("Error on getting user");
				return res.send(500, error);
			});
		} else {
			console.log("Unauthorized on getting user");
			return res.send(401);
		}

	});

	app.post('/user/update', function(req, res, next) {

		console.log("Update user");

		var data = req.body || {};
		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

		if (currentUserId) {
			global.userService.updateUserProfile(currentUserId, data.name, data.oldPassword, data.newPassword).then(function(user) {
				if (!user) {
					return res.status(400).send('Error : User not updated');
				}
				if (data.oldPassword, data.newPassword) {
					//send activated email.
					global.mandrillService.sendPasswordResetSuccessful(user);
				}
				req.logout();
				return res.status(200).json(user);
			}, function(error) {
				console.log("Error on updating user");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorized on updating user");
			return res.send(401);
		}

	});

	app.post('/user/list', function(req, res, next) {

		console.log("Get user list");

		var data = req.body || {};
		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

		if (currentUserId) {
			if (data.IdArray && data.IdArray.length > 0) {
				global.userService.getUserListByIds(data.IdArray).then(function(usersList) {
					if (usersList && usersList.length > 0) {
						for (var i = 0; i < usersList.length; ++i) {
							if (usersList[i].password) {
								delete usersList[i]._doc.password;
							}
							if (usersList[i].emailVerificationCode) {
								delete usersList[i]._doc.emailVerificationCode;
							}
							if (usersList[i].salt) {
								delete usersList[i]._doc.salt;
							}
							if (usersList[i].provider) {
								delete usersList[i]._doc.provider;
							}
						}
					}

					console.log("Successfully retrieved the user list.");
					return res.status(200).json(usersList);
				}, function(error) {
					console.log("Error on getting user list");
					return res.status(500).send(error);
				});
			} else {
				return res.status(200).json(null);
			}

		} else {
			console.log("Unauthorized on getting user list");
			return res.send(401);
		}
	});

	app.post('/user/list/bykeyword', function(req, res, next) {

		console.log("Get User List by Keyword");

		var data = req.body || {};
		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

		if (currentUserId) {

			global.userService.getUserListByKeyword(data.keyword).then(function(usersList) {
				if (usersList && usersList.length > 0) {
					for (var i = 0; i < usersList.length; ++i) {
						if (usersList[i].password) {
							delete usersList[i]._doc.password;
						}
						if (usersList[i].emailVerificationCode) {
							delete usersList[i]._doc.emailVerificationCode;
						}
						if (usersList[i].salt) {
							delete usersList[i]._doc.salt;
						}
						if (usersList[i].provider) {
							delete usersList[i]._doc.provider;
						}
					}
				}
				console.log("Successfully retrieved user list by keyword");
				return res.status(200).json(usersList);
			}, function(error) {
				console.log("error on getting user list by keyword");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorized on getting user list by keyword");
			return res.send(401);
		}
	});

	app.put('/user/list/:skip/:limit', function(req, res, next) {

		console.log("get user list by skipLimit");

		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
		var skip = req.params.skip;
		var limit = req.params.limit;

		var data = req.body || {};
		var skipUserIds = data.skipUserIds;

		if (currentUserId) {
			global.userService.getUserBySkipLimit(skip, limit, skipUserIds).then(function(usersList) {
				if (usersList && usersList.length > 0) {
					for (var i = 0; i < usersList.length; ++i) {
						if (usersList[i].password) {
							delete usersList[i]._doc.password;
						}
						if (usersList[i].emailVerificationCode) {
							delete usersList[i]._doc.emailVerificationCode;
						}
						if (usersList[i].salt) {
							delete usersList[i]._doc.salt;
						}
						if (usersList[i].provider) {
							delete usersList[i]._doc.provider;
						}
					}
				}

				console.log("Successfully retrieved user list by skipLimit");
				return res.status(200).json(usersList);
			}, function(error) {
				console.log("Error on getting user list by skipLimit");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorized on getting user list by skipLimit");
			return res.send(401);
		}

	});

	app.get('/user/active/:userId/:isActive', function(req, res, next) {

		console.log("Activate/Deactivate user");

		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
		var userId = req.params.userId;
		var isActive = req.params.isActive;

		if (currentUserId) {
			if (currentUserId != userId) {
				global.userService.updateUserActive(currentUserId, userId, isActive).then(function(user) {
					if (user) {
						if (user.password) {
							delete user._doc.password;
						}
						if (user.emailVerificationCode) {
							delete user._doc.emailVerificationCode;
						}
						if (user.salt) {
							delete user._doc.salt;
						}
						if (user.provider) {
							delete user._doc.provider;
						}
					}

					console.log("Successfully activate/deactivated the user");
					return res.status(200).json(user);
				}, function(error) {
					console.log("Error or activate or Deactivate user");
					return res.send(500, error);
				});

			} else {
				return res.status(500).send("You can't perform this action");
			}

		} else {
			console.log("Unauthorized on activate or Deactivate user");
			return res.send(401);
		}

	});

	app.get('/user/changerole/:userId/:isAdmin', function(req, res, next) {

		console.log("Change user role");

		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
		var userId = req.params.userId;
		var isAdmin = req.params.isAdmin;

		if (currentUserId) {
			if (currentUserId != userId) {
				global.userService.updateUserRole(currentUserId, userId, isAdmin).then(function(user) {
					if (user) {
						if (user.password) {
							delete user._doc.password;
						}
						if (user.emailVerificationCode) {
							delete user._doc.emailVerificationCode;
						}
						if (user.salt) {
							delete user._doc.salt;
						}
						if (user.provider) {
							delete user._doc.provider;
						}
					}
					console.log("Successfully changed the user role.");
					return res.status(200).json(user);
				}, function(error) {
					console.log("Error on user role change");
					return res.send(500, error);
				});
			} else {
				return res.status(500).send("You can't perform this action");

			}

		} else {
			console.log("Unauthorized on user role change");
			return res.send(401);
		}

	});


	app.post('/user/byadmin', function(req, res, next) {

		console.log("Get user by email and by admin");

		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.body.userId;
		var data = req.body || {};

		if (currentUserId) {
			global.userService.getUserByEmailByAdmin(currentUserId, data.email).then(function(user) {

				if (user) {
					if (user.password) {
						delete user._doc.password;
					}
					if (user.emailVerificationCode) {
						delete user._doc.emailVerificationCode;
					}
					if (user.salt) {
						delete user._doc.salt;
					}
					if (user.provider) {
						delete user._doc.provider;
					}
				}
				console.log("Successfull on get user by email by admin");
				return res.status(200).json(user);

			}, function(error) {
				console.log("Error on get user by email by admin");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorized on get user by email by admin");
			return res.status(401).send("unauthorized");
		}

	});

	return app;

};

function fullUrl(req) {
	var protocol = req.protocol;
	if (!global.config) {
		protocol = "https";
	}
	return url.format({
		protocol: protocol,
		host: req.get('host')
	});
}
