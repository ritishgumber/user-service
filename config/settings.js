var path = require('path');
var fs = require('fs');

if(isDevelopment){
    //read in the global configuration settings in settings.json
    siteConfig = {};
    if(fs.existsSync('./devsettings.json')) {
        siteConfig = JSON.parse(fs.readFileSync('./devSettings.json').toString());

  }


}else{
//read in the global configuration settings in settings.json
siteConfig = {};
if(fs.existsSync('./productuionSettings.json')) {
    siteConfig = JSON.parse(fs.readFileSync('./productionSettings.json').toString());

}

}
module.exports= siteConfig;
