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
              return res.send(400, error);
            });
        	
        }else{
            return res.send(400, "Unauthorized");
        }

    });

    app.get('/analytics/storage/:appId/usage', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.storageUsage(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              return res.send(400, error);
            });
            
        }else{
            return res.send(400, "Unauthorized");
        }

    });

    app.get('/analytics/api/:appId/count', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.apiCount(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              return res.send(400, error);
            });
            
        }else{
            return res.send(400, "Unauthorized");
        }

    });

    app.get('/analytics/storage/:appId/count', function(req,res,next) {

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.storageLastRecord(appId).then(function(result) {                           
              return res.status(200).json(result);
            },function(error){
              return res.send(400, error);
            });
            
        }else{
            return res.send(400, "Unauthorized");
        }

    });

    return app;

}
