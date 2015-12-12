var express = require('express');
var app = express();

module.exports = function(UserService) {

    //routes
    app.get('/cloudboost/isNewServer', function(req,res,next) {       
                        
		UserService.isNewServer().then(function(isNew) {            
            return res.status(200).send(isNew);
        },function(error){
            return res.send(500, error);
        });    
    });

    return app;

}
