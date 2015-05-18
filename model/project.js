module.exports = function(mongoose){

	var Schema = mongoose.Schema;
	//console.log("Schema : "+Schema);
	var projectSchema = new Schema({
	  name:  String,
	  appId: String,
	  _userId: String,
	  keys : Object
	});

	return mongoose.model('Project', projectSchema);
};
