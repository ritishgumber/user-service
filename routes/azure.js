var winston = require('winston');
var express = require('express');
var app = express();    
var Q = require('q');
var utils = require('../helpers/utils');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var passport = require('passport');
var AzureStoreStrategy = require('passport-azure-store').Strategy;
var xmlBodyParser =require('express-xml-bodyparser');
var pricingPlans = require('../config/pricingPlans.js')();

app.use(xmlBodyParser());

module.exports = function() {  
  app.post('/webhooks/azure/subscriptions/:subscription_id/Events', suscription);
  app.put('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name', createOrUpdateResource);
  app.delete('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name', removeResource);
  app.get('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name',  getResource);
  app.get('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name', getResource);
  
  //SSO
  app.post('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name/SsoToken', getToken);

  app.get('/webhooks/azure/sso',
    passport.authenticate('azure-store'),
    function(req, res, next) {
      if (!req.user) {
        res.status(403).send("");
      }
      req.login(req.user, function(err) {
        if (err) {
          console.log("SSO login failed.");
          return next(err);
        }          
        console.log("SSO Azure successfully logged in");
        return res.status(200).send("");
      });
  });

  return app;
};

function suscription(req, res) {  

  var state = req.body.entityevent.entitystate[0];
  switch (state) {
    case 'Registered':
      onSubscriptionRegistered(req, res);
      break;
    case 'Disabled':
      onSubscriptionDisabled(req, res);
      break;
    case 'Enabled':
      onSubscriptionEnabled(req, res);
      break;
    case 'Deleted':
      onSubscriptionDeleted(req, res);
      break;
  }
}

function onSubscriptionRegistered(req, res) {
  var email=getPropertyFromSubscription(req.body, 'EMail');
  var optin=getPropertyFromSubscription(req.body, 'OptIn');  

  var userData={
    email    : email[0],
    isAdmin  : true,
    provider : "azure",
    azure    : {
                  subscription_id : req.params['subscription_id'],
                  optin           : optin[0]
               }
  };

  global.userService.register(userData).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });
}

function onSubscriptionDisabled(req, res) {

  var query={ "provider.subscription_id": req.params['subscription_id'] };
  var newJson={disabled:true};

  global.projectService.updateProjectBy(query,newJson).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });  
}

function onSubscriptionEnabled(req, res) {
  var query={ "provider.subscription_id": req.params['subscription_id'] };
  var newJson={disabled:false};

  global.projectService.updateProjectBy(query,newJson).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });
}

function onSubscriptionDeleted(req, res) {
  var provider={ "provider.subscription_id": req.params['subscription_id'] };

  global.projectService.getProjectBy(provider)
  .then(function(tenants){

    if(tenants && tenants.length>0){

      var promises=[];
      for(var i=0;i<tenants.length;++i){
        promises.push(global.projectService.deleteProjectBy(criteria));
      }
      Q.all(promises).then(function(list){
        res.status(200).send('Resource has been deleted.');
      },function(error){
        return res.status(500).send(error);
      });

    }else{
      res.status(404).send('No resouces found');
    } 

  },function(error){
    return res.status(500).send(error);
  });
}

function createOrUpdateResource(req, res) {

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.cloud_service_name': req.params['cloud_service_name'],
    'provider.resource_name': req.params['resource_name']
  };


  global.projectService.getProjectBy(criteria).then(function(resources){

    var subscription_id=req.params['subscription_id'];
    var cloud_service_name=req.params['cloud_service_name'];
    var resource_name=req.params['resource_name'];
    var etag=req.body.resource.etag[0];
    var plan=req.body.resource.plan[0];
    var georegion=req.body.resource.cloudservicesettings[0].georegion[0];
    var type=req.body.resource.type[0]; 

    //In case of update
    var updateData = {       
      provider: {
        name: "azure",
        etag: etag,
        subscription_id: subscription_id,
        cloud_service_name: cloud_service_name,
        resource_name: resource_name,          
        geoRegion: georegion,
        resource_type:type
      }     
    };


    if (!resources || resources.length === 0) {      

      createResource(subscription_id, cloud_service_name, resource_name, etag, plan, georegion, type)
      .then(function(response){
        res.setHeader('Content-Type', 'application/xml');        
        return res.status(200).send(utils.loadTemplate('create.xml', { response: response }));         
      },function(error){
        updateData.planId=plan;        
        return res.status(403).send(utils.loadTemplate('createFail.xml', { response: updateData }));
      });

    } else {      

      // this is a chance to update the output items shown in connection info on Azure
      // by returning a different ETag if something changed from the provider side
      // tenant.ETag = 'new-etag-signaling-change'

      var projectId=resources[0]._id;
      var appId=resources[0].appId;  

     
      if(plan){
        var planId=1;
        var tempData=plan;
        if(plan){
          var data=Number(plan);        
          if(data.toString()!=tempData){ 
            var planId=1;         
          }else{
            planId=Number(plan); 
          }
        }

        updateData.planId=planId;
      }
     
      global.projectService.findOneAndUpdateProject(projectId,updateData).then(function(updatedProj){
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(utils.loadTemplate('getResource.xml', { resource: updatedProj}));       
      },function(error){
        return res.status(500).send("Upgrade failed");
      }); 

    }
  });  
}

function createResource(subscription_id, cloud_service_name, resource_name, etag, plan, georegion, type) {
  var deferred = Q.defer();

  var criteria = { "azure.subscription_id": subscription_id };

  var currentUser=null;

  global.userService.getUserBy(criteria).then(function(user){
    currentUser=user;

    if(!user){
      var noUserDataDeferred = Q.defer();
      noUserDataDeferred.reject('No user is found for ' + subscription_id);
      return noUserDataDeferred.promise;
    }else{     
      //Check resource name already been in use
      return global.projectService.getProjectBy({"provider.resource_name": resource_name,"provider.subscription_id":subscription_id});      
    }  
  }).then(function(project){
      var isAlreadyInUse=false;
      if(project && project.provider && project.provider.resource_name){
        isAlreadyInUse=true;
      }

      if(isAlreadyInUse){
        var alreadyDeferred = Q.defer();
        alreadyDeferred.reject('This Resource name already being used ' + resource_name);
        return alreadyDeferred.promise;
      }else{
        var tenant = {       
          provider: {
            name: "azure",
            etag: etag,
            subscription_id: subscription_id,
            cloud_service_name: cloud_service_name,
            resource_name: resource_name,          
            geoRegion: georegion,
            resource_type:type
          }      
        };

        if(plan){
          var planId=1;
          var tempData=plan;
          if(plan){
            var data=Number(plan);        
            if(data.toString()!=tempData){ 
              var planId=1;         
            }else{
              planId=Number(plan); 
            }
          }

          tenant.planId=planId;
        }

        return global.projectService.createProject(resource_name, currentUser._id, tenant);
      }
      
  }).then(function(doc){
    deferred.resolve(doc);
  },function(error){
    deferred.reject(error);
  });

  return deferred.promise;
}

function getResource(req, res, next) {
 
  var resourceNameWise=false;

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.cloud_service_name': req.params['cloud_service_name']
  };

  if (req.params['resource_name']) {
    criteria['provider.resource_name'] = req.params['resource_name'];
    resourceNameWise=true;
  }

  global.projectService.getProjectBy(criteria).then(function(resources){
    if(resources && resources.length){
      console.log('azure: resources in db', resources.length);
      res.setHeader('Content-Type', 'application/xml');


      if(resourceNameWise){
        return res.status(200).send(utils.loadTemplate('getResource.xml', { resource: resources[0] }));
      }else{
        return res.status(200).send(utils.loadTemplate('getCloudService.xml', { listResources: resources }));
      }
      
    }else{
      return res.status(404).send('No resources found.');
    }
    
  },function(error){
    return res.status(404).send('');
  });
}

function removeResource(req, res, next) {
  
  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.cloud_service_name': req.params['cloud_service_name']
  };

  if (req.params['resource_name']){
   criteria['provider.resource_name'] = req.params['resource_name'];
  } 

  global.projectService.getProjectBy(criteria)
  .then(function(tenants){

    if(tenants && tenants.length>0){

      var promises=[];
      for(var i=0;i<tenants.length;++i){
        promises.push(global.projectService.deleteProjectBy(criteria));
      }
      Q.all(promises).then(function(list){
        res.status(200).send('Resource has been deleted.');
      },function(error){
        return res.status(500).send(error);
      });

    }else{
      res.status(404).send('No resouces found');
    }   

  },function(error){
    return res.status(500).send(error);
  });
}

function getToken(req, res, next) {
  var secret = "azure-cloudboost";
  var toSign = req.params['subscription_id'] + ':' +
            req.params['cloud_service_name'] + ':' +
            req.params['resource_type'] + ':' +
            req.params['resource_name'] + ':' +
            secret;

  var token = crypto.createHash("sha256").update(toSign).digest("hex");

  var response = utils.loadTemplate('sso.xml', { token: token, timestamp: moment().format() });  
  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(response);
}


/********Private Functions*************/
function getPropertyFromSubscription(reqJSON, propName){
  var emails = reqJSON.entityevent.properties[0].entityproperty
        .filter(function (prop) {
          return prop.propertyname[0] === propName;
        }).map(function (prop) {
          return prop.propertyvalue[0];
        });

  return emails;
}

