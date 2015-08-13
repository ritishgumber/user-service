'use strict';

var async = require('async');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var keys = require('../config/keys');

module.exports = function(Table) {

    return {
        upsertTable: function (appId, data) {

            var deferred = Q.defer();
            var self = this;
            var originalTable = null;

            if (!data.name) {
                deferred.reject("Invalid Table Table Name");
                return deferred.promise;
            }

            if (!data.type) {
                deferred.reject("Invalid Table Type");
                return deferred.promise;
            }

            console.log("type check " + data.type);
            var index = ["custom", "user", "role"].indexOf(data.type.toString());
            if(data.type === 'user' || data.type === 'role'){
                if(data.maxCount !== 1){
                    deferred.reject("User and Role can't be added twice");
                }
            }
            if (index < 0) {
                deferred.reject("Invalid Table Type");
                return deferred.promise;
            }

            console.log("duplicate check " + data.name);
            //duplicate column value verification
            if (!checkDuplicateColumns(data.columns)) {
                deferred.reject("Duplicate Column or Invalid Column Found");
                return deferred.promise;

            }

            console.log("dataType check " + data.name);
            //default dataTypes verification
            var defaultDataType = getDefaultColumnWithDataType(data.type);
            if (!checkValidDataType(data.columns, defaultDataType)) {
                deferred.reject("Invalid DataType Found");
                return deferred.promise;
            }


            Table.findOne({appId: appId, name: data.name}, function (err, table) {
                if (err) {
                    deferred.reject(err);
                } else if (table && !data._id) {
                    deferred.reject("Table already exists.");
                } else {
                    //check if table name is renamed
                    if (data._id) {
                        Table.findOne({appId: appId, _id: data._id}, function (err, table) {
                            var flag = 0;
                            var defaultColumn;
                            if (table) {
                                if (table._doc._id === data._id && table.name !== data.name) {
                                    deferred.reject("Cannot Rename a Table.");
                                    flag++;
                                }

                                if (table._doc._id === data._id && table.type !== data.type) {
                                    deferred.reject("Cannot Change Table's Type Property.");
                                    flag++;
                                }

                                if (!checkDefaultColumns(data.columns, table._doc.type)) {
                                    deferred.reject("Cannot Delete Default Column(s) of a Table.");
                                    flag++;
                                }

                                //check duplicate columns
                                var tableColumn = _.pluck(table._doc.columns, 'name');
                                var tableColumn = _.filter(tableColumn, function (value) {
                                    return value.toLowerCase();
                                });
                                for (var i = 0; i < data.columns.length; i++) {
                                    var index = tableColumn.indexOf(data.columns[i].name.toLowerCase());
                                    if (index >= 0) {
                                        if (data.columns[i].id && data.columns[i].id != table._doc.columns[index].id) {
                                            deferred.reject("Cannot Create Duplicate Column");
                                            flag++;
                                            break;
                                        } else if (!data.columns[i].id) {
                                            deferred.reject("Cannot Create Duplicate Column");
                                            flag++;
                                            break;
                                        }
                                    }

                                    if (!data.columns[i].id) {

                                        data.columns[i].id = makeId();
                                    }
                                }

                                defaultColumn = getDefaultColumnList(table.type);
                                //check if any column's property is changed
                                for (var i = 0; i < table._doc.columns.length; i++) {

                                    var column = _.where(data.columns, {id: table._doc.columns[i].id})[0];
                                    if (column) {

                                        if (column.name.toLowerCase() != table._doc.columns[i].name.toLowerCase() || column.dataType != table._doc.columns[i].dataType
                                            || column.relatedTo != table._doc.columns[i].relatedTo || column.relationType != table._doc.columns[i].relationType
                                            || column.relatedToType != table._doc.columns[i].relatedToType || column.relatedTo != table._doc.columns[i].relatedTo
                                            || column.isDeletable != table._doc.columns[i].isDeletable || column.isEditable != table._doc.columns[i].isEditable
                                            || column.isRenamable != table._doc.columns[i].isRenamable) {
                                            deferred.reject("Cannot Change Column's Property. Only Required and Unique Field are Changable");
                                            flag++;
                                            break;
                                        }

                                        if (column.unique != table._doc.columns[i].unique) {
                                            if (defaultColumn.indexOf(column.name.toLowerCase()) >= 0) {
                                                deferred.reject("Cannot Change Unique Field of a Default Column.");
                                                flag++;
                                                break;
                                            }
                                        }

                                        if (column.required != table._doc.columns[i].required) {
                                            if (defaultColumn.indexOf(column.name.toLowerCase()) >= 0) {
                                                deferred.reject("Cannot Change Reqiured Field of a Default Column.");
                                                flag++;
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                if (!table)
                                    table = new Table();
                            }
                            if (flag == 0) {
                                originalTable = clone(table._doc);
                                setAndSaveTable(appId, data, table, originalTable)
                                    .then(function (savedTable) {
                                        deferred.resolve(savedTable);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                            }
                        });
                    } else {
                        var flag = 0;
                        if (!table)
                            table = new Table();

                        if (flag == 0) {
                            table._id = makeId();
                            for (var i = 0; i < data.columns.length; i++) {
                                data.columns[i].id = makeId();
                            }
                            setAndSaveTable(appId, data, table, originalTable)
                                .then(function (savedTable) {
                                    deferred.resolve(savedTable);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                        }

                    }
                }


            });

            return deferred.promise;

        },

        deleteTable: function (appId, tableName) {

            var deferred = Q.defer();

            var self = this;

            Table.findOne({appId: appId, name: tableName}, function (err, table) {

                if (err)
                    deferred.reject(err);

                if (table) {
                    table.remove(function (err,res) {
                        if (err)
                            deferred.reject(err);

                        //send a post request to DataServices.

                        //delete table from cache.
                        global.redisClient.del(global.keys.cacheSchemaPrefix + '-' + appId + ':' + tableName);

                        var post_data = "{ \"key\" : \"" + keys.cbDataServicesConnectKey + "\"}";

                        request.post({
                            headers: {
                                'content-type': 'application/json',
                                'content-length': post_data.length
                            },
                            url: keys.dataServiceUrl + "/app/" + appId + "/delete/" + tableName,
                            body: post_data
                        }, function (error, response, body) {
                            if (response.body === 'Success') {
                                console.log("Table Deleted");
                                deferred.resolve(true);
                            } else {
                                console.log("Error Deleting Table");
                                deferred.reject(error);
                            }

                        });
                    });
                }else{
                    var post_data = "{ \"key\" : \"" + keys.cbDataServicesConnectKey + "\"}";

                    request.post({
                        headers: {
                            'content-type': 'application/json',
                            'content-length': post_data.length
                        },
                        url: keys.dataServiceUrl + "/app/" + appId + "/delete/" + tableName,
                        body: post_data
                    }, function (error, response, body) {
                        if (response.body === 'Success') {
                            console.log("Table Deleted");
                            deferred.resolve(true);
                        } else {
                            console.log("Error Deleting Table");
                            deferred.reject(error);
                        }

                    });
                }
            });

            return deferred.promise;
        },

        getTablesByProject: function (appId) {

            var deferred = Q.defer();

            var self = this;

            Table.find({appId: appId}, function (err, tables) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    if (tables) {
                        var tables = _.map(tables, function (obj) {
                            return obj._doc
                        });
                        deferred.resolve(tables);
                    } else {
                        deferred.resolve(null);
                    }
                }
            });

            return deferred.promise;
        },

        getTableByTableName: function (appId, tableName) {

            var deferred = Q.defer();

            var self = this;

            Table.findOne({appId: appId, name: tableName}, function (err, table) {
                if (err) {
                    deferred.reject(err);
                } else if (table) {
                    deferred.resolve(table._doc);
                } else {
                    deferred.resolve(null);
                }

            });

            return deferred.promise;
        }

    };

}
    /* Private Functions */

    function setAndSaveTable(appId, data, table, originalTable) {
        var deferred = Q.defer();

        table.appId = appId;
        table.name = data.name;
        table.columns = data.columns;
        table.type = data.type;
        table.id = data.id;

        var promises = [];
        //refresh the cache. 
        console.log('++++++ Refreshing Redis Cache for table ++++++++');
        global.redisClient.del(global.keys.cacheSchemaPrefix + '-' + appId + ':' + data.name);
        console.log(global.keys.cacheSchemaPrefix + '-' + appId + ':' + data.name);
        promises.push(table.save());
        if(originalTable){
            promises.push(createNewColumns(appId,originalTable,table.columns));
        }else {
            promises.push(createTable(appId, table.name, table.columns));
        }
        Q.all(promises).then(function(table){
            if (originalTable) {
                deleteDroppedColumns(appId, originalTable, data.columns);
            }
            deferred.resolve(table[0]._doc);
        },function(err){
            deferred.reject(err);
        });
        return deferred.promise;
    }

    function createTable(appId, tableName, schema){
        var deferred = Q.defer();

        var post_data = "{ \"key\" : \"" + keys.cbDataServicesConnectKey + "\", \"schema\" : " + JSON.stringify(schema) + "}";

                request.post({
                    headers: {
                        'content-type': 'application/json',
                        'content-length': post_data.length
                    },
                    url: keys.dataServiceUrl + "/app/" + appId + "/create/" + tableName,
                    body: post_data
                }, function (error, response, body) {
                    console.log(body);
                    if (!error) {
                        if (response.body === 'Success') {
                            console.log("Table Created In DS");
                            deferred.resolve("Table Created in DS");
                        } else {
                            console.log("Table Create Error in DS");
                            deferred.reject("Table Create Error in DS");
                        }
                    } else {
                        console.log("error");
                    }
                });

        return deferred.promise;
    }

    function deleteDroppedColumns(appId, table, newColumns) {

        var originalColumns = table.columns;

        for (var i = 0; i < newColumns.length; i++) {
            var column = _.first(_.where(originalColumns, {id: newColumns[i].id}));
            originalColumns.splice(originalColumns.indexOf(column), 1);
        }

        if (originalColumns.length > 0) {
            //these columns need to be dropped. 
            for (var i = 0; i < originalColumns.length; i++) {

                //send a post request. 
                var post_data = "{ \"key\" : \"" + keys.cbDataServicesConnectKey + "\"}";

                request.post({
                    headers: {
                        'content-type': 'application/json',
                        'content-length': post_data.length
                    },
                    url: keys.dataServiceUrl + "/app/" + appId + "/" + table.name + "/delete/" + originalColumns[i].name,
                    body: post_data
                }, function (error, response, body) {
                    console.log(body);
                    if (!error) {
                        if (response.body === 'Success') {
                            console.log("Column Sucessfully deleted");
                        } else {
                            console.log("Column Delete Error");
                        }
                    } else {
                        console.log("error");
                    }
                });
            }
        }
    }

    function createNewColumns(appId, table, newColumns) {

        var deferred = Q.defer();

        var originalColumns = table.columns;

        var addedColumns = [];

        for (var i = 0; i < newColumns.length; i++) {
            var column = _.first(_.where(originalColumns, {id: newColumns[i].id}));
            if (!column) {
                addedColumns.push(newColumns[i]);
            }

        }

        if (addedColumns.length > 0) {
            //these columns need to be created in DataServices. 
            for (var i = 0; i < addedColumns.length; i++) {
                //send a post request. 
                var post_data = "{ \"key\" : \"" + keys.cbDataServicesConnectKey + "\",  \"column\" : " + JSON.stringify(addedColumns[i]) + "}";
                request.post({
                    headers: {
                        'content-type': 'application/json',
                        'content-length': post_data.length
                    },
                    url: keys.dataServiceUrl + "/app/" + appId + "/" + table.name + "/createColumn/",
                    body: post_data
                }, function (error, response, body) {
                    if (!error) {
                        if (response.body === 'Success') {
                            console.log("Column Created");
                            deferred.resolve("Success");
                        } else {
                            console.log("Column Create Error");
                            deferred.reject('Cannot create column');
                        }
                    } else {
                        console.log("error");
                        deferred.reject(error);
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

    function checkDefaultColumns(columns, type) {

        var defaultColumn = getDefaultColumnList(type);

        var index;

        columns = _.pluck(columns, 'name');

        for (var i = 0; i < columns.length; i++) {
            if (columns[i])
                columns[i] = columns[i].toLowerCase();
        }

        for (var i = 0; i < defaultColumn.length; i++) {
            index = columns.indexOf(defaultColumn[i].toLowerCase());
            if (index < 0)
                return false;
        }

        return true;
    }

    function getDefaultColumnList(type) {
        var defaultColumn = ['id', 'issearchable', 'createdat', 'updatedat', 'acl'];
        var index;

        if (type == 'user') {
            defaultColumn.concat(['username', 'email', 'password', 'roles']);
        } else if (type == 'role') {
            defaultColumn.push('name');
        }
        return defaultColumn;
    }

    function getDefaultColumnWithDataType(type) {
        var defaultColumn = new Object();
        defaultColumn['id'] = 'Id';
        defaultColumn['isSearchable'] = 'Boolean';
        defaultColumn['createdAt'] = 'DateTime';
        defaultColumn['updatedAt'] = 'DateTime';
        defaultColumn['ACL'] = 'ACL';
        var index;

        if (type == 'user') {
            defaultColumn['username'] = 'Text';
            defaultColumn['email'] = 'Email';
            defaultColumn['password'] = 'Password'
            defaultColumn['roles'] = 'List';
        } else if (type == 'role') {
            defaultColumn['name'] = 'Text';
        }
        return defaultColumn;
    }

    //check for duplicate column
    function checkDuplicateColumns(columns) {
        var length = columns.length;
        columns = _.pluck(columns, 'name');
        //columns = _.filter(columns, function(value){ return value != ""});
        //columns = _.filter(columns, function(value){ return value != null});
        columns = _.filter(columns, Boolean);
        columns = _.filter(columns, function (value) {
            return value.toLowerCase();
        });
        columns = _.uniq(columns);
        if (length != columns.length)
            return false;

        return true;
    }

    //datatype varification
    function checkValidDataType(columns, deafultDataType) {
        var index;
        var defaultColumns = [];
        if (columns.length <= 0) {
            return false;
        }

        //console.log(JSON.stringify(columns) + "   "+ JSON.stringify(deafultDataType));
        //check for default column & respective properties
        var coloumnDataType = _.pluck(columns, 'dataType');
        coloumnDataType = _.filter(coloumnDataType, Boolean);
        for (var key in deafultDataType) {
            console.log(key);
            index = coloumnDataType.indexOf(deafultDataType[key]);
            if (index < 0)
                return false;

            //id property for every table
            //console.log(JSON.stringify(columns[index]));
            if (key === 'id') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Id')
                    return false;
            }

            //is searchable for every table
            if (key === 'isSearchable') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != false || columns[index].unique != false || columns[index].dataType != 'Boolean')
                    return false;
            }

            //createdAt for every table
            if (key === 'createdAt') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'DateTime')
                    return false;
            }

            //updatedAt for every table
            if (key === 'updatedAt') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'DateTime')
                    return false;
            }

            //ACL for every table
            if (key === 'ACL') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'ACL')
                    return false;
            }

            //username for user table
            if (key === 'username') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Text')
                    return false;
            }

            //email for user table
            if (key === 'email') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Email')
                    return false;
            }

            //password for user table
            if (key === 'password') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != false || columns[index].dataType != 'Password')
                    return false;
            }

            //roles property for user table
            if (key === 'roles') {
                if (columns[index].relatedToType != 'role' || columns[index].relationType != 'table' || columns[index].required != false || columns[index].unique != false || columns[index].dataType != 'List' || columns[index].dataType === 'Role')
                    return false;
            }

            //name for role table
            if (key === 'name') {
                if (columns[index].relatedToType != null || columns[index].relationType != null || columns[index].required != true || columns[index].unique != true || columns[index].dataType != 'Text')
                    return false;
            }

            if (columns[index].isRenamable != false || columns[index].isEditable != false || columns[index].isDeletable != false) {
                return false;
            }
            defaultColumns.push(key);
            console.log(defaultColumns);
        }//end of for-loop

        //check for userdefined column & its properties
        var validDataTypeForUser = ['Text', 'Email', 'URL', 'Number', 'Boolean', 'DateTime', 'GeoPoint', 'File', 'List', 'Relation', 'Object'];
        //console.log(defaultColumns);
        for (var i = 0; i < columns.length; i++) {
            if (defaultColumns.indexOf(columns[i].name) < 0) {
                //console.log(columns[i].dataType);
                var index = validDataTypeForUser.indexOf(columns[i].dataType);
                //console.log(index);
                if (index < 0)
                    return false;

                if (columns[i].dataType === 'List' || columns[i].dataType === 'Relation') {
                    if (!columns[i].relatedTo)
                        return false;
                }

            }
        }

        return true;
    }

    //generate a unique Id
    function makeId() {
        //creates a random string of 8 char long.
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 8; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return 'x' + text; //should start with char.
    }

        

