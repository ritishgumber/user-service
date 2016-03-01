var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.get('/server/isNewServer', function(req,res,next) {       
                        
		global.userService.isNewServer().then(function(isNew) {            
            return res.status(200).send(isNew);
        },function(error){
            return res.send(500, error);
        });    
    });


    app.get('/server', function(req,res,next) {       
                        
		global.cbServerService.getSettings().then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });    
    
    app.post('/server', function(req,res,next) {       
        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

		global.cbServerService.upsertSettings(currentUserId,data.id,data.allowedSignUp).then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });

    app.post('/server/url', function(req,res,next) {       
        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        global.cbServerService.upsertAPI_URL(currentUserId,data.apiURL).then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });

    //know server isHosted?
    app.get('/server/isHosted',function(req,res){

        global.cbServerService.isHosted().then(function(settings) {            
            return res.status(200).send(settings);
        },function(error){            
            return res.status(500).send(error);
        });       

    });

    return app;

}
