'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Tutorial){

  return {

    getTutorialList: function () {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Tutorial.find({},null,{sort: {"order": 1}},function (err, tutorial) {
          if (err) deferred.reject(err);
          if(tutorial && tutorial.length>0){
            deferred.resolve(tutorial);
          }else{            
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    },
    getTutorialById: function (tutorialDocId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        /*Tutorial.findOne({tutorials::{"$in":[id:tutorialDocId]}}, function (err, tutorial) {
          if (err) deferred.reject(err);
          if(tutorial){
            deferred.resolve(tutorial);
          }else{
            deferred.resolve(null);
          }               
        });*/

        return deferred.promise;
    }   

  }

};
