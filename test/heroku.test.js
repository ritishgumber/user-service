var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('HEROKU', function() {

  describe('POST /HEROKU/SSO/LOGIN', function() {
    // '/heroku/sso/login'
    it('should allow login to heroku', function(done) {
      done();
    });

  });

  describe('POST /HEROKU/RESOURCES', function() {
    // '/heroku/resources'
    it('should create resources for heroku', function(done) {
      done();
    });

  });

  describe('DELETE /HEROKU/RESOURCES/:ID', function() {
    // '/heroku/resources/:id'
    it('should delete the heroku resources', function(done) {
      done();
    });

  });

  describe('PUT /HEROKU/RESOURCES/:ID', function() {
    // '/heroku/resources/:id'
    it('should update to a heroku plan', function(done) {
      done();
    });

  });

});