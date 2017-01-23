var Hash = require('password-hash');

module.exports = function(){

	var Schema = global.mongoose.Schema;

	var userSchema = new Schema({
		email: String,
		password: String,
		name : String,
		emailVerified : Boolean,
		emailVerificationCode : String,
		provider: String,
		salt : String,
		createdAt : Date,
		fileId:String,
		isAdmin:Boolean,
		isActive:Boolean,
		azure: Object,
		lastLogin: Date
	});

	return global.mongoose.model('User', userSchema);

};