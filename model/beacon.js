module.exports = function() {

	var Schema = global.mongoose.Schema;
	//console.log("Schema : "+Schema);
	var beaconSchema = new Schema({
		_userId: String,
		firstApp: Boolean,
		firstTable: Boolean,
		firstColumn: Boolean,
		firstRow: Boolean,
		tableDesignerLink: Boolean,
		documentationLink: Boolean
	});

	return global.mongoose.model('Beacon', beaconSchema);
};
