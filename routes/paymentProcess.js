var express = require('express');
var app = express();

module.exports = function() {

    //routes  
    app.post('/payment/card', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
        	
    		global.paymentProcessService.upsertCard(currentUserId,data).then(function(beaconObj) {
              if (!beaconObj) {
                return res.send(400, 'Error : Went wrong not found');
              }	              
              return res.status(200).json(beaconObj);

            },function(error){
              return res.send(400, error);
            });
        	
        }else{
            return res.send(400, "Unauthorized");
        }

    });

    return app;

}
