var mongoose = require('mongoose');
var keys = require('./keys.js');

module.exports = function(isDevelopment){

	mongoose.connect(keys.db);

	return mongoose; 
}