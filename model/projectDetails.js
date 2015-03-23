module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var projectDetailsSchema = new Schema({	  
	  appId: String,
	  _userId: String,
	  appProductionName:String,
	  isReleasedInProduction:Boolean,
	  appDescription:String,
	  url:String
	});

	return mongoose.model('ProjectDetails', projectDetailsSchema);
};