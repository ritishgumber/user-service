var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.get('/notification/:skip/:limit', function(req,res,next) {
	   
       console.log("Get notification by skipLimit");

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var skip=req.params.skip;
        var limit=req.params.limit;
        
        if(currentUserId){                
    		global.notificationService.getNotifications(currentUserId, skip,limit).then(function(list) {
                console.log("Successfull Get notification by skipLimit");             
                return res.status(200).json(list);
            },function(error){ 
                console.log("Error Get notification by skipLimit");               
                return res.status(400).send(error);
            });
        }else{
            console.log("Unauthorized Get notification by skipLimit");
            return res.send(401);
        }    
    });

    app.get('/notification/seen', function(req,res,next) {
    
        console.log("notification seen");

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        
        if(currentUserId){                
            global.notificationService.updateNotificationsSeen(currentUserId).then(function(list) { 
                console.log("Successfull notification seen");            
                return res.status(200).json(list);
            },function(error){ 
                console.log("error notification seen");               
                return res.status(400).send(error);
            });
        }else{
            console.log("Unathorized notification seen");
            return res.send(401);
        }    
    }); 

    app.delete('/notification/:id', function(req,res,next) {
    
        console.log("delete notification");

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var notifyId=req.params.id;
        
        if(currentUserId){                
            global.notificationService.removeNotificationById(notifyId).then(function(resp) { 
                 console.log("Successfull delete notification");           
                return res.status(200).json(resp);
            },function(error){
                console.log("Error delete notification");                
                return res.status(400).send(error);
            });
        }else{
            console.log("Unathorized delete notification");
            return res.send(401);
        }    
    });  

    return app;

}
