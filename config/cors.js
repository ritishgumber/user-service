var keys = require('./keys.js');

module.exports = function(app){

  var cors = require('cors');

  // var whitelist = keys.cors;
  // var corsOptions = {
  //   origin: function(origin, callback){
  //     var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
  //     callback(null, originIsWhitelisted);
  //   },
  //   credentials:true
  // };

  app.use(cors());
  
};