HTTP_PORT = 8080

var http     = require('http')
  , path     = require('path')
  , paperboy = require('./vendor/node-paperboy')
  , webroot  = path.join(path.dirname(__filename), 'public');

var frontend = http.createServer(function (req, res) {
  paperboy.deliver(webroot, req, res);
});

frontend.listen(HTTP_PORT);
