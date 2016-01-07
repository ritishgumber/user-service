var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.get('/cloudboost/isNewServer', function(req,res,next) {       
                        
		global.userService.isNewServer().then(function(isNew) {            
            return res.status(200).send(isNew);
        },function(error){
            return res.send(500, error);
        });    
    });


    app.get('/cloudboost', function(req,res,next) {       
                        
		global.cbServerService.getSettings().then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });    
    
    app.post('/cloudboost', function(req,res,next) {       
        var data = req.body || {};
                        
		global.cbServerService.upsertSettings(data.id,data.allowedSignUp).then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });

    app.post('/cloudboost/url', function(req,res,next) {       
        var data = req.body || {};

        global.cbServerService.upsertAPI_URL(data.apiURL).then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });

    return app;

}
