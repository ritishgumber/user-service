module.exports = function() {

	var Schema = global.mongoose.Schema;

	var tutorialSchema = new Schema({
		name: String,
		description: String,
		tutorials: Array

	});

	return global.mongoose.model('Tutorial', tutorialSchema);
};
