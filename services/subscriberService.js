'use strict';

var async = require('async');
var Q = require('q');

module.exports = function(Subscriber){


    return {

      subscribe: function (email) {

            var deferred = Q.defer();

            var self = this;

            self.get(email).then(function(subscriber){
                if(subscriber)
                    deferred.reject('Already Subscribed');
                else{
                     var subscriber = new Subscriber();
                     subscriber.email = email;

                     subscriber.save(function (err) {
                          if (err) deferred.reject(err);
                          else deferred.resolve(email);
                    });
                 }
            });

            return deferred.promise;
        },


        get: function (email) {

            var deferred = Q.defer();

            var self = this;

            Subscriber.findOne({ email: email }, function (err, subscriber) {
              if (err) deferred.reject(err);
              else deferred.resolve(subscriber);
            });

           return deferred.promise;

        },

        delete : function(email){
            var deferred = Q.defer();

            var self = this;

            Subscriber.findOneAndRemove({ email: email }, function (err, subscriber) {
              if (err) deferred.reject(err);
              else {
                deferred.resolve(subscriber);
              }
            });

           return deferred.promise;
        }

    };


};