'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var request = require('request');
var pricingPlans = require('../config/pricingPlans.js')();
var crypto = require('crypto'),
	algorithm = 'aes-256-ctr';

function encrypt(text, password) {
	var cipher = crypto.createCipher(algorithm, password);
	var crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text, password) {
	var decipher = crypto.createDecipher(algorithm, password);
	var dec = decipher.update(text, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
}

module.exports = function(Card, User) {

	return {

		createThirdPartySale: function(appId, planId) {

			console.log("Create sale/charge card..");

			var _self = this;

			var deferred = Q.defer();

			try {
				var user = null;
				var saleDocument;

				_createThirdPartySaleInAnalytics(appId, {
					planId: planId
				}).then(function() {
					console.log("Success on create sale from analyticsService");
					return global.projectService.updatePlanByAppId(appId, planId);
				}).then(function(updatedProject) {
					console.log("Updated project by planId in after create sale..");
					deferred.resolve(updatedProject);
				}, function(error) {
					console.log("Error on create sale..");
					deferred.reject(error);
				});

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		},

		createSale: function(userId, appId, dataObj) {

			console.log("Create sale/charge card..");

			var _self = this;

			var deferred = Q.defer();

			try {
				var user = null;
				var saleDocument;

				global.userService.getAccountById(userId).then(function(userObj) {
					console.log("User is retrieved for create sale..");
					user = userObj;

					dataObj.userId = userId;
					dataObj.userEmail = userObj.email;
					return _createSaleInAnalytics(appId, dataObj);

				}).then(function(data) {
					console.log("Success on create sale from analyticsService");
					saleDocument = data;
					//Update Project with PlanId
					return global.projectService.updatePlanByAppId(appId, data.planId);

				}).then(function(updatedProject) {
					console.log("Updated project by planId in after create sale..");
					deferred.resolve(updatedProject);

					var notificationType = "inform";
					var type = "app-upgraded";
					var text = "Your app <span style='font-weight:bold;'>" + updatedProject.name + "</span> has been upgraded to <span style='font-weight:bold;'>" + saleDocument.planName + "</span>.";
					global.notificationService.createNotification(appId, user._id, notificationType, type, text);

					var mailName = "changeplan";
					var emailTo = user.email;
					var subject = "You've changed your app plan";

					var variableArray = [{
						"domClass": "username",
						"content": user.name,
						"contentType": "text"
					}, {
						"domClass": "appname",
						"content": updatedProject.name,
						"contentType": "text"
					}, {
						"domClass": "planname",
						"content": saleDocument.planName,
						"contentType": "text"
					}];

					global.mailService.sendMail(mailName, emailTo, subject, variableArray);

				}, function(error) {
					console.log("Error on create sale..");
					deferred.reject(error);
				});

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		},


		stopRecurring: function(appId, userId) {

			console.log("Stop recurring...");

			var _self = this;

			var deferred = Q.defer();

			try {
				var project = null;

				global.projectService.getProject(appId).then(function(projectObj) {

					console.log("Retrieved project for Stop recurring...");
					project = projectObj;

					return _stopRecurringInAnalytics(appId, userId);

				}).then(function(response) {
					console.log("Stopped recurring from analyticsService");
					return global.projectService.updatePlanByAppId(appId, 1);

				}).then(function(updatedProject) {

					console.log("updated project with planId after stopped recurring..");

					deferred.resolve({
						"message": "Success"
					});


					global.userService.getAccountById(userId).then(function(userObj) {

						var previousPlan = _.first(_.where(pricingPlans.plans, {
							id: project.planId
						}));

						var notificationType = "inform";
						var type = "app-payment-stopped";
						var text = "Your app <span style='font-weight:bold;'>" + updatedProject.name + "</span> has been cancelled for the <span style='font-weight:bold;'>" + previousPlan.planName + "</span>.";
						global.notificationService.createNotification(appId, userObj._id, notificationType, type, text);

						var mailName = "cancelplan";
						var emailTo = userObj.email;
						var subject = "You've canceled your plan";

						var variableArray = [{
							"domClass": "username",
							"content": userObj.name,
							"contentType": "text"
						}, {
							"domClass": "appname",
							"content": updatedProject.name,
							"contentType": "text"
						}, {
							"domClass": "planname",
							"content": previousPlan.planName,
							"contentType": "text"
						}];

						global.mailService.sendMail(mailName, emailTo, subject, variableArray);

					}, function(error) {
						console.log("Error in getting User details after cancelling Plan");
					});


				}, function(error) {
					console.log("Error on stop recurring..");
					deferred.reject(error);
				});

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		},

		addCard: function(userId, cardDetails) {

			console.log("Add card");

			var _self = this;

			var deferred = Q.defer();
			cardDetails.cardId = Math.random().toString(36).substring(7);

			try {
				User.findOne({
					_id: userId
				}, function(err, userData) {
					if (err) deferred.reject(err);
					Card.findOne({
						_userId: userId
					}, function(err, data) {
						if (err) deferred.reject(err);
						if (data) {
							cardDetails.number_actual = encrypt(cardDetails.number, userData.salt);
							cardDetails.number = cardDetails.number.slice(0, 4) + "-XXXX-XXXX-XXXX";
							data.cards.push(cardDetails);
							data.markModified('cards');
							data.save(function(err) {
								if (err) deferred.reject(err);
								deferred.resolve('Card Created');
							});
						} else {
							var newCard = new Card();
							newCard._userId = userId;
							newCard.cards = [
								cardDetails
							];
							newCard.save(function(err) {
								if (err) deferred.reject(err);
								deferred.resolve('Card Created');
							});
						}
					});
				});
			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		},

		reomveCard: function(userId, cardId) {

			console.log("Delete card");

			var _self = this;

			var deferred = Q.defer();

			try {
				Card.findOne({
					_userId: userId
				}, function(err, data) {
					if (err) deferred.reject(err);
					if (data) {
						data.cards = data.cards.filter(function(x) {
							return x.cardId != cardId;
						});
						data.markModified('cards');
						data.save(function(err) {
							if (err) deferred.reject(err);
							deferred.resolve('Card Removed');
						});
					} else {
						deferred.reject('Card Not found');
					}
				});

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		},

		getCards: function(userId) {

			console.log("Get card");

			var _self = this;

			var deferred = Q.defer();

			try {
				Card.findOne({
					_userId: userId
				}, function(err, data) {
					if (err) deferred.reject(err);
					if (data) {
						data.cards = data.cards.map(function(card) {
							delete card.number_actual;
							return card;
						});
						deferred.resolve(data.cards || []);
					} else {
						deferred.resolve([]);
					}
				});

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
				deferred.reject(err);
			}

			return deferred.promise;
		}

	};

};


/***********************Pinging Analytics Services*********************************/

function _createSaleInAnalytics(appId, dataObj) {

	console.log("Create Sale in Analytics");

	var deferred = Q.defer();

	try {

		dataObj.secureKey = global.keys.secureKey;
		dataObj = JSON.stringify(dataObj);


		var url = global.keys.analyticsServiceUrl + '/' + appId + '/sale';
		request.post(url, {
			headers: {
				'content-type': 'application/json',
				'content-length': dataObj.length
			},
			body: dataObj
		}, function(err, response, body) {
			if (err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error') {
				console.log("Error on Create Sale in Analytics");
				deferred.reject(err);
			} else {
				console.log("Success on Create Sale in Analytics");
				try {
					var respBody = JSON.parse(body);
					deferred.resolve(respBody);
				} catch (e) {
					deferred.resolve();
				}

			}
		});

	} catch (err) {
		global.winston.log('error', {
			"error": String(err),
			"stack": new Error().stack
		});
		deferred.reject(err);
	}

	return deferred.promise;
}

function _createThirdPartySaleInAnalytics(appId, dataObj) {

	console.log("Create Third Party Sale in Analytics");

	var deferred = Q.defer();

	try {

		dataObj.secureKey = global.keys.secureKey;
		dataObj = JSON.stringify(dataObj);


		var url = global.keys.analyticsServiceUrl + '/' + appId + '/thirdPartySale';
		request.post(url, {
			headers: {
				'content-type': 'application/json',
				'content-length': dataObj.length
			},
			body: dataObj
		}, function(err, response, body) {
			if (err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error') {
				console.log("Error on Create Sale in Analytics");
				deferred.reject(err);
			} else {
				console.log("Success on Create Sale in Analytics");
				try {
					var respBody = JSON.parse(body);
					deferred.resolve(respBody);
				} catch (e) {
					deferred.resolve();
				}

			}
		});

	} catch (err) {
		global.winston.log('error', {
			"error": String(err),
			"stack": new Error().stack
		});
		deferred.reject(err);
	}

	return deferred.promise;
}

function _stopRecurringInAnalytics(appId, userId) {

	console.log("Stop recurring in Analytics");

	var deferred = Q.defer();

	try {
		var dataObj = {};
		dataObj.secureKey = global.keys.secureKey;
		dataObj.userId = userId;
		dataObj = JSON.stringify(dataObj);

		var url = global.keys.analyticsServiceUrl + '/' + appId + '/cancel';

		request.post(url, {
			headers: {
				'content-type': 'application/json',
				'content-length': dataObj.length
			},
			body: dataObj
		}, function(err, response, body) {
			if (err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error') {
				console.log("Error stop recurring in Analytics");
				deferred.reject(err);
			} else {
				console.log("Success on stop recurring in Analytics");
				try {
					var respBody = JSON.parse(body);
					deferred.resolve(respBody);
				} catch (e) {
					deferred.reject(e);
				}
			}
		});

	} catch (err) {
		global.winston.log('error', {
			"error": String(err),
			"stack": new Error().stack
		});
		deferred.reject(err);
	}

	return deferred.promise;
}
