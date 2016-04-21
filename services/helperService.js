'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Beacon){

  return {

    convertToPlainJSON: function (obj) {    

      try{
        return obj=JSON.parse(JSON.stringify(obj));    
      }catch(err){  
        global.winston.log('error',{"error":String(err),"stack": new Error().stack});
        return obj;
      }       
    },
    copyObject: function (obj) { 
      try{
        return Object.assign({}, obj);
      }catch(err){  
        global.winston.log('error',{"error":String(err),"stack": new Error().stack});
        return obj;
      }    
    }

  }

};
