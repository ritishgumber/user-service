module.exports = function(){

	var Schema = global.mongoose.Schema;

	var subscriberSchema = new Schema({
	  email:  String
	});

	return global.mongoose.model('Subscriber', subscriberSchema);

};