var winston = require('winston');
var express = require('express');
var app = express();    
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

function getPropertyFromSubscription(reqJSON, propName){
  var emails = reqJSON.entityevent.properties[0].entityproperty
        .filter(function (prop) {
          return prop.propertyname[0] === propName;
        }).map(function (prop) {
          return prop.propertyvalue[0];
        });

  return emails;
}

function suscription(req, res, next) {
  winston.debug('registering subscription', { subscription_id: req.params['subscription_id'] });

  var state = req.body.entityevent.entitystate[0];
  switch (state) {
    case 'Registered':
      onSubscriptionRegistered(req, res, next);
      break;
    case 'Disabled':
      onSubscriptionDisabled(req, res, next);
      break;
    case 'Enabled':
      onSubscriptionEnabled(req, res, next);
      break;
    case 'Deleted':
      onSubscriptionDeleted(req, res, next);
      break;
  }
}

function onSubscriptionRegistered(req, res, next) {
  var hookData = {
    subscription_id: req.params['subscription_id'],
    email: getPropertyFromSubscription(req.body, 'EMail'),
    optin: getPropertyFromSubscription(req.body, 'OptIn')
  };

  global.azureSubscriptionService.create(hookData, function(err) {
      if (err) {
        return next(err);
      }
      
      res.status(200).send("");
  });
}

function onSubscriptionDisabled(req, res, next) {
  global.azureResourceService.disableBy({ "azure.subscription_id": req.params['subscription_id'] }, function(err) {
    if (err) return next(err);

    res.status(200).send('');
  });
}

function onSubscriptionEnabled(req, res, next) {
  global.azureResourceService.enableBy({ "azure.subscription_id": req.params['subscription_id'] }, function(err) {
    if (err) return next(err);

    res.send(200, '');
  });
}

function onSubscriptionDeleted(req, res, next) {
  global.azureResourceService.getBy({ "azure.subscription_id": req.params['subscription_id'] }, function(err, tenants) {
    if (err) return next(err);

    function remove(tenant, cb) {
      global.azureResourceService.remove(tenant.slug, cb);
    }

    async.forEach(tenants, remove, function(err, results) {
      res.send(200, '');
    });
  });
}

function createOrUpdateResource(req, res, next) {
  winston.debug('azure: create or update', { body: req.body, params: req.params['subscription_id'] });

  var criteria = {
    "azure.subscription_id": req.params['subscription_id'],
    "azure.cloud_service_name": req.params['cloud_service_name'],
    "azure.resource_name": req.params['resource_name']
  };
  
  global.azureResourceService.getBy(criteria, function(err, resources) {
    if (err) return next(err);

    if (!resources || resources.length === 0) {
      winston.debug('azure: creating resource', req.body);
      createResource(req.params['subscription_id'], req.params['cloud_service_name'], req.params['resource_name'], req.body.resource.etag[0], function(err, resource) {
        if (err) return next(err);

        renderResponse(resource, function(err, response) {
          if (err) return next(err);

          res.setHeader('Content-Type', 'application/xml');
          return res.status(200).send(response);
        });
      });
    } else {
      var tenant = resources[0];
      winston.debug('azure: updating resource', tenant);
      // TODO: this is a chance to update the output items shown in connection info on Azure
      // by returning a different ETag if something changed from the provider side
      // tenant.ETag = 'new-etag-signaling-change'

      /*renderResponse(resource, function(err, response) {
        if (err) return next(err);

        res.setHeader('Content-Type', 'application/xml');
        return res.send(200, response);
      });*/

      return res.status(200).send("DFCFFF");
    }
  });
}

function renderResponse(resource, callback) {
  winston.debug('azure: render create update res', resource);

  var data = {
    resource_name: resource.azure.resource_name,
    ETag: resource.azure.etag
    // extra parameters you want to send in OutputItems
  };

  return callback(null, utils.loadTemplate('create.xml', data));
}

function createResource(subscription_id, cloud_service_name, resource_name, etag, callback) {
  var criteria = { subscription_id: subscription_id };

  global.azureSubscriptionService.get(criteria, function(err, hookData) {
    if (err) return callback(err);

    if (!hookData) return callback(new Error('hook data is null for ' + subscription_id));

    // make sure tenant is not being used
   global.azureResourceService.getNextAvailable(utils.slugify(resource_name), function(err, slug) {
      if (err) return callback(err);

      var tenant = {
        _id:  slug,
        slug: slug,
        azure: {
          etag: etag,
          subscription_id: subscription_id,
          cloud_service_name: cloud_service_name,
          resource_name: resource_name
        }
      };

      global.azureResourceService.create(tenant, function (err, resource) {
        if (err) {
          winston.error('azure: create tenant', err);
          return callback(err);
        }

        return callback(null, resource);
      });
    });
  });
}

function getResource(req, res, next) {
  winston.debug('azure: get resource');
  
  var criteria = {
    'azure.subscription_id': req.params['subscription_id'],
    'azure.cloud_service_name': req.params['cloud_service_name']
  };
  if (req.params['resource_name']) criteria['azure.resource_name'] = req.params['resource_name'];

  global.azureResourceService.getBy(criteria, function(err, resources) {
    if (err) return next(err);
    if (!resources) return res.send(404, '');

    winston.debug('azure: resources in db', resources.length);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(utils.loadTemplate('get.xml', { resources: resources }));
  });
}

function removeResource(req, res, next) {
  winston.debug('azure: delete resource');
  
  var criteria = {
    'azure.subscription_id': req.params['subscription_id'],
    'azure.cloud_service_name': req.params['cloud_service_name']
  };
  if (req.params['resource_name']) criteria['azure.resource_name'] = req.params['resource_name'];

  global.azureResourceService.getBy(criteria, function(err, resources) {
    if (err) return next(err);

    if (!resources || resources.length === 0) {
      return res.send(404, '');
    }
    
    function remove(tenant, cb) {
      global.azureResourceService.remove(tenant.slug, cb);
    }

    async.forEach(resources, remove, function(err, results) {
      res.status(200).send('');
    });

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
  winston.debug('azure: sso token response', response);
  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(response);
}

