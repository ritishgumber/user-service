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

app.use(xmlBodyParser());

passport.use(new AzureStoreStrategy({
  secret: "azure-cloudboost",
  check_expiration: true
}, function(req, azureInfo, done) {
  var user_id = azureInfo.subscription_id + '_' + azureInfo.cloud_service_name + '_' + azureInfo.resource_name; // you can do anything with this data, typically you would have to find the user based on this data somehow
  // lookup in DB
  done(null, user);
}));

module.exports = function() {  
  app.post('/webhooks/azure/subscriptions/:subscription_id/Events', suscription);
  app.put('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name', createOrUpdateResource);
  app.delete('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name', removeResource);
  app.get('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name',  getResource);
  app.get('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name', getResource);
  
  // sso
  app.post('/webhooks/azure/subscriptions/:subscription_id/cloudservices/:cloud_service_name/resources/:resource_type/:resource_name/SsoToken', getToken);

  app.get('/webhooks/azure/sso',
    passport.authenticate('azure-store'),
    function(req, res) {
      if (!req.user)
        res.redirect('/login'); // whatever

      next();
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

  var hookData = {
    subscription_id: req.params['subscription_id'],
    email: email[0],
    optin: optin[0] 
  };

  global.azureSubscriptionService.create(hookData).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });
}

function onSubscriptionDisabled(req, res) {
  global.azureResourceService.disableBy({ "azure.subscription_id": req.params['subscription_id'] }).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });  
}

function onSubscriptionEnabled(req, res) {
  global.azureResourceService.enableBy({ "azure.subscription_id": req.params['subscription_id'] }).then(function(doc){
    res.status(200).json(doc);
  },function(error){
    return res.status(500).send(error);
  });
}

function onSubscriptionDeleted(req, res) {
  global.azureResourceService.getBy({ "azure.subscription_id": req.params['subscription_id'] })
  .then(function(tenants){

    var promises=[];
    for(var i=0;i<tenants.length;++i){
      promises.push(global.azureResourceService.remove({slug:tenants[i].slug}));
    }

    Q.all(promises).then(function(list){
      res.status(200).send('Resource has been deleted.');
    },function(error){
      return res.status(500).send(error);
    });

  },function(error){
    return res.status(500).send(error);
  });
}

function createOrUpdateResource(req, res) {
  var criteria = {
    "azure.subscription_id": req.params['subscription_id'],
    "azure.cloud_service_name": req.params['cloud_service_name'],
    "azure.resource_name": req.params['resource_name']
  };
  
  global.azureResourceService.getBy(criteria).then(function(resources){
    if (!resources || resources.length === 0) {
     
      var subscription_id=req.params['subscription_id'];
      var cloud_service_name=req.params['cloud_service_name'];
      var resource_name=req.params['resource_name'];
      var etag=req.body.resource.etag[0];
      var plan=req.body.resource.plan[0];
      var georegion=req.body.resource.cloudservicesettings[0].georegion[0];
      var type=req.body.resource.type[0]; 

      createResource(subscription_id, cloud_service_name, resource_name, etag, plan, georegion, type)
      .then(function(resource){
        return renderResponse(resource);
      }).then(function(response){
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(response);
      },function(error){
        return res.status(500).send(error);
      });

    } else {      

      // this is a chance to update the output items shown in connection info on Azure
      // by returning a different ETag if something changed from the provider side
      // tenant.ETag = 'new-etag-signaling-change'         

      var azure= {
          etag: etag,
          subscription_id: subscription_id,
          cloud_service_name: cloud_service_name,
          resource_name: resource_name,
          plan: plan,
          geoRegion: georegion,
          type:type
      };
      global.azureResourceService.updateBy(criteria,{azure:azure}).then(function(resources){
        return renderResponse(resource);      
      }).then(function(){
        res.setHeader('Content-Type', 'application/xml');
        return res.send(200, response);
      },function(error){
        return res.status(500).send(error);
      });      
    }
  });  
}

function createResource(subscription_id, cloud_service_name, resource_name, etag, plan, georegion, type) {
  var deferred = Q.defer();

  var criteria = { subscription_id: subscription_id };

  global.azureSubscriptionService.get(criteria).then(function(hookData){
    if(!hookData){
      var nullHookDatadeferred = Q.defer();
      nullHookDatadeferred.reject('No subscription is found for ' + subscription_id);
      return nullHookDatadeferred.promise;
    }else{
      // make sure tenant is not being used
      return global.azureResourceService.getNextAvailable(utils.slugify(resource_name));
    }
  }).then(function(slug){
      var tenant = {       
        slug: slug,
        azure: {
          etag: etag,
          subscription_id: subscription_id,
          cloud_service_name: cloud_service_name,
          resource_name: resource_name,
          plan: plan,
          geoRegion: georegion,
          type:type
        },
        enabled: true
      };
      return global.azureResourceService.create(tenant);
  }).then(function(doc){
    deferred.resolve(doc);
  },function(error){
    deferred.reject(error);
  });

  return deferred.promise;
}

function getResource(req, res, next) {
  winston.debug('azure: get resource');
  
  var criteria = {
    'azure.subscription_id': req.params['subscription_id'],
    'azure.cloud_service_name': req.params['cloud_service_name']
  };

  if (req.params['resource_name']) {
    criteria['azure.resource_name'] = req.params['resource_name'];
  }

  global.azureResourceService.getBy(criteria).then(function(resources){
    console.log('azure: resources in db', resources.length);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(utils.loadTemplate('get.xml', { resources: resources }));
  },function(error){
    return res.status(404).send('');
  });
}

function removeResource(req, res, next) {
  winston.debug('azure: delete resource');
  
  var criteria = {
    'azure.subscription_id': req.params['subscription_id'],
    'azure.cloud_service_name': req.params['cloud_service_name']
  };

  if (req.params['resource_name']){
   criteria['azure.resource_name'] = req.params['resource_name'];
  } 

  global.azureResourceService.getBy(criteria)
  .then(function(tenants){

    var promises=[];
    for(var i=0;i<tenants.length;++i){
      promises.push(global.azureResourceService.remove({slug:tenants[i].slug}));
    }

    Q.all(promises).then(function(list){
      res.status(200).send('Resource has been deleted.');
    },function(error){
      return res.status(500).send(error);
    });

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

function renderResponse(resource) {

  var deferred = Q.defer();

    var data = {
      resource_name: resource.azure.resource_name,
      ETag: resource.azure.etag
      // extra parameters you want to send in OutputItems
    };

    deferred.resolve(utils.loadTemplate('create.xml', data));
    
  return deferred.promise;  
}