var mongoose = require('mongoose');
var keys = require('./keys.js');

module.exports = function(isDevelopment) {
	mongoose.connect(keys.db);
	mongoose.connection.once('connected', function() {
		//done!
	});
	return mongoose;
}
