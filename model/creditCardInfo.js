module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var creditCardInfoSchema = new Schema({	  
	  appId: String,
	  _userId: String,
	  stripeCardObject:Object
	});

	return mongoose.model('CreditCardInfo', creditCardInfoSchema);
};

