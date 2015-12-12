
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();
var keys = require('../config/keys.js');
var _ = require('underscore');
var url = require('url');


//setup passport
module.exports = function(passport,controller,fileService,mailChimpService,mandrillService) {      

    var authCallback = function(req, res) {
        var user=req.user;
        return res.json(200, user);
    };

    var session = function(req, res) {
        res.redirect('/');
    };

    // routes
    app.post('/user/signup', function(req, res, next) {       

        var data = req.body || {};

        controller.register(data).then(function(user) {
            if (!user) {
                console.log('++++++ User Registration Failed +++++++++++++');
                return res.send(500, "Error: Something went wrong");
            }

            console.log('++++++ User Registration Success +++++++++++++');

            var newsListId="b0419808f9";       
            mailChimpService.addSubscriber(newsListId,user.email);
            
            if(data.isAdmin){
                req.login(user, function(err) {

                    if (err) {
                        console.log('++++++ User Login Error +++++++++++++');
                        console.log(err);
                        return next(err);
                    }
                    
                    console.log('++++++ User Login Success +++++++++++++');

                    delete user.emailVerificationCode; 
                    delete user.password;//delete this code form response for security

                    return res.status(200).json(user);    
                });

            }else{
                mandrillService.sendSignupEmail(user);
                return res.status(200).send('You have signed up Successfully!');  
            }                
        },function(error){
            console.log('++++++ User Registration Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/user/activate', function(req, res, next) {

        var data = req.body || {};
       
        controller.activate(data.code).then(function(user) {

            console.log('++++++ Activation Successful +++++++++++++');
            //send activated email.
            mandrillService.sendActivatedEmail(user);

            req.login(user, function(err) {

                if (err) {
                    console.log('++++++ User Login Error +++++++++++++');
                    console.log(err);
                    return next(err);
                }
                
                console.log('++++++ User Login Success +++++++++++++');

                delete user.emailVerificationCode; 
                delete user.password;//delete this code form response for security

                return res.status(200).json(user);    
            });
            
        },function(error){
            console.log('++++++ Activation Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/user/resendverification', function(req, res, next) {

        var data = req.body || {};
       
        controller.getAccountByEmail(data.email).then(function(user) {

            console.log('++++++ Resent verification Code Successful +++++++++++++');
            //resend verify code.
            mandrillService.sendSignupEmail(user);
            return res.send(200);
        },function(error){           
            return res.send(500, error);
        });
    });

    app.post('/user/ResetPassword', function(req, res, next) {

        var data = req.body || {};

        controller.requestResetPassword(data.email).then(function(user) {

            console.log('++++++ Request Reset Password Successful +++++++++++++');
            //send activated email.
            mandrillService.sendRequestResetPasswordEmail(user);
            return res.send(200);
        },function(error){
            console.log('++++++ Request Reset Password Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/user/updatePassword', function(req, res, next) {

        var data = req.body || {};

        controller.resetPassword(data.code, data.password).then(function(user) {

            console.log('++++++ Request Reset Password Successful +++++++++++++');
            //send activated email.
            mandrillService.sendPasswordResetSuccessful(user);              

            return res.status(200).send('You have changed password successfully!');    
        },function(error){
            console.log('++++++ Request Reset Password Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);            
        });
    });


    app.post('/user/logout', function(req, res, next){
        req.logout();       
        return res.status(200).json({});
    });


    app.post('/user/signin', function(req, res, next) {
        passport.authenticate('local',  function(err, user, info) {

            if (err || !user) {
                return res.status(500).send(info);
            }
            req.login(user, function(err) {
                if (err) {
                    return next(err);
                }
                delete user._doc.emailVerificationCode;
                delete user._doc.password; //delete this code form response for security
                delete user._doc.salt;

                return res.status(200).send(user);

            });
        })(req, res, next);
    });


    app.get('/user', function(req, res, next) {

        var serverUrl=fullUrl(req);
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var respJson={};

        if(currentUserId){
            controller.getAccountById(currentUserId).then(function(user) {  
                delete user.password;
                delete user.salt;  
                delete user.emailVerificationCode;

                respJson.user=user;  
                              
                if(user && user.fileId){                    
                    return fileService.getFileById(user.fileId);
                }                 
            }).then(function(file){

                if(file){
                   //Wrapping for consistency in UI
                    var fileObject={};
                    fileObject.id=file._id;
                    fileObject.name=file.filename;
                    fileObject.url=serverUrl+"/file/"+respJson.user.fileId;         
                  
                    var wrapper={};
                    wrapper.document=fileObject;                
                                
                    respJson.file=wrapper; 
                }else{
                    respJson.file=null; 
                }                

                return res.status(200).send(respJson);
            },function(error){            
                return res.send(500, error);
            });
        }else{
            return res.send(401);
        }
        
    });

    app.post('/user/update', function(req, res, next) {
        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;

        if(currentUserId){
            controller.updateUserProfile(currentUserId,data.name,data.oldPassword,data.newPassword).then(function(user) {  
                if (!user) {                  
                  return res.status(400).send('Error : User not updated'); 
                } 
                if(data.oldPassword,data.newPassword){
                    //send activated email.
                    mandrillService.sendPasswordResetSuccessful(user);
                }                
                req.logout();
                return res.status(200).json(user);                    
            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }        

    });

    app.get('/user/list/:skip/:limit', function(req, res, next) {
     
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user; 
        var skip=req.params.skip;
        var limit=req.params.limit;        

        if(currentUserId){
            controller.getUserBySkipLimit(skip,limit).then(function(usersList) { 
                if(usersList.length>0){
                    for(var i=0;i<usersList.length;++i){
                        if(usersList[i].password){
                            delete usersList[i]._doc.password;
                        }                    
                        if(usersList[i].emailVerificationCode){
                            delete usersList[i]._doc.emailVerificationCode;
                        }
                        if(usersList[i].salt){
                            delete usersList[i]._doc.salt;
                        }
                        if(usersList[i].provider){
                            delete usersList[i]._doc.provider;
                        }                                                       
                    }
                }                  
                return res.status(200).json(usersList);               
            },function(error){            
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }
        
    }); 

    app.get('/user/active/:userId/:isActive', function(req, res, next) {
     
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user; 
        var userId=req.params.userId;
        var isActive=req.params.isActive;              

        if(currentUserId){
            if(currentUserId!=userId){
                controller.updateUserActive(currentUserId,userId,isActive).then(function(user) { 
                    if(user){
                        if(user.password){
                            delete user._doc.password;
                        }                    
                        if(user.emailVerificationCode){
                            delete user._doc.emailVerificationCode;
                        }
                        if(user.salt){
                            delete user._doc.salt;
                        }
                        if(user.provider){
                            delete user._doc.provider;
                        } 
                    }                              
                    return res.status(200).json(user);               
                },function(error){            
                    return res.send(500, error);
                });

            }else{
                return res.status(500).send("You can't perform this action");
            }

        }else{
            return res.send(401);
        }
        
    });

    app.get('/user/changerole/:userId/:isAdmin', function(req, res, next) {
     
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user; 
        var userId=req.params.userId;
        var isAdmin=req.params.isAdmin;             

        if(currentUserId){
            if(currentUserId!=userId){
                controller.updateUserRole(currentUserId,userId,isAdmin).then(function(user) { 
                    if(user){
                        if(user.password){
                            delete user._doc.password;
                        }                    
                        if(user.emailVerificationCode){
                            delete user._doc.emailVerificationCode;
                        }
                        if(user.salt){
                            delete user._doc.salt;
                        }
                        if(user.provider){
                            delete user._doc.provider;
                        } 
                    }                              
                    return res.status(200).json(user);               
                },function(error){            
                    return res.send(500, error);
                });
            }else{
                return res.status(500).send("You can't perform this action");
            }            

        }else{
            return res.send(401);
        }
        
    }); 

    app.delete('/user/:userId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;
        var userId=req.params.userId;

        if(currentUserId){
            if(currentUserId!=userId){
                controller.delete(currentUserId,userId).then(function() {             
                     
                    return res.status(200).json({});                              

                },function(error){
                    return res.send(500, error);
                });
            }else{
                return res.status(500).send("You can't perform this action");
            }

        }else{
            return res.status(401).send("unauthorized");
        }

    }); 


    app.post('/user/byadmin', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;
        var data = req.body || {};

        if(currentUserId){            
            controller.getUserByEmailByAdmin(currentUserId,data.email).then(function(user) {             
                 
                if(user){
                    if(user.password){
                        delete user._doc.password;
                    }                    
                    if(user.emailVerificationCode){
                        delete user._doc.emailVerificationCode;
                    }
                    if(user.salt){
                        delete user._doc.salt;
                    }
                    if(user.provider){
                        delete user._doc.provider;
                    } 
                }                              
                return res.status(200).json(user);                              

            },function(error){
                return res.send(500, error);
            });           

        }else{
            return res.status(401).send("unauthorized");
        }

    });

    return app;

}

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host')
  });
}