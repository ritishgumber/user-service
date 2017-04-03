'use strict';


module.exports = function() {

	return {

		generateRandomString: function() {
			try {
				var text = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

				for (var i = 0; i < 8; i++)
					text += possible.charAt(Math.floor(Math.random() * possible.length));

				return text;

			} catch (err) {
				global.winston.log('error', {
					"error": String(err),
					"stack": new Error().stack
				});
			}
		},

		isEmailValid: function(email) {
			var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
			return re.test(email);
		}

	};

};
