module.exports = {
	mandrill : 'qiDZR_J-NKKKfg6ieTPSYw',
	cors : ['http://localhost:1440','http://localhost:1444','http://localhost:1441','https://www.cloudboost.io', 'http://www.cloudboost.io','http://dashboard.cloudboost.io','https://dashboard.cloudboost.io','http://cloudboost.io','https://cloudboost.io'],
	db : global.isVM ? 'mongodb://127.0.0.1/CloudBoostProdDB' : (global.isDevelopment ? "mongodb://cbmongodb1.cloudapp.net,cbmongodb2.cloudapp.net,cbmongodb3.cloudapp.net/CloudBoostDevDB?slaveOk=true" : "mongodb://cbmongodb1.cloudapp.net,cbmongodb2.cloudapp.net,cbmongodb3.cloudapp.net/CloudBoostProdDB?slaveOk=true"),
	dataServiceUrl : global.isStaging ?'http://stagingdataservices.azurewebsites.net':(global.isDevelopment ? 'http://localhost:4730' : 'https://api.cloudboost.io'),
    encryptKey: "hackersbay", //for encryption of passwords
	cbDataServicesConnectKey : 'secret-cookie',
	cacheSchemaPrefix : 'schema',
	schemaExpirationTimeFromCache : 86400,
    redisURL : global.isVM ? 'localhost':(global.isDevelopment ? "cbcachetest.redis.cache.windows.net" : "cbredis.redis.cache.windows.net"),
    redisPort : 6379,
    redisPassword : global.isVM ? '' : (global.isDevelopment ? 'bXmhmbA3Y5h+ay1DjP+QvD0w89JArE75gEIJh8FZ1HQ=' : 'Lu40rnq6AccYY2t9DL0yeldebmth/Uz6pgZceg13eek='),
	stripeSecretKey : global.isVM?'sk_live_1gE5Q11MYtUxjtDSBdS5Ke8u':(global.isDevelopment ? 'sk_test_9Q1AvvlnCycsAiLlWqAKrfLk' : 'sk_live_1gE5Q11MYtUxjtDSBdS5Ke8u'),
	mixpanelToken : global.isDevelopment ? '59f8c851677a01bdbfa6cffb2865c682' : '59f8c851677a01bdbfa6cffb2865c682'
};

