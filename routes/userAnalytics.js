var express = require('express');
var app = express();

module.exports = function() {

    //routes  
    app.get('/analytics/api/:appId/usage', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
        	
    		global.userAnalyticService.apiUsage(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting api Usage");
              console.log(error);  
              return res.send(400, error);
            });
        	
        }else{
            console.log("Unauthorized-User not found");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/storage/:appId/usage', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.storageUsage(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting storage Usage");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-User not found");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/api/:appId/count', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.apiCount(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting api Count");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-User not found");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/storage/:appId/count', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.storageLastRecord(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting storage Usage");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-User not found");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    return app;

}
