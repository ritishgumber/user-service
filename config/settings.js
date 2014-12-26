var path = require('path');
var fs = require('fs');

module.exports = function(isDevelopment) {
      siteConfig = {};

      if(isDevelopment){
        //read in the global configuration settings in settings.json
        if(fs.existsSync('./devsettings.json')) {
            siteConfig = JSON.parse(fs.readFileSync('./devSettings.json').toString());
        }
                

      }else{

        //read in the global configuration settings in settings.json
        if(fs.existsSync('./productionSettings.json')) {
            siteConfig = JSON.parse(fs.readFileSync('./productionSettings.json').toString());
        }

           
      }

      return siteConfig;


}
