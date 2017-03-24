var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('Beacon', function() {

  describe('GET /BEACON/GET', function() {
    
    it('should not get beacon with a invalid userid', function (done) {
      done();
    });

    it('should get beacon with a valid userid', function (done) {
      done();
    });

  });

  describe('POST /BEACON/UPDATE', function() {
    
    it('should update a beacon with vaild userid', function(done) {
      done();
    });

    it('should not update a beacon with invaild userid', function(done) {
      done();
    });

  });

});