module.exports = {
	mandrill : 'qiDZR_J-NKKKfg6ieTPSYw',
	cors : ['http://localhost:1440','http://localhost:1444','https://www.cloudboost.io', 'http://www.cloudboost.io','http://dashboard.cloudboost.io','https://dashboard.cloudboost.io','http://cloudboost.io','https://cloudboost.io'],
	db : global.isDevelopment ? 'mongodb://CloudBoost:WhiteHouse123@ds030817.mongolab.com:30817/CloudBoostDevDB' : 'mongodb://CloudBoost:WhiteHouse123@ds041177.mongolab.com:41177/CloudBoostProdDB',
	dataServiceUrl : global.isDevelopment ? 'http://localhost' : 'https://api.cloudboost.io',
	dataServiceUrlPort :global.isDevelopment ? 4730 : 80,
	encryptKey: "hackersbay", //for encryption of passwords
	cbDataServicesConnectKey : 'secret-cookie',
	cacheSchemaPrefix : 'schema',
	schemaExpirationTimeFromCache : 86400,
	redisURL : global.isDevelopment ? 'cbtest.redis.cache.windows.net' : 'cbredis.redis.cache.windows.net',
	redisPort : 6379,
	redisPassword : global.isDevelopment ? 'ClWpbDmFSaJ+RzTvR9tu+aM6MUEK1oh2FcsXCLhh5+Y=' : 'Lu40rnq6AccYY2t9DL0yeldebmth/Uz6pgZceg13eek=',
	stripeSecretKey : global.isDevelopment ? 'sk_test_9Q1AvvlnCycsAiLlWqAKrfLk' : 'sk_live_1gE5Q11MYtUxjtDSBdS5Ke8u',
	mixpanelToken : global.isDevelopment ? '59f8c851677a01bdbfa6cffb2865c682' : '59f8c851677a01bdbfa6cffb2865c682'
};