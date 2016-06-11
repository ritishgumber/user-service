'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(AzureResource){

  var tenants={};

  tenants.create = function(tenant, callback) {
    // TODO
    this.tenant = tenant; // fake
    callback(null, tenant);
  };

  tenants.getBy = function(criteria, callback) {
    // TODO
    callback(null, this.tenant ? [this.tenant] : null);
  };

  tenants.removeBy = function(criteria, callback) {
    // TODO
    callback();
  };

  tenants.disableBy = function(criteria, callback) {
    // TODO
    callback();
  };

  tenants.enableBy = function(criteria, callback) {
    // TODO
    callback();
  };

  tenants.get = function(slug, callback) {
    // TODO
    callback(null, this.tenant);
  };

  tenants.remove = function(slug, callback) {
    // TODO
    callback();
  };

  tenants.getNextAvailable = function(slug, callback) {
    // TODO
    callback(null, 'slug');
  };

      
  return tenants;

};
