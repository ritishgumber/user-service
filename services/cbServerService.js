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

        _Settings.findOneAndUpdate({_id:id},{$set: {allowSignUp:allowSignUp }},{upsert: true, 'new': true}, function (err, cbServerSettings) {
          if (err) deferred.reject(err);
          if(cbServerSettings){
            deferred.resolve(cbServerSettings);
          }else{
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    },
    upsertAPI_URL: function (apiURL) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        _Settings.findOne({},function (err, settingsFound) {
          if (err) deferred.reject(err);
          if(settingsFound){            
            settingsFound.myURL=apiURL;
            settingsFound.save(function (err,savedSettings) {
              if (err) deferred.reject(err);
              else deferred.resolve(savedSettings);
            });
          }else{
            deferred.reject("Document not found!");
          }
               
        });

        return deferred.promise;
    }  

  }

};

