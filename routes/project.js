var express = require('express');
var app=express();
var controller = require('../services/projectService');

module.exports = function() {

    // routes
    app.post('/project/create', function(req,res,next) {

        var data = req.body || {};
        var currentUser=req.session.passport.user.id;
        console.log(currentUser);
        if(currentUser && data){
          controller.createProject(data,currentUser,function(e, project) {
              if (e || !project) {
                  return res.send(500, e);
              }
            return res.json(200, project);

          });

        }

    });

    app.get('/project/list', function(req,res,next) {

        var currentUser=req.session.passport.user.id;

        if(currentUser){
            controller.projectList(currentUser,function(e, list) {
                if (e || !list) {
                    return res.send(500, e);
                }
                return res.json(200, list);
            });

        }

    });


    app.put('/project/edit/:id', function(req,res,next) {

        var currentUser=req.session.passport.user.id;
        var id=req.params.id;
        var data = req.body || {};
        var name=data.name;
        var url=data.url;

        if(currentUser && id && data){

            controller.editProject(currentUser,id,name,url,function(e, project) {
                if (e || !project) {
                    return res.send(500, e);
                }

                return res.json(200, project);

            });

        }

    });

    return app;
}
