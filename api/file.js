var express = require('express');
var app = express();

var url = require('url');
var Busboy = require('busboy');
var Grid = require('gridfs-stream');

module.exports = function() {

    Grid.mongo = global.mongoose.mongo;
    var gfs = new Grid(global.mongoose.connection.db);

    //routes
    app.get('/file/:id', function(req, res, next) {

        console.log("Get user Image by id");

        var fileId = req.params.id;
        if (fileId) {
            global.fileService.getFileById(fileId).then(function(file) {

                res.set('Content-Type', file.contentType);
                res.set('Content-Disposition', 'inline');

                var readstream = gfs.createReadStream({_id: file._id});

                readstream.on("error", function(err) {
                    res.send(500, "Got error while processing stream " + err.message);
                    res.end();
                });

                readstream.pipe(res);

                console.log("Successfull Get user Image by id")
            }, function(error) {
                console.log("error Get user Image by id");
                return res.send(500, error);
            });
        } else {
            console.log("Found no image id in the url");
            return res.send(500, "Found no file id in the url");
        }

    });

    app.post('/file', function(req, res, next) {

        console.log("Upload user image");

        var currentUserId = req.session.passport.user
            ? req.session.passport.user.id
            : req.session.passport.user;
        var serverUrl = fullUrl(req);
        var fileHolder;

        var busboy = new Busboy({headers: req.headers});

        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

            global.userService.getAccountById(currentUserId).then(function(user) {
                if (user && user.fileId) {
                    global.fileService.deleteFileById(user.fileId);
                }
                return global.fileService.putFile(file, filename, mimetype);
            }).then(function(savedFile) {
                fileHolder = savedFile;
                return global.userService.updateUserProfilePic(currentUserId, savedFile._id.toString());
            }).then(function(user) {

                //Wrapping for consistency in UI
                var fileObject = {};
                fileObject.id = fileHolder._id;
                fileObject.name = fileHolder.filename;
                fileObject.url = serverUrl + "/file/" + fileHolder._id.toString();

                var wrapper = {};
                wrapper.document = fileObject;

                console.log("Successfull Upload user image");
                return res.status(200).send(wrapper);
            }, function(error) {
                console.log("Error Upload user image");
                return res.status(500).send(error);
            });

        }).on('finish', function() {
            //console.log('Done parsing form!');
            //res.writeHead(303, { Connection: 'close'});
            //res.end();
        });

        req.pipe(busboy);
    });

    app.delete('/file/:id', function(req, res, next) {

        console.log("delete user image");

        var currentUserId = req.session.passport.user
            ? req.session.passport.user.id
            : req.body.userId;
        var fileId = req.params.id;

        if (currentUserId && fileId) {

            global.fileService.deleteFileById(fileId).then(function(resp) {
                return global.userService.updateUserProfilePic(currentUserId, null);
            }).then(function(reply) {
                console.log("Successfully delete user image");
                return res.status(200).send("Deleted Successfully");
            }, function(error) {
                console.log("error delete user image");
                return res.send(500, error);
            });

        } else {
            console.log("unauthorized delete user image");
            return res.status(401).send("unauthorized");
        }

    });

    return app;

}

function fullUrl(req) {
    return url.format({protocol: req.protocol, host: req.get('host')});
}
