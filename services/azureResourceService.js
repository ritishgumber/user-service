'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(AzureResource){

  var tenants={};

  tenants.create = function(tenant) {
    console.log("Create Azure Resource..");

    var _self = this;

    var deferred = Q.defer();

    try{     

      var resource = new AzureResource();
      resource.slug=tenant.slug;
      resource.azure=tenant.azure;
      resource.enabled=tenant.enabled;

      resource.save(function (err, doc) {
        if (err){ 
          console.log("Error on Create Azure Resource..");
          deferred.reject(err);
        }
        if(!doc){
          console.log("Cannot save the Azure Resource right now.");
          deferred.reject('Cannot save the Azure Resource right now.');
        }
        else{
          console.log("Successfully created the Azure Resource");
          deferred.resolve(doc);
        }
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
  };

  tenants.getBy = function(criteria) {
    console.log("Get Azure Resource..");

    var _self = this;

    var deferred = Q.defer();

    try{
      var self = this;

      AzureResource.find(criteria, function (err, list) {
        if (err){ 
          console.log("Error get Azure Resource");
          deferred.reject(err);
        }  
        if(list && list.length>0){
           console.log("Successfully get Azure Resource");
          deferred.resolve(list);
        }else{
          console.log("Azure Resource empty");
          deferred.resolve(null);
        }
             
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
  };

  tenants.removeBy = function(criteria) {
    console.log("remove Azure Resource..");

    var deferred = Q.defer();

    try{

      AzureResource.remove(criteria, function (err) {
        if(err){   
          console.log("Error on remove Azure Resource..");       
          deferred.reject(err);
        }else{
          console.log("Success remove Azure Resource..");
          deferred.resolve({message:"Success."});
        }
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
      deferred.reject(err)         
    }
    
    return deferred.promise;
  };

  tenants.disableBy = function(criteria) {
    console.log("Find and disable Azure Resource...");

    var deffered = Q.defer();

    try{
      var self = this;              

      AzureResource.findOneAndUpdate(criteria, { $set: {enabled:false}},{new:true},function (err, doc) {
        if (err) {   
          console.log("Error on Find and disabling Azure Resource...");               
          return deffered.reject(err);         
        }
        if (!doc) { 
          console.log("Azure Resource not found for ..Find and disabling Azure Resource...");                 
          return deffered.reject(null);
        }   

        console.log("Success on Find and disabling Azure Resource...");             
        return deffered.resolve(doc);                    
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
      deffered.reject(err)         
    }

    return deffered.promise;
  };

  tenants.enableBy = function(criteria) {
    console.log("Find and enable Azure Resource...");

    var deffered = Q.defer();

    try{
      var self = this;              

      AzureResource.findOneAndUpdate(criteria, { $set: {enabled:true}},{new:true},function (err, doc) {
        if (err) {   
          console.log("Error on Find and enable Azure Resource...");               
          return deffered.reject(err);         
        }
        if (!doc) { 
          console.log("Azure Resource not found for ..Find and enable Azure Resource...");                 
          return deffered.reject(null);
        }   

        console.log("Success on Find and enable Azure Resource...");             
        return deffered.resolve(doc);                    
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
      deffered.reject(err)         
    }

    return deffered.promise;
  };

  tenants.updateBy = function(criteria, document) {
    console.log("Find and update Azure Resource...");

    var deffered = Q.defer();

    try{
      var self = this;              

      AzureResource.findOneAndUpdate(criteria, { $set: document},{new:true},function (err, doc) {
        if (err) {   
          console.log("Error on Find and update Azure Resource...");               
          return deffered.reject(err);         
        }
        if (!doc) { 
          console.log("Azure Resource not found for ..Find and update Azure Resource...");                 
          return deffered.reject(null);
        }   

        console.log("Success on Find and update Azure Resource...");             
        return deffered.resolve(doc);                    
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
      deffered.reject(err)         
    }

    return deffered.promise;
  };

  tenants.get = function(slug) {
    // TODO    
  };
    
  tenants.getNextAvailable = function(slug) {
    var deffered = Q.defer();

    var _self=this;

    try{
      var criteria={slug:slug};

      tenants.getBy(criteria).then(function(list){      
        if(list && list.length>0){
          deffered.reject("This resource name already existed");
        }else{
          deffered.resolve(slug);
        }
      },function(error){
        deffered.reject(error);
      });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deffered.reject(err);
    }

    return deffered.promise;
  };

      
  return tenants;

};
