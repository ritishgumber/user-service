var isDevelopment = process.env.PORT ? false : true;
var app = require('./app')(isDevelopment);
app.set('port', process.env.PORT || 3000);

global.isDevelopment = isDevelopment;

var server = app.listen(app.get('port'), function() {

});
