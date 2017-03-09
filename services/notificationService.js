'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Notification) {

	return {

		createNotification: function(appId, email, notificationType, type, text) {

			console.log("Create notifications....");

			var _self = this;

			var deferred = Q.defer();

			try {

				var self = this;

				var notification = new Notification();

				notification.user = email;
				notification.appId = appId;
				notification.notificationType = notificationType;
				notification.type = type;
				notification.text = text;
				notification.seen = false;
				notification.timestamp = new Date().getTime();

				notification.save(function(err, notificationObj) {
					if (err) {
						console.log("Error on Create notifications....");
						deferred.reject(err);
					}
					if (!notificationObj) {
						console.log("Cannot save the notification right now.");
						deferred.reject('Cannot save the notification right now.');
					} else {
						console.log("Success on Create notifications....");
						deferred.resolve(notificationObj);
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
		getNotifications: function(userId, skip, limit) {
			console.log("Get Notification..");

			var _self = this;

			var deferred = Q.defer();

			try {

				var self = this;

				skip = parseInt(skip, 10);
				limit = parseInt(limit, 10);

				Notification.find({
					user: userId
				}).sort({
					timestamp: -1
				}).skip(skip).limit(limit).exec(function(err, notificatonList) {
					if (err) {
						console.log("Error on Get Notification..");
						deferred.reject(err);
					}
					if (notificatonList && notificatonList.length > 0) {
						console.log("Success on Get Notification..");
						deferred.resolve(notificatonList);
					} else {
						console.log("notification not found..");
						deferred.resolve(null);
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
		linkUserId: function(email, userId) {

			console.log("Link userId to notification");

			var _self = this;

			var deferred = Q.defer();

			try {

				var self = this;

				Notification.findOneAndUpdate({
					user: email
				}, {
					$set: {
						user: userId
					}
				}, {
					new: true
				}, function(err, savedNotification) {
					if (err) {
						console.log("Error on Link userId to notification");
						deferred.reject(err);
					}
					if (savedNotification) {
						console.log("Success on Link userId to notification");
						deferred.resolve(savedNotification);
					} else {
						console.log("Unable to Link userId to notification");
						deferred.resolve(null);
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
		updateNotificationsSeen: function(userId) {

			console.log("Update as notification seen by user..");

			var _self = this;

			var deferred = Q.defer();

			try {

				var self = this;

				Notification.find({
					user: userId,
					seen: false
				}, function(err, list) {
					if (err) {
						console.log("Error on Update as notification seen by user..");
						deferred.reject(err);
					}
					if (list && list.length > 0) {

						for (var i = 0; i < list.length; ++i) {
							list[i].seen = true;
							list[i].save();
						}

						console.log("Success on Update as notification seen by user..");
						deferred.resolve({
							message: "success"
						});
					} else {
						console.log("Unable to Update as notification seen by user..");
						deferred.resolve(null);
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
		removeNotificationById: function(notifyId) {

			console.log("remove notification by id..");

			var deferred = Q.defer();

			try {

				Notification.remove({
					_id: notifyId
				}, function(err) {
					if (err) {
						console.log("Error on remove notification by id..");
						deferred.reject(err);
					} else {
						console.log("Success remove notification by id..");
						deferred.resolve({
							message: "Success."
						});
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
