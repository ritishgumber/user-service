var q = require('q');
var uuid = require('node-uuid');


//This file manages encryption keys, Host URL, etc etc. 
module.exports = function () {
    return {
        
        initEncryptKey : function () {
            try {
                console.log("Init Encrypt Key");
                var key = null;

                if (global.keys.encryptKey) {
                    console.log("Encrypt Key : " + global.keys.encryptKey);
                    deferred.resolve(global.keys.encryptKey);
                } else {

                    //get it from mongodb, If does not exist, create a new random key and return;
                    var deferred = q.defer();

                    var collection = global.mongoClient.db(global.keys.globalDb).collection(global.keys.globalSettings);

                    collection.find(function (err, docs) {
                        if (err) {
                            console.log("Error retrieveing Global Settings");
                            console.log(err);
                            deferred.reject(err);
                        } else {

                            var key = uuid.v4(); //generate a new key.

                            if (docs.length >= 1) {
                                if (docs[0].encryptKey) {
                                    global.keys.encryptKey = docs[0].encryptKey;
                                    console.log("Encrypt Key : " + global.keys.encryptKey);
                                    deferred.resolve(global.keys.encryptKey);
                                } else {

                                    //save in mongodb.
                                    if (!docs[0])
                                        docs[0] = {};

                                    docs[0]["encryptKey"] = key;

                                    collection.save(docs[0], function (err, doc) {
                                        if (err) {
                                            console.log("Error while saving Global Settings");
                                            console.log(err);
                                            deferred.reject(err);
                                        } else {
                                            //resolve if not an error
                                            console.log("Encrypt Key : " + global.keys.encryptKey);
                                            deferred.resolve(key);
                                        }
                                    });
                                }
                            }else{
                                //create a new document.
                                var doc = {};
                                doc.encryptKey = key;
                                global.keys.encryptKey = key;
                                collection.save(doc, function (err, doc) {
                                    if (err) {
                                        console.log("Error while saving Global Settings");
                                        console.log(err);
                                        deferred.reject(err);
                                    } else {
                                        //resolve if not an error
                                        console.log("Encrypt Key : " + global.keys.encryptKey);
                                        deferred.resolve(key);
                                    }
                                });
                            }
                        }
                    });
                }

                return deferred.promise;
            }catch(e){
                console.log("Error Init Encrypt Key");
                console.log(e);
            }
        },

        getMyUrl : function () { 
            
                var deferred = q.defer();
                
                if (global.keys.myURL) {
                    deferred.resolve(global.keys.myURL);
                } else {
                    //get it from mongodb, If does not exist, create a new random key and return; 
                    var deferred = q.defer();
                    
                    var collection = global.mongoClient.db(global.keys.globalDb).collection(global.keys.globalSettings);
                    
                    collection.find(function (err, docs) {
                        if (err) {
                            console.log("Error retrieveing Global Settings");
                            console.log(err);
                            deferred.reject(err);
                        } else {
                            
                            var key = uuid.v4(); //generate a new key.
                            
                            if (docs.length >= 1) {
                                if (docs[0].myURL) {
                                    global.keys.myURL = docs[0].myURL;
                                    deferred.resolve(global.keys.myURL);
                                } else {
                                    deferred.reject("URL not found.");
                                }
                            } else {
                                deferred.reject("URL not found.");
                            }
                        }
                    });
                    
                    return deferred.promise;
                }
        }, 
    
    };
};