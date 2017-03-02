module.exports = function(){

	var Schema = global.mongoose.Schema;

	var cardSchema = new Schema({
        _userId: String,
		cards: Array
	});

	return global.mongoose.model('Card', cardSchema);

};