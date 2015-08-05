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

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var data = req.body || {};                      
     
		if(data.key && projectId ){
			project.getProject(projectId).then(function(project) {
                if (!project) {
                    return res.send(500, 'Error: Project not found');
                }else{
                	if(data.key == project.keys.master){
                		controller.upsertTable(projectId,data).then(function(done) {
							if (!done) {
								return res.send(500);
							}

							return res.json(200, done);

							},function(error){
								return res.send(500, error);
							});
                	}else{
                		return res.sendStatus(401);
                	}
                }
            },function(error){
                return res.send(500, error);
            });
		}else if(currentUserId && projectId && data){
            controller.upsertTable(projectId,data).then(function(done) {
                if (!done) {
                    return res.send(500);
                }

                return res.json(200, done);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.sendStatus(401);
        }

    });

     app.put('/table/delete/:appId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var name = req.body.name || {};  
        var key = req.body.key;  
        if(key && projectId && name){            
        	project.getProject(projectId).then(function(project){
        		if (!project) {
                    return res.send(500, 'Error: Project not found');
                }else{
                	if(key == project.keys.master){
                		 controller.deleteTable(projectId,name).then(function() {                
						    return res.json(200);
						},function(error){
						    return res.send(500, error);
						});
                	}else{
                		return res.sendStatus(401);
                	}
                }
        	});
        }else if(currentUserId && projectId && name){

            controller.deleteTable(projectId,name).then(function() {                

                return res.json(200);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });


    app.put('/table/get/:appId', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var projectId=req.params.appId;                          
		if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var key = req.body.key;
        
        if(key && projectId){
        	project.getProject(projectId).then(function(project){
        		if (!project) {
                    return res.send(500, 'Error: Project not found');
                }else{
                	if(key == project.keys.master){
                		  controller.getTablesByProject(projectId).then(function(tables) {
								return res.json(200, tables);

							},function(error){
								return res.send(500, error);
							});
                	}else{
                		return res.sendStatus(401);
                	}
                }
        	});
        }else if(currentUserId && projectId){

            controller.getTablesByProject(projectId).then(function(tables) {
                return res.json(200, tables);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    app.put('/table/:tableName', function(req,res,next) {

        var currentUserId= req.session.passport.user ? req.session.passport.user.id : req.session.passport.user;
        var tableName=req.params.tableName; 
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var appId = req.body.appId || {};                          
		var key = req.body.key;
		if(key && tableName && appId){
			project.getProject(appId).then(function(project){
        		if (!project) {
                    return res.send(500, 'Error: Project not found');
                }else{
                	if(key == project.keys.master){
                		 controller.getTableByTableName(appId,tableName).then(function(table) {
						    return res.json(200, table);

						},function(error){
						    return res.send(500, error);
						});
                	}else{
                		return res.sendStatus(401);
                	}
                }
        	});
		}else if(currentUserId && tableName && appId){

            controller.getTableByTableName(appId,tableName).then(function(table) {
                return res.json(200, table);

            },function(error){
                return res.send(500, error);
            });

        }else{
            return res.send(401);
        }

    });

    return app;

}

