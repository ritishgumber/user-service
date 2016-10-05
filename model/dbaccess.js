module.exports = function () {

	var Schema = global.mongoose.Schema;
	var dbaccessSchema = new Schema({
		appId: String,
		_userId: String,
		password: String,
		username : String
	});

	return global.mongoose.model('dbaccess', dbaccessSchema);
};
