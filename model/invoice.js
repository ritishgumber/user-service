module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var invoiceSchema = new Schema({	  
	  _appId: String,
	  _userId: String,
	  invoiceForMonth: Date,
	  currentInvoice: Number,
	  invoiceDetails: Array
	});

	return mongoose.model('Invoice', invoiceSchema);
};