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

        console.log("Get API Usage by appId...");

        var _self = this;

        var deferred = Q.defer(); 

        try{ 

          _getApiUsageAnalytics(appId).then(function(result) {
              console.log("Success on Get API Usage by appId...");
              deferred.resolve(result);
          },function(error){
              console.log("Error on  on Get API Usage by appId...");
              deferred.reject(error);
          });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
          deferred.reject(err);         
        }     

        return deferred.promise;
    },
 
    storageUsage: function (appId) {

      console.log("Get Storage Usage by appId...");

      var _self = this;

      var deferred = Q.defer();  

      try{
        _getStorageUsageAnalytics(appId).then(function(result) {
            console.log("Success on Get Storage Usage by appId...");
            deferred.resolve(result);
        },function(error){
           console.log("Error on Get Storage Usage by appId...");
            deferred.reject(error);
        });

      }catch(err){
        global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
        deferred.reject(err);         
      }     

      return deferred.promise;
    },
    apiCount: function (appId) {

        console.log("Get API Count...");

        var _self = this;

        var deferred = Q.defer();  

        try{
          _getApiCountAnalytics(appId).then(function(result) {
              console.log("Sucess on Get API Count...");
              deferred.resolve(result);
          },function(error){
              console.log("Error on Get API Count...");
              deferred.reject(error);
          });     

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
          deferred.reject(err);         
        }
        return deferred.promise;
    }, 
    storageLastRecord: function (appId) {

        console.log("Get Last storage record...");

        var _self = this;

        var deferred = Q.defer();  

        try{
          _getStorageLastRecord(appId).then(function(result) {
              console.log("Success on Get Last storage record...");
              deferred.resolve(result);
          },function(error){
              console.log("Error on Get Last storage record...");
              deferred.reject(error);
          }); 

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
          deferred.reject(err);         
        }    

        return deferred.promise;
    }, 
    bulkApiStorageDetails: function (appIdArray) {

        console.log("Get API and Storage by array of appID's");

        var _self = this;

        var deferred = Q.defer();  

        try{
          _getBulkApiStorageDetails(appIdArray).then(function(result) {
              console.log("Success on Get API and Storage by array of appID's");
              deferred.resolve(result);
          },function(error){
              console.log("Error on Get API and Storage by array of appID's");
              deferred.reject(error);
          }); 

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
          deferred.reject(err);         
        }    

        return deferred.promise;
    }
  }
};


/***********************Pinging Analytics Services*********************************/

function _getApiUsageAnalytics(appId){

  console.log("Get api Usage from Analytics");

  var deferred = Q.defer();
 
  try{
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
          console.log("Error on Get api Usage from Analytics"); 
          console.log(err);  
          deferred.reject(err);
        }else {  
          console.log("Success on Get api Usage from Analytics");   
          try{
            var respBody = JSON.parse(body);
            deferred.resolve(respBody);
          } catch(e){
            deferred.reject("Data parse error");
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}


function _getStorageUsageAnalytics(appId){

  console.log("Get storage usage from Analytics...");

  var deferred = Q.defer();
 
  try{
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
          console.log("Error on Get storage usage from Analytics...");  
          console.log(err);    
          deferred.reject(err);
        }else {    
          console.log("Success on Get storage usage from Analytics...");
          try{
            var respBody = JSON.parse(body);
            deferred.resolve(respBody);
          } catch(e){
            deferred.reject("Data parse error");
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}


function _getApiCountAnalytics(appId){

  console.log("Get api by appId from Analytics...");

  var deferred = Q.defer();
 
  try{
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
          console.log("Error on Get api by appId from Analytics...");  
          console.log(err);     
          deferred.reject(err);
        }else {   
          console.log("Success on Get api by appId from Analytics..."); 
          try{
            var respBody = JSON.parse(body);
            deferred.resolve(respBody);
          } catch(e){
            deferred.reject("Data parse error");
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}

function _getStorageLastRecord(appId){

  console.log("Get last storage record from Analytics..");

  var deferred = Q.defer();
 
  try{
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
          console.log("Error on Get last storage record from Analytics..");   
          console.log(err);  
          deferred.reject(err);
        }else { 
          console.log("Success on Get last storage record from Analytics..");     
          try{
            var respBody = JSON.parse(body);
            deferred.resolve(respBody);
          } catch(e){
            deferred.reject("Data parse error");
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}


function _getBulkApiStorageDetails(appIdArray){

  console.log("get api/storage by appID's from Analytics..");

  var deferred = Q.defer();
 
  try{
    var post_data = {};
    post_data.secureKey = global.keys.secureKey; 
    post_data.appIdArray = appIdArray;   
    post_data = JSON.stringify(post_data);


    var url = global.keys.analyticsServiceUrl +'/bulk/api-storage/count';  
    request.post(url,{
        headers: {
            'content-type': 'application/json',
            'content-length': post_data.length
        },
        body: post_data
    },function(err,response,body){
        if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){ 
          console.log("Error on get api/storage by appID's from Analytics.."); 
          console.log(err);     
          deferred.reject(err);
        }else { 
          console.log("Success on get api/storage by appID's from Analytics..");    
          try{
            var respBody = JSON.parse(body);
            deferred.resolve(respBody);
          } catch(e){
            deferred.reject("Data parse error");
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}