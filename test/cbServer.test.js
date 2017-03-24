var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('CloudBoost Server', function() {

  describe('GET /SERVER/ISNEWSERVER', function() {
    // '/server/isNewServer'
    it('should be a new server when there are no user', function(done) {
      done();
    });

    it('should be not be a new server when there are users', function(done) {
      done();
    });
  });

  describe('GET /SERVER', function() {
    // '/server'
    it('should get the server setting', function(done) {
      done();
    });
  });

  describe('POST /SERVER', function() {
    // '/server'
    it('should update server setting', function(done) {
      done();
    });
  });

  describe('POST /SERVER/URL', function() {
    // '/server/url'
    it('should update server api url', function(done) {
      done();
    });
  });

  describe('GET /SERVER/ISHOSTED', function() {
    // '/server/isHosted'
    it('should return current status of hosted server', function(done) {
      done();
    });
  });

  describe('GET /STATUS', function() {
    // '/status'
    it('should return current status of MongoDB & RedisDB', function(done) {
      done();
    });
  });

});