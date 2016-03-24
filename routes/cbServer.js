var express = require('express');
var app = express();
var Q = require('q');

module.exports = function() {

    //routes
    app.get('/server/isNewServer', function(req,res,next) {       
        
        console.log("isNewServer check");                
		global.userService.isNewServer().then(function(isNew) {  
            console.log("Successful on isNewServer check");          
            return res.status(200).send(isNew);
        },function(error){
            console.log("Error on isNewServer check");
            return res.send(500, error);
        });    
    });


    app.get('/server', function(req,res,next) {       
        console.log("Getting server settings");                
		global.cbServerService.getSettings().then(function(settings) { 
            console.log("Successfull Getting server settings");           
            return res.status(200).json(settings);
        },function(error){
            console.log("Error Getting server settings");
            return res.send(500, error);
        });    
    });    
    
    app.post('/server', function(req,res,next) { 
        console.log("Upsert server settings"); 

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

		global.cbServerService.upsertSettings(currentUserId,data.id,data.allowedSignUp).then(function(settings) {  
            console.log("Successfull Upsert server settings");           
            return res.status(200).json(settings);
        },function(error){
            console.log("Error Upsert server settings"); 
            return res.send(500, error);
        });    
    });

    app.post('/server/url', function(req,res,next) {  
        console.log("Upsert API URL");   

        var data = req.body || {};
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.body.userId;

        global.cbServerService.upsertAPI_URL(currentUserId,data.apiURL).then(function(settings) {  
            console.log("Successfull Upsert API URL");           
            return res.status(200).json(settings);
        },function(error){
             console.log("Error Upsert API URL"); 
            return res.send(500, error);
        });    
    });

    //know server isHosted?
    app.get('/server/isHosted',function(req,res){
        console.log("isHosted server check"); 

        global.cbServerService.isHosted().then(function(settings) {  
            console.log("Successfull isHosted server check");          
            return res.status(200).send(settings);
        },function(error){ 
            console.log("Error isHosted server check");           
            return res.status(500).send(error);
        });       

    });

    app.get('/status', function(req,res,next) {

        console.log("MongoDb & RedisDB Status..");

        var promises=[];      

        promises.push(_mongoDbStatus());
        promises.push(_redisDbStatus());

        Q.all(promises).then(function(resultList){
            if(resultList && resultList[0] && resultList[1]){
                return res.status(200).send("MongoDB and RedisDB statuses:OK!");
            }else{
                return res.status(500).send("Something went wrong!");
            }
        },function(error){
            return res.status(500).send("Something went wrong!");
        });
                  
    });

    return app;

}

function _mongoDbStatus(){

    console.log("MongoDB Status Function...");

    var deferred = Q.defer();

    try{

        global.mongoClient.command({ serverStatus: 1},function(err, status){
          if(err) { 
            console.log(err);
            deferred.reject(err);                                    
          }

          console.log("MongoDB Status:"+status.ok);
          if(status && status.ok===1){         
            deferred.resolve("Ok");                                              
          }else{        
            deferred.reject("Failed");
          }
        });

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
}

function _redisDbStatus(){

    console.log("RedisDB Status Function...");

    var deferred = Q.defer();

    try{
        
        //Simple ping/pong with callback
        global.redisClient.call('PING', function (error, result) {                
            if(error){
                console.log(error);
                deferred.reject("Failed"); 
            }
            console.log("RedisDB Status:"+result);
            if(result==="PONG"){
                deferred.resolve("Ok"); 
            }else{
                deferred.reject("Failed");
            }
        });        

    }catch(err){
      global.winston.log('error',{"error":String(err),"stack": new Error().stack});
      deferred.reject(err);
    }

    return deferred.promise;
}
