'use strict';

var async = require('async');
var Q = require('q');

module.exports = function(Table){

  return {

        upsertTable: function (projectId,data) {

              var deferred = Q.defer();

              var self = this;              

              self.findAndUpdate(projectId,data).then(function (done) {
                  if (done) {
                       deferred.resolve(true);
                  }else{                               
                    var table = new Table();
                    table.projectId=projectId;
                    table.tableSchema=data.tables;
                    table.save(function (err) {
                          if (err){ 
                            deffered.reject(err);
                          }
                          else{ 
                            deffered.resolve(true);
                          }
                     });
                  }
            },function(error){
                deferred.reject(error);  
            });              

              return deferred.promise;
          },

          findAndUpdate: function (projectId,data) {
              var deferred = Q.defer();

              var self = this;

              Table.findOneAndUpdate({ projectId: projectId }, { $set:{tableSchema:data.tables} }, function (err, table) {
                if (err) deferred.reject(err);
                else {
                  if(table){
                    deferred.resolve(true);
                  }else{
                    deferred.resolve(false);
                  }
                }
              });

             return deferred.promise;

          },
          getTableByProject: function (projectId) {

              var deferred = Q.defer();

              var self = this;

              Table.findOne({ projectId: projectId }, function (err, tables) {
                if (err) {
                  deferred.reject(err);
                }
                else {
                  if(tables){
                    deferred.resolve(tables);
                  }else{
                    deferred.resolve(null);
                  }
                }
              });

             return deferred.promise;
          }

    }

};
