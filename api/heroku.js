var winston = require('winston');
var express = require('express');
var app = express();
var Q = require('q');
var utils = require('../helpers/utils');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var auth = require('basic-auth');
var sha1 = require('sha1');

 /*
  * This API is built from these links : 
  * https://devcenter.heroku.com/articles/building-a-heroku-add-on
  */

module.exports = function () {

  /*
  * This is Heroku SSO Login
  */

   app.post('/heroku/sso/login', function(req, res, next) {   

        console.log("Heroku Login SSO");

        var pre_token = req.body.id + ':' + global.keys.herokuSalt + ':' + req.body.timestamp;
        var token = sha1(pre_token);
        var navData = req.body["nav-data"];

        if(token!==req.body.token){
          return res.status(403).end("Unauthorized.");
        }
         
        if(parseInt(req.body.timestamp) < (new Date().getTime()/1000) - 5*60){
          return res.status(403).end("Session Expired.");
        } 
         
        //find an app  and then find the user. 

        var appId = req.body.id;

        global.projectService.getProject(appId).then(function(project){
          if(!project){
            return res.status(404).end("App not found.");
          }

          var userId = project._userId;

          if(!userId){
            return res.status(404).end("User not found.");
          }

          global.userService.getAccountById(userId).then(function(user){
              if(!user){
                return res.status(404).end("User not found.");
              }

              //if user is found, then login the user.

               req.login(user, function(err) {

                  if (err) {
                       return res.status(500).end(err);
                  }
                  
                  console.log('++++++ User Login Success +++++++++++++');

                  delete user.emailVerificationCode; 
                  delete user.password; //delete this code form response for security

                  res.writeHead(302, {
                      'Set-Cookie': "heroku-nav-data="+navData,
                      'Location': 'https://dashboard.cloudboost.io?provider=heroku&app='+req.body.app
                  });

                  res.end();
                  return;
              });

            }, function(err){
                return res.status(500).end(err);
            });

        }, function(err){
            return res.status(500).end(err);
        });
  });


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
            user.email = req.body.heroku_id;
            user.emailVerified = true; 
            user.password = global.utilService.generateRandomString();
            user.name = "Heroku";
            user.isAdmin = false;
            user.isActive = true;
            user.provider = "heroku";

            if(!req.body.plan)
                return res.status(400).end("Plan ID is null");


            var planId = 2;

            if(req.body.plan.toString() === 'launch'){
            planId =2;
            }

            if(req.body.plan.toString() === 'bootstrap'){
            planId =3;
            }

            if(req.body.plan.toString() === 'scale'){
            planId =4;
            }

            if(req.body.plan.toString() === 'unicorn'){
            planId =5;
            }

            
            if(planId<2&&planId>5){
                return res.status(400).end("Invalid Plan ID");
            }

            global.userService.register(user).then(function(registeredUser){
               
                global.projectService.createProject("Heroku App",registeredUser.id, {
                    provider : "heroku"
                }).then(function(project) {

                    if (!project) {                               
                        return res.status(400).send('Error : Project not created'); 
                    } 

                    global.paymentProcessService.createThirdPartySale(project.appId,planId).then(function(){
                         console.log("Successfull on App Creation");

                            return res.status(200).json({ 
                                id: project.appId, 
                                config: { 
                                    "CLOUDBOOST_URL" : "https://api.cloudboost.io", 
                                    "CLOUDBOOST_PORTAL":"https://dashboard.cloudboost.io", 
                                    "CLOUDBOOST_PORTAL_EMAIL" : user.email, 
                                    "CLOUDBOOST_PORTAL_PASSWORD" : user.password, 
                                    "CLOUDBOOST_APP_ID" : project.appId, 
                                    "CLOUDBOOST_CLIENT_KEY" : project.keys.js, 
                                    "CLOUDBOOST_MASTER_KEY" :project.keys.master
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


        var planId = 2;

        if(req.body.plan.toString() === 'launch'){
          planId =2;
        }

        if(req.body.plan.toString() === 'bootstrap'){
          planId =3;
        }

        if(req.body.plan.toString() === 'scale'){
          planId =4;
        }

        if(req.body.plan.toString() === 'unicorn'){
          planId =5;
        }

        
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

