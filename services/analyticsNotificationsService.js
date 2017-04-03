'use strict';

var Q = require('q');
var _ = require('underscore');
var pricingPlans = require('../config/pricingPlans.js')();

module.exports = function() {

	return {

		updateUserOver80: function(appId, exceededArray) {

			console.log("Update User Over 80...");

			var deferred = Q.defer();

			try {

				var project = null;

				global.projectService.getProject(appId).then(function(projectObj) {

					console.log("Retrieved project");

					project = projectObj;

					var adminUser = _.first(_.where(project.developers, {
						role: "Admin"
					}));
					return global.userService.getAccountById(adminUser.userId);

				}).then(function(userObj) {

					console.log("Retrieved User account");
					var presentPlan = _.first(_.where(pricingPlans.plans, {
						id: project.planId
					}));

					var notificationType = "payment";
					var type = "upgrade-app";
					var text = "Your app <span style='font-weight:bold;'>" + project.name + "</span> has reached 80% of its current plan. Upgrade to next plan now.";
					global.notificationService.createNotification(appId, userObj._id, notificationType, type, text);

					console.log("Also send mandril email over 80% usage...");

					try {
						if (userObj.name && userObj.email && project.name && presentPlan && presentPlan.planName) {

							var mailName = "over80limit";
							var emailTo = userObj.email;
							var subject = "Your app " + project.name + " reached 80% of its API calls";

							var variableArray = [{
								"domClass": "username",
								"content": userObj.name,
								"contentType": "text"
							}, {
								"domClass": "appname",
								"content": project.name,
								"contentType": "text"
							}, {
								"domClass": "planname",
								"content": presentPlan.planName,
								"contentType": "text"
							}];

							global.mailService.sendMail(mailName, emailTo, subject, variableArray);

						}
					} catch (e) {
						console.log(e);
					}

					console.log("Successfully sent email for over 80% usage.");
					deferred.resolve({
						message: "success"
					});

				}, function(error) {
					console.log("Error on update over 80% usage");
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
		updateUserOver100: function(appId, details) {

			console.log("Update over 100% usage..");

			var deferred = Q.defer();

			try {
				var project = null;

				global.projectService.getProject(appId).then(function(projectObj) {
					console.log("Retrieved project");
					project = projectObj;

					var adminUser = _.first(_.where(project.developers, {
						role: "Admin"
					}));
					return global.userService.getAccountById(adminUser.userId);

				}).then(function(userObj) {

					console.log("Retrieved user account");

					var presentPlan = _.first(_.where(pricingPlans.plans, {
						id: project.planId
					}));

					var notificationType = "payment";
					var type = "upgrade-app";
					var text = "Your app <span style='font-weight:bold;'>" + project.name + "</span> has been over the limit of its current plan. Upgrade to next plan now.";
					global.notificationService.createNotification(appId, userObj._id, notificationType, type, text);

					var mailName = "overlimit";
					var emailTo = userObj.email;
					var subject = "Your app" + project.name + "reached its API limit";

					var variableArray = [{
						"domClass": "username",
						"content": userObj.name,
						"contentType": "text"
					}, {
						"domClass": "appname",
						"content": project.name,
						"contentType": "text"
					}, {
						"domClass": "planname",
						"content": presentPlan.planName,
						"contentType": "text"
					}];

					global.mailService.sendMail(mailName, emailTo, subject, variableArray);

					console.log("Successfully sent email for usage over 100%");

					deferred.resolve({
						message: "success"
					});

				}, function(error) {
					console.log("Error on update over 100% usage");
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
		}

	};

};
