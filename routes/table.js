var express = require('express');
var app = express();
app.use(function(req, res, next){
    if (req.is('text/*')) {
        req.text = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk){ req.text += chunk });
        req.on('end', next);
    } else {
        next();
    }
});

module.exports = function(controller, project) {   

     app.put('/table/create/:appId', function(req,res,next) {
     
        var projectId=req.params.appId;
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var data = req.body || {};                      
     
		if(data.key && projectId ){
			project.getProject(projectId).then(function(project) {
                if (!project) {
                    return res.status(400).send('Error: Project not found');
                }else{
                	if(data.key === project.keys.master){
                		controller.upsertTable(projectId,data).then(function(done) {
							if (!done) {
								return res.status(500).send("Unable to create table");
							}
							return res.status(200).send(done);

							},function(error){
								return res.status(500).send(error);
							});
                	}else{
                		return res.satus(401).send({message: "Invalid Key"});
                	}
                }
            },function(error){
                return res.status(500).send(error);
            });
		}

    });

     app.put('/table/delete/:appId', function(req,res,next) {

        var projectId=req.params.appId;
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var name = req.body.name || {};  
        var key = req.body.key;  
        if(key && projectId && name){            
        	project.getProject(projectId).then(function(project){
        		if (!project) {
                    return res.status(400).send('Error: Project not found');
                }else{
                	if(key === project.keys.master){
                		 controller.deleteTable(projectId,name).then(function() {                
						    return res.status(200).send("Success");
						},function(error){
						    return res.status(500).send(error);
						});
                	}else{
                		return res.status(401).send({message: "Invalid Key"});
                	}
                }
        	});
        }
    });


    app.put('/table/get/:appId', function(req,res,next) {

        var projectId=req.params.appId;                          
		if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var key = req.body.key;        
        
        if(key && projectId){
        	project.getProject(projectId).then(function(project){
        		if (!project) {
                    return res.status(400).send('Error: Project not found');
                }else{
                	if(key === project.keys.master){
                		  controller.getTablesByProject(projectId).then(function(tables) {
								return res.status(200).send(tables);
							},function(error){
								return res.status(500).send(error);
							});
                	}else{
                		return res.status(401).send({message: "Invalid Key"});
                	}
                }
        	});
        }
    });

    app.put('/table/:tableName', function(req,res,next) {

        var tableName=req.params.tableName; 
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var appId = req.body.appId || {};                          
		var key = req.body.key;
		if(key && tableName && appId){
			project.getProject(appId).then(function(project){
        		if (!project) {
                    return res.send(400, 'Error: Project not found');
                }else{
                	if(key === project.keys.master){
                		 controller.getTableByTableName(appId,tableName).then(function(table) {
						    return res.json(200, table);

						},function(error){
						    return res.send(500, error);
						});
                	}else{
                		return res.send(401, {message: "Invalid Key"});
                	}
                }
        	});
		}
    });

    return app;

}

