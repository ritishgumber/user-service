module.exports = function(isDevelopment){

    var express = require('express');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var app = express();
    var mongoose = require('./config/db.js')(isDevelopment);
    var passport = require('passport');    

    app.use(require('express-session')({
        key: 'session',
        secret: 'azuresample',
        store: require('mongoose-session')(mongoose)
    }));

    //models. 
    var Project = require('./model/project.js')(mongoose);
    var Subscriber = require('./model/subscriber.js')(mongoose);
    var User = require('./model/user.js')(mongoose);
    var Table = require('./model/table.js')(mongoose);

    //config
    require('./config/cors.js')(app);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    app.use(cookieParser('azuresample'));
    app.use(passport.initialize());
    app.use(passport.session());
    require('./framework/config')(passport, User);

    //services.
    var SubscriberService  = require('./services/subscriberService.js')(Subscriber);
    var ProjectService  = require('./services/projectService.js')(Project);
    var TableService  = require('./services/tableService.js')(Table);

    //routes. 
    app.use('/auth', require('./routes/auth')(passport,User));
    app.use('/', require('./routes/subscriber.js')(SubscriberService));
    app.use('/', require('./routes/project.js')(ProjectService));
    app.use('/', require('./routes/table.js')(TableService));


    app.get('/', function(req, res, next){
        res.send(200, 'Hello World');
    });

    return app;
};

