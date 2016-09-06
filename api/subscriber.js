var express = require('express');
var app = express();
var keys = require('../config/keys');
var request = require('request');
var Q = require('q');

module.exports = function() {

    // routes
    app.post('/subscribe', function(req,res,next) {

        console.log("subscribe");

        var data = req.body || {};

        if(!data || !data.email){
          return res.send(204,'No content'); // no content.
        }

        global.subscriberService.subscribe(data.email).then(function(subscriber){
            if (!subscriber) { 
              console.log("Error on subscribe");              
               return res.status(400).send('Server Error'); 
            }else{       
              var newsListId="b0419808f9";       
              global.mailChimpService.addSubscriber(newsListId,data.email);
              console.log("successfully on subscribe");
              return res.status(200).json(subscriber);
            }
        }, function(error){
          console.log("error on subscribe");
          if(error === 'Already Subscribed'){            
            return res.status(400).send('Already subscribed'); 
          }
        });

    });

    return app;
    
};

