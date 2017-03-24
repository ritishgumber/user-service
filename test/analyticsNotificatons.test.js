var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Analytics Notifications', function() {

  describe('/:APPID/NOTIFICATIONS/OVER80', function() {
    // '/:appId/notifications/over80'
    it('should send notifications when 80% usage', function(done) {
      done();
    });
  });

  describe('/:APPID/NOTIFICATIONS/OVER100', function() {
    // '/:appId/notifications/over100'
    it('should send notifications when 100% usage', function(done) {
      done();
    });
  });

});