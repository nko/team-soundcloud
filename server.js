var http     = require('http')
  , paperboy = require('paperboy')
  , config   = require('./config')
  , webroot  = config.webroot
  , frontend = new http.Server()

frontend.addListener('request', function (req, res) {
  console.log('request')
  console.log(webroot)
  paperboy.deliver(webroot, req, res);
}).listen(config.frontend.port);
