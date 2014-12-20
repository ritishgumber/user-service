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

        },
        projectList: function (currentUserId, callback) {
            var self = this;

            docDB.getItemList(ProjectCollection,'select * from root r where r.userId ="' + currentUserId + '"', function(e, list) {
                if(!list) {
                    return callback(e);
                }

                return callback(e,list);
            });

        },

        editProject: function(currentUserId,id,name,url, callback) {
            var self = this;

            self.getProject(id, function (e, project) {
                if (e || !project) {
                    return callback('error updating project');
                }
                self.checkURL(url,function (e, data) {
                  if (data) {
                      return callback('This URL already Exists');
                  }
                  project.userId=currentUserId;
                  project.projectName = name;
                  project.url= url;

                  //update a new project
                  docDB.updateItem(project, function(e) {
                      callback(e,project);
                  });

              });


            });

        },

        getProject: function (id, callback) {
            var self = this;

            docDB.getItem(ProjectCollection,'select * from root r where r.id ="' + id + '"', function(e, project) {
                if(!project) {
                    return callback(e);
                }
                return callback(e,project);
            });

        }


}
