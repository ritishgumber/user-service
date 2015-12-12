'use strict';

var async = require('async');
var crypto = require('crypto');
var Q = require('q');
var util = require('./utilService')();

var LocalStrategy = require('passport-local').Strategy;


module.exports = function(User,BeaconService){

    return {
                makeSalt: function () {
                    return crypto.randomBytes(16).toString('base64');
                },

                encryptPassword: function (password, salt) {
                    if (!password || !salt) return '';
                    var salt = new Buffer(salt, 'base64');
                    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
                },

                validatePassword : function(password,encryptedPass,salt){
                    if (!password || !salt) return false;
                    var salt = new Buffer(salt, 'base64');
                    return encryptedPass === crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
                },

                getAccountByEmail: function (email) {

                    var deffered = Q.defer();

                    User.findOne({ email: email }, function (err, user) {
                          if (err) { return deffered.reject(err); }
                          if (!user) {
                            return deffered.resolve(null);
                          }

                          return deffered.resolve(user);
                    });

                     return deffered.promise;
                },

                activate: function (code) {

                    var deffered = Q.defer();

                     User.find({ emailVerificationCode: code }, function (err, user) {
                          if (err) { return deffered.reject(err); }
                          if (user.length===0) {
                            return deffered.reject('Activation Code Invalid.');
                          }

                          for(var i=0;i<user.length;i++){

                            user[i].emailVerified = true;

                            user[i].save(function (err,user) {
                              if (err) deffered.reject(err);
                              else deffered.resolve(user);
                            });

                          }
                    });

                    return deffered.promise;
                },

                requestResetPassword : function(email){
                     var deffered = Q.defer();

                     User.findOne({ email: email }, function (err, user) {
                        if (err) { return deffered.reject(err); }
                        if (!user) {
                          return deffered.reject('Email doesnot belong to any user.');
                        }

                        user.emailVerificationCode = util.generateRandomString();

                        user.save(function (err,user) {
                          if (err) deffered.reject(err);
                          else deffered.resolve(user);
                        });

                     });

                    return deffered.promise;
                },

                resetPassword : function(code, password){

                     var deffered = Q.defer();
                     var self = this;

                     User.findOne({ emailVerificationCode: code }, function (err, user) {
                          if (err) { return deffered.reject(err); }
                          if (!user) {
                            return deffered.reject('Email doesnot belong to any user.');
                          }

                          if(password) {
                            user.salt = self.makeSalt();
                            user.password = self.encryptPassword(password, user.salt);
                          }

                          user.save(function (err,user) {
                            if (err) deffered.reject(err);
                            else deffered.resolve(user);
                          });

                     });

                     return deffered.promise;
                },

                getAccountById: function (id) {
                    
                    var deffered = Q.defer();

                     User.findById(id, function (err, user) {
                        if (err) { return deffered.reject(err); }
                        if (!user) {
                          return deffered.reject('Incorrect ID');
                        }                        
                        return deffered.resolve(user._doc);
                    });

                    return deffered.promise;

                },
            
                register: function (data) {
                    var deffered = Q.defer();

                    var self = this;

                    self.getAccountByEmail(data.email).then(function (user) {

                        if (user) {
                            return deffered.reject('A user with this email already exists.');
                        }

                        data.provider = 'local';
                        
                        //create a new user
                        self.createUser(data).then(function(user){
                            deffered.resolve(user);

                            //Create Beacons For New Users
                            if(user){
                              BeaconService.createBeacon(user._doc._id.toString());
                            }                            
                        },function(error){
                            deffered.reject(error);
                        });
                    },function(error){
                        deffered.reject(error);
                    });

                    return deffered.promise;
                },

                createUser: function(data) {

                     var deffered = Q.defer();

                     var self = this;

                     var user = new User();
                     user.email = data.email;
                     user.name = data.name;
                     user.isAdmin = data.isAdmin;

                     if(data.isAdmin){
                        user.emailVerified  = true;
                     }else{
                        user.emailVerified  = false;
                     }                     
                     user.emailVerificationCode = util.generateRandomString();
                     user.createdAt = new Date();

                     if(data.password) {
                        user.salt = self.makeSalt();
                        user.password = self.encryptPassword(data.password, user.salt);
                     }

                     user.save(function (err) {
                          if (err) deffered.reject(err);
                          else deffered.resolve(user);
                     });

                     return deffered.promise;
                   
                },
                updateUserProfilePic: function(userId,fileId) {
                  var deffered = Q.defer();

                  User.findOneAndUpdate({_id:userId}, { $set: { fileId:fileId}},{new:true},function (err, user) {
                    if (err) { return deffered.reject(err); }
                    if (!user) {
                      return deffered.reject(null);
                    }
                    return deffered.resolve(user);                    
                  });

                  return deffered.promise;
                },

                updateUserProfile: function(userId,name,oldPassword,newPassword) {
                  var self = this;

                  var deffered = Q.defer();

                  if(oldPassword && newPassword){

                    self.getAccountById(userId).then(function(user){                      
                      if (!self.validatePassword(oldPassword,user.password,user.salt)) {
                        return deffered.reject("Password is Incorrect");
                      }else{

                        var setPassword={};                      

                        setPassword.salt = self.makeSalt();
                        setPassword.password = self.encryptPassword(newPassword, setPassword.salt);

                        User.findOneAndUpdate({_id:userId}, { $set: setPassword},{new:true},function (err, user) {
                          if (err) { return deffered.reject(err); }
                          if (!user) {
                            return deffered.reject(null);
                          }
                          return deffered.resolve(user);                    
                        });
                      }
                    });                  

                  }else if(name){
                    User.findOneAndUpdate({_id:userId}, { $set: {name:name}},{new:true},function (err, user) {
                      if (err) { return deffered.reject(err); }
                      if (!user) {
                        return deffered.reject(null);
                      }
                      return deffered.resolve(user);                    
                    });
                  }                 


                  return deffered.promise;
                },

                removeUser: function(id, callback) {
                   //TODO
                },

                getUserList: function(){
                     var deffered = Q.defer();

                     User.find({},function (err, users) {
                          if (err) { return deffered.reject(err); }
                          if (users.length==0) {
                            return deffered.reject(null);
                          }                          
                          return deffered.resolve(users);
                    });

                    return deffered.promise;
                },
                isNewServer: function(){
                  var deffered = Q.defer();

                   User.find({},function (err, users) {
                      if (err) { return deffered.reject(err); }
                      if (!users || users.length==0) {
                        return deffered.resolve(true);
                      }
                      
                      return deffered.resolve(false);
                  });

                  return deffered.promise;
                }
        }

};
