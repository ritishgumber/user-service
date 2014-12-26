module.exports = function(isDevelopment){

    var express = require('express');
    var path = require('path');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var session = require('express-session');
    var DocumentDBSessionStore = require('express-session-documentdb');
    var DocDB = require('./framework/docDB');
    var app = express();
    var siteConfig = require('./config/settings.js')(isDevelopment);
    var mongoose = require('./config/db.js')(isDevelopment);
    var passport = require('passport');

    //config
    require('./config/cors.js')(app);

    //models. 
    var Project = require('./model/project.js')(mongoose);
    var Subscriber = require('./model/subscriber.js')(mongoose);

    //services.
    var SubscriberService  = require('./services/subscriberService.js')(Subscriber);



    //globals
    //var docDB = null;
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    //app.use(cookieParser('azure ermahgerd'));

    // if(siteConfig.initialized) {
    //     docDB = new DocDB(siteConfig.documentdb);
    //     app.use(session({ secret: 'azure ermahgerd',cookie: {maxAge: 600000}, saveUninitialized: true, resave: false, store: new DocumentDBSessionStore(siteConfig.documentdb) }));
    //     require('./framework/config')(passport);
    //     app.use(passport.initialize());
    //     app.use(passport.session());
    // } else {
    //       console.log('No Config File');
    // }

    // app.use('/auth', require('./routes/auth')(passport));
    // app.use('/', require('./routes/project')());
    //app.use('/', require('./routes/subscriber')(SubscriberService));

    // app.use(function(req, res, next){
    //   res.status(404).send('Sorry, unable to locate this resource');
    // });

    // app.use(function(err, req, res, next){
    //   res.status(500).send('Error');
    // });

    //routes. 
    require('./routes/subscriber.js')(SubscriberService,app);

    app.get('/', function(req, res, next){
        console.log('hey!');
        res.send(200, 'Hello World');
    });

    return app;
};

