var express = require('express');
var app = express();

module.exports = function(controller) {

    // routes
    app.post('/project/create', function(req,res,next) {

        var data = req.body || {};
        var currentUserId=req.session.passport.user.id;
        if(currentUserId && data){
          controller.createProject(data,currentUserId).then(function(project) {
              if (!project) {
                  return res.send(400, e);
              }
            return res.json(200, project);

          },function(error){
            return res.send(400, error);
          });

        }

    });

    app.get('/project/list', function(req,res,next) {

        var currentUserId=req.session.passport.user.id;

        if(currentUserId){
            controller.projectList(currentUserId).then(function(list) {
                if (!list) {
                    return res.send(500, e);
                }
                return res.json(200, list);
            },function(error){
                return res.send(500, error);
            });

        }

    });


    app.put('/project/edit/:id', function(req,res,next) {

        var currentUserId=req.session.passport.user.id;
        var id=req.params.id;
        var data = req.body || {};
        var name=data.name;
        var url=data.url;

        if(currentUserId && id && data){

            controller.editProject(currentUserId,id,name,url).then(function(project) {
                if (!project) {
                    return res.send(500, e);
                }

                return res.json(200, project);

            },function(error){
                return res.send(500, error);
            });

        }

    });

     app.get('/project/get/:id', function(req,res,next) {

        var currentUserId=req.session.passport.user.id;
        var id=req.params.id;                

        if(currentUserId && id){

            controller.getProject(id).then(function(project) {
                if (!project) {
                    return res.send(500, e);
                }

                return res.json(200, project);

            },function(error){
                return res.send(500, error);
            });

        }

    });

    return app;

}
