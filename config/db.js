var mongoose = require('mongoose');
var keys = require('./keys.js');

module.exports = function(isDevelopment){
	console.log("connecting mongoose : "+keys.db);
	mongoose.connect(keys.db);
	mongoose.connection.once('connected', function(){
		console.log("Database connected successfully");
	});
	return mongoose; 
}
