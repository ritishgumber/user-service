'use strict'
var LocalStrategy = require('passport-local').Strategy;


module.exports = function(passport, User) {

        var UserService = require('../services/userService.js')(User);

        passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
          },
          function(username, password, done) {
            console.log(username + password);
            User.findOne({ email: username }, function (err, user) {
              if (err) { return done(err); }
              if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
              }
              if (!UserService.validatePassword(password,user.password,user.salt)) {
                return done(null, false, { message: 'Incorrect password.' });
              }
              return done(null, user);
            });
          }
        ));

      // Serialize the user id to push into the session
      passport.serializeUser(function(user, callback) {
          callback(null, {"id":user.id});
      });

      // Deserialize the login / user object based on a pre-serialized token
      // which is the user id / email
      passport.deserializeUser(function(user, callback) {                
        User.findById(user.id, function (err, user) {
            callback(null, user);
        });
      });
};
