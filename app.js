module.exports = function(){

    var express = require('express');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var app = express();
    var mongoose = require('./config/db.js')();
    var passport = require('passport');
    var redis = require('redis');
    var CronJob = require('cron').CronJob;
    var Q = require('q'); 

    global.keys = require('./config/keys.js');  

    app.use(function(req, res, next){
        if (req.is('text/*')) {
            req.text = '';
            req.setEncoding('utf8');
            req.on('data', function(chunk){ req.text += chunk });
            req.on('end', next);
        } else {
            next();
        }
    });

    app.use(function(req, res, next) {
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

	console.log("creating redis client..");
    global.redisClient = redis.createClient(global.keys.redisPort,
        global.keys.redisURL,
        {
            auth_pass:global.keys.redisPassword
        }
    );
	console.log("redis client created..");
    //models. 
	console.log("creating models..");
    var Project = require('./model/project.js')(mongoose);
	//console.log(Project);
    var Subscriber = require('./model/subscriber.js')(mongoose);
    var User = require('./model/user.js')(mongoose);
    var Table = require('./model/table.js')(mongoose);
    var ProjectDetails = require('./model/projectDetails.js')(mongoose);
    var StripeCustomer = require('./model/stripeCustomer.js')(mongoose);
    var CreditCardInfo = require('./model/creditCardInfo.js')(mongoose);
    var Invoice = require('./model/invoice.js')(mongoose);
    var InvoiceSettings = require('./model/invoiceSettings.js')(mongoose);
    var Beacon = require('./model/beacon.js')(mongoose);

	console.log("models created..");
    //config
    
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    //app.use(cookieParser('azuresample'));
    app.use(require('express-session')({        
        key: 'session',
        resave: false, //does not forces session to be saved even when unmodified
        saveUninitialized: false, //doesnt forces a session that is "uninitialized"(new but unmodified) to be saved to the store
        secret: 'azuresample',
        store: require('mongoose-session')(mongoose),
        cookie:{maxAge: (3600000*24*30*3)}// for 3 month
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    require('./framework/config')(passport, User);

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

	console.log("All services started..");
	console.log("routes..");
    //routes. 
    app.use('/', require('./routes/auth')(passport,UserService));
    app.use('/', require('./routes/subscriber.js')(SubscriberService));
    app.use('/', require('./routes/project.js')(ProjectService));
    app.use('/', require('./routes/table.js')(TableService, ProjectService));
    app.use('/', require('./routes/projectDetails.js')(ProjectDetailsService));
    app.use('/', require('./routes/payment.js')(PaymentService));
    app.use('/', require('./routes/invoice.js')(InvoiceService));
    app.use('/', require('./routes/beacon.js')(BeaconService));


    app.get('/', function(req, res, next){
        if(process.env.CBENV)
            res.status(200).send(process.env.CBENV);
        else
            res.status(200).send("FS Running Fine");
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

