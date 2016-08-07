'use strict';

var async = require('async');
var crypto = require('crypto');
var Q = require('q');
var util = require('./utilService')();

var LocalStrategy = require('passport-local').Strategy;


module.exports = function (User) {

  return {
    makeSalt: function () {
      try {
        return crypto.randomBytes(16).toString('base64');
      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
      }
    },

    encryptPassword: function (password, salt) {
      try {
        if (!password || !salt) return '';
        var salt = new Buffer(salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
      }
    },

    validatePassword: function (password, encryptedPass, salt) {
      try {

        if (!password || !salt) return false;
        var salt = new Buffer(salt, 'base64');
        return encryptedPass === crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
      }
    },

    getAccountByEmail: function (email) {

      console.log("Get account by email..");

      var deffered = Q.defer();

      try {

        User.findOne({ email: email }, function (err, user) {
          if (err) {
            console.log("Error on Get account by email..");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("user not found to get account by email..");
            return deffered.resolve(null);
          }

          console.log("Success on Get account by email..");
          return deffered.resolve(user);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }
      return deffered.promise;
    },

    activate: function (code) {

      console.log("Activate user account..");

      var deffered = Q.defer();

      try {

        User.find({ emailVerificationCode: code }, function (err, user) {
          if (err) {
            console.log("Error on find user for Activate user account..");
            return deffered.reject(err);
          }
          if (user.length === 0) {
            console.log('Activation Code Invalid.');
            return deffered.reject('Activation Code Invalid.');
          }

          for (var i = 0; i < user.length; i++) {

            user[i].emailVerified = true;

            user[i].save(function (err, user) {
              if (err) {
                console.log("Error on Activate user account..");
                deffered.reject(err);
              }
              else {
                console.log("Success on Activate user account..");
                deffered.resolve(user);
              }
            });

          }
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }

      return deffered.promise;
    },

    requestResetPassword: function (email) {

      console.log("Request reset password..");

      var deffered = Q.defer();

      try {

        User.findOne({ email: email }, function (err, user) {
          if (err) {
            console.log("Error on find user for Request reset password..");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("Email doesnot belong to any user.");
            return deffered.reject('Email doesnot belong to any user.');
          }

          user.emailVerificationCode = util.generateRandomString();

          user.save(function (err, user) {
            if (err) {
              console.log("Error on Request reset password..");
              deffered.reject(err);
            }
            else {
              console.log("Success on Request reset password..");
              deffered.resolve(user);
            }
          });

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }

      return deffered.promise;
    },

    resetPassword: function (code, password) {

      console.log("Reset Password...");

      var deffered = Q.defer();

      try {
        var self = this;

        User.findOne({ emailVerificationCode: code }, function (err, user) {
          if (err) {
            console.log("Error on find user for Reset Password...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("User not found to Reset Password...");
            return deffered.reject('Email doesnot belong to any user.');
          }

          if (password) {
            user.salt = self.makeSalt();
            user.password = self.encryptPassword(password, user.salt);
          }

          user.save(function (err, user) {
            if (err) {
              console.log("Error on Reset Password...");
              deffered.reject(err);
            }
            else {
              console.log("Success on Reset Password...");
              deffered.resolve(user);
            }
          });

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }

      return deffered.promise;
    },

    getAccountById: function (id) {

      console.log("Get User account by Id...");

      var deffered = Q.defer();

      try {
        User.findById(id, function (err, user) {
          if (err) {
            console.log("Error on find User account by Id...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log('Incorrect ID');
            return deffered.reject('Incorrect ID');
          }

          console.log("Success on get user account by id..");
          return deffered.resolve(user._doc);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;

    },

    register: function (data) {

      console.log("Register User..");

      var deffered = Q.defer();
      try {
        var self = this;

        self.getAccountByEmail(data.email).then(function (user) {

          if (user) {
            console.log("A user with this email already exists to Register");
            return deffered.reject('A user with this email already exists.');
          }

          //create a new user
          self.createUser(data).then(function (user) {
            console.log("Success on Register User..");
            deffered.resolve(user);

            //Create Beacons For New Users
            if (user) {
              global.beaconService.createBeacon(user._doc._id.toString());
            }
          }, function (error) {
            console.log("Error on Register User..");
            deffered.reject(error);
          });
        }, function (error) {
          console.log("Error on get account by email in Register User..");
          deffered.reject(error);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    createUser: function (data) {

      console.log("Create User..");

      var deffered = Q.defer();

      try {
        var self = this;

        var user = new User();
        user.email = data.email;
        user.name = data.name || null;
        user.isAdmin = data.isAdmin;
        user.isActive = true;
        user.provider = data.provider || 'local';

        if (data.isAdmin) {
          user.emailVerified = true;
        } else {
          user.emailVerified = false;
        }

        if (data.provider != "azure") {
          user.emailVerificationCode = util.generateRandomString();
        }

        if (data.provider == "azure" && data.azure) {
          user.azure = data.azure;
        }

        user.createdAt = new Date();

        if (data.password) {
          user.salt = self.makeSalt();
          user.password = self.encryptPassword(data.password, user.salt);
        }

        user.save(function (err) {
          if (err) {
            console.log("Error on Create User..");
            deffered.reject(err);
          } else {
            if (data.isAdmin) {
              global.cbServerService.upsertSettings(user._id, null, false);
              global.notificationService.linkUserId(user.email, user._id);
            }
            console.log("Success on Create User..");
            deffered.resolve(user);
          }
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;

    },
    updateUserProfilePic: function (userId, fileId) {

      console.log("Update profile pic ID...");

      var deffered = Q.defer();

      try {
        User.findOneAndUpdate({ _id: userId }, { $set: { fileId: fileId } }, { new: true }, function (err, user) {
          if (err) {
            console.log("error on find account to Update profile pic ID...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("Account not found to Update profile pic ID...");
            return deffered.reject(null);
          }
          console.log("Success on  Update profile pic ID...");
          return deffered.resolve(user);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },
    updateUserActive: function (currentUserId, userId, isActive) {

      console.log("Update user to active...");

      var deffered = Q.defer();

      try {
        User.findOne({ _id: currentUserId }, function (err, user) {
          if (err) {
            console.log("Error on Find account to Update user to active...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("Account not found to Update user to active...");
            return deffered.reject("Unauthorized");
          }
          if (user && user.isAdmin) {

            User.findOneAndUpdate({ _id: userId }, { $set: { isActive: isActive } }, { new: true }, function (err, user) {
              if (err) {
                console.log("Error on  update for activate account...");
                return deffered.reject(err);
              }
              if (!user) {
                console.log("Unable to  activate account...");
                return deffered.reject(null);
              }
              console.log("Success on activate user account...");
              return deffered.resolve(user);
            });

          } else {
            console.log("Unauthorized user to activate account...");
            return deffered.reject("You can't perform this action!");
          }

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },
    updateUserRole: function (currentUserId, userId, isAdmin) {

      console.log("Update user role...");

      var deffered = Q.defer();

      try {
        User.findOne({ _id: currentUserId }, function (err, user) {
          if (err) {
            console.log("Error find Account for Update user role...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("Unauthorized ->Account  not found for Update user role...");
            return deffered.reject("Unauthorized");
          }
          if (user && user.isAdmin) {

            User.findOneAndUpdate({ _id: userId }, { $set: { isAdmin: isAdmin } }, { new: true }, function (err, user) {
              if (err) {
                console.log("Error to Update user role...");
                return deffered.reject(err);
              }
              if (!user) {
                console.log("Account not found to Update user role...");
                return deffered.reject(null);
              }
              console.log("Success on Update user role...");
              return deffered.resolve(user);
            });

          } else {
            console.log("Unauthorized to Update user role...");
            return deffered.reject("You can't perform this action!");
          }

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    updateUserProfile: function (userId, name, oldPassword, newPassword) {

      console.log("Update user profile...");

      var self = this;

      var deffered = Q.defer();

      try {
        if (oldPassword && newPassword) {

          self.getAccountById(userId).then(function (user) {
            if (!self.validatePassword(oldPassword, user.password, user.salt)) {
              console.log("Password is Incorrect..");
              return deffered.reject("Password is Incorrect");
            } else {

              var setPassword = {};

              setPassword.salt = self.makeSalt();
              setPassword.password = self.encryptPassword(newPassword, setPassword.salt);

              User.findOneAndUpdate({ _id: userId }, { $set: setPassword }, { new: true }, function (err, user) {
                if (err) {
                  console.log("Error on update user profile..");
                  return deffered.reject(err);
                }
                if (!user) {
                  console.log("User not found on update user profile..");
                  return deffered.reject(null);
                }
                console.log("Success on update user profile..");
                return deffered.resolve(user);
              });
            }
          });

        } else if (name) {
          User.findOneAndUpdate({ _id: userId }, { $set: { name: name } }, { new: true }, function (err, user) {
            if (err) {
              console.log("Error on update user profile..");
              return deffered.reject(err);
            }
            if (!user) {
              console.log("User not found on update user profile..");
              return deffered.reject(null);
            }
            console.log("Success on update user profile..");
            return deffered.resolve(user);
          });
        }

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    getUserList: function () {
      console.log("Get user list...");

      var deffered = Q.defer();

      try {
        User.find({}, function (err, users) {
          if (err) {
            console.log("Error on Get user list...");
            return deffered.reject(err);
          }
          if (users.length == 0) {
            console.log("users not found..");
            return deffered.reject(null);
          }

          console.log("Success on Get user list...");
          return deffered.resolve(users);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    getUserListByIds: function (IdsArray) {

      console.log("Get user List by Ids..");

      var deffered = Q.defer();

      try {
        User.find({ _id: { $in: IdsArray } }, function (err, usersList) {
          if (err) {
            console.log("Error on Get user List by Ids..");
            return deffered.reject(err);
          }
          if (usersList.length == 0) {
            console.log("Users not found ...");
            return deffered.reject(null);
          }

          console.log("Success on Get user List by Ids..");
          return deffered.resolve(usersList);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    isNewServer: function () {

      console.log("Check users/isNewServer");

      var deffered = Q.defer();

      try {
        User.find({}, function (err, users) {
          if (err) {
            console.log("Error on Check users/isNewServer");
            return deffered.reject(err);
          }
          if (!users || users.length == 0) {
            console.log("No users found->New Server...");
            return deffered.resolve(true);
          }

          console.log("Users found->Existing User..");
          return deffered.resolve(false);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },
    getUserBySkipLimit: function (skip, limit, skipUserIds) {

      console.log("Get users by skip Limit....");

      var deffered = Q.defer();

      try {
        skip = parseInt(skip);
        limit = parseInt(limit);

        User.find({ _id: { $nin: skipUserIds } }).skip(skip).limit(limit).exec(function (err, users) {
          if (err) {
            console.log("Error on Get users by skip Limit....");
            return deffered.reject(err);
          }
          if (users.length == 0) {
            console.log("Users not found by skip limit..");
            return deffered.resolve(null);
          }

          console.log("Success on find users by skip limit..");
          return deffered.resolve(users);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },
    delete: function (currentUserId, userId) {

      console.log("Delete user...");

      var deffered = Q.defer();

      try {
        var self = this;

        User.findOne({ _id: currentUserId }, function (err, user) {
          if (err) {
            console.log("Error on find current user to Delete user...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("currentUser is not found...");
            return deffered.reject("Unauthorized");
          }
          if (user && user.isAdmin) {

            User.remove({ _id: userId }, function (err) {
              if (err) {
                console.log("Error on delete user..");
                return deffered.reject(err);
              } else {
                console.log("Success  on delete user..");
                return deffered.resolve("Success");
              }
            });

          } else {
            console.log(" Unathourized currentUser to delete user..");
            return deffered.reject("You can't perform this action!");
          }

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;

    },

    getUserByEmailByAdmin: function (adminId, email) {

      console.log("Get user by email and by admin....");

      var deffered = Q.defer();

      try {
        User.findOne({ _id: adminId }, function (err, user) {
          if (err) {
            console.log("Error on find admin for get user...");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("Admin account not found with adminId");
            return deffered.reject("Unauthorized");
          }
          if (user && user.isAdmin) {

            User.findOne({ email: email }, function (err, user) {
              if (err) {
                console.log("Error on get user by email and admin..");
                return deffered.reject(err);
              }
              if (!user) {
                console.log("Incorrect email to get user..");
                return deffered.reject('Incorrect Email');
              }

              console.log("Success on get user by email and admin..");
              return deffered.resolve(user);
            });

          } else {
            console.log("Unathourized adminId to get user...");
            return deffered.reject("You can't perform this action!");
          }

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }
      return deffered.promise;

    },
    getUserListByKeyword: function (email) {

      console.log("Get userList by Keyword");

      var deffered = Q.defer();

      try {
        User.find({ email: email }, function (err, userList) {
          if (err) {
            console.log("Error on Get userList by Keyword");
            return deffered.reject(err);
          }
          if (userList.length == 0) {
            console.log("No users found with keyword..");
            return deffered.resolve(null);
          }
          console.log("Success on Get userList by Keyword");
          return deffered.resolve(userList);

        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    getUserBy: function (query) {

      console.log("Get userList by Query");

      var deffered = Q.defer();

      try {
        User.findOne(query, function (err, user) {
          if (err) {
            console.log("Error on Get account by Query..");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("user not found to get account by Query..");
            return deffered.resolve(null);
          }

          console.log("Success on Get account by Query..");
          return deffered.resolve(user);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },

    getAzureUserByTenantId: function (query, newJson) {
      console.log("Find and update azure user...");

      var deffered = Q.defer();

      try {
        var self = this;

        User.findOneAndUpdate(query, { $set: newJson }, { new: true }, function (err, data) {
          if (err) {
            console.log("Error on Find and update user...");
            return deffered.reject(err);
          }
          if (!data) {
            console.log("User not found for ..Find and update user...");
            return deffered.reject(null);
          }

          console.log("Success on Find and update user...");
          return deffered.resolve(data);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }

      return deffered.promise;
    },

    //-------------------------------------------Azure------------------------------------------------------

    getAccountByTenantId: function (tenantId) {

      console.log("Get account by TenantId..");

      var deffered = Q.defer();

      try {

        User.findOne({ "azure.tenantId": tenantId }, function (err, user) {
          if (err) {
            console.log("Error on Get account by tenantId..");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("user not found to get account by tenantId..");
            return deffered.resolve(null);
          }

          console.log("Success on Get account by tenantId..");
          return deffered.resolve(user);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }
      return deffered.promise;
    },

    UpdateAccountBySubscription: function (query, userData) {

      console.log("Get account by Subscription..");

      var deffered = Q.defer();

      try {

        User.findOneAndUpdate(query, { $set: userData }, { new: true }, function (err, data) {
          if (err) {
            console.log("Error on Find and update user...");
            return deffered.reject(err);
          }
          if (!data) {
            console.log("User not found for ..Find and update user...");
            return deffered.reject(null);
          }

          console.log("Success on Find and update user...");
          return deffered.resolve(data);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }
      return deffered.promise;
    },

    getAccountBySubscription: function (query) {
      console.log("Get account by Subscription..");

      var deffered = Q.defer();

      try {

        User.findOne(query, function (err, user) {
          if (err) {
            console.log("Error on Get account by Subscription..");
            return deffered.reject(err);
          }
          if (!user) {
            console.log("user not found to get account by Subscription..");
            return deffered.resolve(null);
          }

          console.log("Success on Get account by Subscription..");
          return deffered.resolve(user);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err)
      }
      return deffered.promise;
    },

    azureregister: function (data) {

      console.log("Register User..");

      var deffered = Q.defer();
      try {
        var self = this;

        self.getAccountByTenantId(data.azure.tenantId).then(function (user) {

          if (user) {
            console.log("A user with this tenantId already exists to Register");
            return deffered.reject('A user with this tenantId already exists.');
          }

          //create a new user
          self.createUser(data).then(function (user) {
            console.log("Success on Register User..");
            deffered.resolve(user);

            //Create Beacons For New Users
            if (user) {
              global.beaconService.createBeacon(user._doc._id.toString());
            }
          }, function (error) {
            console.log("Error on Register User..");
            deffered.reject(error);
          });
        }, function (error) {
          console.log("Error on get account by tenantId in Register User..");
          deffered.reject(error);
        });

      } catch (err) {
        global.winston.log('error', { "error": String(err), "stack": new Error().stack });
        deffered.reject(err);
      }

      return deffered.promise;
    },





  }

};
