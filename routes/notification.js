var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.get('/notification/:skip/:limit', function(req,res,next) {
	
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var skip=req.params.skip;
        var limit=req.params.limit;
        
        if(currentUserId){                
    		global.notificationService.getNotifications(currentUserId,skip,limit).then(function(list) {            
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
            global.notificationService.updateNotificationsSeen(currentUserId).then(function(list) {            
                return res.status(200).json(list);
            },function(error){                
                return res.status(400).send(error);
            });
        }else{
            return res.send(401);
        }    
    }); 

    app.delete('/notification/:id', function(req,res,next) {
    
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var notifyId=req.params.id;
        
        if(currentUserId){                
            global.notificationService.removeNotificationById(notifyId).then(function(resp) {            
                return res.status(200).json(resp);
            },function(error){                
                return res.status(400).send(error);
            });
        }else{
            return res.send(401);
        }    
    });  

    return app;

}
