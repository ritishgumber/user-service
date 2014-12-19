var path = require('path');
var fs = require('fs');

//read in the global configuration settings in settings.json
siteConfig = {};
if(fs.existsSync('./settings.json')) {
    siteConfig = JSON.parse(fs.readFileSync('./settings.json').toString());

}
module.exports= siteConfig;
