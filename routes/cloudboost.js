var express = require('express');
var app = express();

module.exports = function(CbServerService,UserService) {

    //routes
    app.get('/cloudboost/isNewServer', function(req,res,next) {       
                        
		UserService.isNewServer().then(function(isNew) {            
            return res.status(200).send(isNew);
        },function(error){
            return res.send(500, error);
        });    
    });


    app.get('/cloudboost', function(req,res,next) {       
                        
		CbServerService.getSettings().then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });    
    
    app.post('/cloudboost', function(req,res,next) {       
        var data = req.body || {};
                        
		CbServerService.upsertSettings(data.id,data.allowedSignUp).then(function(settings) {            
            return res.status(200).json(settings);
        },function(error){
            return res.send(500, error);
        });    
    });

    return app;

}
