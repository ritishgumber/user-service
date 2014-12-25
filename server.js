var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
var DocumentDBSessionStore = require('express-session-documentdb');
var DocDB = require('./framework/docDB');
var app = express();
var isDevelopment = false;
var siteConfig = require('./config/settings.js')(isDevelopment);

//globals
docDB = null;
passport = require('passport');

app.set('port', process.env.PORT || 3000);
if(isDevelopment){
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin","http://localhost:1440");
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
  });

}else{

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin","http://www.cloudboost.io");
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
  });

}



app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('azure ermahgerd'));


if(siteConfig.initialized) {
    docDB = new DocDB(siteConfig.documentdb);
    app.use(session({ secret: 'azure ermahgerd',cookie: {maxAge: 600000}, saveUninitialized: true, resave: false, store: new DocumentDBSessionStore(siteConfig.documentdb) }));
    require('./framework/config')(passport);
    app.use(passport.initialize());
    app.use(passport.session());
} else {
      console.log('No Config File');
}

app.use('/auth', require('./routes/auth')(passport));
app.use('/', require('./routes/project')());
app.use('/', require('./routes/market')());

app.use(function(req, res, next){
  res.status(404).send('Sorry, unable to locate this resource');
});

app.use(function(err, req, res, next){
  res.status(500).send('Error');
});

var server = app.listen(app.get('port'), function() {
});
