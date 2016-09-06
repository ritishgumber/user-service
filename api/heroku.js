var winston = require('winston');
var express = require('express');
var app = express();
var Q = require('q');
var utils = require('../helpers/utils');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var auth = require('basic-auth');

 /*
  * This API is built from these links : 
  * https://devcenter.heroku.com/articles/building-a-heroku-add-on
  */

module.exports = function () {

  /*
  * This is Heroku Create Resource Fucntion
  */

  app.post('/heroku/resources', function(req, res, next) {   

        console.log("Heroku Create Resource"); 

        var credentials = auth(req);

        if (!credentials || credentials.name !== global.keys.herokuUsername || credentials.pass !== global.keys.herokuPassword) {
            res.statusCode = 401;
            return res.end('Access denied');
        } else {
            
            //geenrate the userId, 
            var user = {};
            user.email = global.utilService.generateRandomString()+"@heroku.com";
            user.emailVerified = true; 
            user.password = global.utilService.generateRandomString();
            user.name = "Heroku";
            user.isAdmin = false;
            user.isActive = true;
            user.provider = "heroku";

            global.userService.register(user).then(function(registeredUser){
               
                global.projectService.createProject("Heroku App",registeredUser.id, null, {
                    provider : "heroku"
                }).then(function(project) {

                    if (!project) {                               
                        return res.status(400).send('Error : Project not created'); 
                    } 

                    global.paymentProcessService.createThirdPartySale(project.appId,2).then(function(){
                         console.log("Successfull on App Creation");

                            return res.status(200).json({ 
                                id: project.appId, 
                                config: { 
                                    "CLOUDBOOSTSERVICE_URL" : "https://api.cloudboost.io", 
                                    "CLOUDBOOSTSERVICE_PORTAL":"https://dashboard.cloudboost.io", 
                                    "CLOUDBOOSTSERVICE_PORTAL_EMAIL" : user.email, 
                                    "CLOUDBOOSTSERVICE_PORTAL_PASSWORD" : user.password, 
                                    "CLOUDBOOSTSERVICE_APP_ID" : project.appId, 
                                    "CLOUDBOOSTSERVICE_CLIENT_KEY" : project.keys.js, 
                                    "CLOUDBOOSTSERVICE_MASTER_KEY" :project.keys.master
                                }
                            });
                    }, function(error){
                        return res.status(500).end(error);
                    });
                    
                            
                   
                },function(error){    
                    console.log(error);       
                    return res.status(500).send(error); 
                });          
                    
            
            },function(error){    
                console.log(error);       
                return res.status(500).send(error); 
            });
           
        }
  });


  /*
  * Delete a resource.
  */
  app.delete('/heroku/resources/:id', function(req, res, next) {   

        console.log("Heroku Delete Resource"); 

        var credentials = auth(req);

        if (!credentials || credentials.name !== global.keys.herokuUsername || credentials.pass !== global.keys.herokuPassword) {
            res.statusCode = 401;
            return res.end('Access denied');
        } else {

            global.projectService.deleteAppAsAdmin(req.params.id).then(function(project){
                return res.status(200).end();
            }, function(error){
                return res.status(500).end(error);
            });
        }
  });


 /*
  * Update a plan.
  */
  app.put('/heroku/resources/:id', function(req, res, next) {   

        console.log("Heroku Plan Change"); 

        var credentials = auth(req);

        if(!req.body.plan)
            return res.status(400).end("Plan ID is null");

        var planId = parseInt(req.body.plan.toString());
        
        if(planId<2&&planId>5){
            return res.status(400).end("Invalid Plan ID");
        }
        
        if (!credentials || credentials.name !== global.keys.herokuUsername || credentials.pass !== global.keys.herokuPassword) {
            res.statusCode = 401;
            return res.end('Access denied');
        } else {
             global.paymentProcessService.createThirdPartySale(req.params.id,planId).then(function(){
                return res.status(200).end();
            }, function(error){
                return res.status(500).end(error);
            });
        }
  });

  return app;
};

