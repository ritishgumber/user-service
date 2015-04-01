
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();
var keys = require('../config/keys.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(keys.mandrill);

//setup passport
module.exports = function(passport,controller) {    

    //helpers

    var sendRequestResetPasswordEmail = function(user){
        var message = {
                    "to": [{
                            "email": user.email,
                            "name": user.name,
                            "type": "to"
                        }],

                    "global_merge_vars": [{
                            "name": "name",
                            "content": user.name
                        },{
                            "name": "link",
                            "content": "<a href='https://cloudboost.io/#/forgotpassword?code='"+user.emailVerificationCode+" class='btn-primary'>Reset your password</a>"
                        }]
                };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'forgotpassword', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name},
                    {name:'link',content:"<a href='https://cloudboost.io/#/activate?code="+user.emailVerificationCode+"' class='btn-primary'>Activate your account</a>"}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Email Error +++++++++++++');
                    console.log(result);
                }
            });
    };

    var sendPasswordResetSuccessful = function(user){
        var message = {
                    "to": [{
                            "email": user.email,
                            "name": user.name,
                            "type": "to"
                        }],

                    "global_merge_vars": [{
                            "name": "name",
                            "content": user.name
                        }]
                };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'passwordchanged', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name},
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Email Error +++++++++++++');
                    console.log(result);
                }
            });
    };

    var sendSignupEmail = function(user){
        var message = {
                    "to": [{
                            "email": user.email,
                            "name": user.name,
                            "type": "to"
                        }],

                    "global_merge_vars": [{
                            "name": "name",
                            "content": user.name
                        },{
                            "name": "link",
                            "content": "<a href='https://cloudboost.io/#/activate?code='"+user.emailVerificationCode+" class='btn-primary'>Activate your account</a>"
                        }]
                };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'signupwelcome', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name},
                    {name:'link',content:"<a href='https://cloudboost.io/#/activate?code="+user.emailVerificationCode+"' class='btn-primary'>Activate your account</a>"}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Email Error +++++++++++++');
                    console.log(result);
                }
            });
    };

     var sendActivatedEmail = function(user){

        var message = {
                   
                    "to": [{
                            "email": user.email,
                            "name": user.name,
                            "type": "to"
                        }],

                    "global_merge_vars": [{
                            "name": "name",
                            "content": user.name
                        }]
                   
                };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'accountactivated', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Activated Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Activated Email Error +++++++++++++');
                    console.log(result);
                }
            });
    };

    var authCallback = function(req, res) {
        var user=req.user;
        return res.json(200, user);
    };

    var session = function(req, res) {
        res.redirect('/');
    };

    // routes
    app.post('/register', function(req, res, next) {

        var data = req.body || {};

        controller.register(data).then(function(user) {
            if (!user) {
                console.log('++++++ User Registration Failed +++++++++++++');
                return res.send(500, e);
            }

            console.log('++++++ User Registration Success +++++++++++++');

            sendSignupEmail(user);

            req.login(user, function(err) {

                if (err) {
                    console.log('++++++ User Login Error +++++++++++++');
                    console.log(err);
                    return next(err);
                }

                console.log('++++++ User Login Success +++++++++++++');

                delete user.emailVerificationCode; 
                delete user.password;//delete this code form response for security

                return res.json(200, user);
            });
        },function(error){
            console.log('++++++ User Registration Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/activate', function(req, res, next) {

        var data = req.body || {};

        controller.activate(data.code).then(function(user) {

                console.log('++++++ Activation Successful +++++++++++++');
                //send activated email.
                sendActivatedEmail(user);
                return res.send(200);
        },function(error){
            console.log('++++++ Activation Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/requestResetPassword', function(req, res, next) {

        var data = req.body || {};

        controller.requestResetPassword(data.email).then(function(user) {

                console.log('++++++ Request Reset Password Successful +++++++++++++');
                //send activated email.
                sendRequestResetPasswordEmail(user);
                return res.send(200);
        },function(error){
            console.log('++++++ Request Reset Password Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });

    app.post('/resetPassword', function(req, res, next) {

        var data = req.body || {};

        controller.resetPassword(data.code, data.password).then(function(user) {

                console.log('++++++ Request Reset Password Successful +++++++++++++');
                //send activated email.
                sendPasswordResetSuccessful(user);

                 //login the user.
                 req.login(user, function(err) {
                    if (err) {
                        return next(err);
                    }

                    delete user.emailVerificationCode;
                    delete user.password; //delete this code form response for security

                    return res.json(200, user);
                 });

                return res.send(200);
        },function(error){
            console.log('++++++ Request Reset Password Failed +++++++++++++');
            console.log(error);
            return res.send(500, error);
        });
    });


    app.get('/signout', function(req, res, next){
        req.logout();
       return res.json(200, {});
    });

    app.post('/signin', function(req, res, next) {
        passport.authenticate('local',  function(err, user, info) {
            if (err || !user) {
                return res.send(500, info);
            }

            req.login(user, function(err) {
                if (err) {
                    return next(err);
                }

                delete user.emailVerificationCode;
                delete user.password; //delete this code form response for security

                return res.json(200, user);
            });
        })(req, res, next);
    });

    return app;

}

