module.exports = function(){
    
    var pjson = require('./package.json');
    var express = require('express');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var passport = require('passport');
    var session = require('express-session');
    var RedisStore = require('connect-redis')(session);
    var CronJob = require('cron').CronJob;
    var Q = require('q');
    
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

    global.app.use(function(req, res, next) {
        if(req.text){
            req.body = JSON.parse(req.text);
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
    
    
    
    global.app.use(bodyParser.json());
    global.app.use(bodyParser.urlencoded({extended: true}));
    //global.app.use(cookieParser('azuresample'));
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
    global.app.use(passport.initialize());
    global.app.use(passport.session());
    

    global.app.get('/', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ status : 200, version : pjson.version }));
    });



   /**********CRON JOB**********/
   try{
    console.log("cron job initializing...");
        var job = new CronJob('00 30 11 1 * *', function() {
          /*
           * 00 30 11 1 * *
           * Runs every Month 1st day on weekday (Sunday through Saturday)
           * at 11:30:00 AM. 
           */
            InvoiceService.getDueInvoiceList().then(function(invoiceList){                                    
              
              if(invoiceList){
                    console.log("Invoice Service..");                    
                    var userIndex=[]; 
                    var promises=[];
                 
                    if(!invoiceList.length ){
                        console.log("undefine length");
                    }
                    for(var i=0;i<invoiceList.length;++i){

                      var userId=invoiceList[i]._userId;                    

                      if(!invoiceList[i].charged){//if previously not charged
                         promises.push(PaymentService.findCard(userId));
                         userIndex.push(i);
                      }                      
                    }

                    Q.allSettled(promises).then(function(creditCardList){                
                  
                        for(var i=0;i<creditCardList.length;i++){                            
                      
                            if(creditCardList[i].state="fulfilled" && creditCardList[i].value){                               
                                var index=userIndex[i];
                                var customerId=creditCardList[i].value.stripeCardObject.customer;
                               
                                //make payments
                                PaymentService.makePayments(invoiceList[index],customerId);                                                                                   

                            }else{//if card not found block the user                                                       
                                var index=userIndex[i];
                                InvoiceService.blockUser(invoiceList[index]._userId,invoiceList[index]._appId);
                            }                   
                        }             

                    });//end of Q.allSetteled

              }else{
                console.log("There are no Invoices.");
              }

            },function(error){
              console.log(error);              
            });//end of getting invoice List

          }, function () {
            /* This function is executed when the job stops */
          },
          true /* Start the job right now */           
        );
        job.start();

    } catch(ex) {
        console.log("cron pattern not valid");
    }   
    /**********CRON JOB**********/   
    return app;
};


//this fucntion add connections to the DB.
function addConnections(passport){ 
   //MONGO DB
   setUpMongoDB(passport);
   //setUp Redis
   setUpRedis();
}

function setUpRedis(){
   //Set up Redis.
   var hosts = [];
   
   if(global.config.redis.length>0){
       //take from config file
       for(var i=0;i<global.config.redis.length;i++){
           hosts.push({
                host : global.config.redis[i].host,
                port : global.config.redis[i].port,
                password : global.config.redis[i].password
           });
       }
   }else{
      //take from env variables.
      
       var i=1;
      
       while(process.env["DOCKER_REDIS_"+i+"_PORT_6379_TCP_ADDR"] && process.env["REDIS_"+i+"_PORT_6379_TCP_PORT"]){
       var obj = {
                    host : process.env["DOCKER_REDIS_"+i+"_PORT_6379_TCP_ADDR"],
                    port : process.env["REDIS_"+i+"_PORT_6379_TCP_PORT"]
                 };
                 
            hosts.push(obj);       
            i++;
        }
   }
  
   console.log("Redis Connection String");
   console.log(hosts);
   var Redis = require('ioredis');
   global.redisClient = new Redis.Cluster(hosts);
   
}


function setUpMongoDB(passport){
   //MongoDB connections. 
   var mongoConnectionString = "mongodb://";
   
   if(global.config.mongo.length>0){
       //take from config file
       for(var i=0;i<global.config.mongo.length;i++){
            mongoConnectionString+=global.config.mongo[i].host +":"+global.config.mongo[i].port;
            mongoConnectionString+=",";
       }
   }else{
        var i=1;
        while(process.env["DOCKER_MONGO_"+i+"_PORT_27017_TCP_ADDR"] && process.env["MONGO_"+i+"_PORT_27017_TCP_PORT"]){
            mongoConnectionString+=process.env["DOCKER_MONGO_"+i+"_PORT_27017_TCP_ADDR"]+":"+process.env["MONGO_"+i+"_PORT_27017_TCP_PORT"]; 
            mongoConnectionString+=",";
            i++;
        }
   }
  
   mongoConnectionString = mongoConnectionString.substring(0, mongoConnectionString.length - 1);
   mongoConnectionString += "/"; //de limitter. 
   global.keys.db = mongoConnectionString+"?replicaSet=cloudboost&slaveOk=true";  
   global.keys.mongoConnectionString = global.keys.db; 
   console.log("Mongo DB : "+global.keys.db);
   
   var mongoose = require('./config/db.js')();
   
    //models. 
    console.log("creating models..");
    
    
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
    
     //services.
    console.log("starting services..");
    var BeaconService  = require('./services/beaconService.js')(Beacon);  
    var UserService = require('./services/userService')(User,BeaconService);
    console.log("UserService : " + UserService);    
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

    console.log("All services started..");
    console.log("routes..");
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
    
    require('./framework/config')(passport, User);
    
    require('./config/mongoConnect')().connect(function(db){
        global.mongoClient = db;
        //init encryption Key. 
        initEncryptionKey();
    }, function(error){
        //error
        console.log("Error  : MongoDB failed to connect.");
        console.log(error);
    });
}


function initEncryptionKey(){
    require('./config/keyService.js')().initEncryptKey();
}


