var express = require('express');
var app = express();

module.exports = function(paymentService) {

    // routes
    app.post('/payment/upsert/card', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId && data){            
          paymentService.upsertCreditCard(data.appId,currentUserId,data.stripeToken,data.cardInfo).then(function(cardinfo) {
              if (!cardinfo) {
                  return res.send(400, e);
              }
            return res.json(200, cardinfo);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    });   

    app.get('/payment/get/cardinfo/:appName', function(req,res,next) {
        
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appName=req.params.appName

        if(currentUserId && appName){
          paymentService.findCard(currentUserId).then(function(cardinfo) {
              if (!cardinfo) {
                  return res.send(400, e);
              }
            return res.json(200, cardinfo);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    }); 

    return app;

}
