module.exports = function(mongoose){

	var mongooseSchema = mongoose.Schema;

	var tableSchema = new mongooseSchema({
	  appId: String,
	  name: String, 
	  columns : Array,
	  type: String,
	  id : String,
	  tableColor: String

	});

	return mongoose.model('Table', tableSchema);
};