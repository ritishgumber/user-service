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

  subscription.create = function(hookData, callback) {
    // TODO
    this.hookData = hookData; // fake
    callback();
  };

  subscription.get = function(criteria, callback) {
    // TODO
    callback(null, this.hookData); // fake
  };

      
  return subscription;

};
