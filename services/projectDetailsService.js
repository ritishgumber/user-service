'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(ProjectDetails){

  return {

        saveProjectDetails: function (data,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              ProjectDetails.findOne({appId:data.appId,_userId:userId}, function (err, projectDet) {
                if(projectDet){                  
                  projectDet.appProductionName = data.appProductionName;  
                  projectDet.isReleasedInProduction=data.isReleasedInProduction;
                  projectDet.appDescription=data.appDescription;
                  projectDet.url=data.url;

                  projectDet.save(function (err, doc) {
                      if (err) deferred.reject(err);
                      if(!doc)
                          deferred.reject('Cannot save the app right now.');
                      else{                            
                          deferred.resolve(doc._doc);                            
                      }
                  });                  
                }else{

                  var projectDetails = new ProjectDetails();
                  projectDetails.appId=data.appId;
                  projectDetails._userId=userId;
                  projectDetails.appProductionName = data.appProductionName;  
                  projectDetails.isReleasedInProduction=data.isReleasedInProduction;
                  projectDetails.appDescription=data.appDescription;
                  projectDetails.url=data.url;

                  projectDetails.save(function (err, doc) {
                      if (err) deferred.reject(err);

                      if(!doc)
                          deferred.reject('Cannot save the app right now.');
                      else{                                             
                          deferred.resolve(doc._doc);                            
                      }
                  });
                }//end of else

              });             

              return deferred.promise;
          },

           getProjectDetails: function (userId,appId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              

              ProjectDetails.find({_userId: userId,appId:appId}, function (err, projectDet) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(projectDet.length>0){
                      deferred.resolve(projectDet[0]._doc);  
                    }else{
                      deferred.resolve(null); 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          }

         
    }

};
