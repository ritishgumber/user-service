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

    return app;
}
