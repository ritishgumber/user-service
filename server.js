var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
var DocumentDBSessionStore = require('express-session-documentdb');
var DocDB = require('./framework/docDB');

var app = express();

//globals
docDB = null;
passport = require('passport');

app.set('port', process.env.PORT || 3000);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('azure ermahgerd'));



//read in the global configuration settings in settings.json
siteConfig = {};
if(fs.existsSync('./settings.json')) {
    siteConfig = JSON.parse(fs.readFileSync('./settings.json').toString());

}

if(siteConfig.initialized) {
    docDB = new DocDB(siteConfig.documentdb);
    app.use(session({ secret: 'azure ermahgerd', saveUninitialized: true, resave: true, store: new DocumentDBSessionStore(siteConfig.documentdb) }));
    require('./framework/config')(passport);
    app.use(passport.initialize());
    app.use(passport.session());
} else {

      res.send('No Config File');
}


app.use('/auth', require('./routes/auth')(passport));

app.use(function(req, res, next){
  res.status(404).send('Sorry, unable to locate this resource');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Error');
});

var server = app.listen(app.get('port'), function() {
});
