var mongoose = require('mongoose');

module.exports = function(isDevelopment){

	if(isDevelopment){
		mongoose.connect('mongodb://CloudBoost:WhiteHouse123@ds030817.mongolab.com:30817/CloudBoostDevDB');
	}else{
		mongoose.connect('mongodb://CloudBoost:WhiteHouse123@ds041177.mongolab.com:41177/CloudBoostProdDB');
	}

	return mongoose; 
}