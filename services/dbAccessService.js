'use strict';

var Q = require('q');
var keys = require('../config/keys');
var request = require('request');

module.exports = function(dbaccessModel) {

	return {

		createAccessUrl: function(userId, appId) {
			var deferred = Q.defer();
			checkIfAppByUser(userId, appId)
				.then(function(data) {
					return checkIfAlreadyExists(userId, appId, dbaccessModel)
				})
				.then(function(data) {
					return createUserInDb(appId)
				})
				.then(function(userData) {
					return createAccessEntryforUser(userId, appId, userData, dbaccessModel)
				})
				.then(function(data) {
					deferred.resolve(data);
				}, function(err) {
					deferred.reject(err);
				})
			return deferred.promise
		},
		getAccessUrl: function(userId, appId) {
			var deferred = Q.defer();
			dbaccessModel.findOne({
				_userId: userId,
				appId: appId
			}, function(err, data) {
				if (err) deferred.reject(err)
				if (data === null || data === undefined) {
					deferred.reject({
						found: false
					})
				} else {
					if (global.keys.mongoPublicUrls.length === 0) {
						deferred.reject({
							message: "No public url's"
						})
					}
					var url = ''
					for (var k in global.keys.mongoPublicUrls) {
						url += global.keys.mongoPublicUrls[k]
						if (k != global.keys.mongoPublicUrls.length - 1) {
							url += ","
						}
					}
					deferred.resolve({
						data: data,
						url: url
					})
				}
			})
			return deferred.promise
		}

	}

};

function createUserInDb(appId) {
	var deferred = Q.defer();
	var post_data
	var url = global.keys.dataServiceUrl + '/admin/dbaccess/enable/' + appId;
	post_data = {
		secureKey: global.keys.secureKey
	}
	post_data = JSON.stringify(post_data)
	request.post(url, {
		headers: {
			'content-type': 'application/json',
			'content-length': post_data.length
		},
		body: post_data
	}, function(err, response, body) {
		if (err || response.statusCode === 500 || body === 'Error') {
			console.log(err);
			deferred.reject(err);
		} else {
			try {
				deferred.resolve(JSON.parse(body));
			} catch (e) {
				deferred.reject(e);
			}
		}
	});
	return deferred.promise

}

function createAccessEntryforUser(userId, appId, userData, dbaccessModel) {
	var deferred = Q.defer();

	var newDbAccess = new dbaccessModel()
	newDbAccess.username = userData.user.username
	newDbAccess.password = userData.user.password
	newDbAccess._userId = userId
	newDbAccess.appId = appId

	newDbAccess.save(function(err) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(userData)
		}
	})

	return deferred.promise
}

function checkIfAlreadyExists(userId, appId, dbaccessModel) {
	var deferred = Q.defer();
	dbaccessModel.findOne({
		_userId: userId,
		appId: appId
	}, function(err, data) {
		if (err) deferred.reject(err)
		if (data === null || data === undefined) {
			deferred.resolve(true)
		} else {
			deferred.reject({
				error: "DbAccess Already Existis"
			})
		}
	})
	return deferred.promise
}

function checkIfAppByUser(userId, appId) {
	var deferred = Q.defer();
	global.projectService.projectList(userId).then(function(data) {
		for (var k in data) {
			if (data[k].appId == appId) {
				deferred.resolve(true)
			}
		}
		deferred.reject({
			error: "given user does not exists for the given application"
		})
	}, function(err) {
		deferred.reject(err)
	})
	return deferred.promise
}
