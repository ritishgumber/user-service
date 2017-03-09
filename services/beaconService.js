'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Beacon) {

	return {

		createBeacon: function(userId) {

			console.log("Create Beacon..");

			var _self = this;

			var deferred = Q.defer();

			try {
				var self = this;

				var beacon = new Beacon();
				beacon._userId = userId;

				beacon.firstApp = false;
				beacon.firstTable = false;
				beacon.firstColumn = false;
				beacon.firstRow = false;
				beacon.tableDesignerLink = false;
				beacon.documentationLink = false;

				beacon.save(function(err, beaconObj) {
					if (err) {
						console.log("Error on Create Beacon..");
						deferred.reject(err);
					}

					if (!beaconObj) {
						console.log("Cannot save the beacon right now.");
						deferred.reject('Cannot save the beacon right now.');
					} else {
						console.log("Successfully created the beacon");
						deferred.resolve(beaconObj);
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
		getBeaconByUserId: function(userId) {

			console.log("Get beacon user Id");

			var _self = this;

			var deferred = Q.defer();

			try {
				var self = this;

				Beacon.find({
					_userId: userId
				}, function(err, beaconObj) {
					if (err) {
						console.log("Error get beacon user Id");
						deferred.reject(err);
					}
					if (beaconObj && beaconObj.length > 0) {
						console.log("Successfully get beacon user Id");
						deferred.resolve(beaconObj[0]._doc);
					} else {
						console.log("Beacon not found");
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
		updateBeacon: function(userId, beaconObj) {

			console.log("Update Beacon");

			var deferred = Q.defer();

			try {
				var _self = this;

				_self.getBeaconByUserIdAndBeaconId(userId, beaconObj._id)
					.then(function(respBeaconObj) {
						console.log("Beacon reteieved..");
						respBeaconObj.firstApp = beaconObj.firstApp;
						respBeaconObj.firstTable = beaconObj.firstTable;
						respBeaconObj.firstColumn = beaconObj.firstColumn;
						respBeaconObj.firstRow = beaconObj.firstRow;
						respBeaconObj.tableDesignerLink = beaconObj.tableDesignerLink;
						respBeaconObj.documentationLink = beaconObj.documentationLink;

						return _self.saveBeaconByObj(respBeaconObj);

					}).then(function(savedBeaconObj) {
						console.log("Beacon updated Successfully..");
						deferred.resolve(savedBeaconObj);
					}, function(error) {
						console.log("Error on Beacon update");
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
		getBeaconByUserIdAndBeaconId: function(userId, beaconId) {

			console.log("Get Beacon by UserId and BeaconId");

			var _self = this;

			var deferred = Q.defer();

			try {

				var self = this;

				Beacon.findOne({
					_id: beaconId,
					_userId: userId
				}, function(err, beaconObj) {
					if (err) {
						console.log("Error Get Beacon by UserId and BeaconId");
						deferred.reject(err);
					}
					if (beaconObj) {
						console.log("Successfull on  Get Beacon by UserId and BeaconId");
						deferred.resolve(beaconObj);
					} else {
						console.log("Beacon not found");
						deferred.reject("No beacon found");
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
		saveBeaconByObj: function(beaconObj) {

			console.log("Save Beacon by BeaconObj");

			var _self = this;

			var deferred = Q.defer();

			try {
				var self = this;

				beaconObj.save(function(err, savedBeaconObj) {
					if (err) {
						console.log("Error on save beaon by beacon obj");
						deferred.reject(err);
					}
					if (!savedBeaconObj) {
						console.log("Cannot save the beacon right now.");
						deferred.reject('Cannot save the beacon right now.');
					} else {
						console.log("Successfully saved beacon Object");
						deferred.resolve(savedBeaconObj);
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
