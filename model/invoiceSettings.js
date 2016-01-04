module.exports = function(){

	var Schema = global.mongoose.Schema;

	var invoiceSettingsSchema = new Schema({	  
	  _appId: String,
	  _userId: String,
	  autoScale: Boolean,
	  spendingLimit: Number,
	  blocked: Object
	});

	return global.mongoose.model('InvoiceSettings', invoiceSettingsSchema);
};