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
					//check if table name is renamed 
					if(data._id){
						Table.findOne({appId: appId, _id : data._id}, function(err, table){
							var flag = 0;
							var defaultColumn;
							if(table){
								if(table._id == data._id && table.name != data.name){
									deferred.reject("Cannot Rename a Table.");   
									flag++;
								}
								
								if(table._id == data._id && table.type != data.type){
									deferred.reject("Cannot Change Table's Type Property."); 
									flag++;
								}
								
								if(!checkDefaultColumns(data.columns, table.type)){
									deferred.reject("Cannot Delete Default Column(s) of a Table.");   
									flag++;
								}
								
								defaultColumn = getDefaultColumnList(table.type);
								//check if any column's property is changed 
								for(var i=0; i<table.columns.length; i++){
									var column = _.where(data.columns, {id:table.columns[i].id})[0];
									if(column){
										
										if(column.name.toLowerCase() != table.columns[i].name.toLowerCase() || column.dataType != table.columns[i].dataType || column.relatedTo != table.columns[i].relatedTo || column.relationType != table.columns[i].relationType || column.relatedToType != table.columns[i].relatedToType || column.relatedTo != table.columns[i].relatedTo || column.isDeletable != table.columns[i].isDeletable || column.isEditable != table.columns[i].isEditable || column.isRenamable != table.columns[i].isRenamable){
										deferred.reject("Cannot Change Column's Property. Only Required and Unique Field can be edited."); 
										flag++;
										}
										
										if(column.unique != table.columns[i].unique){
											if(defaultColumn.indexOf(column.name.toLowerCase()) >= 0){
												deferred.reject("Cannot Change Unique Field of a Default Column.");   
												flag++;
											}
										}
										
										if(column.required != table.columns[i].required){
											if(defaultColumn.indexOf(column.name.toLowerCase()) >= 0){
												deferred.reject("Cannot Change Reqiured Field of a Default Column.");   
												flag++;
											}
										}
									}
								}
							}else{
								if(!table)
                  					table = new Table();
							}
							if(flag == 0){
								originalTable = clone(table);
								
								setAndSaveTable(appId,data,table,originalTable)
								.then(function(savedTable){
								   	deferred.resolve(savedTable);
								},function(error){ 
								   	deferred.reject(error);
								});
							}
						});
					}else{
					
						if(!table)
                  	table = new Table();

		              	setAndSaveTable(appId,data,table,originalTable)
		              	.then(function(savedTable){
		                	deferred.resolve(savedTable);
		              	},function(error){ 
		                	deferred.reject(error);
		              	});   							
					}              
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
          }

      });

      return deferred.promise;
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
                }else{
                    console.log("error");
                }
             });
        }
      }
    }

    function createNewColumns(appId, table, newColumns){

      var originalColumns  = table.columns;

      var addedColumns = [];

      for(var i=0;i<newColumns.length; i++){
          var column = _.first(_.where(originalColumns, {id :newColumns[i].id }));
          if(!column){
            addedColumns.push(newColumns[i]);
          }
              
      }

      if(addedColumns.length>0){
        //these columns need to be created in DataServices. 
        for(var i=0;i<addedColumns.length; i++){
            //send a post request. 
            var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\",  \"column\" : \""+JSON.stringify(addedColumns[i])+"\"}";
            request.post({
              headers: {
                          'content-type' : 'application/json', 
                          'content-length' : post_data.length
                       },
              url:     keys.dataServiceUrl + "/app/"+appId+"/"+table.name+"/create/"+originalColumns[i].name,
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
    
    function checkDefaultColumns(columns, type){
    
    	var defaultColumn = getDefaultColumnList(type);
    	
    	var index;
    	
		  columns = _.pluck(columns, 'name');
		
		  for(var i=0; i<columns.length; i++){
			  if(columns[i])
    			 columns[i] = columns[i].toLowerCase();
    	}
    	
    	for(var i=0; i<defaultColumn.length; i++){
    		index = columns.indexOf(defaultColumn[i].toLowerCase());
    		if(index < 0)
    			return false;
    	}

    	return true;
    }
    
    function getDefaultColumnList(type){
    	var defaultColumn = ['id', 'issearchable', 'createdat', 'updatedat', 'acl'];
    	var index;
    	
  		if(type == 'user'){
  			defaultColumn.concat(['username', 'email', 'password', 'roles']);
  		}else if(type == 'role'){
  			defaultColumn.push('name');
  		}
  		return defaultColumn;
    }

};
