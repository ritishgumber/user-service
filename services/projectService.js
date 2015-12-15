'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');

module.exports = function(Project,InvoiceService){

  return {

          createProject: function (name, appId ,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              Project.findOne({appId : appId}, function (err, project) {
                if(project){
                  deferred.reject('AppID already exists');
                }else{
                  Project.findOne({_userId:userId,name:name}, function (err, projectSameName) {
                    if(projectSameName){
                      deferred.reject('AppName already exists');
                    }else{
                        var project = new Project();
                        project._userId=userId;
                        project.name=name;
                        project.appId = appId;  
                        project.keys = {};
                        project.keys.js = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 16).toString("base64");
                        project.keys.master = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 32).toString("base64");        
                        
                        //Adding default developer
                        var developers=[];
                        var newDeveloper={};
                        newDeveloper.userId=userId;
                        newDeveloper.role="Admin";
                        developers.push(newDeveloper);

                        project.developers=developers;
                        //End Adding default developer

                        var promises = [];
                        promises.push(createProject(appId));
                        promises.push(project.save());
                        Q.all(promises).then(function (project) {
                                if(!project)
                                    deferred.reject('Cannot save the app right now.');
                                else{
                                  //Create invoice Settings
                                  InvoiceService.createInvoiceSettings(appId, userId).then(function(invoiceSettings){
                                    if(invoiceSettings){
                                        //Create invoice 
                                        InvoiceService.createInvoice(appId, userId).then(function(invoice){                                    
                                          if(invoice){                                        
                                              //Get Project Status
                                              _self.projectStatus(appId, userId).then(function(status){
                                                project[1]._doc.status = status;
                                                deferred.resolve(project[1]._doc);
                                              }, function(error){
                                                project[1]._doc.status = {status : 'Unknown'};
                                                deferred.resolve(project[1]._doc);
                                              });
                                              //End of get Project Status
                                          }

                                        },function(error){
                                          deferred.resolve(project[1]._doc);
                                        });
                                        //End of create invoice
                                    }
                                  },function(error){
                                    deferred.resolve(project[1]._doc);
                                  });
                                  //End of create invoice Settings
                                 
                                }
                        },function(err){
                            deferred.reject(err);
                        });
                    }
                  }); //End of checking same AppName 
                }//end of else of if project is there
              });             

              return deferred.promise;
          },

          projectStatus: function (appId, userId) {

              var deferred = Q.defer();

              var self = this;         

              // try{    

              //     Project.findOne({ appId: appId, _userId : userId }, function (err, project) {
              //       if (err) deferred.reject(err);

              //       if(!project)
              //         deferred.reject('Cannot find.');

              //       http.get(keys.dataServiceUrl+":"+keys.dataServiceUrlPort+"/app/status/"+appId, function(res) {
              //         if(res.statusCode===200){
              //           deferred.resolve({status:'online', appId : appId});
              //         }else{
              //           deferred.resolve({status:'offline', appId : appId});
              //         }
              //       }).on('error', function(e) {
              //         deferred.resolve({status:'offline', appId : appId});
              //       });
                     
              //     });
              //   }catch(e){
              //     console.log('+++++ Project Status Error +++++++');
              //     console.log(e);
              //     deferred.reject(e);
              //   }

              deferred.resolve({status:'online', appId : appId});

              return deferred.promise;
          },

          projectList: function (userId) {

            var _self = this;

            var deferred = Q.defer();

            var self = this;            

              Project.find({ developers: {$elemMatch: {userId:userId} } }, function (err, list) {
                if (err) deferred.reject(err);

                var promise = [];

                for(var i=0;i<list.length;i++){
                    promise.push(_self.projectStatus(list[i]._doc.appId, userId));
                }

                Q.all(promise).then(function(statusList){
                  //merge status with the list
                  for(var i=0;i<list.length;i++){
                    var statusObj = _.first(_.where(statusList, {appId : list[i]._doc.appId}));
                    list[i]._doc.status = statusObj;
                  }

                 list = _.map(list, function(obj){ return obj._doc});

                  deferred.resolve(list);

                }, function(error){
                  deferred.reject(error);
                });
                 
              });

             return deferred.promise;
          },

          editProject: function(userId,id,name) {

              var deferred = Q.defer();
              var _self = this;

              _self.getProject(id).then(function (project) {
                  if (!project) {
                      deferred.reject('error updating project');
                  }else if(project){

                    Project.findOne({name:name}, function (err, projectSameName) {
                      if(projectSameName){
                        deferred.reject('AppName already exists');
                      }else{

                          /***Start editing***/
                          if(project && checkValidUser(project,userId)){                      
                              project.name=name;                 

                              project.save(function (err, project) {
                                  if (err) deferred.reject(err);

                                  if(!project)
                                      deferred.reject('Cannot save the app right now.');
                                  else{
                                    _self.projectStatus(id, userId).then(function(status){
                                      project._doc.status = status;
                                      deferred.resolve(project._doc);
                                    }, function(error){
                                      project._doc.status = {status : 'Unknown'};
                                      deferred.resolve(project._doc);
                                    });
                                  }
                              });
                          }else{
                           deferred.reject("Unauthorized");
                          }
                          /***End Start editing***/ 

                      }
                    });  
                  }                                 

              },function(error){
                deferred.reject(error);
              });

              return deferred.promise;
          },

          getProject: function (appId) {

              var deferred = Q.defer();

              var self = this;

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                else {
                    deferred.resolve(project);
                }
              });

             return deferred.promise;

          },
          changeAppMasterKey: function (appId) {

              var deferred = Q.defer();

              var self = this;             

              var newMasterKey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 32).toString("base64");        

              Project.findOneAndUpdate({appId:appId},{$set: {"keys.master":newMasterKey }},{'new': true}, function (err, newProject) {
                if (err) deferred.reject(err);
                if(newProject){
                  deferred.resolve(newProject);
                }else{
                  deferred.resolve(null);
                }
                     
              });

             return deferred.promise;

          },
          changeAppClientKey: function (appId) {

              var deferred = Q.defer();

              var self = this;

              var newClientkey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), keys.encryptKey, 100, 16).toString("base64");

              Project.findOneAndUpdate({appId:appId},{$set: {"keys.js":newClientkey }},{'new': true}, function (err, newProject) {
                if (err) deferred.reject(err);
                if(newProject){
                  deferred.resolve(newProject);
                }else{
                  deferred.resolve(null);
                }
                     
              });

             return deferred.promise;

          },

          delete: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;

              console.log(' ++++++++ App Delete request +++++++++');

              Project.remove({appId:appId,developers: {$elemMatch: {userId:userId,role:"Admin"} }}, function (err) {
                if(err){
                  console.log('++++++++ App Delete failed from frontend ++++++++++'); 
                  console.log(err);
                  deferred.reject(err);
                }else{
                    var post_data = "{ \"key\" : \""+keys.cbDataServicesConnectKey+"\"}";
                    request.del({
                      headers: {
                                  'content-type' : 'application/json', 
                                  'content-length' : post_data.length
                               },
                      url:     keys.dataServiceUrl +"/app/"+appId,
                      body:    post_data
                    }, function(error, response, body){
                       if(response && response.body === 'Success'){
                          console.log('successfully deleted');
                           deferred.resolve();
                       }else{
                          deferred.reject();
                       }
                    });
                }
              });

             return deferred.promise;

          },
          removeUser: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;             

              Project.findOne({appId:appId,developers: {$elemMatch: {userId:userId} }}, function (err,foundProj) {
                if(err){                  
                  deferred.reject(err);
                }else if(!foundProj){
                   deferred.reject("Project not found with given userId");
                }else{

                  var tempArray=foundProj.developers;

                  for(var i=0;i<foundProj.developers.length;++i){
                    if(foundProj.developers[i].userId==userId){
                      tempArray.splice(i,1);
                    }
                  }

                  foundProj.developers=tempArray;
                  foundProj.save(function (err, project) {
                    if (err) deferred.reject(err);
                    if(!project){
                      deferred.reject('Cannot save the app right now.');
                    }else{
                      deferred.resolve(project);                     
                    }
                  });
                }
              });

             return deferred.promise;

          },
          allProjectList: function () {

            var _self = this;

             var deferred = Q.defer();

              var self = this;

              Project.find({}, function (err, list) {
                if (err) deferred.reject(err);

                var promise = [];

                for(var i=0;i<list.length;i++){
                    promise.push(_self.projectStatus(list[i]._doc.appId, list[i]._doc._userId));
                }

                Q.all(promise).then(function(statusList){
                  //merge status with the list
                  for(var i=0;i<list.length;i++){
                    var statusObj = _.first(_.where(statusList, {appId : list[i]._doc.appId}));
                    list[i]._doc.status = statusObj;
                  }

                 list = _.map(list, function(obj){ return obj._doc});

                  deferred.resolve(list);

                }, function(error){
                  deferred.reject(error);
                });
                 
              });

             return deferred.promise;
          },
          inviteUser: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;                 

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                if(!project){
                  deferred.reject("App not found!.");
                }else{
                  var alreadyThere=project.invited.indexOf(userId);
                  if(alreadyThere<0){
                    project.invited.push(userId);

                    project.save(function (err, savedProject) {
                      if (err) deferred.reject(err);
                      if(!savedProject){
                        deferred.reject('Cannot save the app right now.');
                      }else{
                        deferred.resolve("successfully Invited!");                     
                      }
                    });

                  }else{
                    deferred.resolve("Already invited!");
                  } 
                  
                }
                     
              });

             return deferred.promise;

          },
          addDeveloper: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;                 

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                if(!project){
                  deferred.reject("App not found!.");
                }else{

                  if(!checkValidUser(project,userId)){

                    //Adding default developer                      
                      var newDeveloper={};
                      newDeveloper.userId=userId;
                      newDeveloper.role="User";

                      project.developers.push(newDeveloper); 
                    //End Adding default developer                   

                    project.save(function (err, savedProject) {
                      if (err) deferred.reject(err);
                      if(!savedProject){
                        deferred.reject('Cannot save the app right now.');
                      }else{
                        deferred.resolve("successfully Added!");                     
                      }
                    });

                  }else{
                    deferred.resolve("Already added!");
                  } 
                  
                }
                     
              });

             return deferred.promise;

          }
    }

};

function createProject(appId){

    var deferred = Q.defer();

    var post_data = {};
    post_data.key = global.keys.cbDataServicesConnectKey;
    post_data = JSON.stringify(post_data);
    var url = global.keys.dataServiceUrl + '/app/'+appId;
    request.post(url,{
        headers: {
            'content-type': 'application/json',
            'content-length': post_data.length
        },
        body: post_data
    },function(err,response,body){
        if(err || response.statusCode === 500 || body === 'Error')
            deferred.reject(err);
        else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function checkValidUser(app,userId){
  if(app.developers && app.developers.length>0){
    return _.find(app.developers, function(eachObj){ 
      if(eachObj.userId==userId){
        return true;
      }
    });

  }else {
    return false;
  }
}