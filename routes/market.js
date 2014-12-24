var express = require('express');
var app=express();
var controller = require('../services/marketService');

module.exports = function() {

    // routes
    app.post('/subscribe', function(req,res,next) {
        var data = req.body || {};

        if(data){
          controller.subscribe(data,function(e, email) {
              if (e || !email) {
                  return res.send(500, e);
              }
            return res.json(200, email);

          });

        }

    });

    return app;
}
