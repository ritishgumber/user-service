module.exports = {
	mandrill : 'qiDZR_J-NKKKfg6ieTPSYw',
	cors : ['http://localhost:1440','http://localhost:1444','https://www.cloudboost.io', 'http://www.cloudboost.io','http://dashboard.cloudboost.io','https://dashboard.cloudboost.io','http://cloudboost.io','https://cloudboost.io'],
	devDb : 'mongodb://CloudBoost:WhiteHouse123@ds030817.mongolab.com:30817/CloudBoostDevDB',
	productionDb : 'mongodb://cbmongovm1.cloudapp.net:27017/CloudBoostFrontendServices',
	//dataServiceUrl : 'http://localhost',
	//dataServiceUrlPort : 4730, //fordevelopment
	dataServiceUrl : 'http://cbdataservice.azurewebsites.net',
	dataServiceUrlPort : 80,
	encryptKey: "hackersbay", //for encryption of passwords
	cbDataServicesConnectKey : 'secret-cookie'
};