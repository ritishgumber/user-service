'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(){

  return {

    api: function (appId) {

        var _self = this;

        var deferred = Q.defer();  

        _getApiAnalytics(appId).then(function(result) {
            deferred.resolve(result);
        },function(error){
            deferred.reject(error);
        });     

        return deferred.promise;
    },
 
    storage: function (appId) {

          var _self = this;

          var deferred = Q.defer();  

          _getStorageAnalytics(appId).then(function(result) {
              deferred.resolve(result);
          },function(error){
              deferred.reject(error);
          });     

          return deferred.promise;
      }
    }   

};


/***********************Pinging Analytics Services*********************************/

function _getApiAnalytics(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;
  post_data.appId = appId;
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl + '/'+appId+'/api';  
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


function _getStorageAnalytics(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;
  post_data.appId = appId;
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl +'/'+appId+'/storage';  
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