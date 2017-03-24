var server = require('../server');
// var passport = require('passport');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var should = chai.should();
var User = global.mongoose.model('User');

chai.use(chaiHttp);

describe('Auth', function() {

  describe('/USER/SIGNUP', function() {
  // '/user/signup'
		after(function() {
      User.findOneAndRemove({
        email: 'testemail@sample.com'
      }, function(err) {
        if (err) {
          console.log(err);
          return;
        }
        console.log('email removed successfully');
      });
		});

    it('should not register when email, password or name is null', function(done) {
      // var test_user = {
      //   email: '',
      //   password: '12345'
      // };
      // chai.request(global.app)
      //   .post('/user/signup')
      //   .send(test_user)
      //   .end(function(err, res) {
      //     if (err) {
      //       done(err);
      //     } else {
      //       res.should.have.status(500);
      //       done();
      //     }
      //   });
      done();
    });

    it('should not register with same email', function(done) {
      done();
    });

    it('should not register with invalid email', function(done) {
      done();
    });

    it('should register with name, email, password', function(done) {
   //    var test_user = {
   //      email: 'testemail@sample.com',
			// 	password: 'test123',
			// 	name: 'Test Name'
			// };
			// chai.request(server)
			// 	.post('/user/signup')
			// 	.send(test_user)
			// 	.end(function(err, res) {
			// 		expect(res.body).to.be.an('object')
			// 		res.should.have.status(200);
			// 		done();
			// 	});
      done();
		});

  });

  describe('/USER/ACTIVATE', function() {
    // '/user/activate'
    it('should not activate account when the activation code is invalid', function(done) {
      done();
    });

    it('should activate when activation code is valid', function(done) {
      done();
    });

	});

  describe('/USER/RESENDVERIFICATION', function() {
    // '/user/resendverification'
    it('should not send verification mail when emailid is invalid', function(done) {
      done();
    });

    it('should send verification mail when emailid is valid', function(done) {
      done();
    });
    
  });

  describe('/USER/RESETPASSWORD', function() {
    // '/user/ResetPassword'
    it('should not reset password when emailid is invalid', function(done) {
      done();
    });

    describe('should reset password when', function() {
      
      it('emailid is valid', function(done) {
        done();
      });

      it('and send a reset password mail', function(done) {
        done();
      });
    });

  });

  describe('/USER/UPDATEPASSWORD', function() {
    // '/user/updatePassword'
    it('should not update password when emailid or code is invalid', function(done) {
      done();
    });

    it('should update password when emailid and code is valid', function(done) {
      done();
    });

  });

  describe('/USER/LOGOUT', function() {
    // '/user/logout'
    it('should logout', function(done) {
      done();
    });

  });

  describe('/USER/SIGNIN', function() {
    // '/user/signin'
    it('should signin', function(done) {
      done();
    });

  });
  
  describe('/USER', function() {
    // '/user'
    it('should return the user details', function(done) {
      done();
    });

  });

  describe('/USER/UPDATE', function() {
    // '/user/update'
    it('should update user details', function(done) {
      done();
    });

  });

  describe('/USER/LIST', function() {
    // '/user/list'
    it('should return user list by ids', function(done) {
      done();
    });

  });

  describe('/USER/LIST/BYKEYWORD', function() {
    // '/user/list/bykeyword'
    it('should return empty list when emailid is not present', function(done) {
      done();
    });

    it('should return user list when valid email', function(done) {
      done();
    });

  });

  describe('/USER/LIST/:SKIP/:LIMIT', function() {
    // '/user/list/:skip/:limit'
    it('should return all user when skip, limit and skipuserid is 0, 0, null respectively', function(done) {
      done();
    });

    it('should return user list when skip, limit is present', function(done) {
      done();
    });

    it('user list should not have user present in skipuserid', function(done) {
      done();
    });

  });

  describe('/USER/ACTIVE/:USERID/:ISACTIVE', function() {
    // '/user/active/:userId/:isActive'
    it('should not activate/deactivate user when currentUserId is not equal to userId', function(done) {
      done();
    });

    it('should not activate/deactivate when not a genuine user', function(done) {
      done();
    });

    it('should activate/deactivate user', function(done) {
      done();
    });

  });

  describe('/USER/CHANGEROLE/:USERID/:ISADMIN', function() {
    // '/user/changerole/:userId/:isAdmin'
    it('should not change user role when currentUserId is unauthorised', function(done) {
      done();
    });

    it('should not change user role when currentUserId is an Admin', function(done) {
      done();
    });

  });

  describe('/USER/BYADMIN', function() {
    // '/user/byadmin'
    it('should return user details by userid and email', function(done) {
      done();
    });

  });

});
