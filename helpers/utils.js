var ejs = require('ejs'),
    path = require('path'),
    fs = require('fs'),
    axios = require('axios');

var templates = {
    'create.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'create.xml'), 'utf8'),
    'createFail.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'createFail.xml'), 'utf8'),
    'getResource.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'getResource.xml'), 'utf8'),
    'getSingleResource.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'getSingleResource.xml'), 'utf8'),
    'getCloudService.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'getCloudService.xml'), 'utf8'),
    'getListofSecrets.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'getListofSecrets.xml'), 'utf8'),
    'updateCommunicationPreference.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'updateCommunicationPreference.xml'), 'utf8'),
    'sso.xml': fs.readFileSync(path.join(__dirname, 'azure-xml-responses', 'sso.xml'), 'utf8')
};

function loadTemplate(file, data) {
    return ejs.render(templates[file], data);
}

function slugify(text) {
    return text.replace(/[^\w]/g, '-').toLowerCase();
}
function _request(method, url, data) {
    axios({
        method: method, //'post'
        url: url, //'/user/12345'
        data: data //{firstName:'Ritish',lastName:'Gumber'}
    });
}

module.exports = {
    slugify: slugify,
    loadTemplate: loadTemplate,
    _request: _request
};
