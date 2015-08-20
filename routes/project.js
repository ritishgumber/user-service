var express = require('express');
var app = express();

module.exports = function(controller) {

    // routes
    app.post('/app/create', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId && data){
          controller.createProject(data.name, data.appId,currentUserId).then(function(project) {
              if (!project) {
                  return res.send(400, 'Error : Project not created');
              }
            return res.json(200, project);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    });

    app.get('/app', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        console.log(req.session.cookie.expires);        
        if(currentUserId){
            controller.projectList(currentUserId).then(function(list) {
                if (!list) {
                    return res.send(500, 'Error: Something Went Wrong');
                }
                return res.json(200, list);
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
            controller.projectStatus(req.params.appId).then(function(status) {
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

            controller.editProject(currentUserId,appId,name).then(function(project) {
                if (!project) {
                    return res.send(500, "Error: Project didn't get edited");
                }

                return res.json(200, project);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

     app.get('/app/:appId', function(req,res,next) {
		console.log(req.body);
        //var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id=req.params.appId;
                 
		controller.getProject(id).then(function(project) {
		
            if (!project) {
                 return res.send(500, 'Error: Project not found');
             }
             
             return res.json(200, project);

            },function(error){
                return res.send(500, error);
         });    
    });
    
    app.get('/app/:appId/masterkey', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var id = req.params.appId;
		var key = req.body.key;
        if(key && id){
            controller.getProject(id).then(function(project) {
                if (!project) {
                    return res.send(500, 'Error: Project not found');
                }

                return res.status(200).send(project.keys.master);

            },function(error){
                return res.satus(500).send(error);
            });

        }else{
            return res.send(401);
        }
    });

    app.delete('/app/:appId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

        if(currentUserId){

            controller.delete(req.params.appId, currentUserId).then(function() {
                
                return res.json(200);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });


    return app;

}
