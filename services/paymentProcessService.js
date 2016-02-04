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

    upsertCard: function (userId,cardObj) {

        var _self = this;

        var deferred = Q.defer();  

        _sendToAnalytics(cardObj);

        deferred.resolve("Yes");

        return deferred.promise;
    }
  }   

};


/***********************Pinging Analytics Services*********************************/

function _sendToAnalytics(card){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;
  post_data.card = card;
  post_data = JSON.stringify(post_data);


  var url = global.keys.analyticsServiceUrl + '/app';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
  	console.log(err);
  	console.log(body);

      if(err || response.statusCode === 500 || body === 'Error'){       
        deferred.reject(err);
      }else {                               
        deferred.resolve(body);
      }
  });

  return deferred.promise;
}
