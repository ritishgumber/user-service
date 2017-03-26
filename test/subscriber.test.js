var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Subscriber', function() {

  describe('POST /SUBSCRIBE', function() {
    // '/subscribe'
    it('should add email to subscriber list', function(done) {
      done();
    });

    it('should not add a subscriber if already present', function(done) {
      done();
    });

    it('should not add a subscriber if emailid is invalid', function(done) {
      done();
    });

  });

});