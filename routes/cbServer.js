var express = require('express');
var app = express();

module.exports = function() {

    //routes
    app.get('/server/isNewServer', function(req,res,next) {       
        
        console.log("isNewServer check");                
		global.userService.isNewServer().then(function(isNew) {  
            console.log("Successful on isNewServer check");          
            return res.status(200).send(isNew);
        },function(error){
            console.log("Error on isNewServer check");
            return res.send(500, error);
        });    
    });


    app.get('/server', function(req,res,next) {       
        console.log("Getting server settings");                
		global.cbServerService.getSettings().then(function(settings) { 
            console.log("Successfull Getting server settings");           
            return res.status(200).json(settings);
        },function(error){
            console.log("Error Getting server settings");
            return res.send(500, error);
        });    
    });    
    
    app.post('/server', function(req,res,next) { 
        console.log("Upsert server settings"); 

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

		global.cbServerService.upsertSettings(currentUserId,data.id,data.allowedSignUp).then(function(settings) {  
            console.log("Successfull Upsert server settings");           
            return res.status(200).json(settings);
        },function(error){
            console.log("Error Upsert server settings"); 
            return res.send(500, error);
        });    
    });

    app.post('/server/url', function(req,res,next) {  
        console.log("Upsert API URL");   

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        global.cbServerService.upsertAPI_URL(currentUserId,data.apiURL).then(function(settings) {  
            console.log("Successfull Upsert API URL");           
            return res.status(200).json(settings);
        },function(error){
             console.log("Error Upsert API URL"); 
            return res.send(500, error);
        });    
    });

    //know server isHosted?
    app.get('/server/isHosted',function(req,res){
        console.log("isHosted server check"); 

        global.cbServerService.isHosted().then(function(settings) {  
            console.log("Successfull isHosted server check");          
            return res.status(200).send(settings);
        },function(error){ 
            console.log("Error isHosted server check");           
            return res.status(500).send(error);
        });       

    });

    return app;

}
