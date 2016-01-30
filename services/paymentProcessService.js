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

        return deferred.promise;
    }
  }   

};
