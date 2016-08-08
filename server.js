try{//Load the configuration.
    global.config = require('./config/cloudboost');
}catch(e){
    //File not found. 
    global.config = null;
}

//Load keys.    
global.keys = require('./config/keys.js');
require('./app')();

global.app.set('port', process.env.PORT || 3000);

var server = global.app.listen(global.app.get('port'), function(){
	console.log("");
	console.log("CBFrontend Services runing on PORT:"+global.app.get('port'));
	console.log("Process env variables");
	console.log(process.env);	
});
