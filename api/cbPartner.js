var express = require('express');
var app = express();
var json2xls = require('json2xls');

module.exports = function() {

    //routes
    
    app.post('/partner', function(req,res,next) {        
        console.log("CoudBoost Partner Form");

        var data = req.body || {};      

        global.cbPartnerService.save(data).then(function(result){
            return res.status(200).json(result);
        },function(error){
        	return res.status(400).json(error); 
        });          
           
    });


    app.get('/partner/item/:id', function(req,res,next) {        
        console.log("Get CoudBoost Partner Form By ID");

        var partnerId=req.params.id     

        global.cbPartnerService.getById(partnerId).then(function(result){
            return res.status(200).json(result);
        },function(error){
            return res.status(400).json(error); 
        });          
           
    });


    app.get('/partner/export', function(req,res,next) {        
        console.log("Get CoudBoost Partner List");

        var skip=req.query.skip; 
        var limit=req.query.limit;    

        global.cbPartnerService.getList(skip,limit).then(function(result){         

            var jsonString=JSON.stringify(result);
            var sanitizedJSON=JSON.parse(jsonString)

            res.xls('partners.xlsx', sanitizedJSON); 
                        
        },function(error){
            return res.status(400).json(error); 
        });          
           
    });  



    return app;

}

function sanitizeJSON(unsanitized){ 
    return unsanitized.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\f/g, "\\f").replace(/"/g,"\\\"").replace(/'/g,"\\\'").replace(/\&/g, "\\&"); 
}
