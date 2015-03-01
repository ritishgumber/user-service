var mongoose = require('mongoose');
var keys = require('./keys.js');

module.exports = function(isDevelopment){

	if(isDevelopment){
		mongoose.connect(keys.productionDb);
	}else{
		mongoose.connect(keys.productionDb);
		mongoose.connect(keys.devDb);
	}

	return mongoose; 
}