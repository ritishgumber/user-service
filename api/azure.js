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
var xmlBodyParser = require('express-xml-bodyparser');
var pricingPlans = require('../config/pricingPlans.js')();

app.use(xmlBodyParser());

module.exports = function () {
  app.put('/subscriptions/:subscription_id', subscription);
  app.put('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name', createOrUpdateResource);
  app.put('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name', createOrUpdateResource);
  app.get('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name', getResource);
  app.get('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type', getResource);
  app.get('/subscriptions/:subscription_id/providers/:resourceProviderNamespace/:resourceType', getResource);
  app.post('/subscriptions/:subscription_id/resourcegroups/:resourceGroupName/moveResources', moveResources);
  app.post('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/listSecrets', getListofSecrets);
  app.post('/subscriptions/:subscription_id/providers/:resourceProviderNamespace/updateCommunicationPreference', updateCommunicationPreference);
  app.post('/subscriptions/:subscription_id/providers/:resourceProviderNamespace/listCommunicationPreference', getCommunicationPreference);
  app.post('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/RegenerateKey', RegenerateKeys);
  app.delete('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name', removeResource);
  app.get('/providers/:resourceProviderNamespace/operations', getOperations);
  //SSO
  app.post('/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/listSingleSignOnToken', getNewToken);
  app.get('/sso',

    passport.authenticate('azure-store'),
    function (req, res, next) {
      if (!req.user) {
        res.status(403).send("");
      }
      req.login(req.user, function (err) {
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

function subscription(req, res) {

  var state = req.body.state;
  switch (state) {
    case 'Registered':
      onSubscriptionRegistered(req, res);
      break;
    case 'Suspended':
      onSubscriptionSuspended(req, res);
      break;
    case 'Unregistered':
      onSubscriptionUnregistered(req, res);
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

  var RegistrationDate = req.body.RegistrationDate;
  var tenantId = req.body.Properties.tenantId;
  var LocationPlacementId = req.body.Properties.LocationPlacementId;
  var QuotaId = req.body.Properties.QuotaId;
  var userData = {
    isAdmin: true,
    provider: "azure",
    azure: {
      subscription_id: req.params['subscription_id'],
      RegistrationDate: RegistrationDate,
      tenantId: tenantId,
      LocationPlacementId: LocationPlacementId,
      QuotaId: QuotaId,
    }
  };

  global.userService.azureregister(userData).then(function (doc) {
    res.status(200).json(doc);
  }, function (error) {
    return res.status(500).send(error);
  });
}

function onSubscriptionSuspended(req, res) {

  var query = { "provider.subscription_id": req.params['subscription_id'] };
  var newJson = { disabled: true };

  global.projectService.updateProjectBy(query, newJson).then(function (doc) {
    res.status(200).json(doc);
  }, function (error) {
    return res.status(500).send(error);
  });
}

function onSubscriptionUnregistered(req, res) {
  var tenantId = req.body.Properties.tenantId;
  var query = { "azure.tenantId": tenantId };
  var newJson = { isActive: false };

  global.userService.getAzureUserByTenantId(query, newJson).then(function (data) {
    res.status(200).json(data);
  }, function (error) {
    return res.status(500).send(error);
  });
}

function onSubscriptionEnabled(req, res) {
  var query = { "provider.subscription_id": req.params['subscription_id'] };
  var newJson = { disabled: false };

  global.projectService.updateProjectBy(query, newJson).then(function (doc) {
    res.status(200).json(doc);
  }, function (error) {
    return res.status(500).send(error);
  });
}

function onSubscriptionDeleted(req, res) {
  var provider = { "provider.subscription_id": req.params['subscription_id'] };

  global.projectService.getProjectBy(provider)
    .then(function (tenants) {

      if (tenants && tenants.length > 0) {

        var promises = [];
        for (var i = 0; i < tenants.length; ++i) {
          promises.push(global.projectService.deleteProjectBy(criteria));
        }
        Q.all(promises).then(function (list) {
          res.status(200).send('Resource has been deleted.');
        }, function (error) {
          return res.status(500).send(error);
        });

      } else {
        res.status(404).send('No resouces found');
      }

    }, function (error) {
      return res.status(500).send(error);
    });
}

function createOrUpdateResource(req, res) {

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName'],
    'provider.resourceProviderNamespace': req.params['resourceProviderNamespace'],
    'provider.resource_name': req.params['resource_name']
  };


  global.projectService.getProjectBy(criteria).then(function (resources) {

    var subscription_id = req.params['subscription_id'];
    var resourceGroupName = req.params['resourceGroupName'];
    var resourceProviderNamespace = req.params['resourceProviderNamespace'];
    var resource_name = req.params['resource_name'];
    var tags = req.body.tags;
    var plan = req.body.plan;
    var georegion = req.body.location;
    var type = req.params.resource_type;

    //In case of update
    var updateData = {
      provider: {
        name: "azure",
        tags: tags,
        subscription_id: subscription_id,
        resourceGroupName: resourceGroupName,
        resourceProviderNamespace: resourceProviderNamespace,
        resource_name: resource_name,
        geoRegion: georegion,
        resource_type: type,
        plan: plan
        
      }
    };


    if (!resources || resources.length === 0) {

      createResource(subscription_id, resourceGroupName, resourceProviderNamespace, resource_name, tags, plan, georegion, type)
        .then(function (response) {
          res.setHeader('Content-Type', 'application/xml');
          return res.status(200).send(utils.loadTemplate('create.xml', { response: response }));
        }, function (error) {
          updateData.planId = plan;
          return res.status(403).send(utils.loadTemplate('createFail.xml', { response: updateData }));
        });

    } else {

      // this is a chance to update the output items shown in connection info on Azure
      // by returning a different ETag if something changed from the provider side
      // tenant.ETag = 'new-etag-signaling-change'

      var projectId = resources[0]._id;
      var appId = resources[0].appId;


      if (tags) {
        var planId = 1;
        var tempData = tags;
        if (tags.planId != null) {
          var data = Number(tags.planId);
          if (data.toString() != tempData.planId) {
            var planId = 1;
          } else {
            planId = Number(tags.planId);
          }
          updateData.planId = planId;
        } else {
          updateData = updateData;
        }
      }

      global.projectService.findOneAndUpdateProject(projectId, updateData).then(function (updatedProj) {
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(utils.loadTemplate('getResource.xml', { resource: updatedProj }));
      }, function (error) {
        return res.status(500).send("Upgrade failed");
      });

    }
  });
}

function createResource(subscription_id, resourceGroupName, resourceProviderNamespace, resource_name, tags, plan, georegion, type) {
  var deferred = Q.defer();

  var criteria = { "azure.subscription_id": subscription_id };

  var currentUser = null;

  global.userService.getUserBy(criteria).then(function (user) {
    currentUser = user;

    if (!user) {
      var noUserDataDeferred = Q.defer();
      noUserDataDeferred.reject('No user is found for ' + subscription_id);
      return noUserDataDeferred.promise;
    } else {
      //Check resource name already been in use
      return global.projectService.getProjectBy({ "provider.resource_name": resource_name, "provider.subscription_id": subscription_id });
    }
  }).then(function (project) {
    var isAlreadyInUse = false;
    if (project && project.provider && project.provider.resource_name) {
      isAlreadyInUse = true;
    }

    if (isAlreadyInUse) {
      var alreadyDeferred = Q.defer();
      alreadyDeferred.reject('This Resource name already being used ' + resource_name);
      return alreadyDeferred.promise;
    } else {
      var tenant = {
        provider: {
          name: "azure",
          tags: tags,
          subscription_id: subscription_id,
          resourceGroupName: resourceGroupName,
          resourceProviderNamespace: resourceProviderNamespace,
          resource_name: resource_name,
          geoRegion: georegion,
          resource_type: type,
          plan: plan
        }
      };

      if (plan) {
        var planId = 1;
        var tempData = plan;
        if (plan) {
          var data = Number(plan);
          if (data.toString() != tempData) {
            var planId = 1;
          } else {
            planId = Number(plan);
          }
        }

        tenant.planId = planId;
      }

      return global.projectService.createProject(resource_name, currentUser._id, tenant);
    }

  }).then(function (doc) {
    deferred.resolve(doc);
  }, function (error) {
    deferred.reject(error);
  });

  return deferred.promise;
}

function getResource(req, res, next) {

  var resourceNameWise = false;

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
  };
  if (req.params['resourceGroupName']) {
    criteria = {
      'provider.subscription_id': req.params['subscription_id'],
      'provider.resourceGroupName': req.params['resourceGroupName']
    };
  }
  if (req.params['resource_name']) {
    criteria['provider.resource_name'] = req.params['resource_name'];
    resourceNameWise = true;
  }

  global.projectService.getProjectBy(criteria).then(function (resources) {
    if (resources && resources.length) {
      console.log('azure: resources in db', resources.length);
      res.setHeader('Content-Type', 'application/xml');


      if (resourceNameWise) {
        return res.status(200).send(utils.loadTemplate('getSingleResource.xml', { resource: resources[0] }));
      } else {
        return res.status(200).send(utils.loadTemplate('getCloudService.xml', { listResources: resources }));
      }

    } else {
      return res.status(404).send('No resources found.');
    }

  }, function (error) {
    return res.status(404).send('');
  });
}

function getListofSecrets(req, res, next) {

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName'],
    'provider.resource_name': req.params['resource_name']
  };
  global.projectService.getProjectBy(criteria).then(function (resources) {
    if (resources && resources.length) {
      console.log('azure: resources in db', resources.length);
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(utils.loadTemplate('getListofSecrets.xml', { resource: resources[0] }));
    } else {
      return res.status(404).send('No resources found.');
    }

  }, function (error) {
    return res.status(404).send('');
  });
}

function updateCommunicationPreference(req, res) {
  var query = {
    "azure.subscription_id": req.params['subscription_id']
  }
  var name = req.body.FirstName + " " + req.body.LastName;
  var email = req.body.Email;
  var OptInForCommunication = req.body.OptInForCommunication;
  var userData = {
    name: name,
    email: email,
    "azure.OptInForCommunication": OptInForCommunication,
  };

  global.userService.UpdateAccountBySubscription(query, userData).then(function (doc) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(utils.loadTemplate('updateCommunicationPreference.xml', { doc: doc }));
  }, function (error) {
    return res.status(500).send(error);
  });
}

function getCommunicationPreference(req, res) {
  var query = {
    "azure.subscription_id": req.params['subscription_id']
  }

  global.userService.getAccountBySubscription(query).then(function (doc) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(utils.loadTemplate('updateCommunicationPreference.xml', { doc: doc }));
  }, function (error) {
    return res.status(500).send(error);
  });
}

function getOperations(req, res, next) {
  return res.status(200).json("Testing");
}
//----------------------------------------------------------RegenerateKeys--------------------------
function RegenerateKeys(req, res, next) {
  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName'],
    'provider.resource_name': req.params['resource_name']
  };

  global.projectService.RegenerateKeys(criteria).then(function (response) {
    res.status(200).json(response);
  }, function (error) {
    return res.status(500).send(error);
  });
}




//------------------------------------------------Move Resource--------------------------------------
function moveResources(req, res, next) {
  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName']
  };
  var resouces;
  var OldResource = req.body.resources;
  var targetResourceGroup = req.body.targetResourceGroup;

  global.projectService.getProjectBy(criteria).then(function (resources) {
     res.status(200).send(utils.loadTemplate('getCloudService.xml', { listResources: resources }));
  }, function (error) {
    return res.status(404).send('');
  });
}
//-----------------------------------------------End Move Resource------------------------------------



function removeResource(req, res, next) {

  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName']
  };

  if (req.params['resource_name']) {
    criteria['provider.resource_name'] = req.params['resource_name'];
  }

  global.projectService.getProjectBy(criteria)
    .then(function (tenants) {

      if (tenants && tenants.length > 0) {

        var promises = [];
        for (var i = 0; i < tenants.length; ++i) {
          promises.push(global.projectService.deleteProjectBy(criteria));
        }
        Q.all(promises).then(function (list) {
          res.status(200).send('Resource has been deleted.');
        }, function (error) {
          return res.status(500).send(error);
        });

      } else {
        res.status(404).send('No resouces found');
      }

    }, function (error) {
      return res.status(500).send(error);
    });
}



function getNewToken(req, res, next) {
  var secret = "azure-cloudboost";
  var toSign = req.params['subscription_id'] + ':' +
    req.params['resourceGroupName'] + ':' +
    req.params['resourceProviderNamespace'] + ':' +
    req.params['resource_type'] + ':' +
    req.params['resource_name'] + ':' +
    secret;
  var criteria = {
    'provider.subscription_id': req.params['subscription_id'],
    'provider.resourceGroupName': req.params['resourceGroupName'],
    'provider.resource_name': req.params['resource_name']
  };
  var token = crypto.createHash("sha256").update(toSign).digest("hex");
  global.projectService.getProjectBy(criteria).then(function (resources) {
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(utils.loadTemplate('sso.xml', { resources: resources[0], token: token }));
  }, function (error) {
    return res.status(404).send('');
  });
}

/********Private Functions*************/
function getPropertyFromSubscription(reqJSON, propName) {
  if (propName === "OptIn") {
    var OptIn = reqJSON.Properties.propName;
    return OptIn;
  } else {
    var email = reqJSON.Properties.propName;
    return email;
  }
}

