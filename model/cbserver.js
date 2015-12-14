module.exports = function(mongoose){

	var Schema = mongoose.Schema;
	
	var cbServerSchema = new Schema({	 
	    allowSignUp : Boolean	          
	});

	return mongoose.model('CbServer', cbServerSchema);
};
