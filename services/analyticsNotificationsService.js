'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var pricingPlans = require('../config/pricingPlans.js')();

module.exports = function(){

  return {

    updateUserOver80: function (appId,exceededArray) {

        var _self = this;

        var deferred = Q.defer();     

        var project=null;

        global.projectService.getProject(appId).then(function(projectObj){
          project=projectObj;

          var adminUser=_.first(_.where(project.developers, {role:"Admin"}));
          return global.userService.getAccountById(adminUser.userId);
          
        }).then(function(userObj){

          var presentPlan=_.first(_.where(pricingPlans.plans, {id: project.planId}));

          var notificationType="payment";
          var type="upgrade-app";
          var text="Your app <span style='font-weight:bold;'>"+project.name+"</span> has reached 80% of its current plan. Upgrade to next plan now.";
          global.notificationService.createNotification(appId,userObj._id,notificationType,type,text);
           
          global.mandrillService.over80Limit(userObj.name,userObj.email,project.name,presentPlan.planName);

          deferred.resolve({message:"success"});
          
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },
    updateUserOver100: function (appId,details) {

        var _self = this;

        var deferred = Q.defer();     

        var project=null;

        global.projectService.getProject(appId).then(function(projectObj){
          project=projectObj;

          var adminUser=_.first(_.where(project.developers, {role:"Admin"}));
          return global.userService.getAccountById(adminUser.userId);
          
        }).then(function(userObj){

          var presentPlan=_.first(_.where(pricingPlans.plans, {id: project.planId}));

          var notificationType="payment";
          var type="upgrade-app";
          var text="Your app <span style='font-weight:bold;'>"+project.name+"</span> has been over the limit of its current plan. Upgrade to next plan now.";
          global.notificationService.createNotification(appId,userObj._id,notificationType,type,text);
           
          global.mandrillService.over100Limit(userObj.name,userObj.email,project.name,presentPlan.planName);

          deferred.resolve({message:"success"});
          
        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    } 

  }

};
