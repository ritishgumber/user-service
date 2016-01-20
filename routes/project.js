var express = require('express');
var app = express();

module.exports = function() {

    // routes
    app.post('/app/create', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;
       
        if(currentUserId && data){   
            console.log("STEP1: Hola Nawaz, Just now App Create route connected!");         
          global.projectService.createProject(data.name,currentUserId).then(function(project) {
              if (!project) {         
                   console.log("STEP9:About to send 400 error");            
                  return res.status(400).send('Error : Project not created'); 
              }            
              console.log("STEP9:About to send success msg back.");
            return res.status(200).json(project._doc);

          },function(error){    
            console.log("STEP9:About to send 500 error");        
            return res.status(500).send(error); 
          });

        }else{
            console.log("STEP1:About to send 401 Unauthorised");
            return res.status(401).send("Unauthorised");
        }

    });

    app.get('/app', function(req,res,next) { 

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
              
        if(currentUserId){
            global.projectService.projectList(currentUserId).then(function(list) {
                if (!list) {
                    return res.send(500, 'Error: Something Went Wrong');
                }               
                return res.status(200).json(list);
            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    app.get('/:appId/status', function(req,res,next) {

       var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

        if(currentUserId && req.params.appId){
            global.projectService.projectStatus(req.params.appId).then(function(status) {
                return res.json(200, status);
            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });


    app.put('/app/:appId', function(req,res,next) {

       var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId=req.params.appId;
        var data = req.body || {};
        var name=data.name;       

        if(currentUserId && appId && data){

            global.projectService.editProject(currentUserId,appId,name).then(function(project) {
                if (!project) {                    
                    return res.status(500).send("Error: Project didn't get edited");  
                }               
                return res.status(200).json(project);

            },function(error){ 
                return res.status(500).send(error);    
            });

        }else{
            return res.send(401);
        }

    });

    app.get('/app/:appId', function(req,res,next) {
		//console.log(req.body);
        //var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id=req.params.appId;
                 
		global.projectService.getProject(id).then(function(project) {
		
            if (!project) {
                 return res.send(500, 'Error: Project not found');
            }             
            
            return res.status(200).json(project);

        },function(error){                
            return res.status(500).send(error);  
        });    
    });
    
    app.get('/app/:appId/masterkey', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id = req.params.appId;
		var key = req.body.key;
        if(key && id){
            global.projectService.getProject(id).then(function(project) {
                if (!project) {
                    return res.send(500, 'Error: Project not found');
                }

                return res.status(200).send(project.keys.master);

            },function(error){
                return res.status(500).send(error);
            });

        }else{
            return res.send(401);
        }
    });

    app.get('/app/:appId/change/masterkey', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id = req.params.appId;
        
        if(currentUserId && id){
            global.projectService.changeAppMasterKey(currentUserId,id).then(function(project) {
                if (!project) {
                    return res.send(400, 'Error: Project not found');
                }

                return res.status(200).send(project.keys.master);

            },function(error){
                return res.status(400).send(error);
            });

        }else{
            return res.send(401);
        }
    });

    app.get('/app/:appId/change/clientkey', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id = req.params.appId;
       
        if(currentUserId && id){
            global.projectService.changeAppClientKey(currentUserId,id).then(function(project) {
                if (!project) {
                    return res.send(400, 'Error: Project not found');
                }

                return res.status(200).send(project.keys.js);

            },function(error){
                return res.status(400).send(error);
            });

        }else{
            return res.send(401);
        }
    });

    app.delete('/app/:appId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        if(currentUserId){

            global.projectService.delete(req.params.appId, currentUserId).then(function() {                
                 
                return res.status(200).json({});                              

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.status(401).send("unauthorized");
        }

    });

    app.delete('/app/:appId/removedeveloper/:userId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        var appId = req.params.appId;
        var userId = req.params.userId;

        if(currentUserId && appId && userId){

            global.projectService.removeDeveloper(currentUserId,appId, userId).then(function(project) {                
                 
                return res.status(200).json(project);                              

            },function(error){
                return res.status(400).send(error);
            });

        }else{
            return res.status(401).send("unauthorized");
        }

    });

    app.post('/app/:appId/removeinvitee', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        var appId = req.params.appId;
        var data = req.body || {};

        if(currentUserId && appId && data.email){

            global.projectService.removeInvitee(currentUserId,appId, data.email).then(function(project) {                
                 
                return res.status(200).json(project);                              

            },function(error){                
                return res.status(400).send(error);
            });

        }else{
            return res.status(401).send("unauthorized");
        }

    });

    app.post('/app/:appId/invite', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId = req.params.appId;        
        var data = req.body || {};
        
        if(currentUserId && appId && data.email){
            
            global.projectService.inviteUser(appId,data.email).then(function(response) {
                if (!response) {
                    return res.send(400, 'Error: Project not found');
                }
                return res.status(200).send(response);

            },function(error){
                return res.status(400).send(error);
            });
                       

        }else{
            return res.send(401);            
        }
    });

    app.get('/app/:appId/adddeveloper/:email', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId = req.params.appId;
        var email = req.params.email;
        
        if(currentUserId && appId && email){
            global.projectService.addDeveloper(currentUserId,appId,email).then(function(project) {
                if (!project) {
                    return res.send(400, 'Error: Project not found');
                }

                return res.status(200).json(project);

            },function(error){
            });

        }else{
            return res.send(401);
        }
    });

    app.post('/app/changerole', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var data = req.body || {};
        var appId = data.appId;
        var userId = data.userId;
        var role = data.role;
        
        if(currentUserId){
            if(appId && userId && role){
                global.projectService.changeDeveloperRole(currentUserId,appId,userId,role).then(function(project) {
                if (!project) {
                        return res.send(400, 'Error: Cannot Perform this task now');
                    }

                    return res.status(200).json(project);

                },function(error){
                    return res.status(400).send(error);
                });
            }else{
                return res.status(400).send("AppId and UserId are not provided!");
            }            

        }else{
            return res.send(401);
        }
    });

    return app;

}
