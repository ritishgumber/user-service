module.exports = {
	dataServiceUrl : 'http://localhost:4730',
	analyticsServiceUrl : 'https://analytics.cloudboost.io',
    cacheSchemaPrefix : 'schema',
    globalDb : "_GLOBAL",
    globalSettings : "_Settings",
	schemaExpirationTimeFromCache : 86400,
    mandrill : 'qiDZR_J-NKKKfg6ieTPSYw',
    mixpanelToken : global.isDevelopment ? '59f8c851677a01bdbfa6cffb2865c682' : '59f8c851677a01bdbfa6cffb2865c682',
	mailchimpApiKey : global.isDevelopment ? '36e3c02b54396eacdcd06962e16f2b55-us10' : '36e3c02b54396eacdcd06962e16f2b55-us10'
};