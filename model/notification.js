module.exports = function(){

	var Schema = global.mongoose.Schema;
	
	var notificationSchema = new Schema({	 
	           user : String,	
	            text: String,
	           appId: String,
	notificationType: String,
	            type: String,
	            seen: Boolean,
	            date: { type: Date, default: Date.now }

	});

	return global.mongoose.model('Notification', notificationSchema);
};
