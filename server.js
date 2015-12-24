//Express.
var express = require('express');
global.app = express();

var bodyParser = require('body-parser');

global.app.use(bodyParser.text());
//Load the configuration.
global.config = require('./config/cloudboost');

//Load keys.    
global.keys = require('./config/keys.js');

var app = require('./app')();

global.app.set('port', process.env.PORT || 3000);

var server = global.app.listen(global.app.get('port'), function(){
	console.log("On PORT:"+global.app.get('port'));
});
