module.exports = function(){
    
    var pjson = require('./package.json');
    var express = require('express');
    var cookieParser = require('cookie-parser');
    var passport = require('passport');
    var session = require('express-session');
    var RedisStore = require('connect-redis')(session);
    var CronJob = require('cron').CronJob;
    var Q = require('q');
   
     global.app.use(function(req, res, next) {
        
        //if req body is a string, convert it to JSON. 
        if(typeof(req.body)==="string"){
            req.body = JSON.parse(req.body);
        }

        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        if ('OPTIONS' === req.method) {
             res.sendStatus(200);
         } else {
             next();
         }
    });   
    
   

    //connect to db
    addConnections(passport);
    
    global.app.use(function(req, res, next){
        if (req.is('text/*')) {
            req.text = '';
            req.setEncoding('utf8');
            req.on('data', function(chunk){ req.text += chunk });
            req.on('end', next);
        } else {
            next();
        }
    });

        
    global.app.use(passport.initialize());
    global.app.use(passport.session());
    
    global.app.get('/', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ status : 200, version : pjson.version }));
    });

//this fucntion add connections to the DB.
function addConnections(passport){ 
   //MONGO DB
   setUpMongoDB(passport);
   //setUp Redis
   setUpRedis();
}

function setUpRedis(){
  try{
  
        //Set up Redis.
        var hosts = [];
        
        var isCluster = false;
        
        if(global.config.redis.length>0){
            //take from config file
            for(var i=0;i<global.config.redis.length;i++){
                hosts.push({
                        host : global.config.redis[i].host,
                        port : global.config.redis[i].port,
                        
                });
                
                if(global.config.redis[i].password){
                    hosts[i].password = global.config.redis[i].password;
                }
            }
            
            if(global.config.redis.length>1){
                isCluster = true;
            }
            
        }else{
            //take from env variables.
            var i=1;
            
            while(process.env["DOCKER_REDIS_"+i+"_PORT_6379_TCP_ADDR"] && process.env["REDIS_"+i+"_PORT_6379_TCP_PORT"]){
                        if(i>1){
                            isCluster = true;
                        }
                        var obj = {
                            host : process.env["DOCKER_REDIS_"+i+"_PORT_6379_TCP_ADDR"],
                            port : process.env["REDIS_"+i+"_PORT_6379_TCP_PORT"]
                        };
                        hosts.push(obj);       
                        i++;
                }
        }

        //console.log("Redis Connection String");
        //
        //console.log(hosts);
        
        var Redis = require('ioredis');
        
        if(isCluster){
                global.redisClient = new Redis.Cluster(hosts);
        }else{
            global.redisClient = new Redis(hosts[0]);
        }

        global.app.use(session({        
                key: 'session',
                resave: false, //does not forces session to be saved even when unmodified
                saveUninitialized: false, //doesnt forces a session that is "uninitialized"(new but unmodified) to be saved to the store
                secret: 'azuresample',       
                store: new RedisStore({
                    client: global.redisClient,
                    ttl   : 30 * 24 * 60 * 60 // 30 * 24 * 60 * 60 = 30 days.
                }),
                cookie:{maxAge: (2600000000)}// 2600000000 is for 1 month
            }));
   }catch(e){
       console.log("Error connecting to Redis : ");
       console.log(e);
   }
}


function setUpMongoDB(passport){
   //MongoDB connections. 
   var mongoConnectionString = "mongodb://";
   
   var isReplicaSet = false;
   
   if(global.config.mongo.length>0){
       //take from config file
       
       if(global.config.mongo.length>1){
           isReplicaSet = true;
       }
       
       for(var i=0;i<global.config.mongo.length;i++){
            mongoConnectionString+=global.config.mongo[i].host +":"+global.config.mongo[i].port;
            mongoConnectionString+=",";
       }
   }else{
        var i=1;
        while(process.env["DOCKER_MONGO_"+i+"_PORT_27017_TCP_ADDR"] && process.env["MONGO_"+i+"_PORT_27017_TCP_PORT"]){
            if(i>1){
                isReplicaSet = true;
            }
            mongoConnectionString+=process.env["DOCKER_MONGO_"+i+"_PORT_27017_TCP_ADDR"]+":"+process.env["MONGO_"+i+"_PORT_27017_TCP_PORT"]; 
            mongoConnectionString+=",";
            i++;
        }
   }

  
   mongoConnectionString = mongoConnectionString.substring(0, mongoConnectionString.length - 1);
   mongoConnectionString += "/"; //de limitter. 
   
   global.keys.db = mongoConnectionString+global.keys.globalDb;

   if(isReplicaSet){
      global.db+="?replicaSet=cloudboost&slaveOk=true";
   }

   global.keys.mongoConnectionString = global.keys.db; 
   console.log("Mongo DB : "+global.keys.db);
   
   var mongoose = require('./config/db.js')();

    var Project = require('./model/project.js')(mongoose);
    var Subscriber = require('./model/subscriber.js')(mongoose);
    var User = require('./model/user.js')(mongoose);
    var Table = require('./model/table.js')(mongoose);
    var ProjectDetails = require('./model/projectDetails.js')(mongoose);
    var StripeCustomer = require('./model/stripeCustomer.js')(mongoose);
    var CreditCardInfo = require('./model/creditCardInfo.js')(mongoose);
    var Invoice = require('./model/invoice.js')(mongoose);
    var InvoiceSettings = require('./model/invoiceSettings.js')(mongoose);
    var Beacon = require('./model/beacon.js')(mongoose);
    var Tutorial = require('./model/tutorial.js')(mongoose);
    var CbServer = require('./model/cbserver.js')(mongoose);
    var Notification = require('./model/notification.js')(mongoose);
    
     //services.
    console.log("Service Init...");
    var BeaconService  = require('./services/beaconService.js')(Beacon);  
    
    var UserService = require('./services/userService')(User,BeaconService);
    var SubscriberService  = require('./services/subscriberService.js')(Subscriber);
    var InvoiceService  = require('./services/invoiceService.js')(Invoice,InvoiceSettings,UserService);
    var ProjectService  = require('./services/projectService.js')(Project,InvoiceService);
    var TableService  = require('./services/tableService.js')(Table);
    var ProjectDetailsService  = require('./services/projectDetailsService.js')(ProjectDetails);
    var PaymentService  = require('./services/paymentService.js')(StripeCustomer,CreditCardInfo,InvoiceService,UserService,ProjectService); 
    var TutorialService  = require('./services/tutorialService.js')(Tutorial);
    var FileService  = require('./services/fileService.js')(mongoose);
    var MailChimpService  = require('./services/mailChimpService.js')();
    var MandrillService  = require('./services/mandrillService.js')();
    var NotificationService  = require('./services/notificationService.js')(Notification);
    var CbServerService = require('./services/cbServerService.js')(CbServer);

    console.log("Services Status : OK.");
    console.log("API Init...");
    //routes. 
    global.app.use('/', require('./routes/auth')(passport,UserService,FileService,MailChimpService,MandrillService));
    global.app.use('/', require('./routes/subscriber.js')(SubscriberService,MailChimpService));
    global.app.use('/', require('./routes/project.js')(ProjectService));
    global.app.use('/', require('./routes/table.js')(TableService, ProjectService));
    global.app.use('/', require('./routes/projectDetails.js')(ProjectDetailsService));
    global.app.use('/', require('./routes/payment.js')(PaymentService));
    global.app.use('/', require('./routes/invoice.js')(InvoiceService));
    global.app.use('/', require('./routes/beacon.js')(BeaconService));
    global.app.use('/', require('./routes/tutorial.js')(TutorialService));
    global.app.use('/', require('./routes/file.js')(mongoose,FileService,UserService));
    global.app.use('/', require('./routes/cloudboost.js')(CbServerService,UserService));
    global.app.use('/', require('./routes/notification.js')(NotificationService));

    console.log("API Status : OK.")
    
    require('./framework/config')(passport, User);
    
    require('./config/mongoConnect')().connect().then(function(db){
        global.mongoClient = db;
        //init encryption Key. 
        initEncryptionKey();
    }, function(error){
        //error
        console.log("Error  : MongoDB failed to connect.");
        console.log(error);
    });
  }
}

function initEncryptionKey(){
    require('./config/keyService.js')().initEncryptKey();
}