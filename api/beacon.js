var express = require('express');
var app = express();

module.exports = function() {

	//routes
	app.get('/beacon/get', function(req, res, next) {

		console.log("Get beacons");

		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

		global.beaconService.getBeaconByUserId(currentUserId).then(function(beaconObj) {
			console.log("Successfull Get beacons");
			return res.status(200).json(beaconObj);
		}, function(error) {
			console.log("Error Get beacons");
			return res.send(500, error);
		});
	});

	app.post('/beacon/update', function(req, res, next) {

		console.log("update beacon");

		var data = req.body || {};
		var currentUserId = req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

		if (currentUserId && data) {
			if (currentUserId == data._userId) {
				global.beaconService.updateBeacon(currentUserId, data).then(function(beaconObj) {
					if (!beaconObj) {
						return res.send(400, 'Error : Beacon not found');
					}
					console.log("Successfull update beacon");
					return res.status(200).json(beaconObj);

				}, function(error) {
					console.log("Error update beacon");
					return res.send(400, error);
				});
			} else {
				console.log("Unauthorized update beacon");
				return res.send(400, "Unauthorized");
			}
		} else {
			console.log("Unauthorized update beacon");
			return res.send(401);
		}

	});

	return app;

};
