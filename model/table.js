module.exports = function(mongoose){

	var mongooseSchema = mongoose.Schema;

	var tableSchema = new mongooseSchema({
	  projectId: String,
	  	tableSchema: []	
	});

	return mongoose.model('Table', tableSchema);
};