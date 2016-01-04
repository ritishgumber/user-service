module.exports = function(){

	var Schema = global.mongoose.Schema;

	var creditCardInfoSchema = new Schema({		 
	  _userId: String,
	  stripeCardObject:Object
	});

	return global.mongoose.model('CreditCardInfo', creditCardInfoSchema);
};

