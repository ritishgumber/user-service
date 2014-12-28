var Hash = require('password-hash');

module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var userSchema = new Schema({
		email: String,
		password: String,
		name : String,
		provider: String,
		salt : String,
	});

	

	return mongoose.model('User', userSchema);

};