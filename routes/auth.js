
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();

//setup passport
module.exports = function(passport,User) {

    var controller = require('../services/userService')(User);

    //helpers
    var authCallback = function(req, res) {
        var user=req.user;
        return res.json(200, user);
    };

    var session = function(req, res) {
        res.redirect('/');
    };

    var signin = function(req, res, next) {
        passport.authenticate('local',  function(err, user, info) {
            if (err || !user) {
                return res.send(500, info);
            }

            req.login(user, function(err) {
                if (err) {
                    return next(err);
                }

                return res.json(200, user);
            });
        })(req, res, next);
    };

    // routes
    app.post('/register', function(req, res, next) {

        var data = req.body || {};



        controller.register(data).then(function(user) {
            if (!user) {
                return res.send(500, e);
            }

            req.login(user, function(err) {

                if (err) {
                    return next(err);
                }
                return res.json(200, user);
            });
        },function(error){
            return res.send(500, error);
        });
    });


    app.post('/signout', function(req, res, next){
        req.logout();
        res.json(200, {});
    });

    app.post('/signin', signin);

    return app;

}

