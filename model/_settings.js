module.exports = function() {

	var Schema = global.mongoose.Schema;

	var _settingsSchema = new Schema({
		allowSignUp: Boolean,
		myURL: String,
		clusterKey: String,
		secureKey: String
	}, {
		collection: '_Settings'
	});

	return global.mongoose.model('_Settings', _settingsSchema);
};
