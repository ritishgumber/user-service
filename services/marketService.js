'use strict';

var async = require('async');

var UserCollection = require('../config/collections.js').user;

module.exports = {

      subscribe: function (data,callback) {
            var self = this;

            self.getAccount(data.email, function (e,document) {
                if (document) {
                    return callback('This email already got subscribed');
                }

            var subscribeSchema = {
                type:"subscribe",
                email:data.email
                }

            docDB.addItem(UserCollection,subscribeSchema, function(e, email) {
                return callback(e, email);
            });

          });
        },
        getAccount: function (data, callback) {
            var self = this;

            docDB.getItem(UserCollection,'select * from root r where r.email ="' + data+ '" AND r.type="subscribe"', function(e, document) {
                if(!document) {
                    return callback(e);
                }

                return callback(e, document);
            });

        }






}
