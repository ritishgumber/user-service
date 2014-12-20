var express = require('express');
var app=express();
var controller = require('../services/projectService');

module.exports = function() {

    // routes
    app.post('/project/create', function(req,res,next) {

        var data = req.body || {};
        var currentUserId=req.sessionID;
        if(currentUserId && data){

          controller.createProject(data,currentUserId,function(e, project) {
              if (e || !project) {
                  return res.send(500, e);
              }
            return res.json(200, project);

          });

        }

    });

    app.get('/project/list', function(req,res,next) {

        var currentUserId=req.sessionID;
        
        if(currentUserId){

            controller.projectList(currentUserId,function(e, list) {
                if (e || !list) {
                    return res.send(500, e);
                }

                return res.json(200, list);

            });

        }

    });


    app.put('/project/edit/:id/:name/:url', function(req,res,next) {

        var currentUserId=req.sessionID;
        var id=req.params.id;
        var name=req.params.name;
        var url=req.params.url;

        if(currentUserId){

            controller.editProject(currentUserId,id,name,url,function(e, project) {
                if (e || !project) {
                    return res.send(500, e);
                }

                return res.json(200, project);

            });

        }

    });

    return app;
}
