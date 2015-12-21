//Express.
var express = require('express');
global.app = express();

//Load the configuration.
global.config = require('./config/cloudboost');

//Load keys.    
global.keys = require('./config/keys.js');

var app = require('./app')();

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function(){
	console.log("On PORT:"+app.get('port'));
});
