module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var invoiceSettingsSchema = new Schema({	  
	  _appId: String,
	  _userId: String,
	  autoScale: Boolean,
	  spendingLimit: Number,
	  blocked: Object
	});

	return mongoose.model('InvoiceSettings', invoiceSettingsSchema);
};