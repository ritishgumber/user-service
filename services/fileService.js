'use strict';

var async = require('async');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var keys = require('../config/keys');
var Grid = require('gridfs-stream');

module.exports = function() {
    Grid.mongo = global.mongoose.mongo;
    var gfs = new Grid(global.mongoose.connection.db);

    return {
        putFile: function (file,filename,mimetype) { 
            var deferred = Q.defer();          
            
            // streaming to gridfs
            //filename to store in mongodb
            var writestream = gfs.createWriteStream({
                filename: filename,
                mode: 'w',
                content_type:mimetype
            });
            file.pipe(writestream);
        
            writestream.on('close', function (file) {             
                //console.log(file.filename + ' is written To DB');                
                deferred.resolve(file);
            });

            writestream.on('error', function (error) {             
                console.log("error writing file");       
                deferred.reject(error);
            });          

            return deferred.promise;        
        },

        getFileById: function (fileId) { 
            var deferred = Q.defer();          
            
            gfs.findOne({_id: fileId},function (err, file) {
                if (err) return deferred.reject(err);
                if(!file){
                    return deferred.reject(null);                    
                }                     
                
                return deferred.resolve(file);  
            });          

            return deferred.promise;        
        },

        deleteFileById: function (fileId) { 
            var deferred = Q.defer();          
            
            gfs.remove({_id: fileId},function (err) {
                if (err){
                    return deferred.reject(err);     
                }                            
                
                return deferred.resolve("Success");  
            });          

            return deferred.promise;        
        }
    }
}        



