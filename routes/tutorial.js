var express = require('express');
var app = express();

module.exports = function(tutorialService) {

    //routes
    app.get('/tutorial', function(req,res,next) {

		tutorialService.getTutorialList().then(function(tutorial) {                      
            return res.status(200).json(tutorial);
        },function(error){            
            return res.status(500).send(error); 
        });

    });

    app.get('/tutorial/:id', function(req,res,next) {
        var tutorialDocId=req.params.id;

        tutorialService.getTutorialById(tutorialDocId).then(function(tutorial) {                      
            return res.status(200).json(tutorial);
        },function(error){            
            return res.status(500).send(error); 
        });

    });

    return app;

}
