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

        dataObj.userId=userId;

        _createSaleInAnalytics(appId,dataObj).then(function(data){
          deferred.resolve(data);
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    }
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
      if(err || response.statusCode === 500 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}
