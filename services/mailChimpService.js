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

    addSubscriber: function (listId,email) {

      var deferred = Q.defer();

        var post_data = {};
        post_data.email_address=email;
        post_data.status='subscribed';         
        
        var url="https://us10.api.mailchimp.com/3.0/lists/"+listId+"/members"

        request({
          url: url,   
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',         
          },
          json: post_data,
          auth:{
            "username":"cloudboost",
            "password":keys.mailchimpApiKey
          }
        }, function(error, response, body){
          if(error || response.statusCode==400 || response.statusCode==500) {
            deferred.reject(error);
          } else {
            deferred.resolve(body);
          }
        });

      return deferred.promise;
    }    

  }

};
