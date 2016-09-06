var express = require('express');
var app = express();

module.exports = function() {

    //routes  
    app.get('/analytics/api/:appId/usage', function(req,res,next) {

        console.log("Get analytics api usage");

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
            console.log("Unauthorized-Get analytics api usage");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/storage/:appId/usage', function(req,res,next) {

        console.log("Unauthorized-Get analytics storage usage");

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
            console.log("Unauthorized-analytics storage");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/api/:appId/count', function(req,res,next) {

        console.log("Api count");

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.apiCount(appId).then(function(result) {  
               console.log("Successfull-Api count");                         
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting api Count");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-Api count");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    app.get('/analytics/storage/:appId/count', function(req,res,next) {

        console.log("Storage count");
        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            global.userAnalyticService.storageLastRecord(appId).then(function(result) { 
              console.log("Successfull-Storage count");                          
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting storage Usage");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-Storage count");
            return res.send(400, "Unauthorized-User not found");
        }

    });


    app.post('/analytics/api-storage/bulk/count', function(req,res,next) {

        console.log("Bulk Api/Storage count");

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var data = req.body || {};

        if(currentUserId){
            
            global.userAnalyticService.bulkApiStorageDetails(data.appIdArray).then(function(result) { 
              console.log("Successfull-Bulk Api/Storage count");                          
              return res.status(200).json(result);
            },function(error){
              console.log("Error in getting Api-Storage Bulk Usage Details");
              console.log(error);  
              return res.send(400, error);
            });
            
        }else{
            console.log("Unauthorized-Bulk Api/Storage count");
            return res.send(400, "Unauthorized-User not found");
        }

    });

    return app;

}
