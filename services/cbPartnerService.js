'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var keys = require('../config/keys');


module.exports = function(CbPartner){

  return {

    save: function (data) {

        console.log("CloudBoost Form Save");

        var _self = this;

        var deferred = Q.defer();      

        try{          

            CbPartner.findOne({companyEmail:data.companyEmail}, function (err, partner) {
                if (err) { 
                  console.log("Error on check duplicate email of CloudBoost partner form save");
                  return deferred.reject(err); 
                }
                if (partner) {
                  console.log('This Business email already subscribed to cloudboost.');
                  return deferred.reject({Error:'This Business email already subscribed to cloudboost.'});
                }

                if(!partner){

                     var cbPartner = new CbPartner();
                     cbPartner.companyName=data.companyName;
                     cbPartner.companyDescription=data.companyDescription;
                     cbPartner.personName=data.personName;
                     cbPartner.companyEmail=data.companyEmail;
                     cbPartner.companyContact=data.companyContact;
                     cbPartner.personMobile=data.personMobile;
                     cbPartner.companyAddress=data.companyAddress;
                     cbPartner.companyWebsite=data.companyWebsite;                     
                     cbPartner.companyCountry=data.companyCountry;
                     cbPartner.appSpecilizedIn=data.appSpecilizedIn;
                     cbPartner.companySize=data.companySize;
                     cbPartner.createdAt=new Date();                  

                     cbPartner.save(function (err) {
                        if (err){
                          console.log("Error on CloudBoost Form Save");
                          deferred.reject(err);
                        } else{                 
                         
                          console.log("Success on CloudBoost Form Save..");

                          var partnersListId="4c5ae5e681";       
                          global.mailChimpService.addSubscriber(partnersListId,data.companyEmail);
                          global.mailService.sendTextMail(keys.adminEmailAddress,keys.adminEmailAddress, "CloudBoost Partner Application", JSON.stringify(cbPartner));
                          deferred.resolve({message:"Success","id":cbPartner._id});
                        } 
                     });
                }                                       
            });         

        }catch(err){        
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});
          deferred.reject(err);
        }

        return deferred.promise;
    }, 

    getById: function (partnerId) {

        console.log("Get CloudBoost Partner By Id Service");

        var _self = this;

        var deferred = Q.defer();      

        try{          

            CbPartner.findById(partnerId, function (err, partner) {
                if (err) { 
                  console.log("Error on Get CloudBoost Partner By Id Service");
                  return deferred.reject(err); 
                }
                if (!partner) {
                  console.log('Incorrect ID');
                  return deferred.reject('Incorrect ID');
                }   

                console.log("Success on Get CloudBoost Partner By Id Service");                     
                return deferred.resolve(partner._doc);                      
            });

        }catch(err){        
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});
          deferred.reject(err);
        }

        return deferred.promise;
    },

    getList: function (skip,limit) {

        console.log("Get CloudBoost Partner List Service");

        var _self = this;

        var deferred = Q.defer();      

        try{            

            if(!skip){
              skip=0;
            }

            if(!limit){
              limit=9999999;
            }

            if(skip){
              skip=parseInt(skip);
            }

            if(limit){
              limit=parseInt(limit);
            }

            CbPartner.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }). exec(function (err, partnerList) {
                if (err) { 
                  console.log("Error on CloudBoost Partner List Service");
                  return deferred.reject(err); 
                }                 

                console.log("Success on CloudBoost Partner List Service");                     
                deferred.resolve(partnerList);                      
            }); 

        }catch(err){        
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});
          deferred.reject(err);
        }

        return deferred.promise;
    }
  }

};
