var express = require('express');
var app = express();
var keys = require('../config/keys');
var request = require('request');
var Q = require('q');

module.exports = function(subscriberService) {

    // routes
    app.post('/subscribe', function(req,res,next) {
        var data = req.body || {};

        if(!data || !data.email){
          return res.send(204,'No content'); // no content.
        }

        subscriberService.subscribe(data.email).then(function(subscriber){
            if (!subscriber) {               
               return res.status(400).send('Server Error'); 
            }else{              
              addSubscriberToMailChimp(data.email);
              return res.status(200).json(subscriber);
            }
        }, function(error){
          if(error === 'Already Subscribed'){            
            return res.status(400).send('Already subscribed'); 
          }
        });

    });

    return app;
    
};

function addSubscriberToMailChimp(email){

  var deferred = Q.defer();

    var post_data = {};
    post_data.email_address=email;
    post_data.status='subscribed';
    
    var authString='cloudboost:'+keys.mailchimpApiKey;
    
    var url="https://us10.api.mailchimp.com/3.0/lists/b0419808f9/members"

    request.post(url,{
        headers: {
          'content-type': 'application/json'          
        },
        auth: {
          'user': authString
        },
        body: post_data
    },function(err,response,body){
        if(err || response.statusCode === 500 || body === 'Error'){
          deferred.reject(err);
        }else {
          deferred.resolve();
        }
    });

  return deferred.promise;
}
