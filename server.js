global.isDevelopment = process.env.PORT ? false : true;
global.isVM = true;
var app = require('./app')();

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {

});
