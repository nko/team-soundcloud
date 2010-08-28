HTTP_PORT = 8080

var http     = require('http')
  , path     = require('path')
  , root     = path.dirname(__filename)
  , paperboy = require(path.join(root, 'vendor', 'paperboy'))
  , webroot  = path.join(root, 'public');

var frontend = http.createServer(function (req, res) {
  paperboy.deliver(webroot, req, res);
});

frontend.listen(HTTP_PORT);
