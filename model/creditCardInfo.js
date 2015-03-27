module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var creditCardInfoSchema = new Schema({		 
	  _userId: String,
	  stripeCardObject:Object
	});

	return mongoose.model('CreditCardInfo', creditCardInfoSchema);
};

