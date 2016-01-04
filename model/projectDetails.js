module.exports = function(){

	var Schema = global.mongoose.Schema;

	var projectDetailsSchema = new Schema({	  
	  appId: String,
	  _userId: String,
	  appProductionName:String,
	  isReleasedInProduction:Boolean,
	  appDescription:String,
	  url:String
	});

	return global.mongoose.model('ProjectDetails', projectDetailsSchema);
};