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

    createSale: function (userId,appId,dataObj) {

        var _self = this;

        var deferred = Q.defer();  

        var user=null;
        var saleDocument;

        global.userService.getAccountById(userId).then(function(userObj){
          user=userObj;

          dataObj.userId=userId;
          dataObj.userEmail=userObj.email;
          return _createSaleInAnalytics(appId,dataObj); 

        }).then(function(data){  
          saleDocument=data;
          //Update Project with PlanId
          return global.projectService.updatePlanByAppId(appId,data.planId); 

        }).then(function(updatedProject){
          deferred.resolve(updatedProject);

          var notificationType="inform";
          var type="app-upgraded";
          var text="Your app <span style='font-weight:bold;'>"+updatedProject.name+"</span> has been upgraded to <span style='font-weight:bold;'>"+saleDocument.planName+"</span>.";
          global.notificationService.createNotification(appId,user._id,notificationType,type,text);
          global.mandrillService.changePlan(user.name,user.email,updatedProject.name,saleDocument.planName); 

        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },
    stopRecurring: function (appId,userId) {

        var _self = this;

        var deferred = Q.defer(); 
        var project=null;

        global.projectService.getProject(appId).then(function(projectObj){

          project=projectObj;

          return _stopRecurringInAnalytics(appId,userId);

        }).then(function(response){
         
          return global.projectService.updatePlanByAppId(appId,1);          

        }).then(function(updatedProject){

          deferred.resolve({"message":"Success"});


          global.userService.getAccountById(userId).then(function(userObj){

            var previousPlan=_.first(_.where(pricingPlans.plans, {id: project.planId}));

            var notificationType="inform";
            var type="app-payment-stopped";
            var text="Your app <span style='font-weight:bold;'>"+updatedProject.name+"</span> has been cancelled for the <span style='font-weight:bold;'>"+previousPlan.planName+"</span>.";
            global.notificationService.createNotification(appId,userObj._id,notificationType,type,text);
            global.mandrillService.cancelPlan(userObj.name,userObj.email,updatedProject.name,previousPlan.planName);

          },function(error){
            console.log("Error in getting User details after cancelling Plan");
          });  
          

        },function(error){
          deferred.reject(error);
        });

        return deferred.promise;
    },
  }   

};


/***********************Pinging Analytics Services*********************************/

function _createSaleInAnalytics(appId,dataObj){
  var deferred = Q.defer(); 
  
  dataObj.secureKey = global.keys.secureKey; 
  dataObj = JSON.stringify(dataObj);


  var url = global.keys.analyticsServiceUrl + '/'+appId+'/sale';  
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': dataObj.length
      },
      body: dataObj
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}

function _stopRecurringInAnalytics(appId,userId){
  var deferred = Q.defer(); 
  
  var dataObj={};
  dataObj.secureKey = global.keys.secureKey; 
  dataObj.userId = userId;
  dataObj = JSON.stringify(dataObj);

  var url = global.keys.analyticsServiceUrl + '/'+appId+'/cancel'; 

  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': dataObj.length
      },
      body: dataObj
  },function(err,response,body){
      if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){       
        deferred.reject(err);
      }else {    
        var respBody=JSON.parse(body);
        deferred.resolve(respBody);
      }
  });

  return deferred.promise;
}
