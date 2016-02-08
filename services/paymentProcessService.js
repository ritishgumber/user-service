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

    createSale: function (userId,appId,dataObj) {

        var _self = this;

        var deferred = Q.defer();  

        global.userService.getAccountById(userId).then(function(userObj){

          dataObj.userId=userId;
          dataObj.userEmail=userObj.email;
          return _createSaleInAnalytics(appId,dataObj); 

        }).then(function(data){  

          //Update Project with PlanId
          return global.projectService.updatePlanByAppId(appId,data.planId); 

        }).then(function(updatedProject){
          deferred.resolve(updatedProject);
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },
    stopRecurring: function (appId,userId) {

        var _self = this;

        var deferred = Q.defer();          

        _stopRecurringInAnalytics(appId,userId).then(function(response){
         
          return global.projectService.updatePlanByAppId(appId,1);          

        }).then(function(updatedProject){
          deferred.resolve({"message":"Success"});
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },
  }   

};


/***********************Pinging Analytics Services*********************************/

function _createSaleInAnalytics(appId,dataObj){
  var deferred = Q.defer(); 
  
  dataObj.secureKey = global.keys.secureKey; 
  dataObj = JSON.stringify(dataObj);


  var url = global.keys.analyticsServiceUrl + '/'+appId+'/sale';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': dataObj.length
      },
      body: dataObj
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

function _stopRecurringInAnalytics(appId,userId){
  var deferred = Q.defer(); 
  
  var dataObj={};
  dataObj.secureKey = global.keys.secureKey; 
  dataObj.userId = userId;
  dataObj = JSON.stringify(dataObj);

  var url = global.keys.analyticsServiceUrl + '/'+appId+'/cancel'; 

  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': dataObj.length
      },
      body: dataObj
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
