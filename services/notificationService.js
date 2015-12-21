'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Notification){

  return {

    createNotification: function (appId,email,notificationType,type,text) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        var notification = new Notification();        

        notification.user=email;   
        notification.appId=appId;
        notification.notificationType=notificationType;
        notification.type=type;
        notification.text=text;
        notification.seen=false;
        notification.date=new Date();
     
        notification.save(function (err, notificationObj) {
            if (err) deferred.reject(err);

            if(!notificationObj)
              deferred.reject('Cannot save the beacon right now.');
            else{
              deferred.resolve(notificationObj);
            }
        });

        return deferred.promise;
    },
    getNotifications: function (userId,skip,limit) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Notification.find({user:userId}).skip(skip).limit(limit).exec(function (err, notificatonList) {      
          if (err) deferred.reject(err);
          if(notificatonList){
            deferred.resolve(notificatonList);
          }else{
            deferred.resolve(null);
          }
               
        });
       

        return deferred.promise;
    },
    linkUserId: function (email,userId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Notification.findOneAndUpdate({user:email},{ $set: { user:userId}},{new:true},function (err, savedNotification) {
          if (err) deferred.reject(err);
          if(savedNotification){
            deferred.resolve(savedNotification);
          }else{
            deferred.resolve(null);
          }
               
        });       

        return deferred.promise;
    },
    updateNotificationsSeen: function (userId) {

        var _self = this;

        var deferred = Q.defer();

        var self = this;

        Notification.findOneAndUpdate({user:userId},{ $set: { seen:true}},{new:true},function (err, savedNotification) {
          if (err) deferred.reject(err);
          if(savedNotification){
            deferred.resolve(savedNotification);
          }else{
            deferred.resolve(null);
          }
               
        });       

        return deferred.promise;
    },
    removeNotificationByAppId: function(appId){
      var deferred = Q.defer();
      Notification.remove({appId:appId}, function (err) {
        if(err){          
          deferred.reject(err);
        }else{
          deferred.reject("Success!");
        }
      });
      return deferred.promise;
    }

  }

};
