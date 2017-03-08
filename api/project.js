var express = require('express');
var app = express();

module.exports = function() {

	// routes
	app.post('/app/create', function(req, res, next) {

		console.log("App Creation");

		var data = req.body || {};
		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.body.userId;

		if (currentUserId && data) {

			global.projectService.createProject(data.name, currentUserId, null).then(function(project) {
				if (!project) {
					return res.status(400).send('Error : Project not created');
				}

				console.log("Successfull on App Creation");
				return res.status(200).json(project._doc);

			}, function(error) {
				console.log(error);
				return res.status(500).send(error);
			});

		} else {
			console.log("Unauthorised on App Creation");
			return res.status(401).send("Unauthorised");
		}

	});

	app.post('/app/active/:appId', function(req, res, next) {

		console.log("App Active API");

		var id = req.params.appId;

		if (req.params.appId) {
			global.projectService.activeApp(id).then(function(project) {
				if (!project) {
					return res.send(500, 'Error: Project not found');
				}

				console.log("Successfully updated lastActive");
				return res.status(200).send(project);

			}, function(error) {
				console.log("Error updating lastActive value.");
				return res.status(500).send(error);
			});

		} else {
			console.log("Missing appId in the parameter.");
			return res.send(401);
		}

	});

	app.delete('/apps/inactive', function(req, res, next) {

		console.log("Delete Inactive apps API");
		var body = req.body || {};
		var deleteReason = body.deleteReason;
		if (global.keys.secureKey === body.secureKey) {
			console.log('Authorized');
			global.projectService.deleteInactiveApps(deleteReason).then(function(inactiveApps) {

				console.log("Successfully deleted inactiveApps");
				return res.status(200).send(inactiveApps);

			}, function(error) {
				console.log("Error deleting inactiveApps.");
				return res.status(500).send(error);
			});

		} else {
			console.log('Unauthorized');
			return res.status(401).send('unauthorized');
		}

	});

	app.post('/apps/notifyInactive', function(req, res, next) {

		console.log("Notify Inactive Apps");
		var body = req.body || {};

		if (global.keys.secureKey === body.secureKey) {
			console.log("Authorized.");

			global.projectService.notifyInactiveApps().then(function(inactiveApps) {

				console.log("Successfully notified inactiveApps");
				return res.status(200).send(inactiveApps);

			}, function(error) {
				console.log("Error Fetching inactiveApps.");
				return res.status(500).send(error);
			});
		} else {
			console.log("Unauthorized.");
			return res.status(500).send('Unauthorized');
		}
	});

	app.get('/app', function(req, res, next) {

		console.log("Get app List");
		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;

		if (currentUserId) {
			global.projectService.projectList(currentUserId).then(function(list) {
				if (!list) {
					return res.send(500, 'Error: Something Went Wrong');
				}
				console.log("Successfull on Get app List");
				return res.status(200).json(list);
			}, function(error) {
				console.log("Error on Get app List");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorised on Get app List");
			return res.send(401);
		}

	});

	app.get('/:appId/status', function(req, res, next) {

		console.log("Get app Status");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;

		if (currentUserId && req.params.appId) {
			global.projectService.projectStatus(req.params.appId).then(function(status) {
				console.log("Successfull on Get app Status");
				return res.json(200, status);
			}, function(error) {
				console.log("Error on Get app Status");
				return res.send(500, error);
			});

		} else {
			console.log("Unauthorised on Get app Status");
			return res.send(401);
		}

	});

	app.put('/app/:appId', function(req, res, next) {

		console.log("Updated App");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var appId = req.params.appId;
		var data = req.body || {};
		var name = data.name;

		if (currentUserId && appId && data) {

			global.projectService.editProject(currentUserId, appId, name).then(function(project) {
				if (!project) {
					return res.status(500).send("Error: Project didn't get edited");
				}

				console.log("Successfull on  Updated App");
				return res.status(200).json(project);

			}, function(error) {
				console.log("Error on  Updated App");
				return res.status(500).send(error);
			});

		} else {
			console.log("Unauthorised Updated App");
			return res.send(401);
		}

	});

	app.get('/app/:appId', function(req, res, next) {

		console.log("Get app by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var id = req.params.appId;
		var authUser = {
			appId: id,
			developers: {
				$elemMatch: {
					userId: currentUserId
				}
			}
		};
		if (id && currentUserId) {
			global.projectService.getProjectBy(authUser).then(function(project) {

				if (!project || project.length === 0) {
					return res.send(500, 'Error: Invalid User or project not found');
				}

				console.log("Successfull on Get app by appId");
				return res.status(200).json(project[0]);

			}, function(error) {
				console.log("Error on Get app by appId");
				return res.status(500).send(error);
			});
		} else {
			console.log("Unauthorised Get masterkey by appId");
			return res.send(401);
		}
	});

	app.get('/app/:appId/masterkey', function(req, res, next) {

		console.log("Get masterkey by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var id = req.params.appId;
		var key = req.body.key;
		if (key && id && currentUserId) {
			global.projectService.getProject(id).then(function(project) {
				if (!project) {
					return res.send(500, 'Error: Project not found');
				}

				console.log("Successfull Get masterkey by appId");
				return res.status(200).send(project.keys.master);

			}, function(error) {
				console.log("Error Get masterkey by appId");
				return res.status(500).send(error);
			});

		} else {
			console.log("Unauthorised Get masterkey by appId");
			return res.send(401);
		}
	});

	app.get('/app/:appId/change/masterkey', function(req, res, next) {

		console.log("Change masterkey by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var id = req.params.appId;

		if (currentUserId && id) {
			global.projectService.changeAppMasterKey(currentUserId, id).then(function(project) {
				if (!project) {
					return res.send(400, 'Error: Project not found');
				}

				console.log("Successfull Change masterkey by appId");
				return res.status(200).send(project.keys.master);

			}, function(error) {
				console.log("Error Change masterkey by appId");
				return res.status(400).send(error);
			});

		} else {
			console.log("Unauthorised Change masterkey by appId");
			return res.send(401);
		}
	});

	app.get('/app/:appId/change/clientkey', function(req, res, next) {

		console.log("get clientKey by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var id = req.params.appId;

		if (currentUserId && id) {
			global.projectService.changeAppClientKey(currentUserId, id).then(function(project) {
				if (!project) {
					return res.send(400, 'Error: Project not found');
				}

				console.log("Successfull get clientKey by appId");
				return res.status(200).send(project.keys.js);

			}, function(error) {
				console.log("Error get clientKey by appId");
				return res.status(400).send(error);
			});

		} else {
			console.log("Unauthorised get clientKey by appId");
			return res.send(401);
		}
	});

	app.delete('/app/:appId', function(req, res, next) {

		console.log("Delete project by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.body.userId;

		if (currentUserId) {

			global.projectService.delete(req.params.appId, currentUserId).then(function() {

				console.log("Successfull Delete project by appId");
				return res.status(200).json({});

			}, function(error) {
				console.log("error Delete project by appId");
				return res.send(500, error);
			});

		} else {
			console.log("unauthorized Delete project by appId");
			return res.status(401).send("unauthorized");
		}

	});

	app.delete('/app/:appId/removedeveloper/:userId', function(req, res, next) {

		console.log("Remove developer by userId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.body.userId;

		var appId = req.params.appId;
		var userId = req.params.userId;

		if (currentUserId && appId && userId) {

			global.projectService.removeDeveloper(currentUserId, appId, userId).then(function(project) {

				console.log("Successfull Remove developer by userId");
				return res.status(200).json(project);

			}, function(error) {
				console.log("Error Remove developer by userId");
				return res.status(400).send(error);
			});

		} else {
			console.log("unauthorized Remove developer by userId");
			return res.status(401).send("unauthorized");
		}

	});

	app.post('/app/:appId/removeinvitee', function(req, res, next) {

		console.log("Remove Invitee by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.body.userId;

		var appId = req.params.appId;
		var data = req.body || {};

		if (currentUserId && appId && data.email) {

			global.projectService.removeInvitee(currentUserId, appId, data.email).then(function(project) {

				console.log("Successfull Remove Invitee by appId");
				return res.status(200).json(project);

			}, function(error) {
				console.log("Error Remove Invitee by appId");
				return res.status(400).send(error);
			});

		} else {
			console.log("unauthorized Remove Invitee by appId");
			return res.status(401).send("unauthorized");
		}

	});

	app.post('/app/:appId/invite', function(req, res, next) {

		console.log("Invite user by appId");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var appId = req.params.appId;
		var data = req.body || {};

		if (currentUserId && appId && data.email) {

			global.projectService.inviteUser(appId, data.email).then(function(response) {
				if (!response) {
					return res.send(400, 'Error: Project not found');
				}
				console.log("Successfull Invite user by appId");
				return res.status(200).send(response);

			}, function(error) {
				console.log("error Invite user by appId");
				return res.status(400).send(error);
			});

		} else {
			console.log("unauthorized Invite user by appId");
			return res.send(401);
		}
	});

	app.get('/app/:appId/adddeveloper/:email', function(req, res, next) {

		console.log("Add developer with email");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var appId = req.params.appId;
		var email = req.params.email;

		if (currentUserId && appId && email) {
			global.projectService.addDeveloper(currentUserId, appId, email).then(function(project) {
				if (!project) {
					return res.send(400, 'Error: Project not found');
				}

				console.log("Successfull Add developer with emai");
				return res.status(200).json(project);

			}, function(error) {
				console.log("error Add developer with email");
				return res.status(400).send(error);
			});

		} else {
			console.log("unauthorized Add developer with email");
			return res.send(401);
		}
	});

	app.get('/app/:appId/changerole/:userId/:role', function(req, res, next) {

		console.log("Change developer role");

		var currentUserId = req.session.passport.user ?
			req.session.passport.user.id :
			req.session.passport.user;
		var appId = req.params.appId;
		var requestedUserId = req.params.userId;
		var newRole = req.params.role;

		if (currentUserId && appId && requestedUserId && newRole) {
			global.projectService.changeDeveloperRole(currentUserId, appId, requestedUserId, newRole).then(function(project) {
				if (!project) {
					return res.send(400, 'Error: Project not found');
				}

				console.log("Successfull change developer role");
				return res.status(200).json(project);

			}, function(error) {
				console.log("error change developer role");
				return res.status(400).send(error);
			});

		} else {
			console.log("unauthorized change developer role");
			return res.send(401);
		}
	});

	return app;

}
