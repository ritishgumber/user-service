module.exports = function(){

	var Schema = global.mongoose.Schema;
	//console.log("Schema : "+Schema);
	var azureResourceSchema = new Schema({	           
	           slug : String,	  
	          azure : Object,
	        enabled	: Boolean       
	});

	return global.mongoose.model('AzureResource', azureResourceSchema);
};
