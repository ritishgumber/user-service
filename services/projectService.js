'use strict';

var async = require('async');

var ProjectCollection = require('../config/collections.js').project;

module.exports = {

      createProject: function (data,currentUser,callback) {
            var self = this;

            self.isUrlUnique(data.url, function (e,isUnique) {
                if (isUnique) {
                    return callback('This URL already Exists');
                }

            var projectSchema = {
                user:currentUser,
                name:data.name,
                url:data.url
                }

            docDB.addItem(ProjectCollection,projectSchema, function(e, project) {
                return callback(e, project);
            });

          });
        },

        isUrlUnique: function (url, callback) {
            var self = this;

            docDB.getItem(ProjectCollection,'select * from root r where r.url ="' + url + '"', function(e, url) {
                if(!url) {
                    return callback(e);
                }
                return callback(e, true);

            });

        },
        projectList: function (currentUser, callback) {
            var self = this;

            docDB.getItemList(ProjectCollection,'select * from root r where r.user="' + currentUser+ '"', function(e, list) {
                if(!list) {
                    return callback(e);
                }

                return callback(e,list);
            });

        },

        editProject: function(currentUser,id,name,url, callback) {
            var self = this;

            self.getProject(id, function (e, project) {
                if (e || !project) {
                    return callback('error updating project');
                }
                self.isUrlUnique(url,function (e,isUnique) {
                  if (isUnique) {
                      return callback('This URL already Exists');
                  }
                  project.user=currentUser;
                  project.name=name;
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
