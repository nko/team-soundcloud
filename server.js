var http        = require('http')
  , config      = require('./config')
  , webroot     = config.webroot
  , frontend    = new http.Server()
  , fileServer  = new(require('node-static').Server)('./public')

frontend.addListener('request', function (req, res) {
  req.addListener('end', function() {
    fileServer.serve(req, res)
  })
}).listen(config.frontend.port)
