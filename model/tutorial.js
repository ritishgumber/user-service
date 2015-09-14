module.exports = function(mongoose){

	var Schema = mongoose.Schema;
	
	var tutorialSchema = new Schema({	 
	            name : String,
	     description : String,
	       tutorials : Array
	           
	});

	return mongoose.model('Tutorial', tutorialSchema);
};
