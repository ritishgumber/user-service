module.exports = function(){

	var Schema = global.mongoose.Schema;

	var invoiceSchema = new Schema({	  
	  _appId: String,
	  _userId: String,
	  invoiceForMonth: Date,
	  currentInvoice: Number,
	  invoiceDetails: Array,
	  charged: Object
	});

	return global.mongoose.model('Invoice', invoiceSchema);
};