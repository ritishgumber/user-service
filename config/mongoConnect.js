var q = require("q");

module.exports = function () {
    
    var obj = {

    dbConnect: function(appId){
        return global.mongoClient.db(appId);
    },

    connect: function() {
            
            var _self = obj;
            var deferred = q.defer();
            var mongoClient = require('mongodb').MongoClient;
            mongoClient.connect(global.keys.mongoConnectionString,function (err, db) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(db);
                }
            });
            return deferred.promise;
        }
    };

    return obj;
};
