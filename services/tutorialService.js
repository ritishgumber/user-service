'use strict';

var Q = require('q');
// var async = require('async');
// var http = require('http');
// var keys = require('../config/keys');
// var _ = require('underscore');
// var request = require('request');
// var crypto = require('crypto');

module.exports = function(Tutorial) {

	return {

		getTutorialList: function() {

			console.log("Get tutorials list...");

			// var _self = this;

			var deferred = Q.defer();

			try {

				// var self = this;

				Tutorial.find({}, null, {
					sort: {
						"order": 1
					}
				}, function(err, tutorial) {
					if (err) {
						console.log("Error on Get tutorials list...");
						deferred.reject(err);
					}
					if (tutorial && tutorial.length > 0) {
						console.log("Success on Get tutorials list...");
						deferred.resolve(tutorial);
					} else {
						console.log("tutorials list not found...");
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
		getTutorialById: function(tutorialDocId) {

			console.log("Get tutorials by Id...");

			// var _self = this;

			var deferred = Q.defer();

			try {

				// var self = this;

				/*Tutorial.findOne({tutorials::{"$in":[id:tutorialDocId]}}, function (err, tutorial) {
            if (err) deferred.reject(err);
            if(tutorial){
              deferred.resolve(tutorial);
            }else{
              deferred.resolve(null);
            }               
        });*/

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
