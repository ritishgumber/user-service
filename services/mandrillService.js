'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(keys.mandrill);


module.exports = function(){

  return {    

    sendRequestResetPasswordEmail: function(user){

        console.log("Send Reset password mail through mandrill");

        try{
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
                    "content": "<a href='https://dashboard.cloudboost.io/accounts/#/forgotpassword?code='"+user.emailVerificationCode+" class='btn-primary'>Reset your password</a>"
                }]
            };

            //Send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'forgotpassword', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name},
                    {name:'link',content:"<a href='https://dashboard.cloudboost.io/accounts/#/forgotpassword?code="+user.emailVerificationCode+"' class='btn-primary'>Reset your password</a>"}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Reset Password Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Reset Password Error +++++++++++++');
                    console.log(result);
                }
            });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },

    sendPasswordResetSuccessful:function(user){
        console.log("Send Password changed successfully through mandrill..");
        try{
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
                    console.log('++++++Mandrill Password Changed Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Password Changed Email Error +++++++++++++');
                    console.log(result);
                }
            });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },

    sendSignupEmail:function(user){

        console.log("Send sign up email through mandril..");

        try{
            console.log(user.emailVerificationCode);
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
                        "content": "<a href='https://dashboard.cloudboost.io/accounts/#/activate?code='"+user.emailVerificationCode+" class='btn-primary'>Activate your account</a>"
                    }]
            };

            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'signupwelcome', 
                "message" : message,
                "template_content": [
                    {name:'name',content:user.name},
                    {name:'link',content:"<a href='https://dashboard.cloudboost.io/accounts/#/activate?code="+user.emailVerificationCode+"' class='btn-primary'>Activate your account</a>"}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Signed up Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Signed up Email Error +++++++++++++');
                    console.log(result);
                }
            });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },

    sendActivatedEmail : function(user){

        console.log("Send activate email..");

        try{
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

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },
    inviteDeveloper : function(email,appName){

        console.log("Send invite developer mail through mandrill..");

        try{
            var message = {                   
                "to": [{
                        "email": email,                    
                        "type": "to"
                    }],

                "global_merge_vars": [{
                        "name": "projectname",
                        "content": appName
                    }]           
            };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'invitedeveloper', 
                "message" : message,
                "template_content": [
                    {name:'projectname',content:appName}
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill InviteDeveloper Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill InviteDeveloper Email Error +++++++++++++');
                    console.log(result);
                }
            });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },
    changePlan : function(userName,email,appName,planName){

        console.log("Send changed plan email through mandrill");

        try{
            var message = {                   
                "to": [{
                        "email": email,                    
                        "type": "to"
                    }],

                "global_merge_vars": [{
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }]           
            };


            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'changeplan', 
                "message" : message,
                "template_content": [
                    {
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Change App Plan Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Change App Plan Email Error +++++++++++++');
                    console.log(result);
                }
            });
        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },
    cancelPlan : function(userName,email,appName,planName){

        console.log("Send cancelled plan email throgh mandrill..");

        try{
            var message = {                   
                "to": [{
                        "email": email,                    
                        "type": "to"
                    }],

                "global_merge_vars": [{
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }]           
            };

            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'cancelplan', 
                "message" : message,
                "template_content": [
                    {
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Cancel Plan Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Cancel Plan Plan Email Error +++++++++++++');
                    console.log(result);
                }
            });
        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },
    over80Limit : function(userName,email,appName,planName){

        console.log("Send mail for over 80% usage through mandrill...");

        try{
            var message = {                   
                "to": [{
                        "email": email,                    
                        "type": "to"
                    }],

                "global_merge_vars": [{
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }]           
            };

            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'over80limit', 
                "message" : message,
                "template_content": [
                    {
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Over 80% Plan Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Over 80% Plan Email Error +++++++++++++');
                    console.log(result);
                }
            });
        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    },
    over100Limit : function(userName,email,appName,planName){

        console.log("Send mail for over 100% usage through mandrill...");

        try{
            var message = {                   
                "to": [{
                        "email": email,                    
                        "type": "to"
                    }],

                "global_merge_vars": [{
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }]           
            };

            //send the verification email.
            mandrill_client.messages.sendTemplate({"template_name": 'overlimit', 
                "message" : message,
                "template_content": [
                    {
                        "name": "name",
                        "content": userName
                    },{
                        "name": "appname",
                        "content": appName
                    },{
                        "name": "planname",
                        "content": planName
                    }
                ], "async": true}, function(result){
                if(result.length>0 && result[0].status === 'sent'){
                    console.log('++++++Mandrill Over 100% Plan Email Sent +++++++++++++');
                }else{
                    console.log('++++++Mandrill Over 100% Plan Email Error +++++++++++++');
                    console.log(result);
                }
            });

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }
    }        

  }

};

