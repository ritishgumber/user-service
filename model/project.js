module.exports = function(mongoose){

	var Schema = mongoose.Schema;
	//console.log("Schema : "+Schema);
	var projectSchema = new Schema({
	        name: String,
	       appId: String,
	     _userId: String,
	       keys : Object,
	     invited: Array,
	  developers: Array
	});

	return mongoose.model('Project', projectSchema);
};
