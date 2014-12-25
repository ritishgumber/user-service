var path = require('path');
var fs = require('fs');

module.exports = function(isDevelopment) {

      if(isDevelopment){
              //read in the global configuration settings in settings.json
              siteConfig = {};
              if(fs.existsSync('./devsettings.json')) {
                  siteConfig = JSON.parse(fs.readFileSync('./devSettings.json').toString());
                }
                return siteConfig;

      }else{

            //read in the global configuration settings in settings.json
            siteConfig = {};
            if(fs.existsSync('./productionSettings.json')) {
                siteConfig = JSON.parse(fs.readFileSync('./productionSettings.json').toString());

            }

            return siteConfig;
      }


}
