'use strict';

var async = require('async');
var Q = require('q');

module.exports = function(Project){


  return {

        createProject: function (data,userId) {

              var deferred = Q.defer();

              var self = this;

              self.isUrlUnique(data.url).then(function (isUnique) {
                  if (!isUnique) {
                       deferred.reject('This URL already Exists');

                  }else{

                    var project = new Project();

                    project._userId=userId;
                    project.name=data.name;
                    project.url=data.url;
                    
                    project.save(function (err) {
                            if (err) deferred.reject(err);
                            else deferred.resolve(project);
                    });
                  }
            },function(error){
                deferred.reject(error);  
            });


             return deferred.promise;
          },

          isUrlUnique: function (url) {

              var deferred = Q.defer();

              var self = this;

              Project.findOne({ url: url }, function (err, project) {
                if (err) deferred.reject(err);
                else {
                  if(project){
                    deferred.resolve(false);
                  }else{
                    deferred.resolve(true);
                  }
                }
              });

             return deferred.promise;

          },


          projectList: function (userId) {

             var deferred = Q.defer();

              var self = this;

              Project.find({ _userId: userId }, function (err, list) {
                if (err) deferred.reject(err);
                else deferred.resolve(list);
                 
              });

             return deferred.promise;
             

          },

          editProject: function(userId,id,name,url) {

              var deferred = Q.defer();
              var self = this;

              self.getProject(id).then(function (project) {
                  if (!project) {
                      deferred.reject('error updating project');
                  }
                  self.isUrlUnique(url).then(function (isUnique) {
                    if (!isUnique) {
                        deferred.reject('This URL already Exists');
                    }
                    project._userId=userId;
                    project.name=name;
                    project.url= url;

                     project.save(function (err) {
                          if (err) deferred.reject(err);
                          else deferred.resolve(project);
                     });

                },function(error){
                  deferred.reject(error);
                });


              },function(error){
                deferred.reject(error);
              });

              return deferred.promise;


          },

          getProject: function (id) {

              var deferred = Q.defer();

              var self = this;

              Project.findOne({_id:id}, function (err, project) {
                if (err) deferred.reject(err);
                else {
                    deferred.resolve(project);
                }
              });

             return deferred.promise;

          }
    }

};
