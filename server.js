var isDevelopment = true;

var app = require('./app')(isDevelopment);
app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {

});


