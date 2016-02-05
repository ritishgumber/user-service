'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(_Settings){

  return {  

    getSettings: function () {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        _Settings.findOne({}, function (err, cbServerSettings) {
          if (err) deferred.reject(err);
          if(cbServerSettings){

            if(cbServerSettings.clusterKey){
              delete cbServerSettings._doc.clusterKey;
            }
            if(cbServerSettings.secureKey){
              delete cbServerSettings._doc.secureKey;
            }
            deferred.resolve(cbServerSettings);
          }else{
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    },

    upsertSettings: function (currentUserId,id,allowSignUp) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        //Check User is Admin
        global.userService.getAccountById(currentUserId)
        .then(function(user) { 

          if(user.isAdmin){

            _Settings.findOneAndUpdate({_id:id},{$set: {allowSignUp:allowSignUp }},{upsert: true, 'new': true}, function (err, cbServerSettings) {
              if (err) deferred.reject(err);
              if(cbServerSettings){
                if(cbServerSettings.clusterKey){
                   delete cbServerSettings._doc.clusterKey;
                }
                if(cbServerSettings.secureKey){
                  delete cbServerSettings._doc.secureKey;
                }            

                deferred.resolve(cbServerSettings);
              }else{
                deferred.resolve(null);
              }
                   
            });

          }else{
            deferred.reject("Unauthorised")
          }

        },function(error){
           deferred.reject(error);
        });     

        return deferred.promise;
    },
    upsertAPI_URL: function (currentUserId,apiURL) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        //Check User is Admin
        global.userService.getAccountById(currentUserId)
        .then(function(user) {            
          if(user.isAdmin){

            _Settings.findOne({},function (err, settingsFound) {
              if (err) deferred.reject(err);
              if(settingsFound){            
                settingsFound.myURL=apiURL;
                settingsFound.save(function (err,savedSettings) {
                  if (err){ 
                    deferred.reject(err)
                  }else {
                    if(savedSettings.clusterKey){
                      delete savedSettings._doc.clusterKey;
                    }
                    if(savedSettings.secureKey){
                      delete savedSettings._doc.secureKey;
                    }                
                    deferred.resolve(savedSettings);
                  }
                });
              }else{
                deferred.reject("Document not found!");
              }
                   
            });

          }else{
            deferred.reject("Unauthorised")
          }
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },

    registerServer: function (secureKey) {

        var _self = this;

        var deferred = Q.defer();

        _registerServerAnalytics(secureKey).then(function(result) {
          deferred.resolve(result);
        },function(error){
          deferred.reject(error);
        });           

        return deferred.promise;
    },  

  }

};



/***********************Pinging Analytics Services*********************************/

function _registerServerAnalytics(secureKey){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = secureKey; 
  post_data = JSON.stringify(post_data);

  var url = global.keys.analyticsServiceUrl +'/server/register';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}