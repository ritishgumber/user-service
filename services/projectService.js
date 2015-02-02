'use strict';

var async = require('async');
var Q = require('q');

module.exports = function(Project){


  return {

        createProject: function (data,userId) {

              var deferred = Q.defer();

              var self = this;             

              var project = new Project();
              project._userId=userId;
              project.name=data.name;          
              
              project.save(function (err) {
                      if (err) deferred.reject(err);
                      else deferred.resolve(project);
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

          editProject: function(userId,id,name) {

              var deferred = Q.defer();
              var self = this;

              self.getProject(id).then(function (project) {
                  if (!project) {
                      deferred.reject('error updating project');
                  }
                  
                    project._userId=userId;
                    project.name=name;                 

                     project.save(function (err) {
                          if (err) deferred.reject(err);
                          else deferred.resolve(project);
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
