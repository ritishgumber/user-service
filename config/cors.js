

module.exports = function(app){

  var cors = require('cors');

  var whitelist = ['http://localhost:1440', 'http://www.cloudboost.io','http://cloudboost.io'];
  var corsOptions = {
    origin: function(origin, callback){
      var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
      callback(null, originIsWhitelisted);
    },
    credentials:true
  };

  app.use(cors(corsOptions));
  
};