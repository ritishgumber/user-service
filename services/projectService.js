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

              console.log("Create project/app");

              var _self = this;

              var deferred = Q.defer();

              try{

                var self = this;

                var savedProject;
                var appId;
                var newAppPlanId=1;              

                generateNonExistingAppId().then(function (newAppId) { 
                  console.log("fetched new appId");                
                  appId=newAppId;
                  return _createAppFromDS(appId);    

                }).then(function(project) {

                  console.log("Successfull on create app from data service..");
                  project=JSON.parse(project);
                 
                  //Adding default developer
                  var developers=[];
                  var newDeveloper={};
                  newDeveloper.userId=userId;
                  newDeveloper.role="Admin";
                  developers.push(newDeveloper);              
                  //End Adding default developer

                  var appendJson={_userId:userId,name:name,developers:developers,planId:newAppPlanId};
                  return _self.findOneAndUpdateProject(project._id,appendJson);                              

                }).then(function(newProject){ 

                  console.log("Successfull on save new project");

                  deferred.resolve(newProject);
                  _createPlanInAnalytics(appId,newAppPlanId);

                },function(error) { 
                  console.log("Error on create new project");               
                  deferred.reject(error);
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }            

              return deferred.promise;
          },        
          projectList: function (userId) {

            console.log("Get project list..");

            var _self = this;

            var deferred = Q.defer();

            try{

              var self = this;            

              Project.find({ developers: {$elemMatch: {userId:userId} } }, function (err, list) {
                if (err){
                  console.log("Error on Get project list..");
                  deferred.reject(err);
                }  
                console.log("Success on Get project list..");
                deferred.resolve(list);                 
              });

            }catch(err){
              global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
              deferred.reject(err)         
            }

             return deferred.promise;
          },

          editProject: function(userId,id,name) {

              console.log("Edit project...");

              var deferred = Q.defer();

              try{
                var _self = this;

                _self.getProject(id).then(function (project) {
                    if (!project) {
                        console.log("Project not found for edit...");
                        deferred.reject('Error : Cannot update project right now.');
                    }else if(project){

                      Project.findOne({name:name}, function (err, projectSameName) {
                        if(projectSameName){
                          console.log("Project names conflict for edit..");
                          deferred.reject('You cannot have two apps with the same name.');

                        }else{

                            /***Start editing***/
                            if(project && checkValidUser(project,userId,"Admin")){                      
                                project.name=name;                 

                                project.save(function (err, project) {
                                    if (err){
                                      console.log("Error on edit the project..");
                                      deferred.reject(err);
                                    }
                                    if(!project){
                                        console.log("project not saved on edit..");
                                        deferred.reject('Cannot save the app right now.');
                                    }    
                                    else{
                                      console.log("Successfull on edit project..");
                                      deferred.resolve(project._doc);                             
                                    }
                                });
                            }else{
                              console.log("Unauthorized to edit the project..");
                              deferred.reject("Unauthorized");
                            }
                            /***End Start editing***/
                        }
                      });  
                    }                                 

                },function(error){
                  console.log("error on retrieving project for edit..");
                  deferred.reject(error);
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

              return deferred.promise;
          },

          getProject: function (appId) {

              console.log("Get project...");

              var deferred = Q.defer();

              try{
                var self = this;

                Project.findOne({appId:appId}, function (err, project) {
                  if (err){
                    console.log("Error on Get project...");
                    deferred.reject(err);
                  }  
                  else {
                    console.log("Successfull on get project..");
                    deferred.resolve(project);
                  }
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },

          findOneAndUpdateProject: function (projectId,newJson) {

            console.log("Find and update project...");

            var deffered = Q.defer();

            try{
              var self = this;              

              Project.findOneAndUpdate({_id:projectId}, { $set: newJson},{new:true},function (err, project) {
                if (err) {   
                  console.log("Error on Find and update project...");               
                  return deffered.reject(err);         
                }
                if (!project) { 
                  console.log("Project not found for ..Find and update project...");                 
                  return deffered.reject(null);
                }   

                console.log("Success on Find and update project...");             
                return deffered.resolve(project);                    
              });

            }catch(err){
              global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
              deffered.reject(err)         
            }

            return deffered.promise;

          },
          updatePlanByAppId: function (appId,planId) {

            console.log("Update planId in project..");

            var deffered = Q.defer();

            try{
            var self = this;            
             
              Project.findOneAndUpdate({appId:appId}, { $set: {planId:planId}},{new:true},function (err, project) {
                if (err) {  
                  console.log("Error on update planId in project..");               
                  return deffered.reject(err);         
                }
                if (!project) {  
                  console.log("Project not found.. on update planId in project..");                 
                  return deffered.reject(null);
                }   
                console.log("Successfull on update planId in project..");               
                return deffered.resolve(project);                    
              });

            }catch(err){
              global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
              deffered.reject(err)         
            }

            return deffered.promise;

          },
          delete: function (appId,userId) {

              console.log("Delete Project...");

              var deferred = Q.defer();

              try{
                var self = this;

                console.log(' ++++++++ App Delete request +++++++++');

                Project.findOne({appId:appId,developers: {$elemMatch: {userId:userId,role:"Admin"} }}, function (err,foundProj) {
                  if(err){
                    console.log('++++++++ App Delete failed from frontend ++++++++++');                   
                    deferred.reject(err);
                  }else if(foundProj){

                    _deleteAppFromDS(appId).then(function(resp){
                      console.log("Delete Project from data services......");
                      deferred.resolve(resp);
                    },function(error){
                      console.log("Error on Delete Project from data services......");
                      deferred.reject(error);
                    });

                  }else{
                    console.log("Project not found ..Delete Project");
                    deferred.reject("Project not found with specified user");
                  }
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
          allProjectList: function () {

            console.log("get all project list....");

            var _self = this;

             var deferred = Q.defer();

             try{
              var self = this;

              Project.find({}, function (err, list) {
                if (err){
                  console.log("Error on get all project list....");
                  deferred.reject(err);
                } 
                console.log("Success on get all project list...."); 
                deferred.resolve(list);              
                 
              });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              } 

             return deferred.promise;
          },
          changeAppMasterKey: function (currentUserId,appId) {

              console.log("Change app Masterkey...");

              var deferred = Q.defer();

              try{
                var self = this;             

                var newMasterKey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), global.keys.secureKey, 100, 32).toString("base64");        

                Project.findOneAndUpdate({appId:appId,developers: {$elemMatch: {userId:currentUserId,role:"Admin"}}},{$set: {"keys.master":newMasterKey }},{'new': true}, function (err, newProject) {
                  if (err){
                    console.log("Error on Change app Masterkey...");
                    deferred.reject(err);
                  }  
                  if(newProject){
                    console.log("Success on Change app Masterkey...");
                    deferred.resolve(newProject);
                  }else{
                    console.log("Project not found for Change app Masterkey...");
                    deferred.resolve(null);
                  }
                       
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
          changeAppClientKey: function (currentUserId,appId) {

              console.log("Change client key in project...");

              var deferred = Q.defer();

              try{
                var self = this;

                var newClientkey = crypto.pbkdf2Sync(Math.random().toString(36).substr(2, 5), global.keys.secureKey, 100, 16).toString("base64");

                Project.findOneAndUpdate({appId:appId,developers: {$elemMatch: {userId:currentUserId,role:"Admin"} }},{$set: {"keys.js":newClientkey }},{'new': true}, function (err, newProject) {
                  if (err){
                    console.log("Error on Change client key in project...");
                    deferred.reject(err);
                  }  
                  if(newProject){
                    console.log("Successfull on Change client key in project...");
                    deferred.resolve(newProject);
                  }else{
                    console.log("Project not found for Change client key in project...");
                    deferred.resolve(null);
                  }
                       
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
          removeDeveloper: function (currentUserId,appId,userId) {

              console.log("Remove a developer from project..");

              var deferred = Q.defer();

              try{
                var self = this;             

                Project.findOne({appId:appId,developers: {$elemMatch: {userId:userId} }}, function (err,foundProj) {
                  if(err){  
                    console.log("Error on finding aproject for to remove a developer..");                
                    deferred.reject(err);
                  }else if(!foundProj){
                    console.log("project not found for to remove a developer..");
                     deferred.reject("Project not found with given userId");
                  }else if(currentUserId==userId || checkValidUser(foundProj,currentUserId,"Admin")){
                    //User can delete himself or can delete others when he is a Admin
                    processRemoveDeveloper(foundProj,userId,currentUserId,self)
                    .then(function(data){
                      console.log("Success on remove a developer..");
                      deferred.resolve(data);
                    },function(error){
                      console.log("Error on to remove a developer..");
                      deferred.reject(error);
                    });                                      
                  }else{
                    console.log("Unauthorized user to remove a developer..");
                    deferred.reject('Unauthorized!');
                  }                  
                  
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
          removeInvitee: function (currentUserId,appId,email) {

              console.log("Remove a invitee..");

              var deferred = Q.defer();

              try{
                var self = this;             

                Project.findOne({appId:appId,invited: {$elemMatch:{email:email} }}, function (err,foundProj) {
                  if(err){  
                    console.log("Error on finding project for Remove a invitee..");                
                    deferred.reject(err);
                  }else if(!foundProj){
                    console.log("project not found for Remove a invitee.."); 
                    deferred.reject("Project not found with given Email");
                  }else{

                    global.userService.getAccountByEmail(email).then(function(foundUser) {

                      if(checkValidUser(foundProj,currentUserId,"Admin") || foundUser._id==currentUserId){
                        //User can delete himself or can delete others when he is a Admin
                        processRemoveInvitee(foundProj,email)
                        .then(function(data){
                          console.log("Successfull on Remove a invitee.."); 
                          deferred.resolve(data);
                        },function(error){
                          console.log("Error on Remove a invitee.."); 
                          deferred.reject(error);
                        });                     

                      }else{
                        console.log("Unauthorized user to Remove a invitee.."); 
                        deferred.reject("Unauthorized"); 
                      } 

                    },function(userError) { 
                      console.log("Error on getting user details for remove invitee.."); 
                      deferred.reject("Cannot Perform this task now");                    
                    }); 

                  }
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
         
          inviteUser: function (appId,email) {

              console.log("Invite user to the app.");

              var deferred = Q.defer();

              try{
                var self = this;                 

                Project.findOne({appId:appId}, function (err, project) {
                  if (err){
                    console.log("Error on get project to Invite user to the app.");
                    deferred.reject(err);
                  }  
                  if(!project){
                    console.log("project not found to Invite user to the app.");
                    deferred.reject("App not found!.");
                  }else{

                    global.userService.getAccountByEmail(email).then(function(foundUser) {
                      if(foundUser){

                        if(!checkValidUser(project,foundUser._id,null)){ 

                          processInviteUser(project,email,foundUser)
                          .then(function(data){
                            console.log("Success on Invite user to the app.");
                            deferred.resolve(data);
                          },function(error){
                            console.log("Error on Invite user to the app.");
                            deferred.reject(error);
                          });     

                        }else{
                          console.log("Already a Developer to this App!");
                          deferred.reject("Already a Developer to this App!");
                        } 

                      }else{//There is no user with this email in cloudboost
                        processInviteUser(project,email,foundUser)
                        .then(function(data){
                          console.log("Success on Invite user to the app.");
                          deferred.resolve(data);
                        },function(error){
                          console.log("Error on Invite user to the app.");
                          deferred.reject(error);
                        });     
                      }
                    },function(usererror) {  
                      console.log("Error on getting user details to Invite user to the app."); 
                      deferred.reject('Cannot perform this task right now.');                
                    });                                    
                    
                  }
                       
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
          addDeveloper: function (currentUserId,appId,email) {

              console.log("Add developer...");

              var deferred = Q.defer();

              try{
                var self = this;                 

                Project.findOne({appId:appId}, function (err, project) {
                  if (err){
                    console.log("Error on get project to Add developer...");
                    deferred.reject(err);
                  }  
                  if(!project){
                    console.log("project not found to Add developer...");
                    deferred.reject("App not found!.");
                  }else{

                    if(!checkValidUser(project,currentUserId,null)){

                      //Adding developer                      
                      var newDeveloper={};
                      newDeveloper.userId=currentUserId;
                      newDeveloper.role="User";

                      project.developers.push(newDeveloper); 
                      //End Adding developer                      

                      var notificationId=null;
                      if(project.invited && project.invited.length>0){
                        for(var i=0;i<project.invited.length;++i){
                          if(project.invited[i].email==email){
                            notificationId=project.invited[i].notificationId;
                            project.invited.splice(i,1);
                          }
                        }
                      }                                          

                      project.save(function (err, savedProject) {
                        if (err){
                          console.log("Error on adding developer..");
                          deferred.reject(err);
                        }
                        if(!savedProject){
                          console.log("Cannot save the project to add developer");
                          deferred.reject('Cannot save the app right now.');
                        }else{  
                          console.log("Successfull to add developer");                       
                          deferred.resolve(savedProject);  
                          if(notificationId){
                            global.notificationService.removeNotificationById(notificationId);
                          }                                                                  
                        }
                      });

                    }else{
                      console.log("Already a developer to this app..");
                      deferred.resolve("Already added!");
                    } 
                    
                  }
                       
                });

              }catch(err){
                global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
                deferred.reject(err)         
              }

             return deferred.promise;

          },
   
    }

};

function generateNonExistingAppId(){

  console.log("Function for generate nonExistAppId...");

  var deferred = Q.defer();

  try{
    var appId=randomString({
      length: 12,
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
      console.log("Success on generateNonExistingAppId");
      deferred.resolve(nonExistAppId);
    },function(error){
      console.log("Error on Get project to generateNonExistingAppId");
      deferred.reject(error);
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err)         
  }

  return deferred.promise;
}

function processRemoveDeveloper(foundProj,userId,currentUserId,self){  

  console.log("Private function for process remove developer...");

  var deferred = Q.defer();

  try{
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
        if (err){
          console.log("Error on Private function for process remove developer...");
          deferred.reject(err);
        }  
        if(!project){
          console.log("Project not found for Private function for process remove developer...");
          deferred.reject('Cannot save the app right now.');
        }else{
          console.log("Successfull on Private function for process remove developer...");
          deferred.resolve(project);                     
        }
      });

    }else{
      self.delete(foundProj.appId,currentUserId).then(function(resp) { 
        console.log("Successfull on Delete project Private function to remove developer..");                          
        deferred.resolve(resp);
      },function(error){
        console.log("Error on Delete project Private function to remove developer..");  
        deferred.reject(error);
      });
    }

   }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err)         
  }

  return deferred.promise;
}

function processRemoveInvitee(foundProj,email){

  console.log("private function for Process remove invitee..");

  var deferred = Q.defer();

  try{
    var tempArray=foundProj.invited;
    var notificationId=null;

    if(tempArray && tempArray.length>0){
      for(var i=0;i<tempArray.length;++i){
        if(tempArray[i].email==email){
          notificationId=tempArray[i].notificationId;
          tempArray.splice(i,1);
        }
      }
    }   

    foundProj.invited=tempArray;
    foundProj.save(function (err, project) {
      if (err){
        console.log("Error on save project in private function for Process remove invitee..");
        deferred.reject(err);
      }
      if(!project){
        console.log("project not found in private function for Process remove invitee..");
        deferred.reject('Cannot save the app right now.');
      }else{
        console.log("Successfull for private function for Process remove invitee..");
        deferred.resolve(project);
        if(notificationId){
          global.notificationService.removeNotificationById(notificationId); 
        }                          
      }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err)         
  }

  return deferred.promise;
}

function processInviteUser(project,email,foundUser){

  console.log("Private function for Process Invite User");


  var deferred = Q.defer();
     
  try{   
    var alreadyInvited=_.first(_.where(project.invited, {email:email}));

    //Invitation
    if(!alreadyInvited){


      var notificationType="confirm";
      var type="invited-project";
      var text="You have been invited to collaborate on <span style='font-weight:bold;'>"+project.name+"</span>. Do you want to accept the invite?";
      
      var userIdOREmail=null;
      if(foundUser && foundUser._id){
        userIdOREmail=foundUser._id;
      }else{
        userIdOREmail=email;
      }

      global.notificationService.createNotification(project.appId,userIdOREmail,notificationType,type,text)
      .then(function(notificationId){

        var inviteeObj={
          email:email,
          notificationId:notificationId._id
        };

        project.invited.push(inviteeObj);
   
        project.save(function (err, savedProject) {
          if (err){
            console.log("Error on save project in Private function for Process Invite User");
            deferred.reject(err);
          }
          if(!savedProject){
            console.log("project not found in Private function for Process Invite User");
            deferred.reject('Cannot save the app right now.');
          }else{
            console.log("Successfull on Private function for Process Invite User");
            deferred.resolve("successfully Invited!");         
            global.mandrillService.inviteDeveloper(email,savedProject.name);
          }
        });


      },function(error){
        console.log("Error on create notification in Private function for Process Invite User");
        deferred.reject(error);
      });

      

    }else{
      deferred.reject("Already Invited!");
    }

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err)         
  }

  return deferred.promise;
}


function checkValidUser(app,userId,role){

  try{
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

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack});              
  }
}

/***********************Pinging Data Services*********************************/

function _createAppFromDS(appId){

  console.log("Create app From Data services...");

  var deferred = Q.defer();  
 
  try{
    var post_data = {};
    post_data.secureKey = global.keys.secureKey;
    post_data = JSON.stringify(post_data);


    var url = global.keys.dataServiceUrl + '/app/'+appId;  
    request.post(url,{
        headers: {
            'content-type': 'application/json',
            'content-length': post_data.length
        },
        body: post_data
    },function(err,response,body){                      
        if(err || response.statusCode === 500 || body === 'Error'){ 
          console.log("Error on Create app From Data services...");  
          console.log(err);    
          deferred.reject(err);
        }else { 
          console.log("Successfull on create app from data services..");  
          try{                             
            deferred.resolve(body);
          }catch(e){
            deferred.reject(e); 
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }

  return deferred.promise;
}

function _deleteAppFromDS(appId){

  console.log("Delete app from data services..");

  var deferred = Q.defer();

  try{
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
        try{
            var respData=JSON.parse(response.body); 
            if(respData.status === 'Success'){
              console.log('successfully Delete app from data services.');
              deferred.resolve('Successfully deleted');
            }else{
              console.log('unable Delete app from data services.');
              deferred.reject("Unable to delete!");
            }          
        }catch(e){
          deferred.reject(e);
        }       

      }else{
        console.log('unable Delete app from data services.');
        deferred.reject("Unable to delete!");
      }
       
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err)         
  }

  return deferred.promise;
}


function _createPlanInAnalytics(appId,planId){

  console.log("Create Plan in analyticsServices..");

  var deferred = Q.defer();
 
  try{
    var post_data = {};
    post_data.secureKey = global.keys.secureKey;
    post_data.planId = planId;
    post_data = JSON.stringify(post_data);


    var url = global.keys.analyticsServiceUrl + '/plan/'+appId;  

    request.post(url,{
        headers: {
            'content-type': 'application/json',
            'content-length': post_data.length
        },
        body: post_data
    },function(err,response,body){
      
        if(err || response.statusCode === 500 || response.statusCode === 400 || body === 'Error'){ 
          console.log("Error on  Create Plan in analyticsServices..");      
          deferred.reject(err);
        }else {    
          console.log("Success on Create Plan in analyticsServices..");       

          try{
            var respBody=JSON.parse(body);                           
            deferred.resolve(respBody);
          }catch(e){
            deferred.reject(e);
          }
        }
    });

  }catch(err){
    global.winston.log('error',{"error":String(err),"stack": new Error().stack}); 
    deferred.reject(err);         
  }
  return deferred.promise;
}
  