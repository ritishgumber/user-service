var express = require('express');
var app = express();

module.exports = function() {

    app.post('/dbaccess/enable/:appId', function(req,res,next) {
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;
        var appId = req.params.appId
        if(currentUserId && appId){
            global.dbAccessService.createAccessUrl(currentUserId,appId).then(function(data){
                res.status(200).json({success:true,data:data})
            },function(err){
                res.status(400).json({err:err})
            })
        } else {
            res.status(401).send('Unauthorised');
        }
    });

    app.post('/dbaccess/get/:appId', function(req,res,next) {
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;
        var appId = req.params.appId
        if(currentUserId && appId){
            global.dbAccessService.getAccessUrl(currentUserId,appId).then(function(data){
                console.log(data)
                res.status(200).json({"success":true,"data":data})
            },function(err){
                res.status(400).json({err:err})
            })
        } else {
            res.status(401).send('Unauthorised');
        }
    });

    return app;

}
