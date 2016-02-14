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
        notification.timestamp=new Date().getTime();
     
        notification.save(function (err, notificationObj) {
            if (err) deferred.reject(err);

            if(!notificationObj)
              deferred.reject('Cannot save the notification right now.');
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

        Notification.find({user:userId}).sort({timestamp:-1}).skip(skip).limit(limit).exec(function (err, notificatonList) {      
          if (err) {
            deferred.reject(err);
          }
          if(notificatonList && notificatonList.length>0){
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

        Notification.find({user:userId,seen:false},function (err, list) {
          if (err) deferred.reject(err);
          if(list && list.length>0){

            for(var i=0;i<list.length;++i){
              list[i].seen=true;
              list[i].save();
            }

            deferred.resolve({message:"success"});
          }else{
            deferred.resolve(null);
          }               
        });


        return deferred.promise;
    },
    removeNotificationById: function(notifyId){
      var deferred = Q.defer();
      Notification.remove({_id:notifyId}, function (err) {
        if(err){          
          deferred.reject(err);
        }else{
          deferred.resolve({message:"Success."});
        }
      });
      return deferred.promise;
    }

  }

};
