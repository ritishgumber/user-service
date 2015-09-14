var express = require('express');
var app = express();

module.exports = function(controller, project) {

    /**
     *  Creates a Table
     */

     app.put('/:appId/table/:tableName', function(req,res,next) {
     
        var projectId=req.params.appId;

        if(req.text){
        	req.body = JSON.parse(req.text);
        }
         var key = req.body.key;
        var data = req.body.data || {};
     
		if(key && projectId ){
			project.getProject(projectId).then(function(project) {
                if (!project) {
                    return res.status(400).send('Error: Project not found');
                }else{
                	if(key === project.keys.master){
                		controller.upsertTable(projectId,data).then(function(done) {
							if (!done) {
								return res.status(500).send("Unable to create table");
							}
                            console.log("Sending response");
							return res.status(200).send(done);

							},function(error){
								return res.status(500).send(error);
							});
                	}else{
                		return res.status(401).send({message: "Invalid Key"});
                	}
                }
            },function(error){
                return res.status(500).send(error);
            });
		}

    });

    /**
     * Deletes a Table
     */

     app.delete('/:appId/table/:tableName', function(req,res,next) {

        var projectId=req.params.appId;
        if(req.text){
        	req.body = JSON.parse(req.text);
        }
        var name = req.params.tableName || {};
        var key = req.body.key;  
        if(key && projectId && name){            
        	project.getProject(projectId).then(function(project){
        		if (!project) {
                    res.status(400).send('Error: Project not found');
                }else{
                	if(key === project.keys.master){
                		 controller.deleteTable(projectId,name).then(function() {                
						    res.status(200).send("Success");
						},function(error){
						    res.status(500).send(error);
						});
                	}else{
                		res.status(401).send({message: "Invalid Key"});
                	}
                }
        	});
        }
    });


    /**
     *  Both are same and gets all the tables using _getAllTable function
     */

    app.get('/:appId/table', _getAllTable );
    app.post('/:appId/table', _getAllTable );

    /**
     *  Both are same and get the tables using _getTable function
     */

    app.get('/:appId/table/:tableName', _getTable);
    app.post('/:appId/table/:tableName', _getTable);

    return app;

    /**
     * Returns a table as per the name given to it.
     *
     * @param req
     * @param res
     * @param next
     * @private
     */

    function _getTable(req,res) {

        var tableName=req.params.tableName;
        if(req.text){
            req.body = JSON.parse(req.text);
        }
        /////
        var appId = req.body.appId || {};
        var key = req.body.key; 
        if(key && tableName && appId){
            project.getProject(appId).then(function(project){
                if (!project) {
                    return res.status(400).send('Error: Project not found');
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
    }

    /**
     *  Gets all the tables in App
     *
     * @param req
     * @param res
     * @private
     */

    function _getAllTable(req,res) {

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
    }


}

