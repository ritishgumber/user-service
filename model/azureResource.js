module.exports = function(){

	var Schema = global.mongoose.Schema;
	//console.log("Schema : "+Schema);
	var azureResourceSchema = new Schema({	 
	            _id : String,
	           slug : String,	  
	         azure  : Object	       
	});

	return global.mongoose.model('AzureResource', azureResourceSchema);
};
