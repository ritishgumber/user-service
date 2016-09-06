module.exports = function(){

	var Schema = global.mongoose.Schema;
	//console.log("Schema : "+Schema);
	var projectSchema = new Schema({
	        name: String,
	       appId: String,
	     _userId: String,
	       keys : Object,
	     invited: Array,
	  developers: Array,
	      planId: Number,
	    provider: Object,
	    disabled: Boolean
	}, { collection: 'projects' });

	return global.mongoose.model('Project', projectSchema);
};
