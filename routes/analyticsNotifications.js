var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.post('/:appId/notifications/over80', function(req,res,next) {	
        
        var appId=req.params.appId;                     
		var data = req.body || {};
		
		if(data && data.secureKey==global.keys.secureKey){
	        global.analyticsNotificationsService.updateUserOver80(appId,data.exceeded80).then(function(resp) {            
	            return res.status(200).json(resp);
	        },function(error){            
	            return res.status(400).send(error);
	        });

        }else{           
            return res.status(400).send("Unauthorized");
        }    
           
    }); 

    app.post('/:appId/notifications/over100', function(req,res,next) {	
        
        var appId=req.params.appId;                     
		var data = req.body || {};
		
		if(data && data.secureKey==global.keys.secureKey){
	        global.analyticsNotificationsService.updateUserOver100(appId,data.details).then(function(resp) {            
	            return res.status(200).json(resp);
	        },function(error){            
	            return res.status(400).send(error);
	        });

        }else{           
            return res.status(400).send("Unauthorized");
        }    
           
    });  

    return app;

}
