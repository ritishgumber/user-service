module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var stripeCustomerSchema = new Schema({	  
	  appId: String,
	  _userId: String,
	  stripeCustomerObject:Object
	});

	return mongoose.model('StripeCustomer', stripeCustomerSchema);
};

