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

module.exports = function(Invoice,InvoiceSettings,UserService){

  return {

          getInvoice: function (userId,appId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              var d = new Date();
              d.setDate(1);
              d.setHours(0);
              d.setMinutes(0);
              d.setSeconds(0);
              d=new Date(d);

              Invoice.find({_userId: userId,_appId:appId,invoiceForMonth:{$gte:new Date(d)}}, function (err, invoice) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoice.length>0){
                      deferred.resolve(invoice[0]._doc);  
                    }else{
                      
                        //Create invoice 
                        self.createInvoice(appId, userId).then(function(invoice){                                    
                          if(invoice){                                        
                             deferred.resolve(invoice._doc);  
                          }
                        },function(error){
                          deferred.reject(error);
                        });
                        //End of create invoice
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          getInvoiceSettings: function (userId,appId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              

              InvoiceSettings.find({_userId: userId,_appId:appId}, function (err, invoiceSettings) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceSettings.length>0){
                      deferred.resolve(invoiceSettings[0]._doc);  
                    }else{
                      //Create invoice Settings
                      self.createInvoiceSettings(appId, userId).then(function(invoiceSettings){
                        if(invoiceSettings){
                            deferred.resolve(invoiceSettings._doc); 
                        }
                      },function(error){
                        deferred.reject(error);
                      });
                      //End of create invoice Settings 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          createInvoice: function (appId,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              var invoiceDetails = [
                  {
                      category : 'API',
                      usageMetrics : [
                          {
                              description : 'Requests / Month',
                              usage : '0',
                              charged : '0'
                          }
                      ]
                  },
                  {
                      category : 'Storage',
                      usageMetrics : [
                          {
                              description : 'Size of data stored',
                              usage : '0 GB',
                              charged : '0'
                          }
                      ]
                  },
                  {
                      category : 'Search',
                      usageMetrics : [
                          {
                              description : 'Documents Indexed',
                              usage : '0',
                              charged : '0'
                          }
                      ]
                  },
                  {
                      category : 'Realtime',
                      usageMetrics : [
                          {
                              description : 'Messages Sent',
                              usage : '0',
                              charged : '0'
                          }
                      ]
                  }
              ];
                  
              var invoice = new Invoice();
              invoice._userId=userId;
              invoice._appId=appId;
              invoice.invoiceForMonth= new Date();
              invoice.currentInvoice=0;
              invoice.invoiceDetails=invoiceDetails;            
              
              invoice.save(function (err, invoice) {
                      if (err) deferred.reject(err);

                      if(!invoice)
                        deferred.reject('Cannot create the invoice right now.');
                      else{
                        deferred.resolve(invoice);
                      }
              });                          

              return deferred.promise;
          },
          createInvoiceSettings: function (appId,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              InvoiceSettings.findOne({_appId : appId,_userId:userId}, function (err, invoiceSettings) {
                if(invoiceSettings)
                  deferred.resolve(invoiceSettings);
                else
                  var invoiceSettings = new InvoiceSettings();
                  invoiceSettings._userId=userId;
                  invoiceSettings._appId=appId;
                  invoiceSettings.autoScale= false;
                  invoiceSettings.spendingLimit=0;
                  
                  invoiceSettings.save(function (err, invoiceSettings) {
                      if (err) deferred.reject(err);

                      if(!invoiceSettings)
                        deferred.reject('Cannot create the invoiceSettings right now.');
                      else{
                        deferred.resolve(invoiceSettings);
                      }
                  });
              
              });                          

              return deferred.promise;
          },
          upsertInvoiceSettings: function (userId,appId,spendingLimit) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              

              InvoiceSettings.find({_userId: userId,_appId:appId}, function (err, invoiceSettings) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceSettings.length>0){
                      invoiceSettings[0].spendingLimit=spendingLimit;

                      invoiceSettings[0].save(function (err, invoiceSettings) {
                          if (err) deferred.reject(err);

                          if(!invoiceSettings)
                              deferred.reject('Cannot save the Invoice settings now.');
                          else{                            
                            deferred.resolve(invoiceSettings._doc);
                          }
                      });

                    }else{
                      deferred.reject('There is no Invoice Settings for this App'); 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          getDueInvoiceList: function () {

             var _self = this;

             var deferred = Q.defer();

              var self = this;             

              Invoice.find({charged:null}, function (err, invoiceList) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceList.length>0){                      
                      deferred.resolve(invoiceList);  
                    }else{
                      deferred.resolve(null);
                    }                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          getDueInvoiceListByUserId: function (userId) {
            //get invoices where charged:null
             var _self = this;

             var deferred = Q.defer();

              var self = this;       

              Invoice.find({_userId:userId,charged:null}, function (err, invoiceList) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceList.length>0){
                      deferred.resolve(invoiceList);  
                    }else{
                      deferred.resolve(null);
                    }                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          blockUser: function (userId,appId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;             

              InvoiceSettings.find({_userId:userId,_appId:appId,blocked:{$ne: null}}, function (err, invoiceSettings) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceSettings.length>0){
                     
                      var blocked={
                        status : true, 
                        blockedDateTime: new Date()
                      };
                      invoiceSettings[0].blocked=blocked;

                      invoiceSettings[0].save(function (err, invoiceSettings) {
                          if (err) deferred.reject(err);

                          if(!invoiceSettings)
                              deferred.reject('Cannot block the User right now.');
                          else{
                                var userId=invoiceSettings._userId;
                                UserService.getAccountById(userId)
                                .then(function(user){
                                  if(user){

                                    var userName=user._doc.name;
                                    var email=user._doc.email;
                                    var message = {
                                      "to": [{
                                              "email":email,
                                              "name": userName,
                                              "type": "to"
                                            }],
                                      "global_merge_vars": [{
                                              "name": "name",
                                              "content": userName
                                          }],
                                          "inline_css":true
                                    };
                                    //send the invoice failure Mail
                                    mandrill_client.messages.sendTemplate({"template_name": 'invoicefailure', 
                                        "message" : message,
                                        "template_content": [{
                                              "name": "name",
                                              "content": userName
                                          }], "async": true}, function(result){
                                        if(result.length>0 && result[0].status === 'sent'){
                                            console.log('++++++Mandrill Email Sent +++++++++++++');
                                        }else{
                                            console.log('++++++Mandrill Email Error +++++++++++++');
                                            console.log(result);
                                        }
                                    });
                                    //end of sending mail

                                  }
                                },function(error){ 
                                  console.log(error);
                                });
                                  
                              deferred.resolve(invoiceSettings._doc); 
                          }
                      });                      

                    }else{
                      deferred.resolve(null);
                    }                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          unblockUser: function (userId,appId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              

              InvoiceSettings.find({_userId: userId,_appId:appId,blocked:{$ne: null}}, function (err, invoiceSettings) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoiceSettings.length>0){
                      
                        if(invoiceSettings[0].blocked.status){

                            invoiceSettings[0].blocked=null;
                            invoiceSettings[0].save(function (err, invoiceSettings) {
                                if (err) deferred.reject(err);

                                if(!invoiceSettings)
                                    deferred.reject('Cannot save the Invoice settings now.');
                                else{                            
                                  deferred.resolve(invoiceSettings._doc);
                                }
                            });
                        }                    

                    }else{
                      deferred.reject('There is no Invoice Settings for this App'); 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          updateInvoice: function (userId,appId,charged) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              
 
              Invoice.find({_userId: userId,_appId:appId}, function (err, invoice) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(invoice.length>0){
                      invoice[0].charged=charged;
                     
                      invoice[0].save(function (err, invoice) {
                          if (err) deferred.reject(err);

                          if(!invoice)
                              deferred.reject('Cannot update the Invoice right now.');
                          else{                                     
                            deferred.resolve(invoice._doc);
                          }
                      });

                    }else{
                      deferred.reject('Cannot find Invoice.'); 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          }

         
    }

};
