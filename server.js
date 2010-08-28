var http           = require('http')
  , config         = require('./config')
  , io             = require('socket.io')
  , frontend       = new http.Server()
  , frontendStatic = new(require('node-static').Server)('./public')
  , backend        = new http.Server()
  , socket         = io.listen(backend)

frontend.addListener('request', function (req, res) {
  req.addListener('end', function () {
    frontendStatic.serve(req, res)
  });
});

frontend.listen(config.frontend.port);

backend.addListener('request', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello world</h1>');
  res.end();
});

backend.listen(config.backend.port);

socket.on('connection', function (client) {
  client.broadcast({ announcement: client.sessionId + ' connected' });
});
