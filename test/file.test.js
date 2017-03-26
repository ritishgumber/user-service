var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();

chai.use(chaiHttp);

describe('FILE', function() {

  describe('GET /FILE/:ID', function() {
    // '/file/:id'
    it('should return the file with valid fileId', function(done) {
      done();
    });

    it('should not return the file with invalid fileId', function(done) {
      done();
    });

  });

  describe('POST /FILE', function() {
    // '/file'
    it('should upload the file', function(done) {
      done();
    });

  });

  describe('DELETE /FILE/:ID', function() {
    // '/file/:id'
    it('should delete the file with valid fileId', function(done) {
      done();
    });

    it('should not delete the file with invalid fileId', function(done) {
      done();
    });

  });

});