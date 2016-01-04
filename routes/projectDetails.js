var express = require('express');
var app = express();

module.exports = function() {

    // routes
    app.put('/app/:appId/details', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId && data){
          global.projectDetailsService.saveProjectDetails(data,currentUserId).then(function(projectDet) {
              if (!projectDet) {
                  return res.send(400, "Error: Settings not saved");
              }
            return res.json(200, projectDet);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    });   

    app.get('/app/:appId/details', function(req,res,next) {
        
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId=req.params.appId;

        if(currentUserId && appId){
          global.projectDetailsService.getProjectDetails(currentUserId,appId).then(function(projectDet) {
              if (!projectDet) {
                  return res.send(200, null);
              }
            return res.json(200, projectDet);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    }); 

    return app;

}
