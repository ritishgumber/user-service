var request   = require('request'),
    assert   = require('assert')

var baseUrl = 'http://localhost:3000';

describe("USER SERVICE STATUS CHECK", function() {
  
  before(function(done){
    // initialize resources
    done();
  });

  after(function(done) {
    done();
  });

  it('API STATUS SHOULD RETURN 200', function (done) {
    this.timeout(15000);
    request.get({
        url:  baseUrl +'/status'
    }, function (err, resp, body) {
        assert.equal(200, resp.statusCode);
        done()
    });
  });

});
