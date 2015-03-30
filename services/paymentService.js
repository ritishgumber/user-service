'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var stripe = require("stripe")(
  keys.stripeSecretKey
);

module.exports = function(StripeCustomer,CreditCardInfo){

  return {
         
          upsertCreditCard: function (userId,stripeToken,cardInfo) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;                            

              //find customer in DB
              StripeCustomer.findOne({_userId:userId}, function (err, serverCusObj) {
                if(err){
                  deferred.reject(err);
                }
                if(serverCusObj){  
                    //find card in DB
                    self.findCard(userId).then(function(creditCardInfo){
                        if(creditCardInfo){
                          var customerId=serverCusObj._doc.stripeCustomerObject.id;
                          var cardId=creditCardInfo._doc.stripeCardObject.id; 

                          if(stripeToken){//if stripeToken, create new card and delete existing one

                              self.stripeApiDeleteCard(customerId,cardId).then(function(confirm){
                                 if(confirm.deleted){
                                     //create Card Stripe
                                    self.stripeApiCreateCard(customerId,cardInfo).then(function(stripeCardObj){
                                     if(stripeCardObj){                                       
                                        
                                        creditCardInfo.stripeCardObject=stripeCardObj;

                                        //Save Card Info in DB
                                        self.saveCardInfo(creditCardInfo).then(function(serverCardObj){

                                          self.stripeApiUpdateCustomer(customerId,cardInfo).then(function(serverCustomerObj){
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
                          customerId=serverCusObj._doc.stripeCustomerObject.id;
                          //create Card Stripe
                          self.stripeApiCreateCard(customerId,cardInfo).then(function(stripeCardObj){
                           if(stripeCardObj){

                              var creditCardInfo = new CreditCardInfo();                              
                              creditCardInfo._userId=userId;
                              creditCardInfo.stripeCardObject=stripeCardObj;

                              //Save Card Info in DB
                              self.saveCardInfo(creditCardInfo).then(function(serverCardObj){
                                
                                    self.stripeApiUpdateCustomer(customerId,cardInfo).then(function(serverCustomerObj){
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
                        
                    });  

                }else{
                  var description="Customer for"+userId;
                  //create Stripe Customer
                  self.stripeApiCreateCustomer(description,stripeToken).then(function(stripeCustomerObj){
                    if(stripeCustomerObj){ 

                      var stripeCustomer = new StripeCustomer();                      
                      stripeCustomer._userId=userId;
                      stripeCustomer.stripeCustomerObject=stripeCustomerObj;

                      //Save Customer in DB
                      self.saveCustomer(stripeCustomer).then(function(serverCustomerObj){
                          if(serverCustomerObj){
                              var customerId=serverCustomerObj.stripeCustomerObject.id;
                             
                                //create Card Stripe
                                self.stripeApiCreateCard(customerId,cardInfo).then(function(stripeCardObj){
                                 if(stripeCardObj){

                                    var creditCardInfo = new CreditCardInfo();                                  
                                    creditCardInfo._userId=userId;
                                    creditCardInfo.stripeCardObject=stripeCardObj;

                                    //Save Card Info in DB
                                    self.saveCardInfo(creditCardInfo).then(function(serverCardObj){
                                      deferred.resolve(serverCardObj);
                                    },function(error){ 
                                      deferred.reject(error);
                                    });  

                                 }else{
                                    deferred.reject(null);
                                 }                            

                                },function(error){
                                  deferred.reject(error);                        
                                }); 
                                //End of Stripe
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

                  }//end of else  
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
          }
         
    }

};
