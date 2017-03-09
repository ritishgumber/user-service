'use strict';

var async = require('async');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var keys = require('../config/keys');
var Grid = require('gridfs-stream');

module.exports = function() {
	Grid.mongo = global.mongoose.mongo;
	var gfs = new Grid(global.mongoose.connection.db);

	return {
		putFile: function(file, filename, mimetype) {

			console.log("Upload user image");

			var deferred = Q.defer();

			try {
				// streaming to gridfs
				//filename to store in mongodb
				var writestream = gfs.createWriteStream({
					filename: filename,
					mode: 'w',
					content_type: mimetype
				});
				file.pipe(writestream);

				writestream.on('close', function(file) {
					//console.log(file.filename + ' is written To DB'); 
					console.log("Success on Upload user image");
					deferred.resolve(file);
				});

				writestream.on('error', function(error) {
					console.log("error writing file");
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

		getFileById: function(fileId) {

			console.log("Get image by id");

			var deferred = Q.defer();

			try {
				gfs.findOne({
					_id: fileId
				}, function(err, file) {
					if (err) {
						console.log("Error Get image by id");
						return deferred.reject(err);
					}
					if (!file) {
						console.log("Image not found..");
						return deferred.reject(null);
					}

					console.log("Image retrieved..");
					return deferred.resolve(file);
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

		deleteFileById: function(fileId) {
			console.log("Delete image by id..");
			var deferred = Q.defer();

			try {
				gfs.remove({
					_id: fileId
				}, function(err) {
					if (err) {
						console.log("Error on Delete image by id..");
						return deferred.reject(err);
					}

					console.log("Success on delete image by id..");
					return deferred.resolve("Success");
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
