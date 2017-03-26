var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Database Access', function() {

  describe('POST /DBACCESS/ENABLE/:APPID', function() {
    // '/dbaccess/enable/:appId'
    it('should create a db access entry for user with valid appId', function(done) {
      done();
    });

    it('should not create a db access entry for user with invalid appId', function(done) {
      done();
    });

    it('should not create a db access entry if already present', function(done) {
      done();
    });

  });

  describe('POST /DBACCESS/GET/:APPID', function() {
    // '/dbaccess/get/:appId'
    it('should return the access url when appid is valid', function(done) {
      done();
    });

    it('should not return the access url when no public url is present', function(done) {
      done();
    });

    it('should not return the access url when appid is invalid', function(done) {
      done();
    });

  });

});