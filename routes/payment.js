var express = require('express');
var app = express();

module.exports = function(paymentService) {

    // routes
    app.put('/user/card', function(req,res,next) {

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId && data){            
          paymentService.upsertCreditCard(currentUserId,data.stripeResponse.id,data.cardInfo).then(function(cardinfo) {
              if (!cardinfo) {
                return res.send(400, "Error: Something went wrong");
              }
            return res.json(200, cardinfo);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    });   

    app.get('/user/card', function(req,res,next) {
        
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        

        if(currentUserId){
          paymentService.findCard(currentUserId).then(function(cardinfo) {
              if (!cardinfo) {
                return res.send(200, null);
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
