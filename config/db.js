var mongoose = require('mongoose');
var keys = require('./keys.js');

module.exports = function(isDevelopment){

	if(isDevelopment){
		mongoose.connect(keys.devDb);
	}else{
		mongoose.connect(keys.productionDb);
	}

	return mongoose; 
}