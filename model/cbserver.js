module.exports = function(){

	var Schema = global.mongoose.Schema;
	
	var cbServerSchema = new Schema({	 
	    allowSignUp : Boolean	          
	});

	return global.mongoose.model('CbServer', cbServerSchema);
};
