var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('CloudBoost Partne', function() {

  describe('POST /PARTNER', function() {
    // /partner
    it('should save a partner', function(done) {
      done();
    });

    it('should not save a partner when it is already saved', function(done) {
      done();
    });

  });

  describe('GET /PARTNER/ITEM/:ID', function() {
    // /partner/item/:id
    it('should return a partner by id', function(done) {
      done();
    });

  });

  describe('GET /PARTNER/EXPORT', function() {
    // /partner/export
    it('should return the whole partner list', function(done) {
      done();
    });

    it('should return the partner list when skip and limit is given', function(done) {
      done();
    });
    
  });

});