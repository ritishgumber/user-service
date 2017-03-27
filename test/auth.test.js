require('../server');
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = require('chai').expect;
var util = require('./util/util.js');

chai.use(chaiHttp);

describe('Auth', function() {
	it('should register with name, email, password', function(done) {
		var email = util.makeEmail();
		var name = util.makeString();
		var test_user = {
			email: email,
			password: util.makeString(),
			name: name
		};
		chai.request(global.app)
			.post('/user/signup')
			.send(test_user)
			.end(function(err, res) {
				expect(res).to.have.status(200);
				expect(res.body).to.be.an('object');
				expect(res.body.email).to.equal(email);
				expect(res.body.name).to.equal(name);
				done();
			});
	});
});