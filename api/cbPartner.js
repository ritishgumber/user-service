var express = require('express');
var app = express();
var request = require('request');

module.exports = function() {

	//routes

	app.post('/partner', function(req, res, next) {
		console.log("CoudBoost Partner Form");

		var data = req.body || {};

		global.cbPartnerService.save(data).then(function(result) {
			data.id = result.id.toString();

			//This Zapier integration sends emails to CloudBoost Partners after a day of delay. Zapier Integration can be found at cloudboost1@outlook.com. 
			request.post({
				headers: {
					'content-type': 'application/json'
				},
				url: 'https://hooks.zapier.com/hooks/catch/2024362/mr0i5b/',
				body: JSON.stringify(data)
			}, function(error, response, body) {
				console.log("Partner Application Pushed to Zapier. Send email in a day.");
				console.log(body);
			});

			res.status(200).json(result);
		}, function(error) {
			return res.status(400).json(error);
		});

	});


	app.get('/partner/item/:id', function(req, res, next) {
		console.log("Get CoudBoost Partner Form By ID");

		var partnerId = req.params.id;

		global.cbPartnerService.getById(partnerId).then(function(result) {
			return res.status(200).json(result);
		}, function(error) {
			return res.status(400).json(error);
		});

	});


	app.get('/partner/export', function(req, res, next) {
		console.log("Get CoudBoost Partner List");

		var skip = req.query.skip;
		var limit = req.query.limit;

		global.cbPartnerService.getList(skip, limit).then(function(result) {

			var jsonString = JSON.stringify(result);
			var sanitizedJSON = JSON.parse(jsonString);

			res.xls('partners.xlsx', sanitizedJSON);

		}, function(error) {
			return res.status(400).json(error);
		});

	});



	return app;

};
