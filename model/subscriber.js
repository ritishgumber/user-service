module.exports = function(mongoose){

	var Schema = mongoose.Schema;

	var subscriberSchema = new Schema({
	  email:  String
	});

	return mongoose.model('Subscriber', subscriberSchema);

};