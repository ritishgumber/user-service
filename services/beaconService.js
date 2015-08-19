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

    createBeacon: function (userId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        var beacon = new Beacon();
        beacon._userId=userId;

        beacon.firstApp=false;   
        beacon.firstTable=false;
        beacon.firstColumn=false;
        beacon.firstRow=false;
        beacon.tableDesignerLink=false;
        beacon.documentationLink=false;
     
        beacon.save(function (err, beaconObj) {
            if (err) deferred.reject(err);

            if(!beaconObj)
              deferred.reject('Cannot save the beacon right now.');
            else{
              deferred.resolve(beaconObj);
            }
        });

        return deferred.promise;
    },
    getBeaconByUserId: function (userId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Beacon.find({ _userId: userId }, function (err, beaconObj) {
          if (err) deferred.reject(err);
          if(beaconObj && beaconObj.length>0){
            deferred.resolve(beaconObj[0]._doc);
          }else{
            deferred.resolve(null);
          }
               
        });

        return deferred.promise;
    },    
    updateBeacon: function(userId,beaconObj) {

      var deferred = Q.defer();
      var _self = this;

      _self.getBeaconByUserIdAndBeaconId(userId,beaconObj._id)
      .then(function (respBeaconObj) {
       
        respBeaconObj.firstApp=beaconObj.firstApp;   
        respBeaconObj.firstTable=beaconObj.firstTable;
        respBeaconObj.firstColumn=beaconObj.firstColumn;
        respBeaconObj.firstRow=beaconObj.firstRow;
        respBeaconObj.tableDesignerLink=beaconObj.tableDesignerLink;
        respBeaconObj.documentationLink=beaconObj.documentationLink;

        return _self.saveBeaconByObj(respBeaconObj);
      
      }).then(function (savedBeaconObj) {
        deferred.resolve(savedBeaconObj);
      },function(error){
        deferred.reject(error);
      });     

      return deferred.promise;
    },
    getBeaconByUserIdAndBeaconId: function (userId,beaconId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Beacon.findOne({ _id: beaconId,_userId: userId }, function (err, beaconObj) {
          if (err) deferred.reject(err);
          if(beaconObj){
            deferred.resolve(beaconObj);
          }else{
            deferred.reject("No beacon found");
          }
               
        });

        return deferred.promise;
    },
    saveBeaconByObj: function (beaconObj) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        beaconObj.save(function (err, savedBeaconObj) {
          if (err) deferred.reject(err);

          if(!savedBeaconObj)
            deferred.reject('Cannot save the beacon right now.');
          else{
            deferred.resolve(savedBeaconObj);
          }
        });

        return deferred.promise;
    }   

  }

};
