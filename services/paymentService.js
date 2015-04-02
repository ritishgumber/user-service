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
var stripe = require("stripe")(keys.stripeSecretKey);
var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init(keys.mixpanelToken);

module.exports = function(StripeCustomer,CreditCardInfo,InvoiceService,UserService,ProjectService){

  return {
         
          upsertCreditCard: function (userId,stripeToken,cardInfo) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;                            

              self.upsertCustomer(userId,stripeToken)
               .then(function(serverCustomerObj){

                    var customerId=serverCustomerObj._doc.stripeCustomerObject.id;

                    self.findDeleteAndCreateCard(userId,customerId,cardInfo,stripeToken)
                    .then(function(serverCardObj){ 

                        /*****Check Due Payments****/
                        self.checkDuePayments(userId,serverCardObj);                                               
                        /*****End Check Due Payments****/ 

                        deferred.resolve(serverCardObj);

                    },function(error){ 
                      deferred.reject(error);
                    });
                  
              },function(error){ 
                deferred.reject(error);
              });
                    

              return deferred.promise;
          },
          findCard: function(userId) {

             var _self = this;

             var deferred = Q.defer();

              var self = this;              

              CreditCardInfo.find({_userId:userId}, function (err, cardObj) {
                if (err){
                    deferred.reject(err);
                }else{        
                    if(cardObj.length>0){
                      deferred.resolve(cardObj[0]);  
                    }else{
                      deferred.resolve(null); 
                    }      
                              
                }

              }, function(error){        
                  deferred.reject(error);  
              });     

             return deferred.promise;
          },
          saveCardInfo: function (creditCardInfo) { 

             var _self = this;

             var deferred = Q.defer();

              var self = this;                                    

              creditCardInfo.save(function (err, doc) {
                  if (err) deferred.reject(err);
                  if(!doc)
                      deferred.reject('Cannot save the app right now.');
                  else{                            
                      deferred.resolve(doc._doc);                            
                  }
              });      

             return deferred.promise;
          },
          saveCustomer: function (stripeCustomer) {

            var _self = this;

            var deferred = Q.defer();

            var self = this;                                    

            stripeCustomer.save(function (err, doc) {
                if (err) deferred.reject(err);
                if(!doc)
                    deferred.reject('Cannot save the card right now.');
                else{                            
                    deferred.resolve(doc._doc);                            
                }
            });      

            return deferred.promise;
          },
          upsertCustomer: function (userId,stripeToken) {

            var _self = this;

            var deferred = Q.defer();

            var self = this; 

            StripeCustomer.findOne({_userId:userId}, function (err, serverCusObj) {
                if(err){
                  deferred.reject(err);
                }
                if(serverCusObj){
                  deferred.resolve(serverCusObj);
                }else{
                      var description="Customer for"+userId;
                      //create customer in stripe
                      self.stripeApiCreateCustomer(description,stripeToken)
                      .then(function(stripeCustomerObj){

                          if(stripeCustomerObj){ 

                              var stripeCustomer = new StripeCustomer();                      
                              stripeCustomer._userId=userId;
                              stripeCustomer.stripeCustomerObject=stripeCustomerObj;

                              //Save Customer in DB
                              self.saveCustomer(stripeCustomer).then(function(serverCusObj){
                                  if(serverCusObj){
                                    deferred.resolve(serverCusObj);
                                  }
                              },function(error){ 
                                deferred.reject(error);
                              });   

                          }else{
                            deferred.reject(null);
                          }                            

                      },function(error){
                        deferred.reject(error);                        
                      });   
                } 
            });  
                

            return deferred.promise;
          },
          findDeleteAndCreateCard: function (userId,customerId,cardInfo,stripeToken) {

                var _self = this;

                var deferred = Q.defer();

                var self = this; 

                self.findCard(userId)
                .then(function(creditCardInfo){

                    if(creditCardInfo){

                      var cardId=creditCardInfo._doc.stripeCardObject.id; 

                      if(stripeToken){//if stripeToken, create new card and delete existing one

                          self.stripeApiDeleteCard(customerId,cardId)
                          .then(function(confirm){
                             if(confirm.deleted){
                                 //create Card Stripe
                                self.stripeApiCreateCard(customerId,cardInfo)
                                .then(function(stripeCardObj){

                                 if(stripeCardObj){                                       
                                    
                                    creditCardInfo.stripeCardObject=stripeCardObj;

                                    //Save Card Info in DB
                                    self.saveCardInfo(creditCardInfo)
                                    .then(function(serverCardObj){

                                        self.stripeApiUpdateCustomer(customerId,cardInfo)
                                        .then(function(serverCustomerObj){

                                           deferred.resolve(serverCardObj);
                                            
                                        },function(error){ 
                                          deferred.reject(error);
                                        }); 

                                    },function(error){ 
                                      deferred.reject(error);
                                    });  

                                 }else{
                                    deferred.reject(null);
                                 }                            

                                },function(error){
                                  deferred.reject(error);                        
                                });
                             }                            

                           },function(error){
                              deferred.reject(error);                        
                          });  
                      }

                    }else{
                   
                      //create Card Stripe
                      self.stripeApiCreateCard(customerId,cardInfo)
                      .then(function(stripeCardObj){
                       if(stripeCardObj){

                          var creditCardInfo = new CreditCardInfo();                              
                          creditCardInfo._userId=userId;
                          creditCardInfo.stripeCardObject=stripeCardObj;

                          //Save Card Info in DB
                          self.saveCardInfo(creditCardInfo)
                          .then(function(serverCardObj){
                            
                                self.stripeApiUpdateCustomer(customerId,cardInfo)
                                .then(function(serverCustomerObj){
                                  deferred.resolve(serverCustomerObj);
                                },function(error){ 
                                  deferred.reject(error);
                                }); 

                          },function(error){ 
                            deferred.reject(error);
                          });  

                       }else{
                          deferred.reject(null);
                       }                            

                      },function(error){
                        deferred.reject(error);                        
                      });  
                       
                  }

                },function(error){
                    deferred.reject(error); 
                }); 

                return deferred.promise;
          },
          stripeApiCreateCard: function (customerId,card){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.customers.createCard(
                customerId,
                {card:card},
                function(err, card) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(card){                          
                          deferred.resolve(card);  
                        }else{
                          deferred.resolve(null); 
                        }      
                                  
                    }
                }
              );         

             return deferred.promise;
          },
          stripeApiUpdateCard: function (customerId,cardId,newCardObj){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.customers.updateCard(
                customerId,
                cardId,
                newCardObj,
                function(err, card) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(card){                          
                          deferred.resolve(card);  
                        }else{
                          deferred.resolve(null); 
                        }      
                                  
                    }
                }
              );
             
             return deferred.promise;
          },
          stripeApiDeleteCard: function (customerId,cardId){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.customers.deleteCard(
                customerId,
                cardId,              
                function(err, confirmation) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(confirmation){                          
                          deferred.resolve(confirmation);  
                        }                                
                    }
                }
              );
             
             return deferred.promise;
          },          
          stripeApiCreateCustomer: function (description,stripeToken){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.customers.create({
                  description: description,
                  source: stripeToken 
                },function(err, customer) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(customer){                          
                          deferred.resolve(customer);  
                        }else{
                          deferred.resolve(null); 
                        }      
                                  
                    }
                }
              );   
             
             return deferred.promise;
          },
          stripeApiUpdateCustomer: function (customerId,card){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.customers.update(
                  customerId,
                  { source: card 
                },function(err, customer) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(customer){                          
                          deferred.resolve(customer);  
                        }else{
                          deferred.resolve(null); 
                        }      
                                  
                    }
                }
              );

             return deferred.promise;
          },
          stripeApiCreateCharges: function (amount,customerId){

             var _self = this;

             var deferred = Q.defer();

              var self = this; 

              stripe.charges.create({
                amount: amount,
                currency: "usd",
                customer: customerId          
              },function(err, charge) {
                    if (err){
                      deferred.reject(err);
                    }else{        
                        if(charge){                          
                          deferred.resolve(charge);  
                        }else{
                          deferred.resolve(null); 
                        }      
                                  
                    }
                } 
              );

             return deferred.promise;
          },
          checkDuePayments: function (userId,card){

            var _self = this;

            var deferred = Q.defer();
 
            var self = this; 

            var customerId=card.stripeCardObject.customer;

            InvoiceService.getDueInvoiceListByUserId(userId)
            .then(function(invoiceList){
              if(invoiceList.length>0){         
              
                for(var i=0;i<invoiceList.length;++i){
                    self.makePayments(invoiceList[i],customerId);                   
                }

              }else{
                deferred.resolve(null);
              }
            
            },function(error){ 
              deferred.reject(error);
            });            

             return deferred.promise;
          },
          makePayments: function (invoice,customerId){

            var _self = this;

            var deferred = Q.defer();
 
            var self = this;  

            var userId=invoice._userId;
            var appId=invoice._appId;
               
            var amount=invoice.currentInvoice;                                                                        
            amount=amount*100;//convert into CENTS as per stripe requirement

            if(amount && amount>=50){//min amount $0.50
               
                self.stripeApiCreateCharges(amount,customerId)
                .then(function(charge){
                  if(charge){
                  
                      InvoiceService.updateInvoice(userId,appId,charge)
                      .then(function(updatedInvoice){
                        if(updatedInvoice){
                            self.emailInvoice(updatedInvoice);
                            InvoiceService.unblockUser(userId,appId);
                        }
                      });

                  }else{
                    InvoiceService.blockUser(userId,appId);
                  }                 

                },function(error){ 
                  console.log(error);
                  InvoiceService.blockUser(userId,appId);
                });                             
            }

            return deferred.promise;
          },
          emailInvoice: function (invoice){

            var _self = this;

            var deferred = Q.defer();
 
            var self = this;  

            var userId=invoice._userId;
            var appId=invoice._appId; 

            ProjectService.getProject(appId)
            .then(function(project){
              if(project){ 

                UserService.getAccountById(userId)
                .then(function(user){
                  if(user){                
                    var userId=user._doc._id.toString();
                    var userName=user._doc.name;
                    var email=user._doc.email;
                    var appName=project._doc.name;                  
                    var invoiceDate=invoice.invoiceForMonth;
                    var currentInvoice=invoice.currentInvoice;

                    // record a transaction for revenue analytics
                    mixpanel.people.track_charge(userId, currentInvoice);

                    var html="";
                    var sno=0;
                    for(var i=0; i<invoice.invoiceDetails.length;++i){

                        for(var j=0;j<invoice.invoiceDetails[i].usageMetrics.length;++j){
                            sno=sno+1;
                            html+='<tr>';
                            html+='<td class="no">'+sno+'</td>';
                            html+='<td class="desc"><h3>'+invoice.invoiceDetails[i].category+'</h3>'+invoice.invoiceDetails[i].usageMetrics[j].description+'</td>';
                            html+='<td class="unit"></td>';
                            html+='<td class="qty">'+invoice.invoiceDetails[i].usageMetrics[j].usage+'</td>';
                            html+='<td class="total">$'+invoice.invoiceDetails[i].usageMetrics[j].charged+'</td>';
                            html+='</tr>';
                        }
                       
                    }

                    var message = {
                      "to": [{
                              "email":email ,
                              "name": userName,
                              "type": "to"
                            }],

                      "global_merge_vars": [{
                              "name": "name",
                              "content": userName
                          },{
                              "name": "link",
                              "content": "<a class='btn-primary'>"+email+"</a>"
                      
                          },{
                              "name": "appname",
                              "content": appName                      
                          },{
                              "name": "invoicedate",
                              "content": invoiceDate                      
                          },
                          {
                              "name": "currentinvoice",
                              "content": currentInvoice                      
                          },
                          {
                              "name": "invoicedetails",
                              "content": html                      
                          }],
                          "inline_css":true
                    };
                   
                    //send the verification email.
                    mandrill_client.messages.sendTemplate({"template_name": 'invoice', 
                        "message" : message,
                        "template_content": [{
                              "name": "name",
                              "content": userName
                          },{
                              "name": "link",
                              "content": "<a class='btn-primary'>"+email+"</a>"
                      
                          },{
                              "name": "appname",
                              "content": appName                      
                          },{
                              "name": "invoicedate",
                              "content": invoiceDate                      
                          },
                          {
                              "name": "currentinvoice",
                              "content": currentInvoice                      
                          },
                          {
                              "name": "invoicedetails",
                              "content": html                      
                          }], "async": true}, function(result){
                        if(result.length>0 && result[0].status === 'sent'){
                            console.log('++++++Mandrill Email Sent +++++++++++++');
                        }else{
                            console.log('++++++Mandrill Email Error +++++++++++++');
                            console.log(result);
                        }
                    });

                  }
                },function(error){ 
                  console.log(error);
                });

              }
            },function(error){ 
              console.log(error);
            }); 
            return deferred.promise;
          }
         
    }

};
