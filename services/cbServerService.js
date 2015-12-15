'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(CbServer){

  return {  

    getSettings: function () {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        CbServer.findOne({}, function (err, cbServerSettings) {
          if (err) deferred.reject(err);
          if(cbServerSettings){
            deferred.resolve(cbServerSettings);
          }else{
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    },

    upsertSettings: function (id,allowSignUp) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        CbServer.findOneAndUpdate({_id:id},{$set: {allowSignUp:allowSignUp }},{upsert: true, 'new': true}, function (err, cbServerSettings) {
          if (err) deferred.reject(err);
          if(cbServerSettings){
            deferred.resolve(cbServerSettings);
          }else{
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    } 

  }

};

