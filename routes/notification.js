var express = require('express');
var app = express();

module.exports = function(NotificationService) {

    //routes
    app.get('/notification/:skip/:limit', function(req,res,next) {
	
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var skip=req.params.skip;
        var limit=req.params.limit;
        
        if(currentUserId){                
    		NotificationService.getNotifications(currentUserId,skip,limit).then(function(list) {            
                return res.status(200).json(list);
            },function(error){
                return res.status(400).send(error);
            });
        }else{
            return res.send(401);
        }    
    });

    app.get('/notification/seen', function(req,res,next) {
    
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        
        if(currentUserId){                
            NotificationService.updateNotificationsSeen(currentUserId).then(function(list) {            
                return res.status(200).json(list);
            },function(error){                
                return res.status(400).send(error);
            });
        }else{
            return res.send(401);
        }    
    });   

    return app;

}
