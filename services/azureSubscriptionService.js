'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(AzureSubscription){

  var subscription={};

  subscription.create = function(hookData) {   

    console.log("Create Azure Subscription..");

    var _self = this;

    var deferred = Q.defer();

    try{     

      var subscription = new AzureSubscription();
      subscription.subscription_id=hookData.subscription_id;
      subscription.email=hookData.email;
      subscription.optin=hookData.optin;

      subscription.save(function (err, doc) {
        if (err){ 
          console.log("Error on Create Azure subscription..");
          deferred.reject(err);
        }
        if(!doc){
          console.log("Cannot save the azure subscription right now.");
          deferred.reject('Cannot save the azure subscription right now.');
        }
        else{
          console.log("Successfully created the azure subscription");
          deferred.resolve(doc);
        }
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
  };

  subscription.get = function(criteria) {
    console.log("Get Azure Subscription..");

    var _self = this;

    var deferred = Q.defer();

    try{
      var self = this;

      AzureSubscription.findOne(criteria, function (err, doc) {
        if (err){ 
          console.log("Error get Azure subscription");
          deferred.reject(err);
        }  
        if(doc){
           console.log("Successfully get Azure subscription");
          deferred.resolve(doc);
        }else{
          console.log("Azure subscription not found");
          deferred.resolve(null);
        }
             
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
  };

      
  return subscription;

};
