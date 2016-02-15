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

    apiUsage: function (appId) {

        var _self = this;

        var deferred = Q.defer();  

        _getApiUsageAnalytics(appId).then(function(result) {
            deferred.resolve(result);
        },function(error){
            deferred.reject(error);
        });     

        return deferred.promise;
    },
 
    storageUsage: function (appId) {

          var _self = this;

          var deferred = Q.defer();  

          _getStorageUsageAnalytics(appId).then(function(result) {
              deferred.resolve(result);
          },function(error){
              deferred.reject(error);
          });     

          return deferred.promise;
    },
    apiCount: function (appId) {

        var _self = this;

        var deferred = Q.defer();  

        _getApiCountAnalytics(appId).then(function(result) {
            deferred.resolve(result);
        },function(error){
            deferred.reject(error);
        });     

        return deferred.promise;
    }, 
    storageLastRecord: function (appId) {

        var _self = this;

        var deferred = Q.defer();  

        _getStorageLastRecord(appId).then(function(result) {
            deferred.resolve(result);
        },function(error){
            deferred.reject(error);
        });     

        return deferred.promise;
    }
  }
};


/***********************Pinging Analytics Services*********************************/

function _getApiUsageAnalytics(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey; 
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl + '/'+appId+'/api/usage';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}


function _getStorageUsageAnalytics(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;  
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl +'/'+appId+'/storage/usage';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}


function _getApiCountAnalytics(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey; 
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl + '/'+appId+'/api/count';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}

function _getStorageLastRecord(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;  
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl +'/'+appId+'/storage/count';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}