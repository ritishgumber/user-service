var express = require('express');
var app = express();

module.exports = function() {

	//tutorials routes
	app.get('/tutorial', function(req, res, next) {

		console.log("Get tutorials");

		global.tutorialService.getTutorialList().then(function(tutorial) {
			console.log("Successfully  Get tutorials");
			return res.status(200).json(tutorial);
		}, function(error) {
			console.log("Error Get tutorials");
			return res.status(500).send(error);
		});

	});

	app.get('/tutorial/:id', function(req, res, next) {

		console.log("Get tutorial by id");

		var tutorialDocId = req.params.id;

		global.tutorialService.getTutorialById(tutorialDocId).then(function(tutorial) {
			console.log("Successfully tutorial by id");
			return res.status(200).json(tutorial);
		}, function(error) {
			console.log("Error tutorial by id");
			return res.status(500).send(error);
		});

	});

	return app;

};
