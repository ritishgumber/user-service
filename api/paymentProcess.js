var express = require('express');
var app = express();

module.exports = function() {

    //routes  
    app.post('/:appId/sale', function(req,res,next) {

        console.log("Make a sale");

        var data = req.body || {};
        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
        	
            if(data && appId && data.token){

               global.paymentProcessService.createSale(currentUserId,appId,data).then(function(data) {
                  if (!data) {
                    return res.status(400).send('Error : Something went wrong, try again.');
                  } 
                  console.log("successfully Make a sale");              
                  return res.status(200).json(data);

                },function(error){
                  console.log("error Make a sale");
                  return res.status(400).send(error);                    
                }); 

            }else{ 
                console.log("Unauthorized Make a sale"); 
                return res.status(400).send("Bad Request");  
            }    		
        	
        }else{  
            console.log("Unauthorized Make a sale");         
            return res.status(400).send("Unauthorized");
        }

    });

    app.delete('/:appId/removecard', function(req,res,next) {
        
        console.log("Remove card");

        var appId=req.params.appId;
        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
       
        if(currentUserId){
            
            if(appId){

               global.paymentProcessService.stopRecurring(appId,currentUserId).then(function(data) {
                  if (!data) {
                    return res.status(400).send('Error : Something went wrong, try again.');
                  } 
                  console.log("successfully Remove card");              
                  return res.status(200).json(data);

                },function(error){
                  console.log("error Remove card");
                  return res.status(400).send(error);                    
                }); 

            }else{
                console.log("Bad Requestd Remove card");  
                return res.status(400).send("Bad Request");  
            }           
            
        }else{ 
            console.log("Unauthorized Remove card");          
            return res.status(400).send("Unauthorized");
        }

    });

    return app;

}
