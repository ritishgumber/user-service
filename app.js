module.exports = function() {

	//Express.
	var express = require('express');
	global.app = express();

	var pjson = require('./package.json');
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var passport = require('passport');
	var session = require('express-session');
	var RedisStore = require('connect-redis')(session);
	// var CronJob = require('cron').CronJob;
	// var Q = require('q');
	var json2xls = require('json2xls');

	global.winston = require('winston');
	var expressWinston = require('express-winston');
	require('winston-loggly');

	global.winston.add(global.winston.transports.Loggly, {
		inputToken: global.keys.logToken,
		subdomain: "cloudboost",
		tags: ["frontend-server"],
		json: true
	});

	global.app.use(json2xls.middleware);
	global.app.set('view engine', 'ejs');
	global.app.use(function(req, res, next) {

		//if req body is a string, convert it to JSON.
		if (typeof(req.body) === "string") {
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

	global.app.use(function(req, res, next) {
		if (req.is('text/*')) {
			req.text = '';
			req.setEncoding('utf8');
			req.on('data', function(chunk) {
				req.text += chunk;
			});
			req.on('end', next);
		} else {
			next();
		}
	});

	global.app.get('/', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({
			status: 200,
			message: "Service Status - OK",
			version: pjson.version
		}));
	});

	//this fucntion add connections to the DB.
	function addConnections(passport) {
		//setUp Redis
		setUpRedis();

		//MONGO DB
		setUpMongoDB(passport);

		setUpDataServices();

		setUpAnalyticsServer();
		if (global.config) {
			global.keys.analyticsServiceUrl = "http://localhost:5555";
		}
	}

	function setUpDataServices() {
		try {
			if (process.env["API_PORT_4730_TCP_ADDR"] || process.env["API_" + 1 + "_PORT_4730_TCP_ADDR"]) {
				global.keys.dataServiceUrl = "http://" + (process.env["API_PORT_4730_TCP_ADDR"] || process.env["API_" + 1 + "_PORT_4730_TCP_ADDR"]) + ":4730";
			}
			if (process.env["CLOUDBOOST_ENGINE_SERVICE_HOST"]) {
				global.keys.dataServiceUrl = "http://" + process.env["CLOUDBOOST_ENGINE_SERVICE_HOST"] + ":" + process.env["CLOUDBOOST_ENGINE_SERVICE_PORT"];
			}

			console.log("Data Services URL : " + global.keys.dataServiceUrl);

		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

	function setUpAnalyticsServer() {
		try {
			if (process.env["CLOUDBOOST_ANALYTICS_SERVICE_HOST"]) {
				console.log("Analytics is running on Kubernetes");

				global.keys.analyticsServiceUrl = "http://" + process.env["CLOUDBOOST_ANALYTICS_SERVICE_HOST"] + ":" + process.env["CLOUDBOOST_ANALYTICS_SERVICE_PORT"];
				console.log("Analytics URL:" + global.keys.analyticsServiceUrl);

			} else {
				global.keys.analyticsServiceUrl = "https://analytics.cloudboost.io";
				console.log("Analytics URL:" + global.keys.analyticsServiceUrl);
			}

		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

	function setUpRedis() {
		try {

			//Set up Redis.
			var hosts = [];

			var isCluster = false;

			if (global.config && global.config.redis && global.config.redis.length > 0) {
				//take from config file
				for (var i = 0; i < global.config.redis.length; i++) {
					hosts.push({
						host: global.config.redis[i].host,
						port: global.config.redis[i].port
					});

					if (global.config.redis[i].password) {
						hosts[i].password = global.config.redis[i].password;
					}
				}

				if (global.config.redis.length > 1) {
					isCluster = true;
				}

			} else {
				//take from env variables
				var obj = {};

				if (process.env["REDIS_SENTINEL_SERVICE_HOST"]) {
					//this is running on Kubernetes
					console.log("Redis is running on Kubernetes.");

					obj = {
						host: process.env["REDIS_SENTINEL_SERVICE_HOST"],
						port: process.env["REDIS_SENTINEL_SERVICE_PORT"],
						enableReadyCheck: false
					};
					hosts.push(obj);
				} else {

					var j = 1;
					if (process.env["REDIS_PORT_6379_TCP_ADDR"] && process.env["REDIS_PORT_6379_TCP_PORT"]) {
						obj = {
							host: process.env["REDIS_PORT_6379_TCP_ADDR"],
							port: process.env["REDIS_PORT_6379_TCP_PORT"],
							enableReadyCheck: false
						};

						hosts.push(obj);

					} else {
						while (process.env["REDIS_" + j + "_PORT_6379_TCP_ADDR"] && process.env["REDIS_" + j + "_PORT_6379_TCP_PORT"]) {
							if (j > 1) {
								isCluster = true;
							}
							obj = {
								host: process.env["REDIS_" + j + "_PORT_6379_TCP_ADDR"],
								port: process.env["REDIS_" + j + "_PORT_6379_TCP_PORT"]
							};
							hosts.push(obj);
							j++;
						}
					}
				}
			}

			var Redis = require('ioredis');

			if (isCluster) {
				global.redisClient = new Redis.Cluster(hosts);
			} else {
				global.redisClient = new Redis(hosts[0]);
			}

			//Configure Session,Passport,bodyparse after redisClient
			sessionConfiguration();

		} catch (e) {
			console.log("Error connecting to Redis : ");
			console.log(e);
			global.winston.log('error', {
				"error": String(e),
				"stack": new Error().stack
			});
		}
	}

	function setUpMongoDB(passport) {

		try {

			console.log("Looking for a MongoDB Cluster...");

			if ((!global.config && !process.env["MONGO_1_PORT_27017_TCP_ADDR"] && !process.env["MONGO_SERVICE_HOST"]) || (!global.config && !process.env["MONGO_PORT_27017_TCP_ADDR"] && !process.env["MONGO_SERVICE_HOST"])) {
				console.error("INFO : Not running on Docker. Use docker-compose (recommended) from https://github.com/cloudboost/docker");
			}

			//MongoDB connections.
			var mongoConnectionString = "mongodb://";

			if (process.env["CLOUDBOOST_MONGODB_USERNAME"] && process.env["CLOUDBOOST_MONGODB_PASSWORD"]) {
				mongoConnectionString += process.env["CLOUDBOOST_MONGODB_USERNAME"] + ":" + process.env["CLOUDBOOST_MONGODB_PASSWORD"] + "@";
			}

			var isReplicaSet = false;

			if (global.config && global.config.mongo && global.config.mongo.length > 0) {
				//take from config file

				if (global.config.mongo.length > 1) {
					isReplicaSet = true;
				}

				for (var i = 0; i < global.config.mongo.length; i++) {
					mongoConnectionString += global.config.mongo[i].host + ":" + global.config.mongo[i].port;
					mongoConnectionString += ",";
				}
			} else {
				if (process.env["MONGO1_SERVICE_HOST"]) {
					console.log("MongoDB is running on Kubernetes.");

					i = 1;
					while (process.env["MONGO" + i + "_SERVICE_HOST"]) {

						mongoConnectionString += process.env["MONGO" + i + "_SERVICE_HOST"] + ":" + process.env["MONGO" + i + "_SERVICE_PORT"];
						mongoConnectionString += ",";
						++i;
					}

					isReplicaSet = true;
				} else {
					i = 1;

					if (process.env["MONGO_PORT_27017_TCP_ADDR"] && process.env["MONGO_PORT_27017_TCP_PORT"]) {

						mongoConnectionString += process.env["MONGO_PORT_27017_TCP_ADDR"] + ":" + process.env["MONGO_PORT_27017_TCP_PORT"];
						mongoConnectionString += ",";

					} else {

						while (process.env["MONGO_" + i + "_PORT_27017_TCP_ADDR"] && process.env["MONGO_" + i + "_PORT_27017_TCP_PORT"]) {
							if (i > 1) {
								isReplicaSet = true;
							}
							mongoConnectionString += process.env["MONGO_" + i + "_PORT_27017_TCP_ADDR"] + ":" + process.env["MONGO_" + i + "_PORT_27017_TCP_PORT"];
							mongoConnectionString += ",";
							i++;
						}
					}

				}
			}
			var m = 1;
			global.keys.mongoPublicUrls = [];
			while (process.env["CB_MONGO_" + m + "_SERVER"]) {
				global.keys.mongoPublicUrls.push(process.env["CB_MONGO_" + m + "_SERVER"]);
				m++;
			}

			mongoConnectionString = mongoConnectionString.substring(0, mongoConnectionString.length - 1);
			mongoConnectionString += "/"; //de limitter.
			global.mongoConnectionString = mongoConnectionString;

			global.keys.db = mongoConnectionString + global.keys.globalDb;

			if (isReplicaSet) {
				console.log("MongoDB is running on a replica set");
				global.keys.db += "?replicaSet=cloudboost&slaveOk=true&maxPoolSize=200&ssl=false&connectTimeoutMS=30000&socketTimeoutMS=30000&w=1&wtimeoutMS=30000";
			}

			global.keys.mongoConnectionString = global.keys.db;
			console.log("Mongo DB : " + global.keys.mongoConnectionString);
			global.mongoose = require('./config/db.js')();

			//Models
			var Project = require('./model/project.js')();
			var Subscriber = require('./model/subscriber.js')();
			var User = require('./model/user.js')();
			var Beacon = require('./model/beacon.js')();
			var Tutorial = require('./model/tutorial.js')();
			var _Settings = require('./model/_settings.js')();
			var Notification = require('./model/notification.js')();
			var Cbpartner = require('./model/cbpartner.js')();
			var dbAccess = require('./model/dbAccess.js')();
			var Card = require('./model/cards.js')();

			//Services
			global.beaconService = require('./services/beaconService.js')(Beacon);
			global.userService = require('./services/userService')(User);
			global.subscriberService = require('./services/subscriberService.js')(Subscriber);
			global.projectService = require('./services/projectService.js')(Project, User);
			global.tutorialService = require('./services/tutorialService.js')(Tutorial);
			global.fileService = require('./services/fileService.js')();
			global.mailChimpService = require('./services/mailChimpService.js')();
			global.mailService = require('./services/mailService.js')();
			global.notificationService = require('./services/notificationService.js')(Notification);
			global.cbServerService = require('./services/cbServerService.js')(_Settings);
			global.paymentProcessService = require('./services/paymentProcessService.js')(Card, User);
			global.userAnalyticService = require('./services/userAnalyticService.js')();
			global.analyticsNotificationsService = require('./services/analyticsNotificationsService.js')();
			global.cbPartnerService = require('./services/cbPartnerService.js')(Cbpartner);
			global.utilService = require('./services/utilService.js')();
			global.dbAccessService = require('./services/dbAccessService.js')(dbAccess);

			//Routes(API)
			require('./framework/config')(passport, User);

			global.app.use('/', require('./api/auth')(passport));
			global.app.use('/', require('./api/subscriber.js')());
			global.app.use('/', require('./api/heroku.js')());
			global.app.use('/', require('./api/project.js')());
			global.app.use('/', require('./api/beacon.js')());
			global.app.use('/', require('./api/tutorial.js')());
			global.app.use('/', require('./api/file.js')());
			global.app.use('/', require('./api/cbServer.js')());
			global.app.use('/', require('./api/notification.js')());
			global.app.use('/', require('./api/paymentProcess.js')());
			global.app.use('/', require('./api/userAnalytics.js')());
			global.app.use('/', require('./api/analyticsNotifications.js')());
			global.app.use('/', require('./api/cbPartner.js')());
			global.app.use('/', require('./api/dbAccess.js')());
			global.app.use('/', require('./api/azure.js')());

			global.app.use(expressWinston.errorLogger({
				transports: [
					new global.winston.transports.Console({
						json: true,
						colorize: true
					}),
					new global.winston.transports.Loggly({
						subdomain: 'cloudboost',
						inputToken: global.keys.logToken,
						json: true,
						tags: ["frontend-server"]
					})
				]
			}));

			console.log("Models,Services,Routes Status : OKay.");

			require('./config/mongoConnect')().connect().then(function(db) {
				global.mongoClient = db;
				//init encryption Key.
				initSecureKey();
				initClusterKey();
			}, function(error) {
				//error
				console.log("Error  : MongoDB failed to connect.");
				console.log(error);
			});

		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

	function sessionConfiguration() {
		try {
			global.app.use(cookieParser());
			global.app.use(bodyParser.json());
			global.app.use(bodyParser.urlencoded({
				extended: true
			}));
			global.app.use(session({
				key: 'session',
				resave: false, //does not forces session to be saved even when unmodified
				saveUninitialized: false, //doesnt forces a session that is "uninitialized"(new but unmodified) to be saved to the store
				secret: 'azuresample',
				store: new RedisStore({
					client: global.redisClient,
					ttl: 30 * 24 * 60 * 60 // 30 * 24 * 60 * 60 = 30 days.
				}),
				cookie: {
					maxAge: (2600000000)
				} // 2600000000 is for 1 month
			}));

			global.app.use(passport.initialize());
			global.app.use(passport.session());
		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

	function initSecureKey() {
		try {
			require('./config/keyService.js')().initSecureKey().then(function(secureKey) {
				//Register SecureKey in AnalyticsServer
				global.cbServerService.registerServer(secureKey);
			});

		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

	function initClusterKey() {
		try {
			require('./config/keyService.js')().initClusterKey();
		} catch (err) {
			global.winston.log('error', {
				"error": String(err),
				"stack": new Error().stack
			});
		}
	}

};
