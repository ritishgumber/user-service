var supertest = require('supertest');
var should = require('should');
var app = require('../app.js')(true); //is development.
var request = require('supertest');

require('./routes/home.js')(request,app);
require('./routes/subscriber.js')(request,app);
require('./routes/auth.js')(request,app);
