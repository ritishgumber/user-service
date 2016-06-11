module.exports = function(){

	var Schema = global.mongoose.Schema;
	//console.log("Schema : "+Schema);
	var azureSubscriptionSchema = new Schema({	 
	   subscription_id : String,
	             email : String,	  
	             optin : String	        
	});

	return global.mongoose.model('AzureSubsciption', azureSubscriptionSchema);
};
