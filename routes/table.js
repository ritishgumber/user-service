var express = require('express');
var app = express();

module.exports = function(controller) {   

     app.put('/table/create/:projid', function(req,res,next) {

        var currentUserId=req.session.passport.user.id;
        var projectId=req.params.projid;
        var data = req.body || {};                       

        if(currentUserId && projectId && data){

            controller.upsertTable(projectId,data).then(function(done) {
                if (!done) {
                    return res.send(500, e);
                }
                return res.json(200, done);

            },function(error){
                return res.send(500, error);
            });

        }

    });


     app.get('/table/get/:projid', function(req,res,next) {

        var currentUserId=req.session.passport.user.id;
        var projectId=req.params.projid;                          

        if(currentUserId && projectId){

            controller.getTableByProject(projectId).then(function(tables) {
                if (!tables) {
                    return res.send(500, e);
                }
                return res.json(200, tables);

            },function(error){
                return res.send(500, error);
            });

        }

    });

    return app;

}
