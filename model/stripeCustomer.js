module.exports = function(){

	var Schema = global.mongoose.Schema;

	var stripeCustomerSchema = new Schema({		  
	  _userId: String,
	  stripeCustomerObject:Object
	});

	return global.mongoose.model('StripeCustomer', stripeCustomerSchema);
};

