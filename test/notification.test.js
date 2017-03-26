var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('NOTIFICATION', function() {

  describe('GET /NOTIFICATION/:SKIP/:LIMIT', function() {
    // '/notification/:skip/:limit'
    it('should return notification list for the valid user', function(done) {
      done();
    });

    it('should not return notification list for invalid user', function(done) {
      done();
    });

  });

  describe('GET /NOTIFICATION/SEEN', function() {
    // '/notification/seen'
    it('should update the notification status to seen', function(done) {
      done();
    });

  });

  describe('DELETE /NOTIFICATION/:ID', function() {
    // '/notification/:id'
    it('should delete the notification', function(done) {
      done();
    });

  });

});