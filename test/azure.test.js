var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Azure', function() {

  describe('PUT /SUBSCRIPTIONS/:SUBSCRIPTION_ID', function() {
    // '/subscriptions/:subscription_id'
  });

  describe('PUT /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name'
  });

  describe('PATCH /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name'
  });

  describe('GET /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name'
  });
  
  describe('GET /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type'
  });

  describe('GET /SUBSCRIPTIONS/:SUBSCRIPTION_ID/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCETYPE', function() {
    // /subscriptions/:subscription_id/providers/:resourceProviderNamespace/:resourceType
  });

  describe('GET /PROVIDERS/:RESOURCEPROVIDERNAMESPACE/OPERATIONS', function() {
    // '/providers/:resourceProviderNamespace/operations'
  });

  describe('POST /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME/LISTSECRETS', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/listSecrets'
  });

  describe('POST /SUBSCRIPTIONS/:SUBSCRIPTION_ID/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/UPDATECOMMUNICATIONPREFERENCE', function() {
    // '/subscriptions/:subscription_id/providers/:resourceProviderNamespace/updateCommunicationPreference'
  });

  describe('POST /SUBSCRIPTIONS/:SUBSCRIPTION_ID/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/LISTCOMMUNICATIONPREFERENCE', function() {
    // '/subscriptions/:subscription_id/providers/:resourceProviderNamespace/listCommunicationPreference'
  });

  describe('POST /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME/REGENERATEKEY', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/RegenerateKey'
  });

  describe('DELETE /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name'
  });

  describe('POST /SUBSCRIPTIONS/:SUBSCRIPTION_ID/RESOURCEGROUPS/:RESOURCEGROUPNAME/PROVIDERS/:RESOURCEPROVIDERNAMESPACE/:RESOURCE_TYPE/:RESOURCE_NAME/LISTSINGLESIGNONTOKEN', function() {
    // '/subscriptions/:subscription_id/resourceGroups/:resourceGroupName/providers/:resourceProviderNamespace/:resource_type/:resource_name/listSingleSignOnToken'
  });

  describe('GET /SSO', function() {
    // '/sso'
  });


});