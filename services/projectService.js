'use strict';

var async = require('async');
var Q = require('q');
var http = require('http');
var keys = require('../config/keys');
var _ = require('underscore');
var crypto = require('crypto');
var request = require('request');
var randomString = require('random-string');

module.exports = function(Project){

  return {

          createProject: function (name,userId) {

              var _self = this;

              var deferred = Q.defer();

              var self = this;

              var savedProject;
              var appId;              

              generateNonExistingAppId().then(function (newAppId) {                 
                appId=newAppId;
                return _createAppFromDS(appId);    

              }).then(function(project) {

                project=JSON.parse(project);
               
                //Adding default developer
                var developers=[];
                var newDeveloper={};
                newDeveloper.userId=userId;
                newDeveloper.role="Admin";
                developers.push(newDeveloper);              
                //End Adding default developer

                var appendJson={_userId:userId,name:name,developers:developers};
                return _self.findOneAndUpdateProject(project._id,appendJson);                              

              }).then(function(newProject){ 
                
                savedProject=newProject;
                return _self.projectStatus(appId,userId); 

              }).then(function(statusObj){

                savedProject._doc.status = statusObj;                
                deferred.resolve(savedProject);

              },function(error) {                
                deferred.reject(error);
              });            

              return deferred.promise;
          },

          projectStatus: function (appId, userId) {

              var deferred = Q.defer();

              var self = this;

              //TODO : Retrieve Proper App Status.

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
                      deferred.reject('Error : Cannot update project right now.');
                  }else if(project){

                    Project.findOne({name:name}, function (err, projectSameName) {
                      if(projectSameName){
                        deferred.reject('You cannot have two apps with the same name.');

                      }else{

                          /***Start editing***/
                          if(project && checkValidUser(project,userId,"Admin")){                      
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

          findOneAndUpdateProject: function (projectId,newJson) {

            var deffered = Q.defer();

            var self = this;

              Project.findOneAndUpdate({_id:projectId}, { $set: newJson},{new:true},function (err, user) {
                if (err) { 
                  return deffered.reject(err); 
                }

                if (!user) {
                  return deffered.reject(null);
                }
                return deffered.resolve(user);                    
              });

            return deffered.promise;

          },
          delete: function (appId,userId) {

              var deferred = Q.defer();

              var self = this;

              console.log(' ++++++++ App Delete request +++++++++');

              Project.findOne({appId:appId,developers: {$elemMatch: {userId:userId,role:"Admin"} }}, function (err,foundProj) {
                if(err){
                  console.log('++++++++ App Delete failed from frontend ++++++++++');                   
                  deferred.reject(err);
                }else if(foundProj){

                  _deleteAppFromDS(appId).then(function(resp){
                    deferred.resolve(resp);
                  },function(error){
                    deferred.reject(error);
                  });

                }else{
                  deferred.reject("Project not found with specified user");
                }
              });

             return deferred.promise;

          },
          changeAppMasterKey: function (currentUserId,appId) {

              var deferred = Q.defer();

              var self = this;             

              var newMasterKey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), global.keys.secureKey, 100, 32).toString("base64");        

              Project.findOneAndUpdate({appId:appId,developers: {$elemMatch: {userId:currentUserId,role:"Admin"}}},{$set: {"keys.master":newMasterKey }},{'new': true}, function (err, newProject) {
                if (err) deferred.reject(err);
                if(newProject){
                  deferred.resolve(newProject);
                }else{
                  deferred.resolve(null);
                }
                     
              });

             return deferred.promise;

          },
          changeAppClientKey: function (currentUserId,appId) {

              var deferred = Q.defer();

              var self = this;

              var newClientkey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), global.keys.secureKey, 100, 16).toString("base64");

              Project.findOneAndUpdate({appId:appId,developers: {$elemMatch: {userId:currentUserId,role:"Admin"} }},{$set: {"keys.js":newClientkey }},{'new': true}, function (err, newProject) {
                if (err) deferred.reject(err);
                if(newProject){
                  deferred.resolve(newProject);
                }else{
                  deferred.resolve(null);
                }
                     
              });

             return deferred.promise;

          },
          removeDeveloper: function (currentUserId,appId,userId) {

              var deferred = Q.defer();

              var self = this;             

              Project.findOne({appId:appId,developers: {$elemMatch: {userId:userId} }}, function (err,foundProj) {
                if(err){                  
                  deferred.reject(err);
                }else if(!foundProj){
                   deferred.reject("Project not found with given userId");
                }else if(currentUserId==userId || checkValidUser(foundProj,currentUserId,"Admin")){
                  //User can delete himself or can delete others when he is a Admin
                  processRemoveDeveloper(foundProj,userId,currentUserId,self)
                  .then(function(data){
                    deferred.resolve(data);
                  },function(error){
                    deferred.reject(error);
                  });                                      
                }else{
                  deferred.reject('Unauthorized!');
                }                  
                
              });

             return deferred.promise;

          },
          removeInvitee: function (currentUserId,appId,email) {

              var deferred = Q.defer();

              var self = this;             

              Project.findOne({appId:appId,invited: {$in: [email]}}, function (err,foundProj) {
                if(err){                  
                  deferred.reject(err);
                }else if(!foundProj){
                  deferred.reject("Project not found with given Email");
                }else{

                  global.userService.getAccountByEmail(email).then(function(foundUser) {

                    if(checkValidUser(foundProj,currentUserId,"Admin") || foundUser._id==currentUserId){
                      //User can delete himself or can delete others when he is a Admin
                      processRemoveInvitee(foundProj,email)
                      .then(function(data){
                        deferred.resolve(data);
                      },function(error){
                        deferred.reject(error);
                      });                     

                    }else{
                      deferred.reject("Unauthorized"); 
                    } 

                  },function(userError) { 
                    deferred.reject("Cannot Perform this task now");                    
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
          inviteUser: function (appId,email) {

              var deferred = Q.defer();

              var self = this;                 

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                if(!project){
                  deferred.reject("App not found!.");
                }else{

                  global.userService.getAccountByEmail(email).then(function(foundUser) {
                    if(foundUser){

                      if(!checkValidUser(project,foundUser._id,null)){ 

                        processInviteUser(project,email,foundUser)
                        .then(function(data){
                          deferred.resolve(data);
                        },function(error){
                          deferred.reject(error);
                        });     

                      }else{
                        deferred.reject("Already a Developer to this App!");
                      } 

                    }else{//There is no user with this email in cloudboost
                      processInviteUser(project,email,foundUser)
                      .then(function(data){
                        deferred.resolve(data);
                      },function(error){
                        deferred.reject(error);
                      });     
                    }
                  },function(usererror) {   
                    deferred.reject('Cannot perform this task right now.');                
                  });                                    
                  
                }
                     
              });

             return deferred.promise;

          },
          addDeveloper: function (currentUserId,appId,email) {

              var deferred = Q.defer();

              var self = this;                 

              Project.findOne({appId:appId}, function (err, project) {
                if (err) deferred.reject(err);
                if(!project){
                  deferred.reject("App not found!.");
                }else{

                  if(!checkValidUser(project,currentUserId,null)){

                    //Adding default developer                      
                      var newDeveloper={};
                      newDeveloper.userId=currentUserId;
                      newDeveloper.role="User";

                      project.developers.push(newDeveloper); 
                    //End Adding default developer 

                      var inviteeIndex=project.invited.indexOf(email);
                      if(inviteeIndex==0 || inviteeIndex>0){
                        project.invited.splice(inviteeIndex,1);  
                      }                    

                    project.save(function (err, savedProject) {
                      if (err) deferred.reject(err);
                      if(!savedProject){
                        deferred.reject('Cannot save the app right now.');
                      }else{
                        global.notificationService.removeNotificationByAppId(savedProject.appId); 

                        //Get the status
                        self.projectStatus(savedProject._doc.appId, currentUserId)
                        .then(function(statusObj){
                          savedProject._doc.status=statusObj;
                          deferred.resolve(savedProject);
                        },function(error) {
                          deferred.resolve(error);
                        });                       
                                            
                      }
                    });

                  }else{
                    deferred.resolve("Already added!");
                  } 
                  
                }
                     
              });

             return deferred.promise;

          },
          changeDeveloperRole: function (currentUserId,appId,userId,role) {

              var deferred = Q.defer();

              var self = this;              

              Project.findOne({appId:appId,developers: {$elemMatch: {userId:currentUserId} }}, function (err, project) {
                if (err) deferred.reject(err);
                if(!project){
                  deferred.reject("App not found or Unauthorized!");
                }else{
                  var tempArray=project.developers;
                  var currentUserObj=_.first(_.where(tempArray, {userId:currentUserId}));
                  

                  if(currentUserId==userId){

                    if((currentUserObj.role=="Admin" && role=="User") || (currentUserObj.role=="Admin" && role=="Admin")){

                      //Check if other Admins in APP
                      var otherAdmins = _.find(tempArray, function(eachDev){ 
                        if(eachDev.userId!=currentUserId && eachDev.role=="Admin"){
                          return true;
                        }
                      });

                      if(currentUserObj.role=="Admin" && role=="User" && otherAdmins){
                        processChangeDeveloperRole(project,userId,role)
                        .then(function(data){
                          deferred.resolve(data);
                        },function(error){
                          deferred.reject(error);
                        });
                      }else{
                        deferred.reject("You cannot remove all admins from an app!");
                      }
                      

                    }else if(currentUserObj.role=="User" && role=="Admin"){
                      deferred.reject("You cannot perform this task!");
                    }else if(currentUserObj.role=="User" && role=="User"){
                      deferred.resolve("Already is a User!");
                    }

                  }else if(currentUserObj.role=="Admin"){
                    processChangeDeveloperRole(project,userId,role)
                    .then(function(data){
                      deferred.resolve(data);
                    },function(error){
                      deferred.reject(error);
                    });

                  }else{
                    deferred.reject("You cannot perform this task!");
                  }                  
                }
                     
              });

             return deferred.promise;

          },
    }

};

function generateNonExistingAppId(){
  var deferred = Q.defer();

  var appId=randomString({
    length: 8,
    numeric: false,
    letters: true,
    special: false
  });
  appId=appId.toLowerCase();    
  
  global.projectService.getProject(appId).then(function (existedProject) {
    if(!existedProject){
      deferred.resolve(appId);
    }else if(existedProject){
      return generateNonExistingAppId();     
    }
  }).then(function(nonExistAppId){
    deferred.resolve(nonExistAppId);
  },function(error){
    deferred.reject(error);
  });

  return deferred.promise;
}

function processRemoveDeveloper(foundProj,userId,currentUserId,self){  

  var deferred = Q.defer();

  var tempArray=foundProj.developers;

  for(var i=0;i<foundProj.developers.length;++i){
    if(foundProj.developers[i].userId==userId){
      tempArray.splice(i,1);
    }
  }

  //Find Atleast one admin
  var atleastOneAdmin=_.find(foundProj.developers, function(eachObj){ 
    if(eachObj.role=="Admin"){ 
      return;          
    }
  });

  if(tempArray.length>0 && atleastOneAdmin){
    foundProj.developers=tempArray;
    foundProj.save(function (err, project) {
      if (err) deferred.reject(err);
      if(!project){
        deferred.reject('Cannot save the app right now.');
      }else{
        deferred.resolve(project);                     
      }
    });

  }else{
    self.delete(foundProj.appId,currentUserId).then(function(resp) {                           
      deferred.resolve(resp);
    },function(error){
      deferred.reject(error);
    });
  }

  return deferred.promise;
}

function processRemoveInvitee(foundProj,email){
  var deferred = Q.defer();

  var tempArray=foundProj.invited;
  var inviteeIndex=foundProj.invited.indexOf(email);
  if(inviteeIndex==0 || inviteeIndex>0){
    tempArray.splice(inviteeIndex,1);
  }

  foundProj.invited=tempArray;
  foundProj.save(function (err, project) {
    if (err) deferred.reject(err);
    if(!project){
      deferred.reject('Cannot save the app right now.');
    }else{
      deferred.resolve(project);
      global.notificationService.removeNotificationByAppId(foundProj.appId);                     
    }
  });

  return deferred.promise;
}

function processInviteUser(project,email,foundUser){
  var deferred = Q.defer();

  //Invitation 
  var alreadyInvited=project.invited.indexOf(email);
  if(alreadyInvited<0){
    project.invited.push(email);

    project.save(function (err, savedProject) {
      if (err) deferred.reject(err);
      if(!savedProject){
        deferred.reject('Cannot save the app right now.');
      }else{
        deferred.resolve("successfully Invited!"); 

        var notificationType="Confirm";
        var type="invited-project";
        var text="You have been invited to collaborate on <span style='font-weight:bold;'>"+savedProject.name+"</span>. Do you want to accept the invite?";
        global.notificationService.createNotification(savedProject.appId,foundUser._id,notificationType,type,text); 
        global.mandrillService.inviteDeveloper(email,savedProject.name);
      }
    });

  }else{
    deferred.reject("Already Invited!");
  }

  return deferred.promise;
}

function processChangeDeveloperRole(project,userId,role){
  var deferred = Q.defer();

    var tempArray=project.developers;
    tempArray=JSON.stringify(tempArray);
    tempArray=JSON.parse(tempArray);
    
    var userThere=_.first(_.where(tempArray, {userId:userId}));

    if(userThere){

      var index=tempArray.indexOf(userThere);
      tempArray[index].role=role;

      project.developers=tempArray;
      project.save(function (err, savedProject) {
        if (err) deferred.reject(err);
        if(!savedProject){
          deferred.reject('Cannot save the app right now.');
        }else{                                            
          deferred.resolve(savedProject);                    
        }
      });

    }else{
      deferred.reject("User not found!");
    }

  return deferred.promise;
}

function checkValidUser(app,userId,role){
  if(app.developers && app.developers.length>0){
    return _.find(app.developers, function(eachObj){ 
      if(eachObj.userId==userId){

        if(role && eachObj.role==role){
          return true;
        }else if(role && eachObj.role!=role){
          return false;
        }else if(!role){
          return true;
        }
        
      }
    });
  }else {
    return false;
  }
}

/***********************Pinging Data Services*********************************/

function _createAppFromDS(appId){
  var deferred = Q.defer();
 
  var post_data = {};
  post_data.secureKey = global.keys.secureKey;
  post_data = JSON.stringify(post_data);


  var url = global.keys.dataServiceUrl + '/app/'+appId;
  console.log("STEP4:About to ping data services for creation:"+url);
  request.post(url,{
      headers: {
          'content-type': 'application/json',
          'content-length': post_data.length
      },
      body: post_data
  },function(err,response,body){
      if(err || response.statusCode === 500 || body === 'Error'){       
        deferred.reject(err);
      }else {                               
        deferred.resolve(body);
      }
  });

  return deferred.promise;
}

function _deleteAppFromDS(appId){

  var deferred = Q.defer();

  var post_data = {};
  post_data.secureKey = global.keys.secureKey;
  post_data = JSON.stringify(post_data);

  request.del({
    headers: {
                'content-type' : 'application/json', 
                'content-length' : post_data.length
             },
    url:     keys.dataServiceUrl +"/app/"+appId,
    body:    post_data
  }, function(error, response, body){
    if(response){
      var respData=JSON.parse(response.body);

      if(respData.status === 'Success'){
        console.log('successfully deleted');
        deferred.resolve('Successfully deleted');
      }else{
        deferred.reject("Unable to delete!");
      }

    }else{
      deferred.reject("Unable to delete!");
    }
     
  });

  return deferred.promise;
}
  