'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Project){

  return {

        createProject: function (name, appId ,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              Project.findOne({appId : appId}, function (err, project) {
                if(project)
                  deferred.reject('AppID already exists');
                else
                  var project = new Project();
                  project._userId=userId;
                  project.name=name;
                  project.appId = appId;  
                  project.keys = {};
                  project.keys.js = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 16).toString("base64");
                  project.keys.master = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 32).toString("base64");        
                  
                  project.save(function (err, project) {
                          if (err) deferred.reject(err);

                          if(!project)
                              deferred.reject('Cannot save the app right now.');
                          else{
                            _self.projectStatus(appId, userId).then(function(status){
                              project._doc.status = status;
                              deferred.resolve(project._doc);
                            }, function(error){
                              project._doc.status = {status : 'Unknown'};
                              deferred.resolve(project._doc);
                            })
                          }
                  });
              });             

              return deferred.promise;
          },

          projectStatus: function (appId, userId) {

              var deferred = Q.defer();

              var self = this;         

              // try{    

              //     Project.findOne({ appId: appId, _userId : userId }, function (err, project) {
              //       if (err) deferred.reject(err);

              //       if(!project)
              //         deferred.reject('Cannot find.');

              //       http.get(keys.dataServiceUrl+":"+keys.dataServiceUrlPort+"/app/status/"+appId, function(res) {
              //         if(res.statusCode===200){
              //           deferred.resolve({status:'online', appId : appId});
              //         }else{
              //           deferred.resolve({status:'offline', appId : appId});
              //         }
              //       }).on('error', function(e) {
              //         deferred.resolve({status:'offline', appId : appId});
              //       });
                     
              //     });
              //   }catch(e){
              //     console.log('+++++ Project Status Error +++++++');
              //     console.log(e);
              //     deferred.reject(e);
              //   }

              deferred.resolve({status:'online', appId : appId});

              return deferred.promise;
          },

          projectList: function (userId) {

            var _self = this;

             var deferred = Q.defer();

              var self = this;

              Project.find({ _userId: userId }, function (err, list) {
                if (err) deferred.reject(err);

                var promise = [];

                for(var i=0;i<list.length;i++){
                    promise.push(_self.projectStatus(list[i]._doc.appId, userId));
                }

                Q.all(promise).then(function(statusList){
                  //merge status with the list
                  for(var i=0;i<list.length;i++){
                    var statusObj = _.first(_.where(statusList, {appId : list[i]._doc.appId}));
                    list[i]._doc.status = statusObj;
                  }

                 list = _.map(list, function(obj){ return obj._doc});

                  deferred.resolve(list);

                }, function(error){
                  deferred.reject(error);
                })
                 
              });

             return deferred.promise;
          },

          editProject: function(userId,id,name) {

              var deferred = Q.defer();
              var _self = this;

              _self.getProject(id).then(function (project) {
                  if (!project) {
                      deferred.reject('error updating project');
                  }
                  
                    project._userId=userId;
                    project.name=name;                 

                     project.save(function (err, project) {
                          if (err) deferred.reject(err);

                          if(!project)
                              deferred.reject('Cannot save the app right now.');
                          else{
                            _self.projectStatus(id, userId).then(function(status){
                              project._doc.status = status;
                              deferred.resolve(project._doc);
                            }, function(error){
                              project._doc.status = {status : 'Unknown'};
                              deferred.resolve(project._doc);
                            })
                          }
                  });

              },function(error){
                deferred.reject(error);
              });

              return deferred.promise;
          },

          getProject: function (appId) {

              var deferred = Q.defer();

              var self = this;

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                else {
                    deferred.resolve(project);
                }
              });

             return deferred.promise;

          },

          delete: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;

              console.log(' ++++++++ App Delete request +++++++++');

              Project.remove({appId:appId, _userId : userId}, function (err) {
                if(err){
                  console.log('++++++++ App Delete failed from frontend ++++++++++'); 
                  console.log(err);
                  deferred.reject(err);
                }else{

                    var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\"}";

                    request.post({
                      headers: {
                                  'content-type' : 'application/json', 
                                  'content-length' : post_data.length
                               },
                      url:     keys.dataServiceUrl + ':'+keys.dataServiceUrlPort+"/app/delete/"+appId,
                      body:    post_data
                    }, function(error, response, body){

                       if(response.body === 'Success'){
                          deferred.resolve();
                       }else{
                          deferred.reject();
                       }

                    });
                }
              });

             return deferred.promise;

          }
    }

};
