var q = require("q");

module.exports = function () {
    
    var obj = {

    dbConnect: function(appId){
        try{
            return global.mongoClient.db(appId);

        }catch(err){
          global.winston.log('error',{"error":String(err),"stack": new Error().stack});        
        }
    },

    connect: function() {
            
            var _self = obj;
            var deferred = q.defer();
            try{
                var mongoClient = require('mongodb').MongoClient;
                mongoClient.connect(global.keys.mongoConnectionString,function (err, db) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(db);
                    }
                });

            }catch(err){
              global.winston.log('error',{"error":String(err),"stack": new Error().stack});
              deferred.reject(err);
            }
            
            return deferred.promise;
        }
    };

    return obj;
};
