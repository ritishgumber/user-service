var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('User Analytics', function() {

  describe('GET /ANALYTICS/API/:APPID/USAGE', function() {
    // '/analytics/api/:appId/usage'
    it('should return api usage of the app', function(done) {
      done();
    });

  });

  describe('GET /ANALYTICS/STORAGE/:APPID/USAGE', function() {
    // '/analytics/storage/:appId/usage'
    it('should return analytics storage details for the app', function(done) {
      done();
    });

  });

  describe('GET /ANALYTICS/API/:APPID/COUNT', function() {
    // '/analytics/api/:appId/count'
    it('should return api count for the app', function(done) {
      done();
    });

  });

  describe('GET /ANALYTICS/STORAGE/:APPID/COUNT', function() {
    // '/analytics/storage/:appId/count'
    it('should return storage count for the app', function(done) {
      done();
    });

  });

  describe('GET /ANALYTICS/API-STORAGE/BULK/COUNT', function() {
    // '/analytics/api-storage/bulk/count'
    it('should return api-storage bulk count for the app', function(done) {
      done();
    });

  });

});