module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var projectSchema = new Schema({
	  name:  String,
	  url: String,
	  _userId: String
	});

	return mongoose.model('Project', projectSchema);
};