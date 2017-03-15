'use strict';

var Q = require('q');
var keys = require('../config/keys');
var request = require('request');
// var async = require('async');
// var http = require('http');
// var crypto = require('crypto');
// var _ = require('underscore');


module.exports = function() {

	return {

		addSubscriber: function(listId, email) {

			console.log("Add subscriber in mail chimp..");

			var deferred = Q.defer();

			try {
				var post_data = {};
				post_data.email_address = email;
				post_data.status = 'subscribed';

				var url = "https://us10.api.mailchimp.com/3.0/lists/" + listId + "/members";

				request({
					url: url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: post_data,
					auth: {
						"username": "cloudboost",
						"password": keys.mailchimpApiKey
					}
				}, function(error, response, body) {
					if (error || response.statusCode === 400 || response.statusCode === 500) {
						console.log("Error on Adding subscriber in mail chimp..");
						deferred.reject(error);
					} else {
						console.log("Success on Adding subscriber in mail chimp..");
						deferred.resolve(body);
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
