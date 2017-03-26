var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Payment Process', function() {

  describe('POST /:APPID/SALE', function() {
    // '/:appId/sale'
    it('should make a sale with proper token', function(done) {
      done();
    });

    it('should update plan for the app', function(done) {
      done();
    });

    it('should create a notification', function(done) {
      done();
    });

    it('should send an email regarding plan change', function(done) {
      done();
    });

  });

  describe('DELETE /:APPID/REMOVECARD', function() {
    // '/:appId/removecard'
    it('should update the plan for the app', function(done) {
      done();
    });

    it('should create a notification', function(done) {
      done();
    });

    it('should send an email regarding plan removal', function(done) {
      done();
    });

  });

  describe('POST /CARD', function() {
    // '/card'
    it('should add a card with details', function(done) {
      done();
    });
  });

  describe('DELETE /CARD/:CARDID', function() {
    // '/card/:cardId'
    it('should delete the card with valid cardId', function(done) {
      done();
    });

    it('should not delete the card with invalid cardId', function(done) {
      done();
    });

  });

  describe('GET /CARDS', function() {
    // '/cards'
    it('should get cards for the specific user', function(done) {
      done();
    });

    it('should not get cards for the an invalid user', function(done) {
      done();
    });

  });

});