var express = require('express');
var app = express();

module.exports = function(controller) {   

     app.put('/table/create/:appId', function(req,res,next) {

         var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;
        var data = req.body || {};                       

        if(currentUserId && projectId && data){

            controller.upsertTable(projectId,data).then(function(done) {
                if (!done) {
                    return res.send(500);
                }

                return res.json(200, done);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

     app.put('/table/delete/:appId', function(req,res,next) {

         var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;
        var name = req.body.name || {};                       

        if(currentUserId && projectId && name){

            controller.deleteTable(projectId,name).then(function() {                

                return res.json(200);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });


    app.get('/table/get/:appId', function(req,res,next) {

         var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;                          

        if(currentUserId && projectId){

            controller.getTablesByProject(projectId).then(function(tables) {
                return res.json(200, tables);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    app.get('/table/:tableId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var tableId=req.params.tableId;                          

        if(currentUserId && tableId){

            controller.getTableByTableId(tableId).then(function(table) {
                return res.json(200, table);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    return app;

}
