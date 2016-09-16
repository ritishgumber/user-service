'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var jsdom = require("jsdom");
var fs = require("fs");


var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');
var nodemailerMailgun = nodemailer.createTransport(mailgun({
  auth: {
    api_key: keys.mailGunApiKey,
    domain: keys.mailGunDomain
  }
}));


module.exports = function(){

  return { 

    sendTextMail: function(from, to, subject, text){

        console.log("Send Mail Function...");

        var deferred = Q.defer();


        nodemailerMailgun.sendMail({
              from: from,
              'h:Reply-To': from,
              to: to,           
              subject: subject,                  
              text: text        
            }, function (err, info) {
              if (err) {
                console.log(err);
                deferred.reject(error);
              }
              else {
                console.log(info);
                deferred.resolve(info);
              }
        });

        return deferred.promise;        
    },
   
    sendMail: function(mailName, emailTo, subject, variableArray){

        console.log("Send Mail Function...");

        var deferred = Q.defer();

        try{             

            _getEmailTemplate(mailName).then(function(template){

                if(template){
                    return _mergeVariablesInTemplate(template,variableArray); 
                }else{
                    var noTempDef = Q.defer();
                    noTempDef.reject(mailName+" template not found");
                    return noTempDef.promise;
                }
                
            }).then(function(mergedTemplate){

                nodemailerMailgun.sendMail({
                  from: "CloudBoost.io <"+keys.adminEmailAddress+">",
                  'h:Reply-To': keys.adminEmailAddress,
                  to: emailTo,           
                  subject: subject,                  
                  html: mergedTemplate        
                }, function (err, info) {
                  if (err) {
                    console.log(err);
                    deferred.reject(error);
                  }
                  else {
                    console.log(info);
                    deferred.resolve(info);
                  }
                });

            },function(error){
                console.log(error);
                deferred.reject(error);
            });

        }catch(err){
          deferred.reject(err);  
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});          
        }

        return deferred.promise;        
    }

  }

};


/***********************************Private Functions**********************************/

function _mergeVariablesInTemplate(template,variableArray){

    var deferred = Q.defer();

    try{       

        //Parse Template
        jsdom.env(template, [], function (error, window) {
            if(error){
                deferred.reject("Cannot parse mail template.");
            }else{

                var $ = require('jquery')(window); 
                
                for(var i=0;i<variableArray.length;++i){

                    if(variableArray[i].contentType=="text"){
                        $("."+variableArray[i].domClass).text(variableArray[i].content);
                    }else if(variableArray[i].contentType=="html"){
                        $("."+variableArray[i].domClass).html(variableArray[i].content);
                    }
                    
                }                                         
                
                deferred.resolve(window.document.documentElement.outerHTML);   
            }
        });

    } catch(err){           
        global.winston.log('error',{"error":String(err),"stack": new Error().stack});
        deferred.reject(err);
    }  

    return deferred.promise;
}

function _getEmailTemplate(templateName){
    var deferred = Q.defer();

    var templatePath='./mail-templates/'+templateName+'.html';

    try{
        fs.readFile(templatePath, 'utf8', function(error, data) {                        
            if(error){
                deferred.reject(error);
            }else if(data){
                deferred.resolve(data);
            } 
        });

    } catch(err){           
        global.winston.log('error',{"error":String(err),"stack": new Error().stack});
        deferred.reject(err);
    }

    return deferred.promise;
}

