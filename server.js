var http     = require('http')
  , paperboy = require('paperboy')
  , config   = require('./config')
  , webroot  = config.webroot
  , frontend = new http.Server()

frontend.addListener('request', function (req, res) {
  paperboy
    .deliver(webroot, req, res)
    .otherwise(function(err) {
      var statCode = 404;
      res.writeHead(statCode, {'Content-Type': 'text/plain'});
      log(statCode, req.url, ip, err);
    })
}).listen(config.frontend.port);
