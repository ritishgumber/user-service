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
          
          	  if(!data.name){
              	deferred.reject("Invalid Table Table Name");
              	return deferred.promise;
              }
              
              if(!data.type){
              	deferred.reject("Invalid Table Type");
              	return deferred.promise;
              }
              
              console.log("type check " + data.type);
              var index = ["custom", "user", "role"].indexOf(data.type.toString());
              console.log(index);
              if( index < 0){
				 deferred.reject("Invalid Table Type");
				 return deferred.promise; 
			  }       
			  
			 console.log("duplicate check " + data.name);
			  //duplicate column value varification
			  if(!checkDuplicateColumns(data.columns)){
				deferred.reject("Duplicate Column or Invalid Column Found"); 
				return deferred.promise;
				
			  }
			  
			  console.log("datatype check " + data.name);
			  //default datatypes varification
			  var deafultDataType = getDefaultColumnWithDataType(data.type);
			  if(!checkValidDataType(data.columns, deafultDataType)){
				deferred.reject("Invalid DataType Found");		
				return deferred.promise;		
			  }
			  
			  
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
								if(!table.id)
									table.id = makeId();
																
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
								
								//check duplicate columns
								var tableColumn = _.pluck(table.columns, 'name');
								var tableColumn = _.filter(tableColumn, function(value){ return value.toLowerCase();});
								for(var i=0; i<data.columns.length; i++){
									var index = tableColumn.indexOf(data.columns[i].name.toLowerCase());
									if( index >= 0 ){
										if(data.columns[i].id && data.columns[i].id != table.columns[index].id){
											deferred.reject("Cannot Create Duplicate Column"); 
											flag++;
											break;
										}else if(!data.columns[i].id){
											deferred.reject("Cannot Create Duplicate Column"); 
											flag++;
											break;
										}
									}
									
									if(!data.columns[i].id){
										
										data.columns[i].id = makeId();																				
									}
								}
								
								defaultColumn = getDefaultColumnList(table.type);
								//check if any column's property is changed 
								for(var i=0; i<table.columns.length; i++){
									
									var column = _.where(data.columns, {id:table.columns[i].id})[0];
									if(column){
										
										if(column.name.toLowerCase() != table.columns[i].name.toLowerCase() || column.dataType != table.columns[i].dataType || column.relatedTo != table.columns[i].relatedTo || column.relationType != table.columns[i].relationType || column.relatedToType != table.columns[i].relatedToType || column.relatedTo != table.columns[i].relatedTo || column.isDeletable != table.columns[i].isDeletable || column.isEditable != table.columns[i].isEditable || column.isRenamable != table.columns[i].isRenamable){
										deferred.reject("Cannot Change Column's Property. Only Required and Unique Field are Changable"); 
										flag++;
										break;
										}
										
										if(column.unique != table.columns[i].unique){
											if(defaultColumn.indexOf(column.name.toLowerCase()) >= 0){
												deferred.reject("Cannot Change Unique Field of a Default Column.");   
												flag++;
												break;
											}
										}
										
										if(column.required != table.columns[i].required){
											if(defaultColumn.indexOf(column.name.toLowerCase()) >= 0){
												deferred.reject("Cannot Change Reqiured Field of a Default Column.");   
												flag++;
												break;
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
						var flag = 0;
						if(!table)
                  			table = new Table();

						if(flag == 0){
							table.id = makeId();
							for(var i=0; i<data.columns.length; i++){
								data.columns[i].id = makeId();
							}
							setAndSaveTable(appId,data,table,originalTable)
						      	.then(function(savedTable){
						        	deferred.resolve(savedTable);
						      	},function(error){ 
						        	deferred.reject(error);
						      	});
						}
		              	   							
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
    
    function getDefaultColumnWithDataType(type){
    	var defaultColumn = new Object();
    	defaultColumn['id'] ='Id';
    	defaultColumn['isSearchable']='Boolean';
    	defaultColumn['createdAt'] = 'DateTime';
    	defaultColumn['updatedAt'] ='DateTime'; 
    	defaultColumn['ACL'] = 'ACL';
    	var index;
    	
		if(type == 'user'){
			defaultColumn['username'] = 'Text';
			defaultColumn['email'] = 'Email';
			defaultColumn['password'] = 'Password'
			defaultColumn['roles'] = 'List';
		}else if(type == 'role'){
			defaultColumn['name'] = 'Text';
		}
		return defaultColumn;
    }
    
    //check for duplicate column
    function checkDuplicateColumns(columns){
    	var length = columns.length;
    	columns = _.pluck(columns, 'name');
    	//columns = _.filter(columns, function(value){ return value != ""});
    	//columns = _.filter(columns, function(value){ return value != null});
    	columns = _.filter(columns, Boolean);
    	columns = _.filter(columns, function(value){ return value.toLowerCase();});
    	columns = _.uniq(columns);
    	if(length != columns.length)
    		return false;
    	
    	return true;
    }
    
    //datatype varification
    function checkValidDataType(columns, deafultDataType){
    	var index;
    	var defaultColumns=[];
   		if(columns.length <= 0){
   			return false;
   		}
   		
   		//console.log(JSON.stringify(columns) + "   "+ JSON.stringify(deafultDataType));
   		//check for default column & respective properties 
   		var coloumnDataType = _.pluck(columns, 'dataType');
   		coloumnDataType = _.filter(coloumnDataType, Boolean); 	
    	for (var key in deafultDataType){
    		console.log(key);
    		index = coloumnDataType.indexOf(deafultDataType[key]);
    		if(index < 0)
    			return false;
    		
    		//id property for every table
    		//console.log(JSON.stringify(columns[index]));
    		if(key === 'id'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Id')
    				return false;
    		}
    		
    		//is searchable for every table
    		if(key === 'isSearchable'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != false || columns[index].unique != false || columns[index].dataType != 'Boolean')
    				return false;
    		}
    		
    		//createdAt for every table
    		if(key === 'createdAt'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'DateTime')
    				return false;
    		}
    		
    		//updatedAt for every table
    		if(key === 'updatedAt'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'DateTime')
    				return false;
    		}
    		
    		//ACL for every table
    		if(key === 'ACL'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'ACL')
    				return false;
    		}
    		
    		//username for user table
    		if(key === 'username'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Text')
    				return false;
    		}
    		
    		//email for user table
    		if(key === 'email'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Email')
    				return false;
    		}
    		
    		//password for user table
    		if(key === 'password'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'Password')
    				return false;
    		}
    		
    		//roles property for user table
    		if(key === 'roles'){
    			if(columns[index].relatedToType != 'role' || columns[index].relationType != 'table' || columns[index].required != false || columns[index].unique != false || columns[index].dataType != 'List')
    				return false;
    		}
    		
    		//name for role table
    		if(key === 'name'){
    			if(columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Text')
    				return false;
    		}
    		
    		if(columns[index].isRenamable != false || columns[index].isEditable != false || columns[index].isDeletable != false || columns[index].relatedTo != null){
    			return false;
    		}
    		defaultColumns.push(key);    
    		console.log(defaultColumns);		
    	}//end of for-loop
    	
    	//check for userdefined column & its properties
    	var validDataTypeForUser = ['Text', 'Email', 'URL', 'Number', 'Boolean', 'DateTime', 'GeoPoint', 'File', 'List', 'Relation', 'Object'];
    	//console.log(defaultColumns);
    	for(var i=0; i<columns.length; i++){
    		if(defaultColumns.indexOf(columns[i].name) < 0){
    			//console.log(columns[i].dataType);
    			var index = validDataTypeForUser.indexOf(columns[i].dataType);
    			//console.log(index);
				if(index < 0)
					return false;

				if(columns[i].dataType === 'List' || columns[i].dataType === 'Relation'){
					if(!columns[i].relatedTo)
						return false;
				}
				
    		}
    	}
			
		return true;
    }
    
    //generate a unique Id
	function makeId(){
	  //creates a random string of 8 char long.
	  var text = "";
	  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	  for( var i=0; i < 8; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
		return 'x'+text; //should start with char.
	}

};
