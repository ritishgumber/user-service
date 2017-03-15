module.exports = function() {

	var Schema = global.mongoose.Schema;

	var cbpartnerSchema = new Schema({
		companyName: String,
		companyDescription: String,
		personName: String,
		companyEmail: String,
		companyContact: String,
		personMobile: String,
		companyAddress: String,
		companyWebsite: String,
		companyCountry: String,
		appSpecilizedIn: String,
		companySize: String,
		createdAt: Date
	});

	return global.mongoose.model('Cbpartner', cbpartnerSchema);

};
