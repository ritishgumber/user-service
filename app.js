module.exports = function(){

    var express = require('express');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var app = express();
    var mongoose = require('./config/db.js')();
    var passport = require('passport');
    var redis = require('redis');  

    global.keys = require('./config/keys.js'); 


    app.use(require('express-session')({
        key: 'session',
        resave: false, //does not forces session to be saved even when unmodified
        saveUninitialized: true, //forces a session that is "uninitialized"(new but unmodified) to be saved to the store
        secret: 'azuresample',
        store: require('mongoose-session')(mongoose),
        //cookie:{maxAge:60000000}
    }));

    global.redisClient = redis.createClient(global.keys.redisPort,
        global.keys.redisURL,
        {
            auth_pass:global.keys.redisPassword
        }
    );

    //models. 
    var Project = require('./model/project.js')(mongoose);
    var Subscriber = require('./model/subscriber.js')(mongoose);
    var User = require('./model/user.js')(mongoose);
    var Table = require('./model/table.js')(mongoose);
    var ProjectDetails = require('./model/projectDetails.js')(mongoose);
    var StripeCustomer = require('./model/stripeCustomer.js')(mongoose);
    var CreditCardInfo = require('./model/creditCardInfo.js')(mongoose);


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
    var ProjectDetailsService  = require('./services/projectDetailsService.js')(ProjectDetails);
    var PaymentService  = require('./services/paymentService.js')(StripeCustomer,CreditCardInfo);


    //routes. 
    app.use('/auth', require('./routes/auth')(passport,User));
    app.use('/', require('./routes/subscriber.js')(SubscriberService));
    app.use('/', require('./routes/project.js')(ProjectService));
    app.use('/', require('./routes/table.js')(TableService));
    app.use('/', require('./routes/projectDetails.js')(ProjectDetailsService));
    app.use('/', require('./routes/payment.js')(PaymentService));


    app.get('/', function(req, res, next){
        res.send(200, 'Frontend Service is up and running fine.');
    });

    return app;
};

