'use strict';

var Q = require('q');
var request = require('request');

module.exports = function(_Settings) {

	return {

		getSettings: function() {

			console.log("Get server settings..");

			var deferred = Q.defer();

			try {
				_Settings.findOne({}, function(err, cbServerSettings) {
					if (err) {
						console.log("Error on Get server settings..");
						deferred.reject(err);
					}
					if (cbServerSettings) {

						if (cbServerSettings.clusterKey) {
							delete cbServerSettings._doc.clusterKey;
						}
						if (cbServerSettings.secureKey) {
							delete cbServerSettings._doc.secureKey;
						}
						console.log("Successfull on get server settings..");
						deferred.resolve(cbServerSettings);
					} else {
						console.log("Server settings not found..");
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

		upsertSettings: function(currentUserId, id, allowSignUp) {

			console.log("Upsert server settings..");

			var deferred = Q.defer();

			try {

				//Check User is Admin
				global.userService.getAccountById(currentUserId)
					.then(function(user) {

						console.log("User retrieved..");

						if (user.isAdmin) {

							_Settings.findOneAndUpdate({
								_id: id
							}, {
								$set: {
									allowSignUp: allowSignUp
								}
							}, {
								upsert: true,
								'new': true
							}, function(err, cbServerSettings) {
								if (err) {
									console.log("Error on Upsert server settings..");
									deferred.reject(err);
								}
								if (cbServerSettings) {
									if (cbServerSettings.clusterKey) {
										delete cbServerSettings._doc.clusterKey;
									}
									if (cbServerSettings.secureKey) {
										delete cbServerSettings._doc.secureKey;
									}

									console.log("Successfull on Upsert server settings..");
									deferred.resolve(cbServerSettings);
								} else {
									console.log("Unable to Upsert server settings..");
									deferred.resolve(null);
								}

							});

						} else {
							console.log("Unauthorised user(not a admin)");
							deferred.reject("Unauthorised");
						}

					}, function(error) {
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
		upsertAPI_URL: function(currentUserId, apiURL) {

			console.log("Upsert API URL..");

			var deferred = Q.defer();

			try {
				//Check User is Admin
				global.userService.getAccountById(currentUserId)
					.then(function(user) {
						console.log("User retrieved for Upsert API URL..");
						if (user.isAdmin) {

							_Settings.findOne({}, function(err, settingsFound) {
								if (err) {
									console.log("Error in upsert API URL");
									deferred.reject(err);
								}
								if (settingsFound) {
									settingsFound.myURL = apiURL;
									settingsFound.save(function(err, savedSettings) {
										if (err) {
											console.log("Error on saving API URL");
											deferred.reject(err);
										} else {
											if (savedSettings.clusterKey) {
												delete savedSettings._doc.clusterKey;
											}
											if (savedSettings.secureKey) {
												delete savedSettings._doc.secureKey;
											}
											console.log("Successfull on upset api url");
											deferred.resolve(savedSettings);
										}
									});
								} else {
									console.log("Document not found for upsert API URL..");
									deferred.reject("Document not found!");
								}

							});

						} else {
							console.log("Unauthorised User(not a admin) for Upsert API URL..");
							deferred.reject("Unauthorised");
						}
					}, function(error) {
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

		registerServer: function(secureKey) {

			console.log("Register server...");

			var deferred = Q.defer();

			try {

				_registerServerAnalytics(secureKey).then(function(result) {
					console.log("Success on Register server...");
					deferred.resolve(result);
				}, function(error) {
					console.log("Error Register server...");
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
		isHosted: function() {

			console.log("Check is hosted..");
			var deferred = Q.defer();

			try {

				_isHostedAnalytics().then(function(result) {
					console.log("Success on Check is hosted..");
					deferred.resolve(result);
				}, function(error) {
					console.log("Error on Check is hosted..");
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
		getDBStatuses: function() {

			var deferred = Q.defer();

			try {

				var promises = [];

				promises.push(_mongoDbStatus());
				promises.push(_redisDbStatus());
				promises.push(_cloudboostEngineStatus());

				Q.all(promises).then(function(resultList) {
					deferred.resolve("All are running..");
					console.log("All Status OK.");
				}, function(error) {
					console.log(error);
					deferred.reject(error.error);
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


function _mongoDbStatus() {

	console.log("MongoDB Status Function...");

	var deferred = Q.defer();

	try {
		var responseJson = {};
		responseJson.serviceName = "mongodb";
		responseJson.success = null;
		responseJson.error = null;

		global.mongoClient.command({
			whatsmyuri: 1
		}, function(err, status) {
			if (err) {
				console.log(err);
				responseJson.error = "Unable to know CBService Mongodb status";
				deferred.reject();
			} else {
				console.log("MongoDB Status: OK");
				responseJson.success = "CBService Mongodb status is okay";
				deferred.resolve();
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

function _redisDbStatus() {

	console.log("RedisDB Status Function...");

	var deferred = Q.defer();

	try {

		var responseJson = {};
		responseJson.serviceName = "redisdb";
		responseJson.success = null;
		responseJson.error = null;

		//Simple ping/pong with callback
		global.redisClient.call('PING', function(error, result) {
			if (error) {
				console.log(error);
				responseJson.error = "Unable to know CBService Redisdb status";
				deferred.reject(responseJson);
			}
			console.log("RedisDB Status:" + result);
			if (result === "PONG") {
				responseJson.success = "CBService Redisdb PING is successfull";
				deferred.resolve(responseJson);
			} else {
				responseJson.error = "CBService Redisdb PING is failed";
				deferred.reject(responseJson);
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


/***********************Pinging Analytics Services*********************************/

function _registerServerAnalytics(secureKey) {
	var deferred = Q.defer();

	try {
		var post_data = {};
		post_data.secureKey = secureKey;
		post_data = JSON.stringify(post_data);

		var url = global.keys.analyticsServiceUrl + '/server/register';
		request.post(url, {
			headers: {
				'content-type': 'application/json',
				'content-length': post_data.length
			},
			body: post_data
		}, function(err, response, body) {
			if (err || response.statusCode === 500 || body === 'Error') {
				deferred.reject(err);
			} else {

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


function _isHostedAnalytics() {
	var deferred = Q.defer();

	try {
		var post_data = {};
		post_data.secureKey = global.keys.secureKey;
		post_data = JSON.stringify(post_data);

		var url = global.keys.analyticsServiceUrl + '/server/isHosted';
		request.post(url, {
			headers: {
				'content-type': 'application/json',
				'content-length': post_data.length
			},
			body: post_data
		}, function(err, response, body) {
			if (err || response.statusCode === 500 || body === 'Error') {
				deferred.reject(err);
			} else {
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


function _cloudboostEngineStatus() {
	var deferred = Q.defer();

	try {

		var url = global.keys.dataServiceUrl + '/status';

		request.get(url, function(err, response, body) {
			if (err || response.statusCode === 500 || body === 'Error') {

				if (body) {
					deferred.reject({
						error: body
					});
				} else {
					deferred.reject({
						error: err
					});
				}

				console.log(body);
			} else {

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
