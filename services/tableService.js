'use strict';

var async = require('async');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var keys = require('../config/keys');

module.exports = function(Table){

  return {

        upsertTable: function (appId,data) {

              var deferred = Q.defer();
              var self = this; 
              var originalTable=null;             

              Table.findOne({appId: appId, name : data.name}, function(err, table){
                
                if(err){
                  deferred.reject(err);
                }else if(table && !data._id){
                  deferred.reject("Table already exists.");                 
                }else{

                  if(data._id)
                  originalTable = clone(table); //copy the object.

                  if(!table)
                  table = new Table();

                  setAndSaveTable(appId,data,table,originalTable)
                  .then(function(savedTable){
                    deferred.resolve(savedTable);
                  },function(error){ 
                    deferred.reject(error);
                  });                 
             
                }  

              });

            return deferred.promise;
          },

          deleteTable: function (appId,tableName) {

              var deferred = Q.defer();

              var self = this;              

              Table.findOne({appId: appId, name: tableName}, function(err, table){

                 if(err)
                  deferred.reject(err);

                if(table){
                   table.remove(function(err){

                     if(err)
                      deferred.reject(err);

                      //send a post request to DataServices.

                      //delete table from cache. 
                      global.redisClient.del(global.keys.cacheSchemaPrefix+'-'+appId+':'+tableName);

                      var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\"}";

                      request.post({
                        headers: {
                                    'content-type' : 'application/json', 
                                    'content-length' : post_data.length
                                 },
                        url:     keys.dataServiceUrl + "/app/"+appId+"/delete/"+tableName,
                        body:    post_data
                      }, function(error, response, body){

                         if(response.body === 'Success'){
                            deferred.resolve(true);
                         }else{
                            deferred.reject();
                         }

                       });
                   });
                 }


              });

              return deferred.promise;
          },

          getTablesByProject: function (appId) {

              var deferred = Q.defer();

              var self = this;

              Table.find({ appId: appId }, function (err, tables) {
                if (err) {
                  deferred.reject(err);
                }
                else {
                  if(tables){
                    var tables = _.map(tables, function(obj){ return obj._doc});
                    deferred.resolve(tables);
                  }else{
                    deferred.resolve(null);
                  }
                }
              });

             return deferred.promise;
          },

          getTableByTableName: function (appId,tableName) {

              var deferred = Q.defer();

              var self = this;
            
              Table.findOne({appId:appId, name: tableName }, function (err, table) {
                if (err) {
                  deferred.reject(err);
                }else if(table){                 
                  deferred.resolve(table._doc);                  
                }else{
                  deferred.resolve(null);
                }

              });

             return deferred.promise;
          }

    };


    /* Private Functions */

    function setAndSaveTable(appId,data,table,originalTable){
      var deferred = Q.defer();

      table.appId = appId;
      table.name = data.name;
      table.columns = data.columns;
      table.type = data.type;
      table.id = data.id;               

      createIndex(table.appId,table.name,table.columns);

      //refresh the cache. 
      console.log('++++++ Refreshing Redis Cache for table ++++++++');
      global.redisClient.del(global.keys.cacheSchemaPrefix+'-'+appId+':'+data.name);
      console.log(global.keys.cacheSchemaPrefix+'-'+appId+':'+data.name);

      table.save(function(err,table){

        if(err)
          deferred.reject(err);
        else
          deferred.resolve(table._doc);
         
          if(originalTable){
            deleteDroppedColumns(appId, clone(originalTable._doc), clone(data.columns));
            renameRenamedColumns(appId, clone(originalTable._doc), clone(data.columns));
            renameRenamedTable(appId, clone(originalTable._doc), clone(data));
          }

      });

      return deferred.promise;
    }

    function renameRenamedTable(appId, originalTable, newTable){
            if(originalTable.name !== newTable.name){
              //this table is renamed. 
              
              console.log('Table '+ originalTable.name+' is renamed to '+newTable.name);
              //send a post request. 

              var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\" , \"newCollectionName\" :  \""+newTable.name+"\"  }";

              request.post({
                headers: {
                            'content-type' : 'application/json', 
                            'content-length' : post_data.length
                         },
                url:     keys.dataServiceUrl +"/app/"+appId+"/rename/"+originalTable.name,
                body:    post_data
              }, function(error, response, body){
                 if(response.body === 'Success'){
                   console.log('Collection '+newTable.name + "Sucessfully Renamed");
                 }else{
                    console.log('Collection '+newTable.name + " Rename Error.");
                 }

               });


            }

          }

          function renameRenamedColumns(appId, originalTable, newTable){
              for(var i=0;i<originalTable.columns.length; i++){
                var newColumn = _.first(_.where(newTable, {id : originalTable.columns[i].id }));

                if(newColumn && newColumn.name !== originalTable.columns[i].name){
                   
                   //shoot a post request to rename a column in CbDataServices. 

                   var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\" , \"newColumnName\" :  \""+newColumn.name+"\"  }";

                    request.post({

                      headers: {
                                  'content-type' : 'application/json', 
                                  'content-length' : post_data.length
                               },

                      url:     keys.dataServiceUrl +"/app/"+appId+"/"+originalTable.name+"/rename/"+originalTable.columns[i].name,
                      body:    post_data
                    }, function(error, response, body){

                       if(response.body === 'Success'){
                         console.log('Collection '+newTable.name + "Sucessfully Renamed");
                       }else{
                          console.log('Collection '+newTable.name + " Rename Error.");
                       }

                     });
                }
              }
          }

          function deleteDroppedColumns(appId, table, newColumns){

                  var originalColumns  = table.columns;

                  for(var i=0;i<newColumns.length; i++){

                      var column = _.first(_.where(originalColumns, {id :newColumns[i].id }));
                      originalColumns.splice(originalColumns.indexOf(column),1);

                  }

                  if(originalColumns.length>0){
                    //these columns need to be dropped. 
                    for(var i=0;i<originalColumns.length; i++){
                        
                        //send a post request. 

                        var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\"}";

                        request.post({
                          headers: {
                                      'content-type' : 'application/json', 
                                      'content-length' : post_data.length
                                   },
                          url:     keys.dataServiceUrl + "/app/"+appId+"/"+table.name+"/delete/"+originalColumns[i].name,
                          body:    post_data
                        }, function(error, response, body){

                           console.log(body);
                        if(!error) {
                            if (response.body === 'Success') {
                                console.log("Column Sucessfully deleted");
                            } else {
                                console.log("Column Delete Error");
                            }
                        }else
                        {
                            console.log("error");
                        }
                         });

                    }
                  }
          }

          function clone(obj) {
            var copy;

            // Handle the 3 simple types, and null or undefined
            if (null == obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        }
    function createIndex(appId,tableName,columns)
    {
        for(var i in columns)
        {
            if(columns[i].dataType === 'GeoPoint')
            {
                var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\",\"collectionName\" :  \""+tableName+"\",\"columnName\" :  \""+columns[i].name+"\"}";
                request.post({
                    headers: {
                        'content-type' : 'application/json',
                        'content-length' : post_data.length
                       // 'user-agent' : 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0.1) Gecko/20100101 Firefox/10.0.1'
                        //'host' : 'localhost:80'
                    },
                    url:     keys.dataServiceUrl +"/api/createIndex/"+appId,
                    body:    post_data
                }, function(error, response, body){
                    if(error)
                    {
                        console.log(error);
                    }else {
                        if (response.body === 'Success') {
                            console.log('Index Created');
                        } else {
                            console.log('Index cant be created');
                        }
                    }

                });
            }
        }
    }

};
