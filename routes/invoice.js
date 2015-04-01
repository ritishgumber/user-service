var express = require('express');
var app = express();

module.exports = function(invoiceService) {

    // routes
    app.get('/invoice/get/:appId', function(req,res,next) {
        
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId=req.params.appId;

        if(currentUserId && appId){
          invoiceService.getInvoice(currentUserId,appId).then(function(invoice) {
              if (!invoice) {
                  return res.send(400, e);
              }
            return res.json(200, invoice);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    }); 

    app.get('/invoice/get/settings/:appId', function(req,res,next) {
        
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId=req.params.appId;

        if(currentUserId && appId){
          invoiceService.getInvoiceSettings(currentUserId,appId).then(function(invoiceSettings) {
              if (!invoiceSettings) {
                  return res.send(400, e);
              }
            return res.json(200, invoiceSettings);

          },function(error){
            return res.send(400, error);
          });

        }else{
            return res.send(401);
        }

    });


    app.put('/invoice/update/settings/:appId', function(req,res,next) {

       var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var appId=req.params.appId;
        var data = req.body || {};
        var spendingLimit=data.spendingLimit;
       

        if(currentUserId && appId && spendingLimit>=0){

            invoiceService.upsertInvoiceSettings(currentUserId,appId,spendingLimit).then(function(invoiceSettings) {
                if (!invoiceSettings) {
                    return res.send(500, e);
                }

                return res.json(200, invoiceSettings);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    return app;

}