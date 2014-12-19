'use strict';

var async = require('async');
var crypto = require('crypto');

var ProjectCollection = require('../config/collections.js').project;

module.exports = {






      createProject: function (data,currentUserId,callback) {
            var self = this;

            self.checkURL(data.url, function (e, url) {
                if (url) {
                    return callback('This URL already Exists');
                }

            var projectSchema = {
                userId:currentUserId,
                projectName:data.name,
                url:data.url
                }

            docDB.addItem(ProjectCollection,projectSchema, function(e, project) {
                return callback(e, project);
            });

          });
        },

        checkURL: function (url, callback) {
            var self = this;

            docDB.getItem(ProjectCollection,'select * from root r where r.url ="' + url + '"', function(e, url) {
                if(!url) {
                    return callback(e);
                }
                return callback(e, url);

            });

        }


}
