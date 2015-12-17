var express = require('express');
var app = express();

module.exports = function(NotificationService) {

    //routes
    app.get('/notification', function(req,res,next) {
	
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        
        if(currentUserId){                
    		NotificationService.getNotifications(currentUserId).then(function(list) {            
                return res.status(200).json(list);
            },function(error){
                return res.send(500, error);
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
                return res.send(500, error);
            });
        }else{
            return res.send(401);
        }    
    });   

    return app;

}
